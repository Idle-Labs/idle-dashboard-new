import Web3 from 'web3'
import BigNumber from 'bignumber.js'
import { Contract } from 'web3-eth-contract'
import { MAX_ALLOWANCE } from 'constants/vars'
import { tokensFolder } from 'constants/folders'
import { TrancheVault } from 'vaults/TrancheVault'
import { selectUnderlyingToken } from 'selectors/'
import { ContractSendMethod } from 'web3-eth-contract'
import { CacheContextProps } from 'contexts/CacheProvider'
import { GenericContract } from 'contracts/GenericContract'
import { GenericContractsHelper } from 'classes/GenericContractsHelper'
import type { GaugeRewardData, AssetId, NumberType } from 'constants/types'
import { BNify, normalizeTokenAmount, fixTokenDecimals, asyncReduce, catchPromise } from 'helpers/'
import { TrancheToken, GaugeConfig, UnderlyingTokenProps, Assets, ContractRawCall, EtherscanTransaction, Transaction } from '../constants'

type ConstructorProps = {
  web3: Web3
  chainId: number
  gaugeConfig: GaugeConfig
  trancheVault: TrancheVault
  cacheProvider?: CacheContextProps
  gaugeDistributorProxy?: GenericContract
}

export class GaugeVault {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly chainId: number
  public readonly type: string

  // Private attributes
  private readonly cacheProvider: CacheContextProps | undefined

  // Raw config
  public readonly gaugeConfig: GaugeConfig
  public readonly trancheVault: TrancheVault
  public readonly trancheToken: TrancheToken
  public readonly rewardTokens: UnderlyingTokenProps[]
  public readonly rewardToken: UnderlyingTokenProps | undefined
  public readonly underlyingToken: UnderlyingTokenProps | undefined
  public readonly multiRewardsTokens: UnderlyingTokenProps[] | undefined

  // Contracts
  public readonly contract: Contract
  public readonly multiRewardsContract: Contract | undefined
  public readonly gaugeDistributorProxy: GenericContract | undefined

