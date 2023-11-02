import Web3 from 'web3'
import ERC20 from 'abis/tokens/ERC20.json'
import { Contract } from 'web3-eth-contract'
import { MAX_ALLOWANCE } from 'constants/vars'
import { tokensFolder } from 'constants/folders'
import { ContractSendMethod } from 'web3-eth-contract'
import { GenericContractConfig } from 'constants/contracts'
import type { UnderlyingTokenProps } from 'constants/underlyingTokens'
import { asyncReduce, fixTokenDecimals, BNify, normalizeTokenAmount } from 'helpers/'
import type { Abi, Assets, ContractRawCall, EtherscanTransaction, Transaction, NumberType } from 'constants/types'

type ConstructorProps = {
  web3: Web3
  chainId: number
  stkIdleConfig: GenericContractConfig
  rewardTokenConfig: UnderlyingTokenProps
  feeDistributorConfig: GenericContractConfig
}

export class StakedIdleVault {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly chainId: number
  public readonly type: string
  public stkIdleConfig: GenericContractConfig
  public rewardTokenConfig: UnderlyingTokenProps
  public feeDistributorConfig: GenericContractConfig

  // Contracts
  public readonly stkIdleContract: Contract
  public readonly rewardTokenContract: Contract
  public readonly feeDistributorContract: Contract

  constructor(props: ConstructorProps){

    const {
      web3,
      chainId,
      stkIdleConfig,
      rewardTokenConfig,
      feeDistributorConfig
    } = props
    
    // Init global data
    this.web3 = web3
    this.type = 'STK'
    this.chainId = chainId
    this.stkIdleConfig = stkIdleConfig
    this.rewardTokenConfig = rewardTokenConfig
    this.feeDistributorConfig = feeDistributorConfig
    this.id = stkIdleConfig.address.toLowerCase()

    // Init contracts
    const rewardTokenContractAbi = rewardTokenConfig.abi || ERC20 as Abi
    this.rewardTokenContract = new web3.eth.Contract(rewardTokenContractAbi, rewardTokenConfig.address)

    this.stkIdleContract = new web3.eth.Contract(stkIdleConfig.abi, stkIdleConfig.address)
    this.feeDistributorContract = new web3.eth.Contract(feeDistributorConfig.abi, feeDistributorConfig.address)
  }

  // eslint-disable-next-line
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

        for (const tx of internalTxs) {
          // Check for right token
          const isRightToken = internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.rewardTokenConfig.address?.toLowerCase()).length > 0;

          const isDepositInternalTx = isRightToken && internalTxs.find(iTx => iTx.from.toLowerCase() === account.toLowerCase() && (iTx.to.toLowerCase() === this.id))
          const isRedeemInternalTx = isRightToken && internalTxs.find(iTx => iTx.contractAddress.toLowerCase() === this.rewardTokenConfig.address?.toLowerCase() && iTx.from.toLowerCase() === this.id && iTx.to.toLowerCase() === account.toLowerCase())

          const isSendTransferTx = internalTxs.length === 1 && tx.from.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id
          const isReceiveTransferTx = internalTxs.length === 1 && tx.to.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id

          const isDepositTx = isRightToken && tx.from.toLowerCase() === account.toLowerCase() && (tx.to.toLowerCase() === this.id)
          const isRedeemTx = isRightToken && !isDepositInternalTx && tx.from.toLowerCase() === this.id && tx.contractAddress.toLowerCase() === this.rewardTokenConfig.address?.toLowerCase() && tx.to.toLowerCase() === account.toLowerCase()

          const isSwapOutTx = !isSendTransferTx && !isRedeemInternalTx && tx.from.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id
          const isSwapTx = !isReceiveTransferTx && !isDepositInternalTx && tx.to.toLowerCase() === account.toLowerCase() && tx.contractAddress.toLowerCase() === this.id

          // Get action by positive condition
          const actions: Record<string, boolean> = {
            stake: !!(isReceiveTransferTx || isDepositTx || isSwapTx),
            unstake: !!(isSendTransferTx || isRedeemTx || isSwapOutTx)
          }

