import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import type { ContractRawCall } from '../constants/types'
import type { GenericContractConfig } from '../constants'

export class GenericContract {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly chainId: number
  public readonly name: string
  public readonly contractConfig: GenericContractConfig

  // Contracts
  public readonly contract: Contract

  constructor(web3: Web3, chainId: number, contractConfig: GenericContractConfig){
    
    // Init global data
    this.web3 = web3
    this.chainId = chainId
    this.name = contractConfig.name
    this.contractConfig = contractConfig
    this.id = contractConfig.address?.toLowerCase()

    // Init CDO contract
    this.contract = new web3.eth.Contract(contractConfig.abi, this.id)
  }

  public getRawCall(methodName: string, params: any[] = [], assetId?: string): ContractRawCall {
    const call = this.contract.methods[methodName] ? this.contract.methods[methodName](...params) : null
    return {
      call,
      assetId: assetId || this.id,
    }
  }

  public async executeRawCall(rawCall: ContractRawCall, params: Record<any, any> = {}): Promise<any | null> {
    if (!rawCall.call) return null
    try {
      return await rawCall.call.call(params)
    } catch (err) {
      return null
    }
  }

  public async call(methodName: string, params: any[] = [], callParams: Record<any, any> = {}): Promise<any | null> {
    const rawCall = this.getRawCall(methodName, params);
    return await this.executeRawCall(rawCall, callParams)
  }
}