  // constructor(web3: Web3, chainId: number, gaugeConfig: GaugeConfig, trancheVault: TrancheVault | undefined){
  constructor(props: ConstructorProps){

    const {
      web3,
      chainId,
      trancheVault,
      gaugeConfig,
      cacheProvider,
      gaugeDistributorProxy
    } = props
    
    // Init global data
    this.web3 = web3
    this.type = 'GG'
    this.chainId = chainId
    this.gaugeConfig = gaugeConfig
    this.trancheVault = trancheVault
    this.cacheProvider = cacheProvider
    this.trancheToken = gaugeConfig.trancheToken
    this.id = this.gaugeConfig.address.toLowerCase()
    this.gaugeDistributorProxy = gaugeDistributorProxy
    this.underlyingToken = selectUnderlyingToken(chainId, gaugeConfig.underlyingToken)

    // const gaugeRewards = [...gaugeConfig.rewardTokens, ...(gaugeConfig.multiRewards?.rewardTokens || [])]

    this.rewardToken = selectUnderlyingToken(chainId, gaugeConfig.rewardToken)

    this.multiRewardsTokens = gaugeConfig.multiRewards?.rewardTokens.reduce( (rewards: UnderlyingTokenProps[], rewardToken: string) => {
      const underlyingToken = selectUnderlyingToken(chainId, rewardToken)
      if (underlyingToken){
        rewards.push(underlyingToken)
      }
      return rewards
    },[])

    this.rewardTokens = [...(this.multiRewardsTokens || [])]
    if (this.rewardToken){
      this.rewardTokens.push(this.rewardToken)
    }

    // Init idle token contract
    this.contract = new web3.eth.Contract(this.gaugeConfig.abi, this.gaugeConfig.address)
    if (this.gaugeConfig.multiRewards){
      this.multiRewardsContract = new web3.eth.Contract(this.gaugeConfig.multiRewards.abi, this.gaugeConfig.multiRewards.address)
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
        const transactions = []

        for (const tx of internalTxs) {
          // Check for right token
          const isRightToken = internalTxs.length > 1 && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.trancheToken.address?.toLowerCase()).length > 0;

          const isDepositInternalTx = isRightToken && internalTxs.find(iTx => iTx.from.toLowerCase() === account.toLowerCase() && (iTx.to.toLowerCase() === this.id));
          const isRedeemInternalTx = isRightToken && internalTxs.find(iTx => iTx.contractAddress.toLowerCase() === this.trancheToken.address?.toLowerCase() && internalTxs.filter(iTx2 => iTx2.contractAddress.toLowerCase() === this.id).length && iTx.to.toLowerCase() === account.toLowerCase());

          const isSendTransferTx = internalTxs.length === 1 && tx.from.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;
          const isReceiveTransferTx = internalTxs.length === 1 && tx.to.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;

          const isDepositTx = isRightToken && tx.from.toLowerCase() === account.toLowerCase() && (tx.to.toLowerCase() === this.id);
          const isRedeemTx = isRightToken && !isDepositInternalTx && tx.contractAddress.toLowerCase() === this.trancheToken.address?.toLowerCase() && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.id).length && tx.to.toLowerCase() === account.toLowerCase();

          const isSwapOutTx = !isSendTransferTx && !isRedeemInternalTx && tx.from.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;
          const isSwapTx = !isReceiveTransferTx && !isDepositInternalTx && tx.to.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id;

          // Get action by positive condition
          const actions: Record<string, boolean> = {
            stake: !!(isReceiveTransferTx || isDepositTx || isSwapTx),
            unstake: !!(isSendTransferTx || isRedeemTx || isSwapOutTx)
          }

          const action = Object.keys(actions).find( (action: string) => !!actions[action] )

          if (action) {

            // Get idle token tx and underlying token tx
            const idleTokenToAddress = action === 'unstake' ? (isSendTransferTx ? null : account) : this.gaugeConfig.address
            const idleTokenTx = internalTxs.find( iTx => iTx.contractAddress.toLowerCase() === this.trancheToken.address?.toLowerCase() && (!idleTokenToAddress || iTx.to.toLowerCase() === idleTokenToAddress.toLowerCase()) )
            const idleAmount = idleTokenTx ? fixTokenDecimals(idleTokenTx.value, 18) : BNify(0)

            const pricesCalls = this.trancheVault.getPricesCalls()

            const cacheKey = `tokenPrice_${this.chainId}_${this.trancheVault.id}_${tx.blockNumber}`
            // @ts-ignore
            const callback = async() => await catchPromise(pricesCalls[0].call.call({}, parseInt(tx.blockNumber)))
            const tokenPrice = this.cacheProvider ? await this.cacheProvider.checkAndCache(cacheKey, callback, 0) : await callback()
            const idlePrice = tokenPrice ? fixTokenDecimals(tokenPrice, this.underlyingToken?.decimals) : BNify(1)

            // const underlyingAmount = idlePrice.times(idleAmount)
            const underlyingAmount = idleAmount
              // console.log('tokenPrice', this.id, tx.blockNumber, tokenPrice, idlePrice.toString(), underlyingAmount.toString())

            // console.log(this.id, action, tx.hash, tokenPrice?.toString(), idlePrice.toString(), underlyingAmount.toString(), idleAmount.toString(), idleTokenToAddress, tx)

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

        return transactions
      },
      (acc, val) => ([...acc, ...val]),
      []
    )

    // console.log('Gauge transactions', this.id, transactions)

