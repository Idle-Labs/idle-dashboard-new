import Web3 from 'web3'
import { ZERO_ADDRESS } from 'constants/'
import { Contract } from 'web3-eth-contract'
import { tokensFolder } from 'constants/folders'
import { selectUnderlyingToken } from 'selectors/'
import { GenericContract } from 'contracts/GenericContract'
import { BNify, fixTokenDecimals, asyncForEach } from 'helpers/'
import { VaultFunctionsHelper } from 'classes/VaultFunctionsHelper'
import { GenericContractsHelper } from 'classes/GenericContractsHelper'
import type { BestYieldConfig, IdleToken, UnderlyingTokenProps, Assets, ContractRawCall, EtherscanTransaction, Transaction, VaultHistoricalRates, PlatformApiFilters } from 'constants/'

export class BestYieldVault {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly chainId: number
  public readonly type: string

  // Raw config
  public readonly idleConfig: IdleToken
  public readonly tokenConfig: BestYieldConfig
  public readonly rewardTokens: UnderlyingTokenProps[]
  public readonly underlyingToken: UnderlyingTokenProps | undefined

  // Contracts
  public readonly contract: Contract

  constructor(web3: Web3, chainId: number, tokenConfig: BestYieldConfig, type: string){
    
    // Init global data
    this.web3 = web3
    this.type = type
    this.chainId = chainId
    this.tokenConfig = tokenConfig
    this.idleConfig = tokenConfig.idle
    this.id = this.idleConfig.address.toLowerCase()
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
          const idleTokenToAddress = action === 'redeem' ? ZERO_ADDRESS : account
          const idleTokenTx = internalTxs.find( iTx => iTx.contractAddress.toLowerCase() === this.id && iTx.to.toLowerCase() === idleTokenToAddress.toLowerCase() )
          const idleAmount = idleTokenTx ? fixTokenDecimals(idleTokenTx.value, 18) : BNify(0)
          
          const underlyingTokenTx = internalTxs.find( iTx => {
            const underlyingTokenDirectionAddress = action === 'redeem' ? iTx.to : iTx.from
            const underlyingAmount = fixTokenDecimals(iTx.value, this.underlyingToken?.decimals)
            return iTx.contractAddress.toLowerCase() === this.underlyingToken?.address?.toLowerCase() && underlyingTokenDirectionAddress.toLowerCase() === account.toLowerCase() && underlyingAmount.gte(idleAmount) /*|| this.tokenConfig.proxies?.includes(underlyingTokenDirectionAddress.toLowerCase()*/ 
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
      },
    ]
  }

  public getPricesCalls(): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.contract.methods.tokenPrice(),
        decimals:this.underlyingToken?.decimals || 18,
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
        call:conversionRateParams.call
      }
    ]
  }

  public getAprsCalls(): ContractRawCall[] {
    return [
      {
        decimals: 18,
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

  public async getHistoricalAprs(filters?: PlatformApiFilters): Promise<VaultHistoricalRates> {
    const vaultFunctionsHelper: VaultFunctionsHelper = new VaultFunctionsHelper(this.chainId, this.web3)
    return await vaultFunctionsHelper.getVaultRatesFromIdleApi(this, filters)
  }

  public getAssetsData(): Assets {
    return {
      [this.id]:{
        decimals: 18,
        type: this.type,
        token: this.idleConfig.token,
        color: this.underlyingToken?.colors.hex,
        icon: `${tokensFolder}${this.underlyingToken?.token}.svg`,
        name: this.underlyingToken?.label || this.underlyingToken?.token || this.idleConfig.token,
      },
      ...(this.tokenConfig.protocols.reduce( (tokens: Assets, protocolToken) => {
        tokens[protocolToken.address.toLowerCase()] = {
          name:protocolToken.token,
          token:protocolToken.token,
          decimals:protocolToken.decimals,
        }
        return tokens
      }, {}))
    }
  }
}