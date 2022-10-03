import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import { selectUnderlyingToken } from '../selectors'
import { GenericContract } from '../contracts/GenericContract'
import { GenericContractsHelper } from '../classes/GenericContractsHelper'
import type { BestYieldConfig, IdleToken, UnderlyingTokenConfig, Assets, ContractRawCall } from '../constants'

export class BestYieldVault {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly type: string
  readonly chainId: number

  // Raw config
  public readonly idleConfig: IdleToken
  public readonly tokenConfig: BestYieldConfig
  public readonly underlyingToken: UnderlyingTokenConfig | undefined

  // Contracts
  public readonly contract: Contract

  constructor(web3: Web3, chainId: number, tokenConfig: BestYieldConfig){
    
    // Init global data
    this.web3 = web3
    this.chainId = chainId
    this.type = 'best-yield'
    this.tokenConfig = tokenConfig
    this.idleConfig = tokenConfig.idle
    this.id = this.idleConfig.address.toLowerCase()
    this.underlyingToken = selectUnderlyingToken(chainId, tokenConfig.underlyingToken)

    // Init idle token contract
    this.contract = new web3.eth.Contract(this.idleConfig.abi, this.idleConfig.address)
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

  public getAssetsData(): Assets {
    return {
      [this.id]:{
        decimals: 18,
        type: this.type,
        name: this.idleConfig.token,
        token: this.idleConfig.token,
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