          const action = Object.keys(actions).find( (action: string) => !!actions[action] )

          if (action) {

            // Get idle token tx and underlying token tx
            const idleTokenToAddress = action === 'unstake' ? (isSendTransferTx ? null : account) : this.id
            const idleTokenTx = internalTxs.find( iTx => iTx.contractAddress.toLowerCase() === this.rewardTokenConfig.address?.toLowerCase() && (!idleTokenToAddress || iTx.to.toLowerCase() === idleTokenToAddress.toLowerCase()) )
            const idleAmount = idleTokenTx ? fixTokenDecimals(idleTokenTx.value, 18) : BNify(0)
            const underlyingAmount = idleAmount
            const idlePrice = BNify(1)

            transactions.push({
              ...tx,
              action,
              idlePrice,
              idleAmount,
              assetId:this.id,
              underlyingAmount,
              chainId: this.chainId
            })
          }
        }

        return transactions
      },
      (acc, val) => ([...acc, ...val]),
      []
    )

    // console.log('Staking transactions', this.id, transactions)

    return transactions
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

  public getBalancesCalls(params: any[] = []): any[] {
    return [
      {
        assetId:this.id,
        call:this.stkIdleContract.methods.balanceOf(...params)
      }
    ]
  }

  public getTotalSupplyCalls(): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.stkIdleContract.methods.totalSupply()
      }
    ]
  }

  /*
  public getRewardTokensCalls(data?: any): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.stkIdleContract.methods.token()
      }
    ]
  }

  public getRewardTokensAmounts(account: string): ContractRawCall[] {
    return [
      {
        assetId: this.id,
        call: this.feeDistributorContract.methods.claim(account)
      }
    ]
  }
  */

  public getAssetsData(): Assets {
    return {
      [this.id]:{
        type: this.type,
        token: this.rewardTokenConfig.token,
        color: this.rewardTokenConfig.colors.hex,
        underlyingId: this.rewardTokenConfig.address,
        decimals: this.rewardTokenConfig.decimals || 18,
        icon: `${tokensFolder}${this.rewardTokenConfig.token}.svg`,
        name: this.rewardTokenConfig.label || this.rewardTokenConfig.token,
      }
    }
  }

  // Transactions

  public getMethodDefaultGasLimit(methodName: string): number | undefined {
    switch (methodName){
      case 'stake':
        return 558690
      case 'unstake':
        return 567990
      default:
        return
    }
  }

  public getAllowanceParams(amount: NumberType): any[] {
    const amountToApprove = amount === MAX_ALLOWANCE ? MAX_ALLOWANCE : normalizeTokenAmount(amount, 18)
    return [this.id, amountToApprove]
  }

  public getUnlimitedAllowanceParams(): any[] {
    return this.getAllowanceParams(MAX_ALLOWANCE)
  }

  public getAllowanceContract(): Contract | undefined {
    return this.rewardTokenContract
  }

  public getAllowanceContractSendMethod(params: any[] = []): ContractSendMethod | undefined {
    const allowanceContract = this.getAllowanceContract()
    return allowanceContract?.methods.approve(...params)
  }

  public getIncreaseAmountParams(amount: NumberType): any[] {
    return [normalizeTokenAmount(amount, 18)]
  }

  public getIncreaseAmountContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.stkIdleContract.methods[`increase_amount`](...params)
  }

  public getIncreaseTimeParams(lockEndTime: number): any[] {
    return [lockEndTime]
  }

  public getIncreaseTimeContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.stkIdleContract.methods[`increase_unlock_time`](...params)
  }

  public getDepositParams(amount: NumberType, lockEndTime?: number): any[] {
    return [normalizeTokenAmount(amount, 18), lockEndTime]
  }

  public getDepositContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.stkIdleContract.methods[`create_lock`](...params)
  }

  public getWithdrawParams(): any[] {
    return []
  }

  public getClaimRewardsContractSendMethod(): ContractSendMethod {
    return this.feeDistributorContract.methods.claim()
  }

  public getWithdrawContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.stkIdleContract.methods[`withdraw`](...params)
  }
}
