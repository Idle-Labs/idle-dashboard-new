import { BNify } from 'helpers/'
import type { Vault } from 'vaults/'
import BigNumber from 'bignumber.js'
import type { Number } from 'constants/types'
import { Contract, ContractSendMethod, CallOptions } from 'web3-eth-contract'

export const getVaultAllowanceOwner = (vault: Vault) => {
  return ("getAllowanceOwner" in vault) ? vault.getAllowanceOwner() : vault.id
}

export const getAllowance = async (contract: Contract, owner: string, spender: string): Promise<number | null> => {
  if (!contract.methods.allowance) return null
  return await contract.methods.allowance(owner, spender).call()
}

export const estimateGasLimit = async (contractSendMethod: ContractSendMethod, callOptions: CallOptions = {}, minGasLimit: Number = 0): Promise<number | null> => {
  const gas = await contractSendMethod.estimateGas(callOptions).catch(e => console.error(e));
  if (!gas) return null
  return BigNumber.maximum(BNify(gas), minGasLimit).integerValue(BigNumber.ROUND_FLOOR).toNumber()
}