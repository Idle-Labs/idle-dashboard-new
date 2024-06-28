import BigNumber from "bignumber.js";
import { SECONDS_IN_YEAR } from "constants/vars";
import { protocolsFolder } from "constants/folders";

export type ProtocolField = {
  props?: any;
  field: string;
  label: string;
  tooltip?: string;
  function: string;
  decimals?: number;
  formatFn?: Function;
  inlineField?: string;
};

const env = process.env;

type ProtocolColors = {
  rgb: number[];
  hsl: string[];
  hex?: string;
};

type StatsProps = {
  showLegend?: boolean;
};

export type ApisProps = {
  path?: string;
  filters?: string[];
  params?: string[];
  config?: Record<any, any>;
  endpoint: Record<number, string>;
};

export interface Protocol {
  enabled: boolean;
  label: string;
  icon?: string;
  stats?: StatsProps;
  govTokens?: string[];
  colors?: ProtocolColors;
  fields?: ProtocolField[];
  apis?: Record<string, ApisProps>;
}

export const protocols: Record<string, Protocol> = {
  compound: {
    stats: {
      showLegend: true,
    },
    enabled: true,
    label: "Compound",
    govTokens: ["COMP"],
    icon: `${protocolsFolder}compound.svg`,
    colors: {
      rgb: [0, 209, 146],
      hsl: ["162", "100%", "41%"],
    },
  },
  fulcrum: {
    stats: {
      showLegend: false,
    },
    enabled: false,
    label: "Fulcrum",
    icon: `${protocolsFolder}fulcrum.svg`,
    colors: {
      rgb: [2, 138, 192],
      hsl: ["197", "98%", "38%"],
    },
  },
  dsr: {
    label: "DSR",
    enabled: false,
    icon: `${protocolsFolder}dsr.svg`,
    colors: {
      rgb: [222, 52, 67],
      hsl: ["355", "72%", "54%"],
    },
  },
  dydx: {
    icon: `${protocolsFolder}dydx.svg`,
    stats: {
      showLegend: true,
    },
    label: "DyDx",
    enabled: false,
    colors: {
      rgb: [87, 87, 90],
      hsl: ["240", "2%", "35%"],
    },
  },
  iearn: {
    icon: `${protocolsFolder}iearn.svg`,
    label: "Yearn",
    enabled: true,
  },
  aave: {
    icon: `${protocolsFolder}aave.svg`,
    label: "Aave V1",
    stats: {
      showLegend: false,
    },
    enabled: false,
    colors: {
      rgb: [230, 131, 206],
      hsl: ["315", "66%", "71%"],
    },
  },
  aavev2: {
    stats: {
      showLegend: true,
    },
    enabled: true,
    label: "Aave V2",
    govTokens: ["STKAAVE"],
    icon: `${protocolsFolder}aave.svg`,
    colors: {
      rgb: [151, 79, 141],
      hsl: ["308", "31%", "45%"],
    },
  },
  morpho: {
    icon: `${protocolsFolder}morpho.svg`,
    label: "Morpho",
    stats: {
      showLegend: false,
    },
    enabled: true,
    colors: {
      rgb: [30, 61, 137],
      hsl: ["223", "64%", "33%"],
    },
  },
  ethena: {
    icon: `${protocolsFolder}ethena.svg`,
    label: "Ethena",
    stats: {
      showLegend: false,
    },
    enabled: true,
    colors: {
      rgb: [30, 61, 137],
      hsl: ["223", "64%", "33%"],
    },
    apis: {
      USDe: {
        path: "stakingYield.value",
        endpoint: {
          1: "https://api.idle.finance/ethenaAprs",
        },
        config: {
          headers: env.REACT_APP_IDLE_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_KEY}` }
            : {},
        },
      },
    },
  },
  amphor: {
    icon: `${protocolsFolder}amphor.png`,
    label: "Morpho",
    stats: {
      showLegend: false,
    },
    enabled: true,
    colors: {
      rgb: [30, 61, 137],
      hsl: ["223", "64%", "33%"],
    },
    apis: {
      wstETHBase: {
        path: "wstethVault.underlyingAPR",
        endpoint: {
          1: "https://api.idle.finance/amphorAprs",
        },
        config: {
          headers: env.REACT_APP_IDLE_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_KEY}` }
            : {},
        },
      },
      wstETH: {
        path: "wstethVault.strategyNetAPR",
        endpoint: {
          1: "https://api.idle.finance/amphorAprs",
        },
        config: {
          headers: env.REACT_APP_IDLE_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_KEY}` }
            : {},
        },
      },
      wstETHTotal: {
        path: "wstethVault.totalNetAPR",
        endpoint: {
          1: "https://api.idle.finance/amphorAprs",
        },
        config: {
          headers: env.REACT_APP_IDLE_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_KEY}` }
            : {},
        },
      },
      wstETHEpoch: {
        endpoint: {
          1: "https://api.idle.finance/amphorEpochInfo/wstethVault",
        },
        config: {
          headers: env.REACT_APP_IDLE_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_KEY}` }
            : {},
        },
      },
    },
  },
  optimism: {
    icon: "",
    label: "Optimism",
    stats: {
      showLegend: false,
    },
    apis: {
      additionalRewards: {
        endpoint: {
          10: "https://api-optimism.idle.finance/opDistributionAprs",
        },
        config: {
          headers: env.REACT_APP_IDLE_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_KEY}` }
            : {},
        },
      },
    },
    enabled: true,
    colors: {
      rgb: [63, 118, 255],
      hsl: ["223", "100%", "62%"],
    },
  },
  instadapp: {
    icon: `${protocolsFolder}instadapp.png`,
    label: "Instadapp",
    stats: {
      showLegend: false,
    },
    apis: {
      stETH: {
        // path:'4.apy.apyWithFee',
        endpoint: {
          1: "https://api.instadapp.io/v2/mainnet/lite/users/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE/vaults",
        },
      },
    },
    enabled: true,
    colors: {
      rgb: [63, 118, 255],
      hsl: ["223", "100%", "62%"],
    },
  },
  cream: {
    icon: `${protocolsFolder}cream.svg`,
    stats: {
      showLegend: false,
    },
    enabled: false,
    label: "Cream",
    colors: {
      rgb: [105, 226, 220],
      hsl: ["177", "68%", "65%"],
    },
  },
  lido: {
    icon: `${protocolsFolder}lido.png`,
    stats: {
      showLegend: false,
    },
    apis: {
      rates: {
        path: "apr",
        endpoint: {
          1: "https://api.idle.finance/poLidoStats",
        },
        config: {
          headers: env.REACT_APP_IDLE_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_KEY}` }
            : {},
        },
      },
      stETH: {
        path: "data.apr",
        endpoint: {
          1: "https://eth-api.lido.fi/v1/protocol/steth/apr/last",
        },
      },
      checkpoints: {
        path: "result",
        endpoint: {
          1: "https://heimdall-api.polygon.technology/checkpoints/",
        },
      },
    },
    enabled: true,
    label: "Lido",
    colors: {
      rgb: [0, 163, 255],
      hsl: ["202", "100%", "50%"],
    },
  },
  quickswap: {
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "QuickSwap",
    icon: `${protocolsFolder}quickswap.png`,
    colors: {
      rgb: [0, 163, 255],
      hsl: ["202", "100%", "50%"],
    },
  },
  convex: {
    icon: `${protocolsFolder}convex.svg`,
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "Convex",
    colors: {
      rgb: [58, 58, 58],
      hsl: ["0", "0%", "23%"],
    },
  },
  mstable: {
    icon: `${protocolsFolder}mstable.svg`,
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "mStable",
    colors: {
      rgb: [0, 0, 0],
      hsl: ["0", "0%", "0%"],
    },
  },
  euler: {
    icon: `${protocolsFolder}euler.svg`,
    label: "Euler",
    stats: {
      showLegend: false,
    },
    enabled: true,
    colors: {
      rgb: [228, 97, 94],
      hsl: ["1", "71%", "63%"],
    },
  },
  wintermute: {
    icon: `${protocolsFolder}wintermute.svg`,
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "Wintermute",
    colors: {
      rgb: [163, 236, 38],
      hsl: ["82", "84%", "54%"],
    },
  },
  gearbox: {
    icon: `${protocolsFolder}gearbox.svg`,
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "Gearbox",
    apis: {
      tokenSupply: {
        endpoint: {
          1: "https://charts-server.fly.dev/api/getBalanceAt?asset=",
          10: "https://optimism.gearbox.foundation/api/getBalanceAt?asset=",
        },
      },
    },
    colors: {
      rgb: [163, 236, 38],
      hsl: ["82", "84%", "54%"],
    },
  },
  clearpool: {
    icon: `${protocolsFolder}clearpool.svg`,
    stats: {
      showLegend: false,
    },
    govTokens: ["CPOOL"],
    enabled: true,
    label: "Clearpool",
    fields: [
      {
        field: "poolSize",
        function: "poolSize",
        label: "assets.assetDetails.generalData.pool",
        tooltip: "assets.assetDetails.tooltips.pool",
      },
      {
        decimals: 18,
        field: "borrowRate",
        function: "getBorrowRate",
        formatFn: (d: BigNumber) => d.times(SECONDS_IN_YEAR).times(100),
        label: "assets.assetDetails.generalData.borrowRate",
        tooltip: "assets.assetDetails.tooltips.borrowRate",
      },
      {
        decimals: 18,
        field: "supplyRate",
        function: "getSupplyRate",
        formatFn: (d: BigNumber) => d.times(SECONDS_IN_YEAR).times(100),
        label: "assets.assetDetails.generalData.supplyRate",
        tooltip: "assets.assetDetails.tooltips.supplyRate",
      },
      {
        decimals: 18,
        field: "utilizationRate",
        function: "getUtilizationRate",
        formatFn: (d: BigNumber) => d.times(100),
        label: "assets.assetDetails.generalData.utilizationRate",
        tooltip: "assets.assetDetails.tooltips.utilizationRate",
      },
    ],
    colors: {
      rgb: [95, 115, 244],
      hsl: ["232", "87%", "66%"],
    },
  },
  ribbon: {
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "Ribbon",
    icon: `${protocolsFolder}ribbon.svg`,
    colors: {
      rgb: [252, 10, 84],
      hsl: ["342", "98%", "51%"],
    },
  },
  truefi: {
    icon: `${protocolsFolder}truefi.svg`,
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "TrueFi",
    colors: {
      rgb: [25, 91, 255],
      hsl: ["223", "100%", "55%"],
    },
  },
  fuse: {
    stats: {
      showLegend: true,
    },
    enabled: false,
    label: "Fuse",
    icon: `${protocolsFolder}fuse.png`,
    colors: {
      rgb: [0, 0, 0],
      hsl: ["0", "0%", "0%"],
    },
  },
  curve: {
    icon: `${protocolsFolder}curve.svg`,
    label: "",
    enabled: true,
    colors: {
      rgb: [0, 55, 255],
      hsl: ["227", "100%", "50%"],
    },
  },
  idle: {
    icon: `${protocolsFolder}idle-blue.svg`,
    label: "Idle",
    enabled: true,
    colors: {
      rgb: [0, 55, 255],
      hsl: ["227", "100%", "50%"],
    },
    apis: {
      checkSignature: {
        endpoint: {
          1: "https://api.idle.finance/checkSignature/",
          // 1: 'http://localhost:3333/checkSignature/' // TEST
        },
        config: {
          headers: env.REACT_APP_IDLE_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_KEY}` }
            : {},
        },
      },
      saveSignature: {
        endpoint: {
          1: "https://api.idle.finance/saveSignature",
          // 1: 'http://localhost:3333/saveSignature' // TEST
        },
        config: {
          headers: env.REACT_APP_IDLE_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_KEY}` }
            : {},
        },
      },
      vaults: {
        endpoint: {
          1: "https://api-staging.idle.finance/v1/vaults",
          10: "https://api-staging.idle.finance/v1/vaults",
          137: "https://api-staging.idle.finance/v1/vaults",
          // 1: "http://127.0.0.1:3000/v1/vaults",
          // 10: "http://127.0.0.1:3000/v1/vaults",
          // 137: "http://127.0.0.1:3000/v1/vaults",
        },
        path: "data",
        filters: ["address", "limit"],
        config: {
          headers: env.REACT_APP_IDLE_API_V2_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_API_V2_KEY}` }
            : {},
        },
      },
      tokenBlocks: {
        endpoint: {
          1: "https://api-staging.idle.finance/v1/vaultBlocks",
          10: "https://api-staging.idle.finance/v1/vaultBlocks",
          137: "https://api-staging.idle.finance/v1/vaultBlocks",
          // 1: "http://127.0.0.1:3000/v1/token-blocks",
          // 10: "http://127.0.0.1:3000/v1/token-blocks",
          // 137: "http://127.0.0.1:3000/v1/token-blocks",
        },
        filters: [
          /*"start", "end",*/
          "offset",
          "limit",
          "tokenId",
          "tokenAddress",
          "order",
          "sort",
        ],
        config: {
          headers: env.REACT_APP_IDLE_API_V2_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_API_V2_KEY}` }
            : {},
        },
      },
      vaultBlocks: {
        endpoint: {
          // 1: "https://api-staging.idle.finance/v1/vaultBlocks",
          // 10: "https://api-staging.idle.finance/v1/vaultBlocks",
          // 137: "https://api-staging.idle.finance/v1/vaultBlocks",
          1: "http://127.0.0.1:3000/v1/vault-blocks",
          10: "http://127.0.0.1:3000/v1/vault-blocks",
          137: "http://127.0.0.1:3000/v1/vault-blocks",
        },
        filters: [
          /*"start", "end",*/
          "offset",
          "limit",
          "vaultId",
          "vaultAddress",
          "order",
          "sort",
        ],
        config: {
          headers: env.REACT_APP_IDLE_API_V2_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_API_V2_KEY}` }
            : {},
        },
      },
      transactions: {
        endpoint: {
          1: "https://api-staging.idle.finance/v1/transactions/",
          10: "https://api-staging.idle.finance/v1/transactions/",
          137: "https://api-staging.idle.finance/v1/transactions/",
        },
        config: {
          headers: env.REACT_APP_IDLE_API_V2_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_API_V2_KEY}` }
            : {},
        },
      },
      rates: {
        endpoint: {
          1: "https://api.idle.finance/rates/",
          10: "https://api-optimism.idle.finance/rates/",
          137: "https://api-polygon.idle.finance/rates/",
        },
        filters: ["start", "end", "limit", "frequency", "order"],
        config: {
          headers: env.REACT_APP_IDLE_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_KEY}` }
            : {},
        },
      },
      juniorRates: {
        endpoint: {
          1: "https://api.idle.finance/junior-rates/",
        },
        filters: ["start", "end", "limit", "frequency", "order"],
        config: {
          headers: env.REACT_APP_IDLE_KEY
            ? { Authorization: `Bearer ${env.REACT_APP_IDLE_KEY}` }
            : {},
        },
      },
    },
  },
};
