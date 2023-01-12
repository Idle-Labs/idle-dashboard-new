import type { Abi } from './types'
import DAI from 'abis/tokens/DAI.json'
import USDC from 'abis/tokens/USDC.json'
import WETH from 'abis/tokens/WETH.json'
import stMATIC from 'abis/lido/stMATIC.json'
import QuickswapLiquidityPool from "abis/quickswap/QuickswapLiquidityPool.json";

type TokenColors = {
  rgb: number[]
  hex: string
  hsl: string[]
}

type ConversionRateProps = {
  field?: string
  routerMethod?: string
  address?: string
  addressFrom?: string
  invertTokens?: boolean
  protocolContract?: string
  isPoolToken?: boolean
}

interface ChainlinkConfig {
  address?: string
  feedUsdAddress?: string
  feedEthAddress?: string
}

export interface UnderlyingTokenProps {
  token: string,
  label?: string
  symbol?: string,
  enabled: boolean
  decimals?: number
  colors: TokenColors
  underlyingToken?: string
  abi?: Abi | null
  address?: string
  chainlinkPriceFeed?: ChainlinkConfig
  conversionRate?: ConversionRateProps
}

export const underlyingTokens: Record<number, Record<string, UnderlyingTokenProps>> = {
  1: {
    DAI: {
      token:'DAI',
      decimals: 18,
      enabled: true,
      abi: DAI as Abi,
      colors: {
        hex: '#F7B24A',
        rgb: [250, 184, 51],
        hsl: ['40', '95%', '59%']
      },
      address: '0x6b175474e89094c44da98b954eedeac495271d0f'
    },
    ETH: {
      abi: null,
      symbol:'Ξ',
      token:'ETH',
      decimals: 18,
      enabled: true,
      colors: {
        hex: '#333',
        rgb: [51, 51, 51],
        hsl: ['0, 0%, 20%']
      },
      address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    },
    STETH: {
      decimals: 18,
      enabled: true,
      token:'stETH',
      label: 'stETH',
      colors: {
        hex: '#00a3ff',
        rgb: [0, 163, 255],
        hsl: ['202', '100%', '50%']
      },
      conversionRate: {
        field: "stETHDAIPrice"
      },
      address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84'
    },
    CVX: {
      token:'CVX',
      label: 'CVX',
      decimals: 18,
      enabled: true,
      colors: {
        hex: '#3a3a3a',
        rgb: [58, 58, 58],
        hsl: ['0', '0%', '23%']
      },
      address: '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b'
    },
    LDO: {
      token:'LDO',
      label: 'LDO',
      decimals: 18,
      enabled: true,
      colors: {
        hex: '#f69988',
        rgb: [246, 153, 136],
        hsl: ['9', '86%', '75%']
      },
      conversionRate: {
        field: "LDO"
      },
      address: '0x5a98fcbea516cf06857215779fd812ca3bef1b32'
    },
    MTA: {
      token: 'MTA',
      label: 'MTA',
      decimals: 18,
      enabled: true,
      colors: {
        hex: '#000',
        rgb: [0, 0, 0],
        hsl: ['0', '0%', '0%']
      },
      address: '0xa3BeD4E1c75D00fa6f4E5E6922DB7261B5E9AcD2'
    },
    CRV: {
      decimals: 18,
      label: 'CRV',
      token: 'CRV',
      enabled: true,
      colors: {
        hex: '#3466a3',
        rgb: [52, 102, 163],
        hsl: ['213', '52%', '42%']
      },
      address: '0xD533a949740bb3306d119CC777fa900bA034cd52'
    },
    FRAX3CRV: {
      decimals: 18,
      enabled: true,
      label: 'FRAX3CRV',
      token: 'FRAX3CRV',
      colors: {
        hex: '#ffffff',
        rgb: [255, 255, 255],
        hsl: ['0, 0%, 100%']
      },
      chainlinkPriceFeed: {
        address: '0x853d955acef822db058eb8505911ed77f175b99e'
      },
      address: '0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B'
    },
    MIM3CRV: {
      decimals: 18,
      enabled: true,
      label: 'MIM3CRV',
      token: 'MIM3CRV',
      colors: {
        hex: '#9695f7',
        rgb: [150, 149, 247],
        hsl: ['241', '86%', '78%']
      },
      chainlinkPriceFeed: {
        address: '0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3'
      },
      address: '0x5a6A4D54456819380173272A5E8E9B9904BdF41B'
    },
    ALUSD3CRV: {
      decimals: 18,
      enabled: true,
      label: 'ALUSD3CRV',
      token: 'ALUSD3CRV',
      colors: {
        hex: '#ffbf93',
        rgb: [255, 191, 147],
        hsl: ['24, 100%, 79%']
      },
      chainlinkPriceFeed: {
        address: '0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9'
      },
      address: '0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c'
    },
    MUSD3CRV: {
      decimals: 18,
      enabled: true,
      label: 'MUSD3CRV',
      token: 'MUSD3CRV',
      colors: {
        hex: '#333',
        rgb: [51, 51, 51],
        hsl: ['0, 0%, 20%']
      },
      address: '0x1AEf73d49Dedc4b1778d0706583995958Dc862e6'
    },
    PBTCCRV: {
      decimals: 18,
      enabled: true,
      label: 'PBTCCRV',
      token: 'PBTCCRV',
      underlyingToken: 'WBTC', // Used for decimals
      colors: {
        hex: '#ff6665',
        rgb: [255, 102, 101],
        hsl: ['0', '100%', '70%']
      },
      conversionRate: {
        field: 'PBTCDAIPrice',
        routerMethod: 'getAmountsOut',
        address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
      },
      chainlinkPriceFeed: {
        address: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
      },
      address: '0xC9467E453620f16b57a34a770C6bceBECe002587'
    },
    MUSD: {
      decimals: 18,
      enabled: true,
      label: 'mUSD',
      token: 'mUSD',
      colors: {
        hex: '#333',
        rgb: [51, 51, 51],
        hsl: ['0, 0%, 20%']
      },
      address: '0xe2f2a5c287993345a840db3b0845fbc70f5935a5'
    },
    ANGLE: {
      decimals: 18,
      enabled: true,
      label: 'ANGLE',
      token: 'ANGLE',
      colors: {
        hex: '#333',
        rgb: [51, 51, 51],
        hsl: ['0, 0%, 20%']
      },
      address: '0x31429d1856ad1377a8a0079410b297e1a9e214c2'
    },
    PNT: {
      token: 'PNT',
      decimals: 18,
      enabled: true,
      label: 'pNetwork',
      colors: {
        hex: '#ff6665',
        rgb: [255, 102, 101],
        hsl: ['0', '100%', '70%']
      },
      address: '0x89ab32156e46f46d02ade3fecbe5fc4243b9aaed'
    },
    "3EUR": {
      decimals: 18,
      enabled: true,
      label: '3EUR',
      token: '3EUR',
      colors: {
        hex: '#cc9768',
        rgb: [204, 151, 104],
        hsl: ['28', '50%', '60%']
      },
      conversionRate: {
        field: "eurDAIPrice",
        address: '0x1a7e4e63778b4f12a199c062f3efdd288afcbce8',
        addressFrom: '0x956f47f50a910163d8bf957cf5846d573e7f87ca'
      },
      chainlinkPriceFeed: {
        address: '0x00000000000000000000000000000000000003d2'
      },
      address: '0xb9446c4Ef5EBE66268dA6700D26f96273DE3d571'
    },
    STECRV: {
      decimals: 18,
      enabled: true,
      label: 'steCRV',
      token: 'steCRV',
      colors: {
        hex: '#81c8ff',
        rgb: [129, 200, 255],
        hsl: ['206', '100%', '75%']
      },
      conversionRate: {
        field: "stETHDAIPrice",
        address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84'
      },
      chainlinkPriceFeed: {
        address: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84'
      },
      address: '0x06325440D014e39736583c165C2963BA99fAf14E'
    },
    SPELL: {
      decimals: 18,
      enabled: true,
      label: 'SPELL',
      token: 'SPELL',
      colors: {
        hex: '#9695f7',
        rgb: [150, 149, 247],
        hsl: ['241', '86%', '78%']
      },
      address: '0x090185f2135308bad17527004364ebcc2d37e5f6'
    },
    CPOOL: {
      decimals: 18,
      enabled: true,
      label: 'CPOOL',
      token: 'CPOOL',
      colors: {
        hex: '#5F73F4',
        rgb: [95, 115, 244],
        hsl: ["232", "87%", "66%"]
      },
      address: '0x66761fa41377003622aee3c7675fc7b5c1c2fac5'
    },
    MATIC: {
      decimals: 18,
      enabled: true,
      token: 'MATIC',
      colors: {
        hex: '#8247E5',
        rgb: [130, 71, 229],
        hsl: ['262, 75%, 59%']
      },
      conversionRate: {
        field: "maticDAIPrice"
      },
      address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'
    },
    STMATIC: {
      decimals: 18,
      enabled: true,
      token: 'stMATIC',
      abi: stMATIC as Abi,
      colors: {
        hex: '#8247E5',
        rgb: [130, 71, 229],
        hsl: ['262, 75%, 59%']
      },
      conversionRate: {
        field: "maticDAIPrice"
      },
      address: '0x9ee91F9f426fA633d227f7a9b000E28b9dfd8599'
    },
    USDC: {
      decimals: 6,
      token: 'USDC',
      enabled: true,
      abi: USDC as Abi,
      colors: {
        hex: "#2875C8",
        rgb: [40, 117, 200],
        hsl: ["211", "67%", "47%"]
      },
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    },
    USDT: {
      decimals: 6,
      token: 'USDT',
      enabled: true,
      colors: {
        hex: "#22a079",
        rgb: [34, 160, 121],
        hsl: ["161", "65%", "38%"]
      },
      address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    },
    TUSD: {
      decimals: 18,
      token: 'TUSD',
      enabled: true,
      colors: {
        hex: "#002868",
        rgb: [0, 40, 104],
        hsl: ["217", "100%", "20%"]
      },
      address: "0x0000000000085d4780b73119b644ae5ecd22b376"
    },
    SUSD: {
      decimals: 18,
      token: 'SUSD',
      enabled: true,
      colors: {
        hex: "#1e1a31",
        rgb: [30, 26, 49],
        hsl: ["250", "31%", "15%"]
      },
      address: "0x57ab1ec28d129707052df4df418d58a2d46d5f51"
    },
    WBTC: {
      decimals: 8,
      token: 'WBTC',
      enabled: true,
      colors: {
        hex: "#eb9444",
        rgb: [235, 148, 68],
        hsl: ["29", "81%", "59%"]
      },
      conversionRate: {
        field: "wbtcDAIPrice",
        routerMethod: 'getAmountsOut'
      },
      address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
      chainlinkPriceFeed: {
        address: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
        feedUsdAddress: '0xAe74faA92cB67A95ebCAB07358bC222e33A34dA7',
      }
    },
    WETH: {
      decimals: 18,
      token: 'WETH',
      enabled: true,
      abi: WETH as Abi,
      colors: {
        hex: "#ee1f79",
        rgb: [238, 31, 121],
        hsl: ["334", "86%", "53%"]
      },
      conversionRate: {
        field: "wethDAIPrice"
      },
      chainlinkPriceFeed: {
        address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        feedUsdAddress: '0x37bC7498f4FF12C19678ee8fE19d713b87F6a9e6'
      },
      address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    },
    COMP: {
      decimals: 18,
      token: 'COMP',
      enabled: true,
      colors: {
        hex: "#00d395",
        rgb: [0, 211, 149],
        hsl: ["162", "100%", "41%"]
      },
      conversionRate: {
        field: "compDAIPrice"
      },
      address: "0xc00e94cb662c3520282e6f5717214004a7f26888"
    },
    AAVE: {
      decimals: 18,
      token: 'AAVE',
      enabled: true,
      colors: {
        hex: "#B6509E",
        rgb: [182, 80, 158],
        hsl: ["314", "41%", "51%"]
      },
      conversionRate: {
        field: "aaveDAIPrice"
      },
      address: "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9"
    },
    STKAAVE: {
      decimals: 18,
      enabled: false,
      token: 'stkAAVE',
      colors: {
        hex: "#B6509E",
        rgb: [182, 80, 158],
        hsl: ["314", "41%", "51%"]
      },
      conversionRate: {
        field: "aaveDAIPrice",
        address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9'
      },
      address: "0x4da27a545c0c5b758a6ba100e3a049001de870f5"
    },
    IDLE: {
      decimals: 18,
      token: 'IDLE',
      enabled: true,
      colors: {
        hex: "#0d55bb",
        rgb: [13, 85, 187],
        hsl: ["215", "87%", "39%"]
      },
      conversionRate: {
        field: "idleDAIPrice"
      },
      address: "0x875773784Af8135eA0ef43b5a374AaD105c5D39e"
    },
    STKIDLE: {
      decimals: 18,
      token: 'stkIDLE',
      enabled: true,
      colors: {
        hex: "#0d55bb",
        rgb: [13, 85, 187],
        hsl: ["215", "87%", "39%"]
      }
    },
    RAI: {
      token: 'RAI',
      decimals: 18,
      enabled: true,
      colors: {
        hex: "#378879",
        rgb: [55, 136, 121],
        hsl: ["169", "42%", "37%"]
      },
      conversionRate: {
        field: "raiDAIPrice"
      },
      address: "0x03ab458634910aad20ef5f1c8ee96f1d6ac54919"
    },
    FEI: {
      token: 'FEI',
      decimals: 18,
      enabled: true,
      colors: {
        hex: '#229b6e',
        rgb: [34, 155, 110],
        hsl: ['158', '64%', '37%']
      },
      conversionRate: {
        field: 'feiDAIPrice'
      },
      address: '0x956f47f50a910163d8bf957cf5846d573e7f87ca'
    },
    TRU: {
      token: 'TRU',
      decimals: 18,
      enabled: true,
      colors: {
        hex: '#195bff',
        rgb: [25, 91, 255],
        hsl: ["223", "100%", "55%"]
      },
      address: '0x4c19596f5aaff459fa38b0f7ed92f11ae6543784'
    },
    AGEUR: {
      decimals: 18,
      enabled: true,
      token: 'AGEUR',
      colors: {
        hex: '#fbcea9',
        rgb: [251, 206, 169],
        hsl: ['27', '91%', '82%']
      },
      chainlinkPriceFeed: {
        address: '0x00000000000000000000000000000000000003d2'
      },
      address: '0x1a7e4e63778b4f12a199c062f3efdd288afcbce8'
    },
    // WMATIC: {
    //   decimals: 18,
    //   enabled: true,
    //   token: 'WMATIC',
    //   colors: {
    //     hex: '#2891f8',
    //     rgb: [40, 145, 248],
    //     hsl: ['210', '94%', '56%']
    //   },
    //   address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'
    // }
  },
  137:{
    DQUICK:{
      decimals: 18,
      enabled: true,
      label: 'DQUICK',
      token: 'DQUICK',
      colors: {
        hex: '#1d8bcf',
        rgb: [29, 139, 207],
        hsl: ['203', '75%', '46%']
      },
      conversionRate:{
        invertTokens: true,
        protocolContract: 'QuickswapRouter',
      },
      address: '0xf28164A485B0B2C90639E47b0f377b4a438a16B1'
    },
    CXETHWETH: {
      decimals: 18,
      enabled: true,
      label: 'CXETHWETH',
      token: 'CXETHWETH',
      conversionRate: {
        field: "ETHDAIPrice",
        isPoolToken: true, // Get Pool Token price for conversion rate
        protocolContract: 'QuickswapRouter'
      },
      colors: {
        hex: '#f73bac',
        rgb: [247, 59, 172],
        hsl: ['324', '92%', '60%']
      },
      abi: QuickswapLiquidityPool as Abi,
      address: '0xda7cd765DF426fCA6FB5E1438c78581E4e66bFe7'
    },
  }
}