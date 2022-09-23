import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { selectUnderlyingToken } from '../selectors'
import { TrancheVault } from '../vaults/TrancheVault'
import { GenericContract } from '../contracts/GenericContract'
import { GenericContractsHelper } from '../classes/GenericContractsHelper'
import type { TrancheToken, GaugeConfig, UnderlyingTokenConfig, Assets, ContractRawCall } from '../constants'

export class GaugeVault {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly type: string
  readonly chainId: number

  // Raw config
  public readonly gaugeConfig: GaugeConfig
  public readonly trancheVault: TrancheVault | undefined
  public readonly trancheToken: TrancheToken
  public readonly underlyingToken: UnderlyingTokenConfig | undefined

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

    // Init idle token contract
    this.contract = new web3.eth.Contract(this.gaugeConfig.abi, this.gaugeConfig.address)
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

  public getAssetsData(): Assets {
    return {
      [this.id]:{
        decimals: 18,
        name: this.gaugeConfig.name,
        token: this.gaugeConfig.token,
      }
    }
  }
}