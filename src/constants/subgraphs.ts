type SubgraphProps = {
  enabled: boolean;
  endpoints: Record<number, string>;
  entities: Record<string, string[]>;
};

const env = process.env;

export const subgraphs: Record<string, SubgraphProps> = {
  tranches: {
    enabled: true,
    endpoints: {
      1: `https://gateway-arbitrum.network.thegraph.com/api/${env.REACT_APP_SUBGRAPH_KEY}/subgraphs/id/C29JvonxZXzgmxi57g3vznAdxyeDozghz2twmwUPE6oG`,
      10: "https://api.studio.thegraph.com/query/12583/idle-tranches-optimism/version/latest",
      1101: "https://api.studio.thegraph.com/query/12583/idle-tranches-zkevm/version/latest",
    },
    entities: {
      trancheInfos: [
        "id",
        "apr",
        "timeStamp",
        // 'blockNumber',
        // 'totalSupply',
        "virtualPrice",
        "contractValue",
      ],
    },
  },
  /*
  chainlinkFeeds: {
    enabled:true,
    enabledChains:[1],
    endpoint:"https://gateway.thegraph.com/api/[api-key]/subgraphs/id/6sGpZpDeGRYW8Csk98eqkXtX5FcEvYDaE2bqU2BbKEkj",
    entities:{
      trancheInfos:[
        'id',
        'apr',
        'timeStamp',
        'blockNumber',
        'totalSupply',
        'virtualPrice',
        'contractValue',
      ]
    }
  }
  */
};
