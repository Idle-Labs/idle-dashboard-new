import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { selectUnderlyingToken } from '../selectors'
import { TrancheVault } from '../vaults/TrancheVault'
import { GenericContract } from '../contracts/GenericContract'
import { BNify, fixTokenDecimals, asyncForEach } from 'helpers/'
import { GenericContractsHelper } from '../classes/GenericContractsHelper'
import { ZERO_ADDRESS, TrancheToken, GaugeConfig, UnderlyingTokenProps, Assets, ContractRawCall, EtherscanTransaction, Transaction, VaultHistoricalRates, PlatformApiFilters } from '../constants'

export class GaugeVault {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly chainId: number
  public readonly type: string

  // Raw config
  public readonly gaugeConfig: GaugeConfig
  public readonly trancheVault: TrancheVault | undefined
  public readonly trancheToken: TrancheToken
  public readonly rewardTokens: UnderlyingTokenProps[]
  public readonly underlyingToken: UnderlyingTokenProps | undefined

  // Contracts
  public readonly contract: Contract

  constructor(web3: Web3, chainId: number, gaugeConfig: GaugeConfig, trancheVault: TrancheVault | undefined){
    
    // Init global data
    this.web3 = web3
    this.type = 'gauge'
    this.chainId = chainId
    this.gaugeConfig = gaugeConfig
    this.trancheVault = trancheVault
    this.trancheToken = gaugeConfig.trancheToken
    this.id = this.gaugeConfig.address.toLowerCase()
    this.underlyingToken = selectUnderlyingToken(chainId, gaugeConfig.underlyingToken)

    this.rewardTokens = gaugeConfig.rewardTokens ? gaugeConfig.rewardTokens.reduce( (rewards: UnderlyingTokenProps[], rewardToken: string) => {
      const underlyingToken = selectUnderlyingToken(chainId, rewardToken)
      if (underlyingToken){
        rewards.push(underlyingToken)
      }
      return rewards
    },[]) : []

    // Init idle token contract
    this.contract = new web3.eth.Contract(this.gaugeConfig.abi, this.gaugeConfig.address)
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

      const transactions = await transactionsPromise

      const internalTxs = transactionsByHash[hash]

      await asyncForEach(internalTxs, async (tx: EtherscanTransaction) => {

        // Check for right token
        const isRightToken = internalTxs.length > 1 && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.underlyingToken?.address?.toLowerCase()).length > 0;

        const isDepositInternalTx = isRightToken && internalTxs.find(iTx => iTx.from.toLowerCase() === account.toLowerCase() && (iTx.to.toLowerCase() === this.id));
        const isRedeemInternalTx = isRightToken && internalTxs.find(iTx => iTx.contractAddress.toLowerCase() === this.underlyingToken?.address?.toLowerCase() && internalTxs.filter(iTx2 => iTx2.contractAddress.toLowerCase() === this.id).length && iTx.to.toLowerCase() === account.toLowerCase());

        const isSendTransferTx = internalTxs.length === 1 && tx.from.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;
        const isReceiveTransferTx = internalTxs.length === 1 && tx.to.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;

        const isDepositTx = isRightToken && tx.from.toLowerCase() === account.toLowerCase() && (tx.to.toLowerCase() === this.id);
        const isRedeemTx = isRightToken && !isDepositInternalTx && tx.contractAddress.toLowerCase() === this.underlyingToken?.address?.toLowerCase() && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.id).length && tx.to.toLowerCase() === account.toLowerCase();

        const isSwapOutTx = !isSendTransferTx && !isRedeemInternalTx && tx.from.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;
        const isSwapTx = !isReceiveTransferTx && !isDepositInternalTx && tx.to.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;

        // Get action by positive condition
        const actions: Record<string, boolean> = {
          deposit: !!(isReceiveTransferTx || isDepositTx || isSwapTx),
          redeem: !!(isSendTransferTx || isRedeemTx || isSwapOutTx)
        }

        const action = Object.keys(actions).find( (action: string) => !!actions[action] )

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

          const underlyingAmount = underlyingTokenTx ? fixTokenDecimals(underlyingTokenTx.value, this.underlyingToken?.decimals) : BNify(0)
          const idlePrice = underlyingAmount?.gt(0) ? underlyingAmount.div(idleAmount) : BNify(0)

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
        call:this.contract.methods.balanceOf(...params),
      }
    ]
  }

  public getPricesCalls(): any[] {
    if (!this.trancheVault) return []
    return [
      {
        assetId:this.id,
        decimals:this.underlyingToken?.decimals || 18,
        call:this.trancheVault.cdoContract.methods.tranchePrice(this.trancheToken.address)
      }
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
        call:conversionRateParams.call
      }
    ]
  }

  public getAprsCalls(): ContractRawCall[] {
    return []
  }

  public getTotalSupplyCalls(): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.contract.methods.totalSupply()
      }
    ]
  }

  public async getHistoricalAprs(filters?: PlatformApiFilters): Promise<VaultHistoricalRates> {
    return {
      vaultId: this.id,
      rates: []
    }
  }

  public getAssetsData(): Assets {
    return {
      [this.id]:{
        decimals: 18,
        type: this.type,
        name: this.gaugeConfig.name,
        token: this.gaugeConfig.token,
        color: this.underlyingToken?.colors.hex
      }
    }
  }
}