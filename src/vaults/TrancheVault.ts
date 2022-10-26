import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { tokensFolder } from 'constants/folders'
import { selectUnderlyingToken } from 'selectors/'
import { GenericContract } from 'contracts/GenericContract'
import { BNify, fixTokenDecimals, asyncForEach } from 'helpers/'
import { GenericContractsHelper } from 'classes/GenericContractsHelper'
import { ZERO_ADDRESS, CDO, Strategy, Pool, Tranche, GaugeConfig, TrancheConfig, UnderlyingTokenProps, Assets, ContractRawCall, EtherscanTransaction, Transaction } from '../constants'

export class TrancheVault {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly chainId: number
  readonly protocol: string
  public readonly type: string

  // Raw config
  public readonly vaultConfig: TrancheConfig

  // 
  public readonly cdoConfig: CDO
  public readonly trancheConfig: Tranche
  public readonly strategyConfig: Strategy
  public readonly poolConfig: Pool | undefined
  public readonly rewardTokens: UnderlyingTokenProps[]
  public readonly gaugeConfig: GaugeConfig | null | undefined
  public readonly underlyingToken: UnderlyingTokenProps | undefined

  // Contracts
  public readonly cdoContract: Contract
  public readonly trancheContract: Contract
  public readonly underlyingContract: Contract | undefined

  constructor(web3: Web3, chainId: number, protocol: string, vaultConfig: TrancheConfig, gaugeConfig: GaugeConfig | null | undefined, type: string){
    
    // Init global data
    this.web3 = web3
    this.type = type
    this.chainId = chainId
    this.protocol = protocol
    this.vaultConfig = vaultConfig
    this.gaugeConfig = gaugeConfig
    this.trancheConfig = vaultConfig.Tranches[type]
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
        
    // Init underlying token contract
    if (this.underlyingToken){
      this.underlyingContract = new web3.eth.Contract(this.cdoConfig.abi, this.cdoConfig.address)
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

      await asyncForEach(internalTxs, async (tx: EtherscanTransaction) => {

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
          const idleTokenToAddress = action === 'redeem' ? ZERO_ADDRESS : account
          const idleTokenTx = internalTxs.find( iTx => iTx.contractAddress.toLowerCase() === this.id && iTx.to.toLowerCase() === idleTokenToAddress.toLowerCase() )
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

            // @ts-ignore
            const tokenPrice = await pricesCalls[0].call.call({}, parseInt(tx.blockNumber))

            idlePrice = fixTokenDecimals(tokenPrice, this.underlyingToken?.decimals)
            underlyingAmount = idlePrice.times(idleAmount)
            // console.log('tokenPrice', this.id, tx.blockNumber, tokenPrice, idlePrice.toString(), underlyingAmount.toString())
          } else {
            underlyingAmount = underlyingTokenTxAmount
          }

          // console.log(this.id, action, tx.hash, idlePrice.toString(), underlyingAmount.toString(), idleAmount.toString())

          transactions.push({
            ...tx,
            action,
            idlePrice,
            idleAmount,
            assetId:this.id,
            underlyingAmount
          })
        }
      })

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
    return [
      {
        assetId:this.id,
        decimals:this.underlyingToken?.decimals || 18,
        call:this.cdoContract.methods.virtualPrice(this.trancheConfig.address)
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

  public getAprsCalls(): ContractRawCall[] {

    return [
      {
        decimals:18,
        assetId:this.id,
        call:this.cdoContract.methods.getApr(this.trancheConfig.address)
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
        name: this.underlyingToken?.label || this.underlyingToken?.token || this.trancheConfig.label || this.trancheConfig.token,
        decimals: this.trancheConfig.decimals
      },
    }
  }
}