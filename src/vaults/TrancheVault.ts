import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { selectUnderlyingToken } from '../selectors'
import { GenericContract } from '../contracts/GenericContract'
import { GenericContractsHelper } from '../classes/GenericContractsHelper'
import type { CDO, Strategy, Pool, Tranche, TrancheConfig, UnderlyingTokenConfig, Assets, ContractRawCall } from '../constants'

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
  public readonly strategyConfig: Strategy
  public readonly trancheAAConfig: Tranche
  public readonly trancheBBConfig: Tranche
  public readonly poolConfig: Pool | undefined
  public readonly underlyingToken: UnderlyingTokenConfig | undefined

  // Contracts
  public readonly cdoContract: Contract
  public readonly underlyingContract: Contract | undefined
  public readonly trancheAAContract: Contract
  public readonly trancheBBContract: Contract

  constructor(web3: Web3, chainId: number, protocol: string, vaultConfig: TrancheConfig){
    
    // Init global data
    this.web3 = web3
    this.type = 'tranche'
    this.chainId = chainId
    this.protocol = protocol
    this.vaultConfig = vaultConfig
    this.id = vaultConfig.CDO.address.toLowerCase()
    this.underlyingToken = selectUnderlyingToken(chainId, vaultConfig.underlyingToken)

    // Init tranche configs
    this.cdoConfig = vaultConfig.CDO
    this.poolConfig = vaultConfig.Pool
    this.strategyConfig = vaultConfig.Strategy
    this.trancheAAConfig = vaultConfig.Tranches.AA
    this.trancheBBConfig = vaultConfig.Tranches.BB

    // Init CDO contract
    this.cdoContract = new web3.eth.Contract(this.cdoConfig.abi, this.cdoConfig.address)
        
    // Init underlying token contract
    if (this.underlyingToken){
      this.underlyingContract = new web3.eth.Contract(this.cdoConfig.abi, this.cdoConfig.address)
    }

    // Init tranche tokens contracts
    this.trancheAAContract = new web3.eth.Contract(this.trancheAAConfig.abi, this.trancheAAConfig.address)
    this.trancheBBContract = new web3.eth.Contract(this.trancheBBConfig.abi, this.trancheBBConfig.address)
  }

  public getBalancesCalls(params: any[] = []): any[] {
    return [
      {
        assetId:this.trancheAAConfig.address,
        call:this.trancheAAContract.methods.balanceOf(...params),
      },
      {
        assetId:this.trancheBBConfig.address,
        call:this.trancheBBContract.methods.balanceOf(...params),
      }
    ]
  }

  public getPricesCalls(): any[] {
    return [
      {
        decimals:this.underlyingToken?.decimals || 18,
        assetId:this.trancheAAConfig.address.toLowerCase(),
        call:this.cdoContract.methods.virtualPrice(this.trancheAAConfig.address)
      },
      {
        decimals:this.underlyingToken?.decimals || 18,
        assetId:this.trancheBBConfig.address.toLowerCase(),
        call:this.cdoContract.methods.virtualPrice(this.trancheBBConfig.address)
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
        params:conversionRateParams,
        call:conversionRateParams.call,
        assetId:this.trancheAAConfig.address.toLowerCase()
      },
      {
        params:conversionRateParams,
        call:conversionRateParams.call,
        assetId:this.trancheBBConfig.address.toLowerCase()
      }
    ]
  }

  public getAprsCalls(): ContractRawCall[] {
    return [
      {
        decimals:this.underlyingToken?.decimals || 18,
        assetId:this.trancheAAConfig.address.toLowerCase(),
        call:this.cdoContract.methods.getApr(this.trancheAAConfig.address)
      },
      {
        decimals:this.underlyingToken?.decimals || 18,
        assetId:this.trancheBBConfig.address.toLowerCase(),
        call:this.cdoContract.methods.getApr(this.trancheBBConfig.address)
      }
    ]
  }

  public getTotalSupplyCalls(): ContractRawCall[] {
    return [
      {
        decimals:this.underlyingToken?.decimals || 18,
        call:this.trancheAAContract.methods.totalSupply(),
        assetId:this.trancheAAConfig.address.toLowerCase()
      },
      {
        decimals:this.underlyingToken?.decimals || 18,
        call:this.trancheBBContract.methods.totalSupply(),
        assetId:this.trancheBBConfig.address.toLowerCase()
      }
    ]
  }

  public getAssetsData(): Assets {
    return {
      [this.id]:{
        token: this.cdoConfig.name,
        name: this.cdoConfig.name,
        decimals: this.cdoConfig.decimals
      },
      [this.trancheAAConfig.address.toLowerCase()]:{
        vaultId:this.id,
        token: this.trancheAAConfig.token,
        name: this.trancheAAConfig.label||this.trancheAAConfig.token,
        decimals: this.trancheAAConfig.decimals
      },
      [this.trancheBBConfig.address.toLowerCase()]:{
        vaultId:this.id,
        token: this.trancheBBConfig.token,
        name: this.trancheBBConfig.label||this.trancheBBConfig.token,
        decimals: this.trancheBBConfig.decimals
      }
    }
  }
}