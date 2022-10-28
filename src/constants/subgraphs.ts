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
        'blockNumber',
        'totalSupply',
        'virtualPrice',
        'contractValue',
      ]
    }
  }
}