import Web3 from 'web3'
import { BNify } from 'helpers/'
import type { Vault } from 'vaults/'
import BigNumber from 'bignumber.js'
import type { BlockTransactionString } from 'web3-eth'
import { Contract, ContractSendMethod, CallOptions } from 'web3-eth-contract'

export function getVaultAllowanceOwner(vault: Vault) {
  return ("getAllowanceOwner" in vault) ? vault.getAllowanceOwner() : vault.id
}

export async function getAllowance(contract: Contract, owner: string, spender: string): Promise<BigNumber> {
  if (!contract.methods.allowance) return BNify(0)
  const allowance = await contract.methods.allowance(owner, spender).call()
  return BNify(allowance)
}

export async function estimateGasLimit(contractSendMethod: ContractSendMethod, callOptions: CallOptions = {}, minGasLimit = 0, addPercentage = 0): Promise<number | undefined> {
  const gas = await contractSendMethod.estimateGas(callOptions).catch( /*err => null*/ );
  if (!gas) return
  let gasLimit = BigNumber.maximum(BNify(gas), BNify(minGasLimit))
  if (addPercentage){
    gasLimit = gasLimit.plus(gasLimit.times(BNify(addPercentage).div(100)))
  }
  return gasLimit.integerValue(BigNumber.ROUND_FLOOR).toNumber()
}

export async function getBlock(web3: Web3, blockNumber: string | number = 'latest'): Promise<BlockTransactionString | undefined> {
  return await web3.eth.getBlock(blockNumber)
}

export async function getBlockBaseFeePerGas(web3: Web3, blockNumber: string | number = 'latest'): Promise<number | null> {
  const block = await getBlock(web3, blockNumber)
  if (!block) return null
  return block.baseFeePerGas ? +block.baseFeePerGas : null
}