    return transactions
  }

  public getGaugeRewardData(rewardAddress: string, rewardTokenBalance: BigNumber, rewardRate?: BigNumber): GaugeRewardData | undefined {
    const rewardToken = this.rewardTokens.find( (rewardToken: UnderlyingTokenProps) => rewardToken.address?.toLowerCase() === rewardAddress.toLowerCase() )
    if (!rewardToken) return

    const tokensPerSecond = rewardRate ? fixTokenDecimals(rewardRate, 18) : BNify(0)
    const balance = !rewardTokenBalance.isNaN() ? fixTokenDecimals(rewardTokenBalance, rewardToken.decimals) : BNify(0)

    return {
      balance,
      apr: null,
      rate: tokensPerSecond.times(86400),
    };
  }

  public getBalancesCalls(params: any[] = []): any[] {
    return [
      {
        assetId:this.id,
        call:this.contract.methods.balanceOf(...params),
      }
    ]
  }

  public getRewardContractCalls(): ContractRawCall[] {
    return [
      {
        assetId: this.id,
        call: this.contract.methods.reward_contract()
      }
    ]
  }

  public getClaimableRewardsCalls(account: string): ContractRawCall[] {
    return [
      {
        assetId: this.id,
        call: this.contract.methods.claimable_tokens(account)
      }
    ]
  }

  public getMultiRewardsDataCalls(): ContractRawCall[] {
    if (!this.multiRewardsTokens) return []
    return this.multiRewardsTokens.reduce( (calls: ContractRawCall[], rewardTokenAddress: UnderlyingTokenProps) => {
      if (this.multiRewardsContract){
        calls.push(
          {
            assetId: this.id,
            call: this.multiRewardsContract.methods.rewardData(rewardTokenAddress.address)
          }
        )
      }
      return calls
    }, [])
  }

  public getClaimableMultiRewardsCalls(account: string): ContractRawCall[] {
    if (!this.multiRewardsTokens) return []
    return this.multiRewardsTokens.reduce( (calls: ContractRawCall[], rewardTokenAddress: UnderlyingTokenProps) => {
      calls.push({
        assetId: this.id,
        call: this.contract.methods.claimable_reward_write(account, rewardTokenAddress.address)
      })
      return calls
    }, [])
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

  public async getHistoricalData(): Promise<any> {
    return {
      vaultId: this.id,
      rates: [],
      prices: []
    }
  }

  public async getHistoricalPrices(): Promise<any> {
    return {
      vaultId: this.id,
      prices: []
    }
  }

  public async getHistoricalAprs(): Promise<any> {
    return {
      vaultId: this.id,
      rates: []
    }
  }

  public getAssetsData(): Assets {
    const trancheAssetData = Object.values(this.trancheVault.getAssetsData())[0]
    return {
      [this.id]:{
        decimals: 18,
        type: this.type,
        name: this.trancheToken.name,
        token: trancheAssetData.token,
        color: this.underlyingToken?.colors.hex,
        underlyingId: this.trancheToken.address.toLowerCase(),
        icon: `${tokensFolder}${this.underlyingToken?.token}.svg`,
      }
    }
  }

  // Transactions
  public getAllowanceOwner() {
    return this.gaugeConfig.address
  }

  public getMethodDefaultGasLimit(methodName: string): number | undefined {
    switch (methodName){
      case 'deposit':
        return 583082
      case 'withdraw':
        return 567990
      default:
        return
    }
  }

  public getAllowanceParams(amount: NumberType): any[] {
    const amountToApprove = amount === MAX_ALLOWANCE ? MAX_ALLOWANCE : normalizeTokenAmount(amount, 18)
    return [this.getAllowanceOwner(), amountToApprove]
  }

  public getUnlimitedAllowanceParams(): any[] {
    return this.getAllowanceParams(MAX_ALLOWANCE)
  }

  public getAllowanceContract(): Contract | undefined {
    return this.trancheVault.trancheContract
  }

  public getAllowanceContractSendMethod(params: any[] = []): ContractSendMethod | undefined {
    const allowanceContract = this.getAllowanceContract()
    return allowanceContract?.methods.approve(...params)
  }

  public getDepositParams(amount: NumberType): any[] {
    return [normalizeTokenAmount(amount, 18)]
  }

  public getClaimRewardsContractSendMethod(assetId: AssetId): ContractSendMethod | undefined {
    if (assetId.toLowerCase() === this.rewardToken?.address?.toLowerCase()){
      const distributeRawCall = this.gaugeDistributorProxy?.getRawCall('distribute', [this.id])
      return distributeRawCall?.call
    } else {
      return this.contract.methods.claim_rewards()
    }
  }

  public getDepositContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.contract.methods[`deposit`](...params)
  }

  public getWithdrawParams(amount: NumberType): any[] {
    return [normalizeTokenAmount(amount, 18)]
  }

  public getWithdrawContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.contract.methods[`withdraw`](...params)
  }
}