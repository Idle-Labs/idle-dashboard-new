type SubgraphProps = {
  enabled: boolean
  endpoints: Record<number, string>
  entities: Record<string, string[]>
}

export const subgraphs: Record<string, SubgraphProps> = {
  tranches: {
    enabled:true,
    endpoints:{
      1:"https://api.thegraph.com/subgraphs/name/samster91/idle-tranches",
      10:"https://api.thegraph.com/subgraphs/name/samster91/idle-tranches-optimism",
      1101:"https://api.studio.thegraph.com/query/12583/idle-tranches-zkevm/version/latest"
    },
    entities:{
      trancheInfos:[
        'id',
        'apr',
        'timeStamp',
        // 'blockNumber',
        // 'totalSupply',
        'virtualPrice',
        'contractValue',
      ]
    }
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
}