import Web3 from 'web3'
import ERC20 from 'abis/tokens/ERC20.json'
import { Contract } from 'web3-eth-contract'
import { tokensFolder } from 'constants/folders'
import { selectUnderlyingToken } from 'selectors/'
import type { VaultMessages } from 'constants/vaults'
import { ContractSendMethod } from 'web3-eth-contract'
import { CacheContextProps } from 'contexts/CacheProvider'
import { GenericContract } from 'contracts/GenericContract'
import { ZERO_ADDRESS, MAX_ALLOWANCE } from 'constants/vars'
import type { Abi, NumberType, VaultStatus } from 'constants/types'
import { VaultFunctionsHelper } from 'classes/VaultFunctionsHelper'
import { GenericContractsHelper } from 'classes/GenericContractsHelper'
import { BNify, fixTokenDecimals, normalizeTokenAmount, catchPromise, asyncReduce } from 'helpers/'
import type { BestYieldConfig, IdleToken, UnderlyingTokenProps, Assets, ContractRawCall, EtherscanTransaction, Transaction, VaultHistoricalData, VaultHistoricalRates, VaultHistoricalPrices, PlatformApiFilters } from 'constants/'

type ConstructorProps = {
  web3: Web3
  type: string
  chainId: number
  web3Rpc?: Web3 | null
  tokenConfig: BestYieldConfig
  cacheProvider?: CacheContextProps
  idleController?: GenericContract
}

export class BestYieldVault {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly chainId: number
  readonly protocol: string
  readonly description: string | undefined
  readonly messages: VaultMessages | undefined
  readonly vaultFunctionsHelper: VaultFunctionsHelper
  readonly flags: Record<string, boolean> | undefined

  // Private attributes
  private readonly cacheProvider: CacheContextProps | undefined

  // Raw config
  public readonly type: string
  public readonly idleConfig: IdleToken
  public readonly variant: string | undefined
  public readonly tokenConfig: BestYieldConfig
  public readonly status: VaultStatus | undefined
  public readonly rewardTokens: UnderlyingTokenProps[]
  public readonly underlyingToken: UnderlyingTokenProps | undefined

  // Contracts
  public readonly contract: Contract
  public readonly underlyingContract: Contract | undefined

  // Read only contracts
  public readonly contractRpc: Contract | undefined // Used for calls on specific blocks
  public readonly idleController: GenericContract | undefined

  constructor(props: ConstructorProps){

    const {
      web3,
      type,
      web3Rpc,
      chainId,
      tokenConfig,
      cacheProvider,
      idleController
    } = props
    
    // Init global data
    this.web3 = web3
    this.type = type
    this.messages = {}
    this.chainId = chainId
    this.protocol = 'idle'
    this.flags = tokenConfig.flags
    this.tokenConfig = tokenConfig
    this.status = tokenConfig.status
    this.variant = tokenConfig.variant
    this.cacheProvider = cacheProvider
    this.idleConfig = tokenConfig.idle
    this.idleController = idleController
    this.description = tokenConfig.description
    this.id = this.idleConfig.address.toLowerCase()
    this.vaultFunctionsHelper = new VaultFunctionsHelper({chainId, web3, cacheProvider})
    this.underlyingToken = selectUnderlyingToken(chainId, tokenConfig.underlyingToken)

    this.rewardTokens = tokenConfig.autoFarming ? tokenConfig.autoFarming.reduce( (rewards: UnderlyingTokenProps[], rewardToken: string) => {
      const underlyingToken = selectUnderlyingToken(chainId, rewardToken)
      if (underlyingToken){
        rewards.push(underlyingToken)
      }
      return rewards
    },[]) : []

    // Init idle token contract
    this.contract = new web3.eth.Contract(this.idleConfig.abi, this.idleConfig.address)
    if (web3Rpc) {
      this.contractRpc = new web3Rpc.eth.Contract(this.idleConfig.abi, this.idleConfig.address)
    }

    // Init underlying token contract
    if (this.underlyingToken) {
      const abi: Abi = this.underlyingToken?.abi || ERC20 as Abi
      this.underlyingContract = new web3.eth.Contract(abi, this.underlyingToken.address)
    }
  }

