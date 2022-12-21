import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import ERC20 from '../abis/tokens/ERC20.json'
import { tokensFolder } from 'constants/folders'
import { GenericContract } from '../contracts/GenericContract'
import type { Abi, Assets, ContractRawCall } from '../constants/types'
import type { UnderlyingTokenProps } from '../constants/underlyingTokens'
import { GenericContractsHelper } from '../classes/GenericContractsHelper'

export class UnderlyingToken {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly chainId: number
  public readonly type: string
  public readonly tokenConfig: UnderlyingTokenProps

  // Contracts
  public readonly contract: Contract | null

  constructor(web3: Web3, chainId: number, tokenConfig: UnderlyingTokenProps){
    
    // Init global data
    this.web3 = web3
    this.chainId = chainId
    this.type = 'underlying'
    this.tokenConfig = tokenConfig
    this.id = tokenConfig.address?.toLowerCase() || '0x0000000000000000000000000000000000000000'

    // Init CDO contract
    this.contract = null
    if (tokenConfig.abi !== null) {
      const abi = tokenConfig.abi || ERC20 as Abi
      this.contract = new web3.eth.Contract(abi, tokenConfig.address)
    }
  }

  public getTransactions(): any[] {
    return []
  }

  public getBalancesCalls(params: any[] = []): any[] {
    if (!this.contract) return []
    return [
      {
        assetId:this.id,
        call:this.contract.methods.balanceOf(...params)
      }
    ]
  }

  public getPricesCalls(): ContractRawCall[] {
    return []
  }

  public getPricesUsdCalls(contracts: GenericContract[]): any[] {
    if (!this.contract) return []
    if (!this.tokenConfig.conversionRate) return []
    
    const genericContractsHelper = new GenericContractsHelper({chainId: this.chainId, web3: this.web3, contracts})
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

  public getAprsCalls(): ContractRawCall[] {
    return []
  }

  public getTotalSupplyCalls(): ContractRawCall[] {
    if (!this.contract) return []
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
    return {
      [this.id]:{
        type: this.type,
        underlyingId: this.id,
        token: this.tokenConfig.token,
        color: this.tokenConfig?.colors.hex,
        decimals: this.tokenConfig.decimals || 18,
        icon: `${tokensFolder}${this.tokenConfig.token}.svg`,
        name: this.tokenConfig.label||this.tokenConfig.token,
      }
    }
  }
}
