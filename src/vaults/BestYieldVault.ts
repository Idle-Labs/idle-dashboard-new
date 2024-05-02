import Web3 from 'web3'
import ERC20 from 'abis/tokens/ERC20.json'
import { Contract } from 'web3-eth-contract'
import { tokensFolder } from 'constants/folders'
import { selectUnderlyingToken } from 'selectors/'
import { ContractSendMethod } from 'web3-eth-contract'
import { ZERO_ADDRESS, MAX_ALLOWANCE } from 'constants/'
import { CacheContextProps } from 'contexts/CacheProvider'
import { GenericContract } from 'contracts/GenericContract'
import type { Abi, NumberType, VaultStatus } from 'constants/types'
import { VaultFunctionsHelper } from 'classes/VaultFunctionsHelper'
import { GenericContractsHelper } from 'classes/GenericContractsHelper'
import { IdleTokenProtocol, AggregatedVault, aggregatedVaults } from 'constants/vaults'
import { BNify, fixTokenDecimals, getObjectPath, normalizeTokenAmount, catchPromise, asyncReduce, isEmpty, cmpAddrs } from 'helpers/'
import type { BestYieldConfig, IdleToken, UnderlyingTokenProps, Assets, ContractRawCall, EtherscanTransaction, Transaction, VaultHistoricalData, VaultHistoricalRates, VaultHistoricalPrices, PlatformApiFilters, StatsProps } from 'constants/'

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
  readonly messages: Record<string, any>
  readonly description: string | undefined
  // readonly categories: string[] | undefined
  readonly vaultFunctionsHelper: VaultFunctionsHelper
  readonly flags: Record<string, boolean> | undefined

  // Private attributes
  private readonly cacheProvider: CacheContextProps | undefined

  // Raw config
  public readonly type: string
  public readonly idleConfig: IdleToken
  public readonly variant: string | undefined
  public readonly tokenConfig: BestYieldConfig
  public readonly stats: StatsProps | undefined
  public readonly status: VaultStatus | undefined
  public readonly rewardsSenders: string[] | undefined
  public readonly rewardTokens: UnderlyingTokenProps[]
  public readonly distributedTokens: UnderlyingTokenProps[]
  public readonly aggregatedVault: AggregatedVault | undefined
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
    this.stats = tokenConfig.stats
    this.flags = tokenConfig.flags
    this.tokenConfig = tokenConfig
    this.status = tokenConfig.status
    this.variant = tokenConfig.variant
    this.cacheProvider = cacheProvider
    this.idleConfig = tokenConfig.idle
    this.idleController = idleController
    this.description = tokenConfig.description
    this.id = this.idleConfig.address.toLowerCase()
    this.rewardsSenders = tokenConfig.rewardsSenders
    this.vaultFunctionsHelper = new VaultFunctionsHelper({chainId, web3, cacheProvider})
    this.underlyingToken = selectUnderlyingToken(chainId, tokenConfig.underlyingToken)

    this.distributedTokens = []
    if (tokenConfig.distributedTokens){
      tokenConfig.distributedTokens.forEach( (distributedToken: string) => {
        const underlyingToken = selectUnderlyingToken(chainId, distributedToken)
        if (underlyingToken){
          this.distributedTokens.push(underlyingToken)
        }
      })
    }

    if (tokenConfig.aggregatedVaultId){
      this.aggregatedVault = aggregatedVaults[tokenConfig.aggregatedVaultId]
    }

    this.rewardTokens = []
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

  public async getTransactions(account: string, etherscanTransactions: EtherscanTransaction[], getTokenPrice: boolean = true): Promise<Transaction[]> {

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
        const transactions = []
        const insertedTxs: Record<string, any> = {}

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

          const isMintTx = !isSwapTx && !!(internalTxs.find(iTx => iTx.from === ZERO_ADDRESS && iTx.to.toLowerCase() === account.toLowerCase() && iTx.contractAddress.toLowerCase() === this.id));

          // Get action by positive condition
          const actions: Record<string, boolean> = {
            deposit: !!(isReceiveTransferTx || isDepositTx || isSwapTx),
            redeem: !!(isSendTransferTx || isRedeemTx || isWithdrawTx || isSwapOutTx)
          }

          const subActions: Record<string, boolean> = {
            send: isSendTransferTx,
            receive: isReceiveTransferTx,
            swapIn: isSwapTx || isMintTx,
            swapOut: isSwapOutTx,
          }

          const action = Object.keys(actions).find( (action: string) => !!actions[action] )
          const subAction = Object.keys(subActions).find( (subAction: string) => !!subActions[subAction] )


          if (action) {
            const txHashKey = `${tx.hash}_${action}`

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

              if (getTokenPrice){
                const cacheKey = `tokenPrice_${this.chainId}_${this.id}_${tx.blockNumber}`
                try {
                  // @ts-ignore
                  const callback = async() => await catchPromise(pricesCalls[0].call.call({}, parseInt(tx.blockNumber)))
                  const tokenPrice = this.cacheProvider ? await this.cacheProvider.checkAndCache(cacheKey, callback, 0) : await callback()
                  idlePrice = tokenPrice ? fixTokenDecimals(tokenPrice, this.underlyingToken?.decimals) : BNify(1)
                } catch (err){
                }
              }

              underlyingAmount = idlePrice.times(idleAmount)
            } else {
              underlyingAmount = underlyingTokenTxAmount
            }

            if (!insertedTxs[txHashKey]){
              transactions.push({
                ...tx,
                action,
                subAction,
                idlePrice,
                idleAmount,
                assetId:this.id,
                underlyingAmount,
                chainId: this.chainId
              })

              // Save inserted txs to avoid duplicated
              insertedTxs[txHashKey] = 1;
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

  public getPausedCalls(): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.contract.methods.paused()
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

  public getInterestBearingTokensExchangeRatesCalls(): ContractRawCall[] {
    return this.tokenConfig.protocols.reduce( (calls: ContractRawCall[], protocolToken: IdleTokenProtocol) => {
      // Exchange rate call
      const exchangeRateFunction = protocolToken.functions?.exchangeRate
      if (exchangeRateFunction){
        const protocolAbi = protocolToken.abi ? protocolToken.abi as Abi : ERC20 as Abi
        const protocolAddress = exchangeRateFunction.target || protocolToken.address
        const protocolTokenContract = new this.web3.eth.Contract(protocolAbi, protocolAddress)
        if (protocolTokenContract.methods[exchangeRateFunction.name]){
          calls.push({
            assetId: this.id,
            data: {
              ...protocolToken as any,
              decimals: exchangeRateFunction.decimals || protocolToken.decimals
            },
            call: protocolTokenContract.methods[exchangeRateFunction.name](...exchangeRateFunction.params)
          })
        }
      }

      return calls
    }, [])
  }

  public getInterestBearingTokensCalls(): ContractRawCall[] {
    const calls = this.tokenConfig.protocols.reduce( (calls: ContractRawCall[], protocolToken: IdleTokenProtocol) => {
      const protocolTokenContract = new this.web3.eth.Contract(ERC20 as Abi, protocolToken.address)

      // Balance call
      calls.push({
        assetId: this.id,
        data: protocolToken as any,
        call: protocolTokenContract.methods.balanceOf(this.id)
      })

      return calls
    }, [])
    
    if (this.underlyingToken?.address && this.underlyingContract){
      calls.push({
        assetId: this.id,
        data: {
          address: this.underlyingToken.address,
          decimals: this.underlyingToken?.decimals || 18
        },
        call: this.underlyingContract.methods.balanceOf(this.id)
      })
    }

    return calls
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
        underlyingId: this.underlyingToken?.address?.toLowerCase(),
        name: this.underlyingToken?.label || this.underlyingToken?.token || this.idleConfig.token,
        icon: `${tokensFolder}${this.underlyingToken?.icon || `${this.underlyingToken?.token}.svg`}`,
      }
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

  public getFlag(flag: string): any{
    return getObjectPath(this, `flags.${flag}`)
  }

  public getAllowanceParams(amount: NumberType): any[] {
    const decimals = this.underlyingToken?.decimals || 18
    const amountToApprove = amount === MAX_ALLOWANCE ? MAX_ALLOWANCE : normalizeTokenAmount(amount, decimals)
    return [this.id, amountToApprove]
  }

  public getUnlimitedAllowanceParams(): any[] {
    return this.getAllowanceParams(MAX_ALLOWANCE)
  }

  public getDistributedRewards(account: string, etherscanTransactions: EtherscanTransaction[]): EtherscanTransaction[] {
    if (!this.distributedTokens.length || isEmpty(this.rewardsSenders)) return []
    return etherscanTransactions.filter( (tx: EtherscanTransaction) => {
      return this.distributedTokens.map( (distributedToken: UnderlyingTokenProps) => distributedToken.address?.toLowerCase() ).includes(tx.contractAddress.toLowerCase()) && this.rewardsSenders?.map( addr => addr.toLowerCase() ).includes(tx.from.toLowerCase()) && cmpAddrs(tx.to, account)
    })
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

  public getDepositParams(amount: NumberType, _referral: string | undefined | null = null): any[] {
    const decimals = this.underlyingToken?.decimals || 18
    return [normalizeTokenAmount(amount, decimals), true, _referral || ZERO_ADDRESS]
  }

  public getDepositContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.contract.methods.mintIdleToken(...params)
  }

  public getWithdrawInterestBearingParams(amount: NumberType): any[] {
    return [normalizeTokenAmount(amount, this.idleConfig.decimals)]
  }

  public getWithdrawInterestBearingContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.contract.methods.redeemInterestBearingTokens(...params)
  }

  public getWithdrawParams(amount: NumberType): any[] {
    return [normalizeTokenAmount(amount, this.idleConfig.decimals)]
  }

  public getWithdrawContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.contract.methods.redeemIdleToken(...params)
  }
}