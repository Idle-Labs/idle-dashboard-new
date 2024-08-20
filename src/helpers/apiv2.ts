import {
  ApisProps,
  TransactionDataApiV2,
  EtherscanTransaction,
  Vault,
  Transaction,
  AssetId,
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

export async function getIdleAPIV2AllPages<T = any>(
  endpoint: string,
  apiConfig: ApisProps | null,
  limit: number = 200
): Promise<T[]> {
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

export async function getWalletPerformancesFromApiV2(
  walletAddress: string
): Promise<Record<AssetId, any>> {
  const response = await callPlatformApis(1, "idle", "wallets", "", {
    address: walletAddress,
    limit: 1,
  });

  if (!response) return [];

  const wallet = response[0];

  // Call walletLatestBlocks
  const walletLatestBlocks = await callPlatformApis(
    1,
    "idle",
    "walletLatestBlocks",
    "",
    {
      walletId: wallet._id,
      "balance:gt": 0,
    }
  );

  const promises = walletLatestBlocks.map((walletLatestBlock: any) =>
    callPlatformApis(
      1,
      "idle",
      "walletVaultPerformance",
      "",
      {
        startBlock: 1,
      },
      {
        walletId: wallet._id,
        vaultId: walletLatestBlock.vaultId,
      }
    ).then((performance) => ({
      vaultId: walletLatestBlock.vaultAddress,
      performance,
    }))
  );

  return await Promise.all(promises);
}

export async function getVaultsFromApiV2(): Promise<any> {
  return await callPlatformApis(1, "idle", "vaults");
}

export async function getWalletsVaultsPerformancesFromApiV2(
  walletAddress: string,
  startTimestamp?: number,
  endTimestamp?: number,
  sort?: string,
  order?: string
): Promise<any> {
  const response = await callPlatformApis(1, "idle", "wallets", "", {
    address: walletAddress,
    limit: 1,
  });

  if (!response) return [];

  const wallet = response[0];

  const filters: any = {
    walletId: wallet._id,
  };

  if (startTimestamp) {
    filters["timestamp:gte"] = startTimestamp;
  }
  if (endTimestamp) {
    filters["timestamp:lte"] = endTimestamp;
  }

  if (sort) {
    filters["sort"] = sort;
  }
  if (order) {
    filters["order"] = order;
  }

  const apiConfig = getPlatformApiConfig(
    1,
    "idle",
    "walletsVaultsPerformances"
  );
  const endpoint = getPlatformApisEndpoint(
    1,
    "idle",
    "walletsVaultsPerformances",
    "",
    filters
  );

  if (!endpoint) return [];

  return getIdleAPIV2AllPages<TransactionDataApiV2>(endpoint, apiConfig);
}

export async function getTransactionsFromApiV2(
  walletAddress: string,
  startTimestamp?: number,
  endTimestamp?: number,
  sort?: string,
  order?: string
): Promise<TransactionDataApiV2[]> {
  const apiConfig = getPlatformApiConfig(1, "idle", "transactions");

  const filters: any = {
    walletAddress,
  };

  if (startTimestamp) {
    filters["timestamp:gte"] = startTimestamp;
  }
  if (endTimestamp) {
    filters["timestamp:lte"] = endTimestamp;
  }

  if (sort) {
    filters["sort"] = sort;
  }
  if (order) {
    filters["order"] = order;
  }

  const endpoint = getPlatformApisEndpoint(
    1,
    "idle",
    "transactions",
    "",
    filters
  );

  if (!endpoint) return [];

  return getIdleAPIV2AllPages<TransactionDataApiV2>(endpoint, apiConfig);
}

export async function getWalletBlocksFromApiV2(
  walletAddress: string,
  startTimestamp?: number,
  endTimestamp?: number,
  sort?: string,
  order?: string
): Promise<any[]> {
  const apiConfig = getPlatformApiConfig(1, "idle", "walletBlocks");

  const filters: any = {
    walletAddress,
  };

  if (startTimestamp) {
    filters["timestamp:gte"] = startTimestamp;
  }
  if (endTimestamp) {
    filters["timestamp:lte"] = endTimestamp;
  }

  if (sort) {
    filters["sort"] = sort;
  }
  if (order) {
    filters["order"] = order;
  }

  const endpoint = getPlatformApisEndpoint(
    1,
    "idle",
    "walletBlocks",
    "",
    filters
  );

  if (!endpoint) return [];

  return getIdleAPIV2AllPages<any>(endpoint, apiConfig);
}

export async function getTokensFromApiV2(
  tokenId: string | string[]
): Promise<any[]> {
  const apiConfig = getPlatformApiConfig(1, "idle", "tokens");

  const filters: any = {
    _id: tokenId,
  };

  const endpoint = getPlatformApisEndpoint(1, "idle", "tokens", "", filters);

  if (!endpoint) return [];

  return getIdleAPIV2AllPages<any>(endpoint, apiConfig);
}

export async function getTokenBlocksFromApiV2(
  tokenId: string,
  block?: number | number[],
  startTimestamp?: number,
  endTimestamp?: number
): Promise<any[]> {
  const apiConfig = getPlatformApiConfig(1, "idle", "tokenBlocks");

  const filters: any = {
    tokenId,
  };
  if (startTimestamp) {
    filters["timestamp:gte"] = startTimestamp;
  }
  if (endTimestamp) {
    filters["timestamp:lte"] = endTimestamp;
  }
  if (block) {
    filters["block"] = block;
  }

  const endpoint = getPlatformApisEndpoint(
    1,
    "idle",
    "tokenBlocks",
    "",
    filters
  );

  if (!endpoint) return [];

  return getIdleAPIV2AllPages<any>(endpoint, apiConfig);
}

export async function getUserEtherscanTransactionsFromApiV2(
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
        blockNumber: "" + transaction.block.number,
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

  return results.map((res) => res.data).flat();
}

export async function getLatestVaultsBlocks(vaultsIds: string[]): Promise<any> {
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
