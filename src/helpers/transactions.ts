import Web3 from 'web3'
import { BNify } from 'helpers/'
import type { Vault } from 'vaults/'
import BigNumber from 'bignumber.js'
import type { Number } from 'constants/types'
import { Contract, ContractSendMethod, CallOptions } from 'web3-eth-contract'

export const getVaultAllowanceOwner = (vault: Vault) => {
  return ("getAllowanceOwner" in vault) ? vault.getAllowanceOwner() : vault.id
}

export const getAllowance = async (contract: Contract, owner: string, spender: string): Promise<BigNumber> => {
  if (!contract.methods.allowance) return BNify(0)
  const allowance = await contract.methods.allowance(owner, spender).call()
  return BNify(allowance)
}

export const estimateGasLimit = async (contractSendMethod: ContractSendMethod, callOptions: CallOptions = {}, minGasLimit: Number = 0): Promise<number | undefined> => {
  const gas = await contractSendMethod.estimateGas(callOptions).catch( err => null );
  if (!gas) return
  return BigNumber.maximum(BNify(gas), minGasLimit).integerValue(BigNumber.ROUND_FLOOR).toNumber()
}

export const getBlockBaseFeePerGas = async (web3: Web3, blockNumber: string | number = 'latest'): Promise<number | null> => {
  const block = await web3.eth.getBlock(blockNumber)
  if (!block) return null
  return block.baseFeePerGas ? +block.baseFeePerGas : null
}