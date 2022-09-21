type ProtocolColors = {
  rgb: number[]
  hsl: string[]
  hex?: string
}

type StatsProps = {
  showLegend?: boolean
}

export interface Protocol {
  enabled: boolean
  label: string
  icon?: string
  colors?: ProtocolColors
  stats?: StatsProps
}

export const protocols: Record<string, Protocol> = {
  compound: {
    stats: {
      showLegend: true,
    },
    enabled: true,
    label: "Compound",
    colors: {
      rgb: [0, 209, 146],
      hsl: ["162", "100%", "41%"]
    }
  },
  aavev2WithStkAAVE: {
    enabled: true,
    label: "Aave V2 + stkAAVE",
    colors: {
      hex: "#B6509E",
      rgb: [182, 80, 158],
      hsl: ["314", "41%", "51%"]
    },
  },
  compoundWithCOMP: {
    enabled: true,
    label: "Compound + COMP",
    colors: {
      rgb: [0, 153, 107],
      hsl: ["162", "100%", "30%"]
    },
  },
  fulcrum: {
    stats: {
      showLegend: false,
    },
    enabled: false,
    label: "Fulcrum",
    colors: {
      rgb: [2, 138, 192],
      hsl: ["197", "98%", "38%"]
    }
  },
  dsr: {
    label: "DSR",
    enabled: false,
    icon: "CHAI.png",
    colors: {
      rgb: [222, 52, 67],
      hsl: ["355", "72%", "54%"]
    }
  },
  dydx: {
    stats: {
      showLegend: true,
    },
    label: "DyDx",
    enabled: false,
    colors: {
      rgb: [87, 87, 90],
      hsl: ["240", "2%", "35%"]
    }
  },
  iearn: {
    label: "Yearn",
    enabled: true
  },
  aave: {
    label: "Aave V1",
    stats: {
      showLegend: false,
    },
    enabled: false,
    colors: {
      rgb: [230, 131, 206],
      hsl: ["315", "66%", "71%"]
    }
  },
  aavev2: {
    stats: {
      showLegend: true,
    },
    enabled: true,
    icon: "aave.svg",
    label: "Aave V2",
    colors: {
      rgb: [151, 79, 141],
      hsl: ["308", "31%", "45%"]
    }
  },
  cream: {
    stats: {
      showLegend: false,
    },
    enabled: false,
    label: "Cream",
    icon: "cream.svg",
    colors: {
      rgb: [105, 226, 220],
      hsl: ["177", "68%", "65%"]
    }
  },
  lido: {
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "Lido",
    icon: "lido.png",
    colors: {
      rgb: [0, 163, 255],
      hsl: ['202', '100%', '50%']
    }
  },
  quickswap: {
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "QuickSwap",
    icon: "quickswap.png",
    colors: {
      rgb: [0, 163, 255],
      hsl: ['202', '100%', '50%']
    }
  },
  convex: {
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "Convex",
    colors: {
      rgb: [58, 58, 58],
      hsl: ['0', '0%', '23%']
    }
  },
  mstable: {
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "mStable",
    colors: {
      rgb: [0, 0, 0],
      hsl: ['0', '0%', '0%']
    }
  },
  euler: {
    label: "Euler",
    stats: {
      showLegend: false,
    },
    enabled: true,
    colors: {
      rgb: [228, 97, 94],
      hsl: ["1", "71%", "63%"]
    }
  },
  wintermute: {
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "Wintermute",
    colors: {
      rgb: [163, 236, 38],
      hsl: ["82", "84%", "54%"]
    }
  },
  clearpool: {
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "Clearpool",
    colors: {
      rgb: [95, 115, 244],
      hsl: ["232", "87%", "66%"]
    }
  },
  truefi: {
    stats: {
      showLegend: false,
    },
    enabled: true,
    label: "TrueFi",
    colors: {
      rgb: [25, 91, 255],
      hsl: ["223", "100%", "55%"]
    }
  },
  fuse: {
    stats: {
      showLegend: true,
    },
    enabled: false,
    label: "Fuse",
    icon: "fuse.png",
    colors: {
      rgb: [0, 0, 0],
      hsl: ["0", "0%", "0%"]
    }
  },
  curve: {
    label: "",
    enabled: true,
    colors: {
      rgb: [0, 55, 255],
      hsl: ["227", "100%", "50%"]
    }
  },
  idle: {
    label: "Idle",
    enabled: true,
    colors: {
      rgb: [0, 55, 255],
      hsl: ["227", "100%", "50%"]
    }
  }
}