import type { Chain } from '@web3-onboard/common';

const env = process.env;

export const defaultChainId = 1;

export const chains: Record<number, Chain> = {
  1: {
    id: '0x1',
    token: 'ETH',
    label: 'Ethereum Mainnet',
    rpcUrl: `https://mainnet.infura.io/v3/${env.REACT_APP_INFURA_KEY}`
  },
  137: {
    id: '0x89',
    token: 'MATIC',
    label: 'Matic(Polygon) Mainnet',
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${env.REACT_APP_INFURA_KEY}`
  }
}