  public async getTransactions(account: string, etherscanTransactions: EtherscanTransaction[]): Promise<Transaction[]> {

    const transactionsByHash = etherscanTransactions.reduce( (transactions: Record<string, EtherscanTransaction[]>, transaction: EtherscanTransaction) => {
      if (!transactions[transaction.hash]) {
        transactions[transaction.hash] = []
      }

      transactions[transaction.hash].push(transaction)

      return transactions
    },{})

    const transactions: Transaction[] = await asyncReduce<Transaction[], Transaction[]>(
      (Object.values(transactionsByHash) as Transaction[][]),
      async (internalTxs: Transaction[]) => {
        const insertedTxs: Record<string, any> = {}
        const transactions = []
        // const transactions = new Set()

        for (const tx of internalTxs) {

          // Check for right token
          const isRightToken = internalTxs.length > 1 && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.underlyingToken?.address?.toLowerCase()).length > 0;
          const isSendTransferTx = internalTxs.length === 1 && tx.from.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;
          const isReceiveTransferTx = internalTxs.length === 1 && tx.to.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;

          const isDepositInternalTx = isRightToken && internalTxs.find(iTx => iTx.from.toLowerCase() === account.toLowerCase() && (iTx.to.toLowerCase() === this.id));
          const isRedeemInternalTx = isRightToken && internalTxs.find(iTx => iTx.contractAddress.toLowerCase() === this.underlyingToken?.address?.toLowerCase() && internalTxs.filter(iTx2 => iTx2.contractAddress.toLowerCase() === this.id).length && iTx.to.toLowerCase() === account.toLowerCase());

          const isDepositTx = isRightToken && tx.from.toLowerCase() === account.toLowerCase() && (tx.to.toLowerCase() === this.id/* || (depositProxyContractInfo && tx.to.toLowerCase() === depositProxyContractInfo.address.toLowerCase() && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.id).length > 0)*/);
          const isRedeemTx = isRightToken && !isDepositInternalTx && tx.contractAddress.toLowerCase() === this.underlyingToken?.address?.toLowerCase() && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.id).length && tx.to.toLowerCase() === account.toLowerCase();
          const isWithdrawTx = internalTxs.length > 1 && internalTxs.filter(iTx => this.tokenConfig.protocols.map(p => p.address.toLowerCase()).includes(iTx.contractAddress.toLowerCase())).length > 0 && tx.contractAddress.toLowerCase() === this.id;

          const isSwapOutTx = !isSendTransferTx && !isWithdrawTx && !isRedeemInternalTx /*&& !etherscanTxs[tx.hash]*/ && tx.from.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;
          const isSwapTx = !isReceiveTransferTx && !isDepositInternalTx /*&& !etherscanTxs[tx.hash]*/ && tx.to.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;

          // Get action by positive condition
          const actions: Record<string, boolean> = {
            deposit: !!(isReceiveTransferTx || isDepositTx || isSwapTx),
            redeem: !!(isSendTransferTx || isRedeemTx || isWithdrawTx || isSwapOutTx)
          }

          const action = Object.keys(actions).find( (action: string) => !!actions[action] )

          if (action) {

            // Get idle token tx and underlying token tx
            const idleTokenToAddress = action === 'redeem' ? (isSendTransferTx ? null : ZERO_ADDRESS) : account
            const idleTokenTx = internalTxs.find( iTx => iTx.contractAddress.toLowerCase() === this.id && (!idleTokenToAddress || iTx.to.toLowerCase() === idleTokenToAddress.toLowerCase()) )
            const idleAmount = idleTokenTx ? fixTokenDecimals(idleTokenTx.value, 18) : BNify(0)
            
            const underlyingTokenTx = internalTxs.find( iTx => {
              const underlyingTokenDirectionAddress = action === 'redeem' ? iTx.to : iTx.from
              const underlyingAmount = fixTokenDecimals(iTx.value, this.underlyingToken?.decimals)
              return iTx.contractAddress.toLowerCase() === this.underlyingToken?.address?.toLowerCase() && underlyingTokenDirectionAddress.toLowerCase() === account.toLowerCase() && underlyingAmount.gte(idleAmount) /*|| this.tokenConfig.proxies?.includes(underlyingTokenDirectionAddress.toLowerCase()*/ 
            })

            const underlyingTokenTxAmount = underlyingTokenTx ? fixTokenDecimals(underlyingTokenTx.value, this.underlyingToken?.decimals) : null
            let idlePrice = underlyingTokenTxAmount?.gt(0) ? underlyingTokenTxAmount.div(idleAmount) : BNify(1)

            let underlyingAmount = BNify(0)
            if (!underlyingTokenTxAmount){
              const pricesCalls = this.getPricesCalls()

              const cacheKey = `tokenPrice_${this.chainId}_${this.id}_${tx.blockNumber}`
              // @ts-ignore
              const callback = async() => await catchPromise(pricesCalls[0].call.call({}, parseInt(tx.blockNumber)))
              const tokenPrice = this.cacheProvider ? await this.cacheProvider.checkAndCache(cacheKey, callback, 0) : await callback()
              idlePrice = tokenPrice ? fixTokenDecimals(tokenPrice, this.underlyingToken?.decimals) : BNify(1)

              underlyingAmount = idlePrice.times(idleAmount)
            } else {
              underlyingAmount = underlyingTokenTxAmount
            }

            if (tx.hash.toLowerCase() === '0xe0891010279401be3b42b89fec8a0abf67cdc86373cc20c9614877be8bbd3735'.toLowerCase()){
              console.log(this.id, tx.blockNumber, idlePrice.toString(), idleAmount.toString(), underlyingAmount.toString())
            }

            // transactions.add({
            //   ...tx,
            //   action,
            //   idlePrice,
            //   idleAmount,
            //   assetId:this.id,
            //   underlyingAmount
            // })

            if (!insertedTxs[tx.hash]){
              transactions.push({
                ...tx,
                action,
                idlePrice,
                idleAmount,
                assetId:this.id,
                underlyingAmount
              })

              // Save inserted txs to avoid duplicated
              insertedTxs[tx.hash] = 1;
            }
          }
        }

        // console.log('transactions', this.id, Array.from(transactions.values()))

        return transactions; //Array.from(transactions.values())
      },
      (acc, val) => ([...acc, ...val]),
      []
    )

    return transactions
  }

  public getBlockNumber(): number {
    return this.tokenConfig.blockNumber
  }

  public getBalancesCalls(params: any[] = []): any[] {
    const contract = this.contractRpc || this.contract
    return [
      {
        assetId:this.id,
        call:contract.methods.balanceOf(...params),
      },
    ]
  }

  public getPricesCalls(): ContractRawCall[] {
    const contract = this.contractRpc || this.contract
    return [
      {
        assetId: this.id,
        call: contract.methods.tokenPrice(),
        decimals: this.underlyingToken?.decimals || 18,
      },
    ]
  }

  public getPricesUsdCalls(contracts: GenericContract[]): any[] {
    if (!this.underlyingToken) return []
    
    const genericContractsHelper = new GenericContractsHelper({chainId: this.chainId, web3: this.web3, contracts})
    const conversionRateParams = genericContractsHelper.getConversionRateParams(this.underlyingToken)
    if (!conversionRateParams) return []

    return [
      {
        assetId:this.id,
        params:conversionRateParams,
        call:conversionRateParams.call
      }
    ]
  }

  public getFeesCalls(): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.contract.methods.fee()
      }
    ]
  }

  public getIdleDistributionCalls(): ContractRawCall[] {
    if (!this.idleController) return []
    return [this.idleController.getRawCall('idleSpeeds', [this.id], this.id)]
  }

  public getAprsCalls(): ContractRawCall[] {
    return [
      {
        decimals:18,
        assetId:this.id,
        call:this.contract.methods.getAvgAPR()
      }
    ]
  }

  public getTotalSupplyCalls(): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.contract.methods.totalSupply()
      }
    ]
  }

  public getProtocolsCalls(): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.contract.methods.getAPRs()
      }
    ]
  }

  public getAllocationsCalls(index: number, data?: any): ContractRawCall[] {
    return [
      {
        data,
        assetId:this.id,
        call:this.contract.methods.lastAllocations(index)
      }
    ]
  }

  public getRewardTokensCalls(): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.contract.methods.getGovTokens()
      }
    ]
  }

  public getRewardTokensAmounts(account: string): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.contract.methods.getGovTokensAmounts(account)
      }
    ]
  }

  public async getHistoricalData(filters?: PlatformApiFilters): Promise<VaultHistoricalData> {
    return await this.vaultFunctionsHelper.getVaultHistoricalDataFromIdleApi(this, filters)
  }

  public async getHistoricalPrices(filters?: PlatformApiFilters): Promise<VaultHistoricalPrices> {
    return await this.vaultFunctionsHelper.getVaultPricesFromIdleApi(this, filters)
  }

  public async getHistoricalAprs(filters?: PlatformApiFilters): Promise<VaultHistoricalRates> {
    return await this.vaultFunctionsHelper.getVaultRatesFromIdleApi(this, filters)
  }

  public getAssetsData(): Assets {
    return {
      [this.id]:{
        decimals:18,
        type: this.type,
        token: this.idleConfig.token,
        color: this.underlyingToken?.colors.hex,
        icon: `${tokensFolder}${this.underlyingToken?.token}.svg`,
        underlyingId: this.underlyingToken?.address?.toLowerCase(),
        name: this.underlyingToken?.label || this.underlyingToken?.token || this.idleConfig.token,
      },
      // ...(this.tokenConfig.protocols.reduce( (tokens: Assets, protocolToken) => {
      //   tokens[protocolToken.address.toLowerCase()] = {
      //     name:protocolToken.token,
      //     token:protocolToken.token,
      //     decimals:protocolToken.decimals,
      //   }
      //   return tokens
      // }, {}))
    }
  }

  // Transactions
  public getAllowanceOwner() {
    return this.id
  }

  public getMethodDefaultGasLimit(methodName: string): number | undefined {
    switch (methodName){
      case 'deposit':
        return 723882
      case 'withdraw':
        return 726206
      default:
        return
    }
  }

  public getAllowanceParams(amount: NumberType): any[] {
    const decimals = this.underlyingToken?.decimals || 18
    const amountToApprove = amount === MAX_ALLOWANCE ? MAX_ALLOWANCE : normalizeTokenAmount(amount, decimals)
    return [this.id, amountToApprove]
  }

  public getUnlimitedAllowanceParams(): any[] {
    return this.getAllowanceParams(MAX_ALLOWANCE)
  }

  public getAllowanceContract(): Contract | undefined {
    return this.underlyingContract
  }

  public getClaimRewardsContractSendMethod(): ContractSendMethod | undefined {
    return this.contract.methods.redeemIdleToken(0)
  }

  public getAllowanceContractSendMethod(params: any[] = []): ContractSendMethod | undefined {
    const allowanceContract = this.getAllowanceContract()
    return allowanceContract?.methods.approve(...params)
  }

  public getDepositParams(amount: NumberType, _referral: string | undefined = ZERO_ADDRESS): any[] {
    const decimals = this.underlyingToken?.decimals || 18
    return [normalizeTokenAmount(amount, decimals), true, _referral]
  }

  public getDepositContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.contract.methods.mintIdleToken(...params)
  }

  public getWithdrawParams(amount: NumberType): any[] {
    return [normalizeTokenAmount(amount, this.idleConfig.decimals)]
  }

  public getWithdrawContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.contract.methods.redeemIdleToken(...params)
  }
}