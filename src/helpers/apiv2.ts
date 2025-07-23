import {
  ApisProps,
  TransactionDataApiV2,
  EtherscanTransaction,
  Vault,
  Transaction,
} from "constants/";
import {
  callPlatformApis,
  getPlatformApiConfig,
  getPlatformApisEndpoint,
  makePostRequest,
  makeRequest,
} from "./apis";
import { BNify, cmpAddrs } from "./utilities";

export async function getIdleAPIV2Page(
  endpoint: string,
  apiConfig: ApisProps | null,
  offset: number = 0,
  limit: number = 200
): Promise<any> {
  return await makeRequest(
    endpoint + `&offset=${offset}&limit=${limit}`,
    apiConfig?.config
  );
}

export async function getIdleAPIV2AllPages(
  endpoint: string,
  apiConfig: ApisProps | null,
  limit: number = 200
): Promise<any> {
  const firstPageResults = await getIdleAPIV2Page(endpoint, apiConfig, 0);
  const totalCount = firstPageResults?.totalCount;
  const totalRequests = Math.ceil((totalCount - limit) / limit);

  let output = [...firstPageResults.data];
  if (totalRequests > 0) {
    const promises = Array.from(Array(totalRequests).keys()).map(
      (index: number) => {
        return getIdleAPIV2Page(
          endpoint,
          apiConfig,
          limit * (+index + 1),
          limit
        );
      }
    );

    const results = await Promise.all(promises);
    output = [...output, ...results.map((res) => res.data).flat()];
  }

  return output;
}

export const saveSignatureV2 = async (
  signatureId: string,
  walletAddress: string,
  hash: string
): Promise<any> => {
  const apiConfig = getPlatformApiConfig(1, "idle", "signSignatureV2");
  const endpoint = getPlatformApisEndpoint(
    1,
    "idle",
    "signSignatureV2"
  )?.replace(":signatureId", signatureId);
  if (!endpoint) return null;
  return await makePostRequest(
    endpoint,
    {
      walletAddress,
      hash,
    },
    apiConfig?.config
  );
};

export const checkSignatureV2 = async (
  signatureId: string,
  walletAddress: string
): Promise<any> => {
  const apiConfig = getPlatformApiConfig(1, "idle", "checkSignatureV2");
  const endpoint = getPlatformApisEndpoint(1, "idle", "checkSignatureV2", "", {
    walletAddress,
  })?.replace(":signatureId", signatureId);
  if (!endpoint) return null;

  return await makeRequest(endpoint, apiConfig?.config);
};

export async function getSignatureById(signatureId: string): Promise<any> {
  const signature = await callPlatformApis(
    1,
    "idle",
    "signatures",
    signatureId,
    {
      limit: 1,
    }
  );
  return signature;
}

export async function getUserTransactionsFromApiV2(
  vaults: Vault[],
  walletAddress: string,
  startBlock: number = 0,
  endBlock: string | number = "latest"
): Promise<EtherscanTransaction[]> {
  const apiConfig = getPlatformApiConfig(1, "idle", "transactions");
  const endpoint = getPlatformApisEndpoint(1, "idle", "transactions", "", {
    walletAddress,
    startBlock,
    endBlock,
  });

  if (!endpoint) return [];

  const transactions: TransactionDataApiV2[] = await getIdleAPIV2AllPages(
    endpoint,
    apiConfig
  );

  return transactions.reduce(
    (acc: Transaction[], transaction: TransactionDataApiV2) => {
      const vault = vaults.find((vault) =>
        cmpAddrs(vault.id, transaction.vaultAddress)
      );
      if (!vault) return acc;

      const userTransaction: Transaction = {
        action: transaction.type,
        subAction: "",
        chainId: vault.chainId,
        assetId: vault.id,
        idlePrice: BNify(transaction.price),
        idleAmount: BNify(transaction.amount),
        amountUsd: BNify(0),
        underlyingAmount: BNify(transaction.tokenAmount),
        blockHash: "",
        blockNumber: transaction.block.number,
        confirmations: "1",
        contractAddress: "",
        cumulativeGasUsed: "0",
        from: "",
        gas: "",
        gasPrice: "",
        gasUsed: "",
        hash: transaction.hash,
        input: "",
        nonce: "",
        timeStamp: "" + transaction.block.timestamp,
        to: "",
        tokenDecimal: "",
        tokenName: "",
        tokenSymbol: "",
        transactionIndex: "",
        value: transaction.amount,
      };

      return [...acc, userTransaction];
    },
    []
  );
}
