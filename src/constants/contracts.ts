import type { Abi } from './types'
import stkIDLE from "abis/idle/stkIDLE.json";
import Timelock from 'abis/idle/Timelock.json';
import Multicall from 'abis/idle/Multicall.json';
import LockedIDLE from "abis/idle/LockedIDLE.json";
import PriceOracle from "abis/idle/PriceOracle.json";
import FeeTreasury from "abis/idle/FeeTreasury.json";
import EarlyRewards from 'abis/idle/EarlyRewards.json';
import VesterFactory from 'abis/idle/VesterFactory.json';
import GovernorAlpha from 'abis/idle/GovernorAlpha.json';
import GovernorBravo from 'abis/idle/GovernorBravo.json'
import EcosystemFund from 'abis/idle/EcosystemFund.json';
import Comptroller from 'abis/compound/Comptroller.json';
import IdleController from 'abis/idle/IdleController.json';
import GaugeController from 'abis/idle/GaugeController.json';
import DepositManager from 'abis/polygon/DepositManager.json';
import GaugeDistributor from 'abis/idle/GaugeDistributor.json';
import RootChainManager from 'abis/polygon/RootChainManager.json';
import SushiV2Router02 from "abis/sushiswap/SushiV2Router02.json";
import UniswapV2Router02 from "abis/uniswap/UniswapV2Router02.json";
import ChildChainManager from 'abis/polygon/ChildChainManager.json';
import ProtocolDataProvider from 'abis/aave/ProtocolDataProvider.json';
import GaugeDistributorProxy from 'abis/idle/GaugeDistributorProxy.json';
import StakingFeeDistributor from 'abis/idle/StakingFeeDistributor.json';
import QuickswapV2Router02 from "abis/quickswap/QuickswapV2Router02.json";
import BalancerExchangeProxy from "abis/balancer/BalancerExchangeProxy.json";
import MinimalInitializableProxyFactory from "abis/idle/MinimalInitializableProxyFactory.json";

export type GenericContractConfig = {
  abi: Abi
  address: string
  name: string
  networkId?: number
}

export const globalContracts: Record<number, GenericContractConfig[]> = {
  137: [
    {
      abi: ProtocolDataProvider as Abi,
      name: 'ProtocolDataProvider',
      address: '0x7551b5D2763519d4e37e8B81929D336De671d46d'
    },
    {
      abi: ChildChainManager as Abi,
      name: 'ChildChainManager',
      address: '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa' // Matic
    },
    {
      networkId: 1,
      name: 'UniswapRouter',
      abi: UniswapV2Router02 as Abi,
      address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
    },
    {
      abi: SushiV2Router02 as Abi,
      name: 'SushiswapRouter',
      address: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
    },
    {
      abi: QuickswapV2Router02 as Abi,
      name: 'QuickswapRouter',
      address: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff'
    }
  ],
  1101: [
    {
      networkId: 1,
      name: 'UniswapRouter',
      abi: UniswapV2Router02 as Abi,
      address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
    }
  ],
  1: [
    {
      abi: DepositManager as Abi,
      name: 'DepositManager',
      address: '0x401f6c983ea34274ec46f84d70b31c151321188b'
    },
    {
      abi: RootChainManager as Abi,
      name: 'RootChainManager',
      address: '0xA0c68C638235ee32657e8f720a23ceC1bFc77C77' // Mainnet
    },
    {
      abi: MinimalInitializableProxyFactory as Abi,
      name: 'ProxyFactory',
      address: "0x91baced76e3e327ba7850ef82a7a8251f6e43fb8"
    },
    {
      abi: LockedIDLE as Abi,
      name: 'LockedIDLE',
      address: '0xF241a0151841AE2E6ea750D50C5794b5EDC31D99'
    },
    {
      abi: FeeTreasury as Abi,
      name: 'FeeTreasury',
      address: '0x69a62c24f16d4914a48919613e8ee330641bcb94' // MAIN
    },
    {
      abi: PriceOracle as Abi,
      name: 'PriceOracle',
      address: '0x972A64d108e250dF98dbeac8170678501f5EF181' // MAIN
    },
    {
      abi: Timelock as Abi,
      name: 'Timelock',
      address: '0xD6dABBc2b275114a2366555d6C481EF08FDC2556' // MAIN
    },
    {
      abi: EcosystemFund as Abi,
      name: 'EcosystemFund',
      address: '0xb0aA1f98523Ec15932dd5fAAC5d86e57115571C7' // MAIN
    },
    {
      abi: VesterFactory as Abi,
      name: 'VesterFactory',
      address: '0xbF875f2C6e4Cc1688dfe4ECf79583193B6089972' // MAIN
    },
    {
      abi: IdleController as Abi,
      name: 'IdleController',
      address: '0x275DA8e61ea8E02d51EDd8d0DC5c0E62b4CDB0BE' // MAIN
    },
    {
      abi: EarlyRewards as Abi,
      name: 'EarlyRewards',
      address: '0xa1F71ED24ABA6c8Da8ca8C046bBc9804625d88Fc' // MAIN
    },
    {
      abi: GovernorAlpha as Abi,
      name: 'GovernorAlpha',
      address: '0x2256b25CFC8E35c3135664FD03E77595042fe31B' // MAIN
    },
    {
      abi: GovernorBravo as Abi,
      name: 'GovernorBravo',
      address: '0x3D5Fc645320be0A085A32885F078F7121e5E5375'
    },
    {
      abi: Comptroller as Abi,
      name: 'Comptroller',
      address: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b', // Main
    },
    {
      abi: SushiV2Router02 as Abi,
      name: 'SushiswapRouter',
      address: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'
    },
    {
      abi: UniswapV2Router02 as Abi,
      name: 'UniswapRouter',
      address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
    },
    {
      abi: BalancerExchangeProxy as Abi,
      name: 'BalancerExchangeProxy',
      address: '0x3E66B66Fd1d0b02fDa6C811Da9E0547970DB2f21'
    },
    {
      abi: GaugeController as Abi,
      name: 'GaugeController',
      address:'0xaC69078141f76A1e257Ee889920d02Cc547d632f'
    },
    {
      abi: GaugeDistributor as Abi,
      name: 'GaugeDistributor',
      address:'0x1276A8ee84900bD8CcA6e9b3ccB99FF4771Fe329'
    },
    {
      abi: GaugeDistributorProxy as Abi,
      name: 'GaugeDistributorProxy',
      address:'0x074306BC6a6Fc1bD02B425dd41D742ADf36Ca9C6'
    },
    {
      abi: Multicall as Abi,
      name: 'Multicall',
      address:'0xeefba1e63905ef1d7acba5a8513c70307c1ce441'
    },
    {
      name: "stkIDLE",
      abi: stkIDLE as Abi,
      address: "0xaac13a116ea7016689993193fce4badc8038136f"
    },
    {
      name: "StakingFeeDistributor",
      abi: StakingFeeDistributor as Abi,
      address: "0xbabb82456c013fd7e3f25857e0729de8207f80e2" // Mainnet
    }
  ]
}