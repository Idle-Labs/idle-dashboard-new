import { IconType } from './types'
import { FaEthereum } from 'react-icons/fa'

const env = process.env;

export interface Network {
  version?: string
  icon?: IconType
  name: string
  baseToken: string
  color: string
  network?: string
  provider: string
  explorer: string
  blocksPerCall: number
  chainName: string
}

export const networks: Record<number, Network> = {
  1: {
    version: 'v1',
    name: 'Ethereum',
    baseToken: 'ETH',
    color: '#4474f1',
    icon: FaEthereum,
    // icon: 'https://raw.githubusercontent.com/Idle-Labs/idle-dashboard/master/public/images/networks/ethereum.svg',
    network: 'mainnet',
    provider: 'infura',
    explorer: 'etherscan',
    blocksPerCall: 1000000,
    chainName: 'Ethereum Mainnet',
  },
  42: {
    name: 'Kovan',
    color: '#9064ff',
    baseToken: 'ETH',
    provider: 'infura',
    explorer: 'etherscan',
    blocksPerCall: 1000000,
    chainName: 'Ethereum Testnet Kovan',
  },
  3: {
    name: 'Ropsten',
    color: '#ff4a8d',
    baseToken: 'ETH',
    provider: 'infura',
    explorer: 'etherscan',
    blocksPerCall: 1000000,
    chainName: 'Ethereum Testnet Ropsten',
  },
  4: {
    name: 'Rinkeby',
    color: '#f6c343',
    baseToken: 'ETH',
    provider: 'infura',
    explorer: 'etherscan',
    blocksPerCall: 1000000,
    chainName: 'Ethereum Testnet Rinkeby',
  },
  137: {
    version: 'v1',
    name: 'Polygon',
    color: '#8247E5',
    network: 'mainnet',
    baseToken: 'MATIC',
    provider: 'polygon',
    blocksPerCall: 1000000,
    explorer: 'polygonscan',
    chainName: 'Matic(Polygon) Mainnet',
  },
  5: {
    name: 'Görli',
    color: '#3099f2',
    baseToken: 'ETH',
    version: 'mumbai',
    network: 'testnet',
    provider: 'infura',
    explorer: 'etherscan',
    blocksPerCall: 1000000,
    chainName: 'Ethereum Testnet Görli',
  },
  1337: {
    name: 'Hardhat',
    baseToken: 'ETH',
    color: '#4474f1',
    provider: 'infura',
    explorer: 'etherscan',
    blocksPerCall: 1000000,
    chainName: 'Ethereum Mainnet',
  },
  80001: {
    name: 'Mumbai',
    color: '#4474f1',
    version: 'mumbai',
    network: 'testnet',
    baseToken: 'MATIC',
    provider: 'polygon',
    blocksPerCall: 1000000,
    explorer: 'polygonscan',
    chainName: 'Matic Testnet Mumbai',
  }
}

export interface Provider {
  enabled: boolean
  key: string | undefined
  networkPairs?: Record<number, number>
  rpcs: Record<number, string>
}

export const providers: Record<string, Provider> = {
  alchemy:{
    enabled: true,
    key: env.REACT_APP_ALCHEMY_KEY,
    rpcs:{
      42:'https://eth-kovan.alchemyapi.io/v2/',
      1:'https://eth-mainnet.alchemyapi.io/v2/',
      137:'https://eth-mainnet.alchemyapi.io/v2/'
    }
  },
  infura: {
    enabled: true,
    key: env.REACT_APP_INFURA_KEY,
    rpcs: {
      5: 'https://goerli.infura.io/v3/',
      42: 'https://kovan.infura.io/v3/',
      1: 'https://mainnet.infura.io/v3/',
      1337: 'https://mainnet.infura.io/v3/',
      137: 'https://mainnet.infura.io/v3/',
      80001: 'https://goerli.infura.io/v3/'
    }
  },
  polygon: {
    enabled: true,
    key: env.REACT_APP_INFURA_KEY,
    networkPairs: {
      1: 137,
      137: 1,
      5: 80001,
      80001: 5
    },
    rpcs: {
      1: 'https://polygon-mainnet.infura.io/v3/',
      5: 'https://polygon-mainnet.infura.io/v3/',
      137: 'https://polygon-mainnet.infura.io/v3/',
      80001: 'https://polygon-mainnet.infura.io/v3/'
    }
  }
}

export interface Explorer {
  enabled: boolean
  keys: (string | undefined)[]
  endpoints: Record<number, string>
  baseUrl: Record<number, string>
}

export const explorers: Record<string, Explorer> = {
    polygonscan: {
      enabled: true, // False for empty txs list (try new wallet)
      keys: [
        env.REACT_APP_POLYGONSCAN_KEY,
        env.REACT_APP_POLYGONSCAN_KEY2,
        env.REACT_APP_POLYGONSCAN_KEY3,
      ],
      endpoints: {
        137: 'https://api.polygonscan.com/api',
        80001: 'https://api-testnet.polygonscan.com/api',
      },
      baseUrl: {
        137: 'https://polygonscan.com',
        80001: 'https://polygonscan.com',
      }
    },
    etherscan: {
      enabled: true, // False for empty txs list (try new wallet)
      keys: [
        env.REACT_APP_ETHERSCAN_KEY,
        env.REACT_APP_ETHERSCAN_KEY2,
        env.REACT_APP_ETHERSCAN_KEY3,
        env.REACT_APP_ETHERSCAN_KEY4
      ],
      endpoints: {
        1: 'https://api.etherscan.io/api',
        1337: 'https://api.etherscan.io/api',
        5: 'https://api-goerli.etherscan.io/api',
        42: 'https://api-kovan.etherscan.io/api'
      },
      baseUrl: {
        1: 'https://etherscan.io',
        1337: 'https://etherscan.io',
        5: 'https://goerli.etherscan.io',
        42: 'https://kovan.etherscan.io',
      }
    },
}