import Web3 from "web3";
import { BNify } from "helpers/";
import type { Vault } from "vaults/";
import BigNumber from "bignumber.js";
import { EtherscanTransaction } from "constants/";
import type { BlockTransactionString } from "web3-eth";
import type { Transaction as Web3Transaction } from "web3-core";
import { Contract, ContractSendMethod, CallOptions } from "web3-eth-contract";

export function getVaultAllowanceOwner(vault: Vault) {
  return "getAllowanceOwner" in vault ? vault.getAllowanceOwner() : vault.id;
}

export async function getAllowance(
  contract: Contract,
  owner: string,
  spender: string
): Promise<BigNumber> {
  if (!contract.methods.allowance) return BNify(0);
  const allowance = await contract.methods.allowance(owner, spender).call();
  return BNify(allowance);
}

export async function estimateGasLimit(
  contractSendMethod: ContractSendMethod,
  callOptions: CallOptions = {},
  minGasLimit = 0,
  addPercentage = 0
): Promise<number | undefined> {
  const gas = await contractSendMethod
    .estimateGas(callOptions)
    .catch(/*err => null*/);
  if (!gas) return;
  let gasLimit = BigNumber.maximum(BNify(gas), BNify(minGasLimit));
  if (addPercentage) {
    gasLimit = gasLimit.plus(gasLimit.times(BNify(addPercentage).div(100)));
  }
  return gasLimit.integerValue(BigNumber.ROUND_FLOOR).toNumber();
}

export async function getBlock(
  web3: Web3,
  blockNumber: string | number = "latest"
): Promise<BlockTransactionString | undefined> {
  return await web3.eth.getBlock(blockNumber);
}

export async function getGasPrice(web3: Web3) {
  const gasPrice = await web3.eth.getGasPrice();
  return BNify(gasPrice).div(1e9);
}

export function decodeTxParams(
  web3: Web3,
  tx: EtherscanTransaction | Web3Transaction,
  contract: Contract,
  functionName?: string
): string[] | null {
  if (!functionName && "functionName" in tx) {
    functionName = tx.functionName;
  }
  if (!functionName || !tx.input?.length) return null;

  const methodName = functionName.match(/^(\w+)\(/)?.[1];
  const methodAbi = contract.options.jsonInterface.find(
    (f) => f.name === methodName
  );

  if (!methodAbi || !methodAbi.inputs) return null;

  const inputTypes = methodAbi.inputs.map((i) => i.type);
  const decodedParams = web3.eth.abi.decodeParameters(
    [`"(${inputTypes.join(",")})"`],
    tx.input.slice(10)
  );

  return decodedParams?.[0] || null;
}

export async function getBlockBaseFeePerGas(
  web3: Web3,
  blockNumber: string | number = "latest"
): Promise<number | null> {
  const block = await getBlock(web3, blockNumber);
  if (!block) return null;
  return block.baseFeePerGas ? +block.baseFeePerGas : null;
}
