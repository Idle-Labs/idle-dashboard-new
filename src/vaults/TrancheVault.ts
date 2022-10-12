import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { tokensFolder } from 'constants/folders'
import { selectUnderlyingToken } from '../selectors'
import { GenericContract } from '../contracts/GenericContract'
import { GenericContractsHelper } from '../classes/GenericContractsHelper'
import { strategies, CDO, Strategy, Pool, Tranche, TrancheConfig, UnderlyingTokenProps, Assets, ContractRawCall } from '../constants'

export class TrancheVault {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly type: string
  readonly chainId: number
  readonly protocol: string

  // Raw config
  public readonly vaultConfig: TrancheConfig

  // 
  public readonly cdoConfig: CDO
  public readonly trancheConfig: Tranche
  public readonly strategyConfig: Strategy
  public readonly poolConfig: Pool | undefined
  public readonly rewardTokens: UnderlyingTokenProps[]
  public readonly underlyingToken: UnderlyingTokenProps | undefined

  // Contracts
  public readonly cdoContract: Contract
  public readonly underlyingContract: Contract | undefined
  public readonly trancheContract: Contract

  constructor(web3: Web3, chainId: number, protocol: string, vaultConfig: TrancheConfig, type: string){
    
    // Init global data
    this.web3 = web3
    this.chainId = chainId
    this.protocol = protocol
    this.vaultConfig = vaultConfig
    this.type = strategies[type]?.route
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
        assetId:this.id,
        decimals:this.underlyingToken?.decimals || 18,
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
        icon: `${tokensFolder}${this.underlyingToken?.token}.svg`,
        name: this.underlyingToken?.label || this.underlyingToken?.token || this.trancheConfig.label || this.trancheConfig.token,
        decimals: this.trancheConfig.decimals
      },
    }
  }
}