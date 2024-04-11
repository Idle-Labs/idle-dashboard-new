import { Alchemy, Network, AssetTransfersParams, AssetTransfersCategory, AssetTransfersResult } from "alchemy-sdk"

const env = process.env;

export const getNetworkByChainId = (chainId: number): Network | null => {
  const networks: Record<number, Network> = {
    1: Network.ETH_MAINNET,
    10: Network.OPT_MAINNET,
    // 1101: Network.POLYGONZKEVM_MAINNET
  }
  return networks[chainId] || null
}

export const getApiKeyByChain = (chainId: number): string | null => {
  const apiKeys: Record<number, string> = {
    1: env.REACT_APP_ALCHEMY_KEY as string,
    // 1101: env.REACT_APP_ALCHEMY_ZK_KEY as string,
    10: env.REACT_APP_ALCHEMY_OPTIMISM_KEY as string
  }
  return apiKeys[chainId] || null
}

export const getAlchemyTransactionHistory = async (chainId: number, fromAddress: string, toAddress: string | undefined, fromBlock: number | string = 0, toBlock: number | string = 'latest'): Promise<AssetTransfersResult[] | null> => {
  const network = getNetworkByChainId(chainId)
  if (!network) return []

  const apiKey = getApiKeyByChain(chainId)
  if (!apiKey) return []

  const config = {
    apiKey,
    network,
  };
  const alchemy = new Alchemy(config);

  const result = await alchemy.core.getAssetTransfers({
    toBlock: toBlock as AssetTransfersParams["toBlock"],
    fromBlock: fromBlock as AssetTransfersParams["fromBlock"],
    toAddress: toAddress as AssetTransfersParams["toAddress"],
    fromAddress: fromAddress as AssetTransfersParams["fromAddress"],
    category: [AssetTransfersCategory.ERC20],
    excludeZeroValue: true,
  });

  return result?.transfers || null
}