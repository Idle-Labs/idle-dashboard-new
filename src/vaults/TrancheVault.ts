import Web3 from 'web3'
import ERC20 from 'abis/tokens/ERC20.json'
import { Contract } from 'web3-eth-contract'
import { MAX_ALLOWANCE } from 'constants/vars'
import { tokensFolder } from 'constants/folders'
import type { Abi, Number } from 'constants/types'
import { selectUnderlyingToken } from 'selectors/'
import { ContractSendMethod } from 'web3-eth-contract'
import { GenericContract } from 'contracts/GenericContract'
import { VaultFunctionsHelper } from 'classes/VaultFunctionsHelper'
import { GenericContractsHelper } from 'classes/GenericContractsHelper'
import { BNify, normalizeTokenAmount, fixTokenDecimals, catchPromise } from 'helpers/'
import { ZERO_ADDRESS, CDO, Strategy, Pool, Tranche, GaugeConfig, TrancheConfig, UnderlyingTokenProps, Assets, ContractRawCall, EtherscanTransaction, Transaction, VaultHistoricalRates, VaultHistoricalPrices, VaultHistoricalData, PlatformApiFilters } from 'constants/'

type ConstructorProps = {
  web3: Web3
  type: string
  web3Rpc?: Web3 | null
  chainId: number
  protocol: string
  vaultConfig: TrancheConfig
  gaugeConfig?: GaugeConfig | null
}

export class TrancheVault {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly chainId: number
  readonly protocol: string
  readonly web3Rpc: Web3 | null | undefined
  readonly vaultFunctionsHelper: VaultFunctionsHelper

  // Raw config
  public readonly type: string
  public readonly cdoConfig: CDO
  public readonly trancheConfig: Tranche
  public readonly strategyConfig: Strategy
  public readonly vaultConfig: TrancheConfig
  public readonly poolConfig: Pool | undefined
  public readonly rewardTokens: UnderlyingTokenProps[]
  public readonly gaugeConfig: GaugeConfig | null | undefined
  public readonly underlyingToken: UnderlyingTokenProps | undefined

  // Contracts
  public readonly cdoContract: Contract
  public readonly trancheContract: Contract
  public readonly strategyContract: Contract
  public readonly underlyingContract: Contract | undefined

  // Read only contracts
  public readonly cdoContractRpc: Contract | undefined // Used for calls on specific blocks

  constructor(props: ConstructorProps){

    const {
      web3,
      type,
      web3Rpc,
      chainId,
      protocol,
      vaultConfig,
      gaugeConfig
    } = props
    
    // Init global data
    this.web3 = web3
    this.type = type
    this.web3Rpc = web3Rpc
    this.chainId = chainId
    this.protocol = protocol
    this.vaultConfig = vaultConfig
    this.gaugeConfig = gaugeConfig
    this.trancheConfig = vaultConfig.Tranches[type]
    this.vaultFunctionsHelper = new VaultFunctionsHelper(chainId, web3)
    this.underlyingToken = selectUnderlyingToken(chainId, vaultConfig.underlyingToken)

    this.rewardTokens = vaultConfig.autoFarming ? vaultConfig.autoFarming.reduce( (rewards: UnderlyingTokenProps[], rewardToken: string) => {
      const underlyingToken = selectUnderlyingToken(chainId, rewardToken)
      if (underlyingToken){
        rewards.push(underlyingToken)
      }
      return rewards
    },[]) : []

    // Init tranche configs
    this.cdoConfig = vaultConfig.CDO
    this.poolConfig = vaultConfig.Pool
    this.strategyConfig = vaultConfig.Strategy
    this.id = this.trancheConfig.address.toLowerCase()

    // Init CDO contract
    this.cdoContract = new web3.eth.Contract(this.cdoConfig.abi, this.cdoConfig.address)
    if (web3Rpc) {
      this.cdoContractRpc = new web3Rpc.eth.Contract(this.cdoConfig.abi, this.cdoConfig.address)
    }

    // Init Strategy contract
    this.strategyContract = new web3.eth.Contract(this.strategyConfig.abi, this.strategyConfig.address)
        
    // Init underlying token contract
    if (this.underlyingToken){
      const abi: Abi = this.underlyingToken?.abi || ERC20 as Abi
      this.underlyingContract = new web3.eth.Contract(abi, this.underlyingToken.address)
    }

    // Init tranche tokens contracts
    this.trancheContract = new web3.eth.Contract(this.trancheConfig.abi, this.trancheConfig.address)
  }

