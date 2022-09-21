import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import ERC20 from '../abis/tokens/ERC20.json'
import { selectUnderlyingToken } from '../selectors'
import { GenericContract } from '../contracts/GenericContract'
import { Abi, Assets, ContractRawCall } from '../constants/types'
import { GenericContractsHelper } from '../classes/GenericContractsHelper'
import type { UnderlyingTokenConfig } from '../constants/underlyingTokens'

export class UnderlyingToken {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly type: string
  readonly chainId: number

  readonly tokenConfig: UnderlyingTokenConfig

  // Contracts
  public readonly contract: Contract

  constructor(web3: Web3, chainId: number, tokenConfig: UnderlyingTokenConfig){
    
    // Init global data
    this.web3 = web3
    this.chainId = chainId
    this.type = 'underlying'
    this.tokenConfig = tokenConfig
    this.id = tokenConfig.address?.toLowerCase() || '0x0000000000000000000000000000000000000000'

    // Init CDO contract
    const abi = tokenConfig.abi || ERC20 as Abi
    this.contract = new web3.eth.Contract(abi, tokenConfig.address)
  }

  public getPricesCalls(): ContractRawCall[] {
    return []
  }

  public getPricesUsdCalls(contracts: GenericContract[]): any[] {
    if (!this.tokenConfig.conversionRate) return []
    
    const genericContractsHelper = new GenericContractsHelper(this.chainId, this.web3, contracts)
    const conversionRateParams = genericContractsHelper.getConversionRateParams(this.tokenConfig)
    if (!conversionRateParams) return []

    return [
      {
        assetId:this.id,
        params:conversionRateParams,
        call:conversionRateParams.call
      }
    ]
  }

  public getBalancesCalls(params: any[] = []): any[] {
    return [
      {
        assetId:this.id,
        call:this.contract.methods.balanceOf(...params)
      }
    ]
  }

  public getAssetsData(): Assets {
    return {
      [this.id]:{
        token: this.tokenConfig.token,
        name: this.tokenConfig.label||this.tokenConfig.token,
        decimals: this.tokenConfig.decimals || 18
      }
    }
  }
}