import {
  ApisProps,
  TransactionDataApiV2,
  EtherscanTransaction,
  Vault,
  Transaction,
  PlatformApiFilters,
} from "constants/";
import {
  callPlatformApis,
  getPlatformApiConfig,
  getPlatformApisEndpoint,
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

  let output = [...(firstPageResults?.data || [])];
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
    output = [...output, ...results.map((res) => res?.data).flat()];
  }

  return output;
}

export async function getVaultsFromApiV2(): Promise<any> {
  return await callPlatformApis(1, "idle", "vaults");
}

export async function getLatestTokenBlocks(tokenIds: string[]): Promise<any> {
  const promises = tokenIds.map((tokenId) => {
    return callPlatformApis(1, "idle", "tokenBlocks", "", {
      tokenId,
      sort: "block",
      order: "desc",
      limit: 1,
    });
  });

  const results = await Promise.all(promises);

  return results.map((res) => res?.data).flat();
}

export async function getLatestVaultBlocks(vaultsIds: string[]): Promise<any> {
  const promises = vaultsIds.map((vaultId) => {
    return callPlatformApis(1, "idle", "vaultBlocks", "", {
      vaultId,
      sort: "block",
      order: "desc",
      limit: 1,
    });
  });

  const results = await Promise.all(promises);
  if (!results) return;

  return results.map((res) => res.data).flat();
}

export async function getVaultBlocksFromApiV2(
  filters?: PlatformApiFilters
): Promise<any> {
  const apiConfig = getPlatformApiConfig(1, "idle", "vaultBlocks");
  const endpoint = getPlatformApisEndpoint(
    1,
    "idle",
    "vaultBlocks",
    "",
    filters
  );

  if (!endpoint) return [];

  return await getIdleAPIV2AllPages(endpoint, apiConfig);
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
