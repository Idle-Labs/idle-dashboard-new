export const subgraphs = {
  tranches: {
    enabled:true,
    enabledChains:[1],
    endpoint:"https://api.thegraph.com/subgraphs/name/samster91/idle-tranches",
    entities:{
      trancheInfos:[
        'id',
        'apr',
        'timeStamp',
        // 'blockNumber',
        // 'totalSupply',
        'virtualPrice',
        // 'contractValue',
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