import Web3 from 'web3'
import { Contract } from 'web3-eth-contract'
import ERC20 from '../abis/tokens/ERC20.json'
import { selectUnderlyingToken } from '../selectors'
import type { GenericContractConfig } from '../constants'
import type { Abi, Assets, ContractRawCall } from '../constants/types'

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
    this.id = contractConfig.address.toLowerCase()

    // Init CDO contract
    this.contract = new web3.eth.Contract(contractConfig.abi, this.id)
  }

  public getRawCall(methodName: string, params: any[] = []): ContractRawCall[] | null {
    if (!this.contract.methods[methodName]) return null
    return [
      {
        assetId:this.id,
        call:this.contract.methods[methodName](...params)
      }
    ]
  }

  public async call(methodName: string, params: any[] = []): Promise<any | null> {
    const rawCall = this.getRawCall(methodName, params);
    if (!rawCall) return null
    return await rawCall[0].call
  }
}