import { TransactionSpeed } from "./types";

const env = process.env;

export interface Explorer {
  name: string;
  enabled: boolean;
  keys: (string | undefined)[];
  endpoints: Record<number, string>;
  gasOracle?: null | {
    endpoints: Record<number, string>;
    mapping: Record<TransactionSpeed, string>;
  };
  baseUrl: Record<number, string>;
}

export const explorers: Record<string, Explorer> = {
  polygonscan: {
    name: "Polygonscan",
    enabled: true, // False for empty txs list (try new wallet)
    keys: [
      env.REACT_APP_POLYGONSCAN_KEY,
      env.REACT_APP_POLYGONSCAN_KEY2,
      env.REACT_APP_POLYGONSCAN_KEY3,
    ],
    endpoints: {
      137: "https://api.polygonscan.com/api",
      80001: "https://api-testnet.polygonscan.com/api",
    },
    baseUrl: {
      137: "https://polygonscan.com",
      80001: "https://polygonscan.com",
    },
  },
  zkevmpolygonscan: {
    name: "Polygonscan",
    enabled: true, // False for empty txs list (try new wallet)
    keys: [
      env.REACT_APP_POLYGONSCAN_KEY,
      env.REACT_APP_POLYGONSCAN_KEY2,
      env.REACT_APP_POLYGONSCAN_KEY3,
    ],
    gasOracle: {
      endpoints: {
        1101: "https://gasstation.polygon.technology/zkevm",
      },
      mapping: {
        [TransactionSpeed.VeryFast]: "fastest",
        [TransactionSpeed.Fast]: "fast",
        [TransactionSpeed.Average]: "standard",
        [TransactionSpeed.Slow]: "safeLow",
      },
    },
    endpoints: {
      1101: "https://api-zkevm.polygonscan.com/api",
    },
    baseUrl: {
      1: "https://etherscan.io",
      137: "https://polygonscan.com",
      1101: "https://zkevm.polygonscan.com",
    },
  },
  optimismscan: {
    name: "Optimistic",
    enabled: true,
    keys: [
      env.REACT_APP_OPTIMISM_KEY,
      env.REACT_APP_OPTIMISM_KEY2,
      env.REACT_APP_OPTIMISM_KEY3,
    ],
    gasOracle: null,
    endpoints: {
      10: "https://api-optimistic.etherscan.io/api",
    },
    baseUrl: {
      10: "https://optimistic.etherscan.io",
    },
  },
  etherscan: {
    name: "Etherscan",
    enabled: true, // False for empty txs list (try new wallet)
    keys: [
      env.REACT_APP_ETHERSCAN_KEY,
      env.REACT_APP_ETHERSCAN_KEY2,
      env.REACT_APP_ETHERSCAN_KEY3,
      env.REACT_APP_ETHERSCAN_KEY4,
    ],
    endpoints: {
      1: "https://api.etherscan.io/api",
      1337: "https://api.etherscan.io/api",
      5: "https://api-goerli.etherscan.io/api",
      42: "https://api-kovan.etherscan.io/api",
    },
    baseUrl: {
      1: "https://etherscan.io",
      1337: "https://etherscan.io",
      5: "https://goerli.etherscan.io",
      42: "https://kovan.etherscan.io",
    },
  },
  arbiscan: {
    name: "Arbiscan",
    enabled: true,
    keys: [
      env.REACT_APP_ARBISCAN_KEY,
      env.REACT_APP_ARBISCAN_KEY2,
      env.REACT_APP_ARBISCAN_KEY3,
    ],
    gasOracle: null,
    endpoints: {
      42161: "https://api.arbiscan.io/api",
    },
    baseUrl: {
      42161: "https://arbiscan.io",
    },
  },
};