  public async getTransactions(account: string, etherscanTransactions: EtherscanTransaction[]): Promise<Transaction[]> {

    const transactionsByHash = etherscanTransactions.reduce( (transactions: Record<string, EtherscanTransaction[]>, transaction: EtherscanTransaction) => {
      if (!transactions[transaction.hash]) {
        transactions[transaction.hash] = []
      }

      transactions[transaction.hash].push(transaction)

      return transactions
    },{})

    const transactions = await Object.keys(transactionsByHash).reduce( async (transactionsPromise, hash: string): Promise<Transaction[]> => {

      // console.log('transactions', transactions)
      const transactions = await transactionsPromise

      const internalTxs = transactionsByHash[hash]

      for (const tx of internalTxs) {

        // Check for right token
        const isRightToken = internalTxs.length > 1 && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.underlyingToken?.address?.toLowerCase()).length > 0;

        const isDepositInternalTx = isRightToken && internalTxs.find(iTx => iTx.from.toLowerCase() === account.toLowerCase() && (iTx.to.toLowerCase() === this.id));
        const isRedeemInternalTx = isRightToken && internalTxs.find(iTx => iTx.contractAddress.toLowerCase() === this.underlyingToken?.address?.toLowerCase() && internalTxs.filter(iTx2 => iTx2.contractAddress.toLowerCase() === this.id).length && iTx.to.toLowerCase() === account.toLowerCase());

        // Skip gauges deposits / redeems
        const isGaugeDeposit = this.gaugeConfig && tx.contractAddress.toLowerCase() === this.id && tx.to.toLowerCase() === this.gaugeConfig.address.toLowerCase()
        const isGaugeRedeem = this.gaugeConfig && tx.contractAddress.toLowerCase() === this.id && tx.from.toLowerCase() === this.gaugeConfig.address.toLowerCase() && tx.to.toLowerCase() === account.toLowerCase()

        const isSendTransferTx = internalTxs.length === 1 && !isGaugeDeposit && tx.from.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;
        const isReceiveTransferTx = internalTxs.length === 1 && !isGaugeRedeem && tx.to.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;

        const isDepositTx = isRightToken && tx.from.toLowerCase() === account.toLowerCase() && (tx.to.toLowerCase() === this.id);
        const isRedeemTx = isRightToken && !isDepositInternalTx && tx.contractAddress.toLowerCase() === this.underlyingToken?.address?.toLowerCase() && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.id).length && tx.to.toLowerCase() === account.toLowerCase();

        const isSwapOutTx = !isSendTransferTx && !isGaugeDeposit && !isRedeemInternalTx && tx.from.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;
        const isSwapTx = !isReceiveTransferTx && !isGaugeRedeem && !isDepositInternalTx && tx.to.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;

        // Get action by positive condition
        const actions: Record<string, boolean> = {
          deposit: !!(isReceiveTransferTx || isDepositTx || isSwapTx),
          redeem: !!(isSendTransferTx || isRedeemTx || isSwapOutTx)
        }

        const action = Object.keys(actions).find( (action: string) => !!actions[action] )

        // if (tx.hash.toLowerCase() === '0x67db8b44103853451733ae2387a26a76476a94b11759e1e81d45999847ce4561'.toLowerCase()) {
        //   console.log('GAUGE?', isGaugeDeposit, isGaugeRedeem, isSendTransferTx, isRedeemTx, isSwapOutTx, action)
        // }

        if (action) {

          // Get idle token tx and underlying token tx
          const idleTokenToAddress = action === 'redeem' ? (isSendTransferTx ? null : ZERO_ADDRESS) : account
          const idleTokenTx = internalTxs.find( iTx => iTx.contractAddress.toLowerCase() === this.id && (!idleTokenToAddress || iTx.to.toLowerCase() === idleTokenToAddress.toLowerCase()) )
          const idleAmount = idleTokenTx ? fixTokenDecimals(idleTokenTx.value, 18) : BNify(0)
          
          const underlyingTokenTx = internalTxs.find( iTx => {
            const underlyingTokenDirectionAddress = action === 'redeem' ? iTx.to : iTx.from
            const underlyingAmount = fixTokenDecimals(iTx.value, this.underlyingToken?.decimals)
            return iTx.contractAddress.toLowerCase() === this.underlyingToken?.address?.toLowerCase() && underlyingTokenDirectionAddress.toLowerCase() === account.toLowerCase() && underlyingAmount.gte(idleAmount)
          })

          const underlyingTokenTxAmount = underlyingTokenTx ? fixTokenDecimals(underlyingTokenTx.value, this.underlyingToken?.decimals) : null
          let idlePrice = underlyingTokenTxAmount?.gt(0) ? underlyingTokenTxAmount.div(idleAmount) : BNify(0)

          let underlyingAmount = BNify(0)
          if (!underlyingTokenTxAmount){
            const pricesCalls = this.getPricesCalls()

            // const tokenPrice = await pricesCalls[0].call.call({}, parseInt(tx.blockNumber))
            // @ts-ignore
            let tokenPrice = await catchPromise(pricesCalls[0].call.call({}, parseInt(tx.blockNumber)))
            if (!tokenPrice) {
              // console.log('tokenPrice', this.id, action, tx.blockNumber, internalTxs, underlyingTokenTx, idleTokenTx, pricesCalls)
              tokenPrice = BNify(1)
            }

            idlePrice = fixTokenDecimals(tokenPrice, this.underlyingToken?.decimals)
            underlyingAmount = idlePrice.times(idleAmount)
            // console.log('tokenPrice', this.id, tx.blockNumber, tokenPrice, idlePrice.toString(), underlyingAmount.toString())
          } else {
            underlyingAmount = underlyingTokenTxAmount
          }

          // console.log(this.id, action, tx.hash, idlePrice.toString(), underlyingAmount.toString(), idleAmount.toString(), tx)

          transactions.push({
            ...tx,
            action,
            idlePrice,
            idleAmount,
            assetId:this.id,
            underlyingAmount
          })
        }
      }

      return transactions;
    }, Promise.resolve([] as Transaction[]))

    return transactions
  }

  public getBalancesCalls(params: any[] = []): any[] {
    return [
      {
        assetId:this.id,
        call:this.trancheContract.methods.balanceOf(...params),
      },
    ]
  }

  public getPricesCalls(): any[] {
    const contract = this.cdoContractRpc || this.cdoContract
    return [
      {
        assetId: this.id,
        decimals: this.underlyingToken?.decimals || 18,
        call: contract.methods.virtualPrice(this.trancheConfig.address)
      },
    ]
  }

  public getPricesUsdCalls(contracts: GenericContract[]): any[] {
    if (!this.underlyingToken) return []
    
    const genericContractsHelper = new GenericContractsHelper(this.chainId, this.web3, contracts)
    const conversionRateParams = genericContractsHelper.getConversionRateParams(this.underlyingToken)
    if (!conversionRateParams) return []

    return [
      {
        assetId:this.id,
        params:conversionRateParams,
        call:conversionRateParams.call,
      },
    ]
  }

  public getFeesCalls(): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.cdoContract.methods.fee()
      }
    ]
  }

  public getAprsCalls(): ContractRawCall[] {
    const contract = this.cdoContractRpc || this.cdoContract
    return [
      {
        decimals: 18,
        assetId: this.id,
        call: contract.methods.getApr(this.trancheConfig.address)
      },
    ]
  }

  public getTotalSupplyCalls(): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.trancheContract.methods.totalSupply()
      },
    ]
  }

  public getAprRatioCalls(): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.cdoContract.methods.trancheAPRSplitRatio()
      },
    ]
  }

  public getBaseAprCalls(): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.strategyContract.methods.getApr()
      },
    ]
  }

  public async getHistoricalData(filters?: PlatformApiFilters): Promise<VaultHistoricalData> {
    return await this.vaultFunctionsHelper.getVaultHistoricalDataFromSubgraph(this, filters)
  }

  public async getHistoricalPrices(filters?: PlatformApiFilters): Promise<VaultHistoricalPrices> {
    return await this.vaultFunctionsHelper.getVaultPricesFromSubgraph(this, filters)
  }

  public async getHistoricalAprs(filters?: PlatformApiFilters): Promise<VaultHistoricalRates> {
    return await this.vaultFunctionsHelper.getVaultRatesFromSubgraph(this, filters)
  }

  public getAssetsData(): Assets {
    return {
      // [this.id]:{
      //   name: this.cdoConfig.name,
      //   token: this.cdoConfig.name,
      //   decimals: this.cdoConfig.decimals
      // },
      [this.id]:{
        type: this.type,
        token: this.trancheConfig.token,
        color: this.underlyingToken?.colors.hex,
        icon: `${tokensFolder}${this.underlyingToken?.token}.svg`,
        underlyingId: this.underlyingToken?.address?.toLowerCase(),
        name: this.underlyingToken?.label || this.underlyingToken?.token || this.trancheConfig.label || this.trancheConfig.token,
        decimals: this.trancheConfig.decimals
      },
    }
  }

  // Transactions
  public getAllowanceOwner() {
    return this.cdoConfig.address
  }

  public getMethodDefaultGasLimit(methodName: string): number | undefined {
    switch (methodName){
      case 'deposit':
        return 1185000
      case 'withdraw':
        return 1972478
      default:
        return
    }
  }

  public getAllowanceParams(amount: Number): any[] {
    const decimals = this.underlyingToken?.decimals || 18
    const amountToApprove = amount === MAX_ALLOWANCE ? MAX_ALLOWANCE : normalizeTokenAmount(amount, decimals)
    return [this.cdoConfig.address, amountToApprove]
  }

  public getUnlimitedAllowanceParams(): any[] {
    return this.getAllowanceParams(MAX_ALLOWANCE)
  }

  public getAllowanceContractSendMethod(params: any[] = []): ContractSendMethod | undefined {
    return this.underlyingContract?.methods.approve(...params)
  }

  public getDepositParams(amount: Number): any[] {
    const decimals = this.underlyingToken?.decimals || 18
    return [normalizeTokenAmount(amount, decimals)]
  }

  public getDepositContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.cdoContract.methods[`deposit${this.type}`](...params)
  }

  public getWithdrawParams(amount: Number): any[] {
    return [normalizeTokenAmount(amount, this.cdoConfig.decimals)]
  }

  public getWithdrawContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.cdoContract.methods[`withdraw${this.type}`](...params)
  }
}