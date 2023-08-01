import type { Chain } from '@web3-onboard/common';

const env = process.env;

export const defaultChainId = 1;

export const chains: Record<number, Chain> = {
  1: {
    id: '0x1',
    token: 'ETH',
    label: 'Ethereum Mainnet',
    publicRpcUrl: 'https://ethereum.publicnode.com',
    rpcUrl: `https://mainnet.infura.io/v3/${env.REACT_APP_INFURA_KEY}`
    // rpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${env.REACT_APP_ALCHEMY_KEY}`
  },
  /*
  137: {
    id: '0x89',
    token: 'MATIC',
    label: 'Matic(Polygon) Mainnet',
    publicRpcUrl: 'https://polygon-rpc.com',
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${env.REACT_APP_INFURA_KEY}`
  },
  1101: {
    id: '0x44d',
    token: 'ETH',
    label: 'Polygon zkEVM',
    publicRpcUrl: `https://zkevm-rpc.com`,
    rpcUrl: `https://polygonzkevm-mainnet.g.alchemy.com/v2/${env.REACT_APP_ALCHEMY_ZK_KEY}`
  }
  */
}

export function selectChainById(id: number){
  return chains[id]
}

export function selectChainByHexId(hexId: string){
  return Object.values(chains).find( (c: Chain) => c.id === hexId )
}