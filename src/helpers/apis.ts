import Web3 from 'web3'
import axios from 'axios'
import { ethers } from 'ethers'
import GnosisSafe from 'abis/gnosis/GnosisSafe.json'
import { GenericContract } from 'contracts/GenericContract'
import { getObjectPath, asyncWait, cmpAddrs } from 'helpers/'
import { protocols, subgraphs, explorers, networks } from 'constants/'
import type { Abi, Explorer, PlatformApiFilters, ApisProps, Nullable } from 'constants/'

export const makeRequest = async (endpoint: string, config?: any, error_callback?: Function): Promise<any> => {
  const data = await axios
    .get(endpoint, config)
    .catch(err => {
      if (typeof error_callback === 'function') {
        error_callback(err);
      }
    });

  return data?.data || null;
}

export const makePostRequest = async (endpoint: string, postData: any = {}, config?: any, error_callback?: Function) => {
  const data = await axios
    .post(endpoint, postData, config)
    .catch(err => {
      if (typeof error_callback === 'function') {
        error_callback(err);
      }
    });
  return data?.data;
}

export const getPlatformApiConfig = (chainId: number, protocol: string, api: string): ApisProps | null => {
  const protocolApis = protocols[protocol]
  if (!protocolApis || !protocolApis.apis) return null
  
  const apiConfig = protocolApis.apis[api]
  if (!apiConfig || !apiConfig.endpoint[chainId]) return null

  return apiConfig
}

export const getPlatformApisEndpoint = (chainId: number, protocol: string, api: string, endpointSuffix?: string, filters?: PlatformApiFilters): string | null => {
  const apiConfig = getPlatformApiConfig(chainId, protocol, api)
  if (!apiConfig) return null

  const protocolFilters = apiConfig.filters
  const queryStringParams = filters && Object.keys(filters).reduce( (applyFilters: string[], field: string) => {
    if (protocolFilters && protocolFilters.includes(field.toLowerCase())) {
      applyFilters.push(`${field.toLowerCase()}=${filters[field]}`)
    }
    return applyFilters
  }, [])

  return `${apiConfig.endpoint[chainId]}${endpointSuffix||''}`+(queryStringParams ? `?${queryStringParams.join('&')}` : '')
}

export const callPlatformApis = async (chainId: number, protocol: string, api: string, endpointSuffix?: string, filters?: PlatformApiFilters): Promise<any> => {
  const endpoint = getPlatformApisEndpoint(chainId, protocol, api, endpointSuffix, filters)
  if (!endpoint) return null

  const protocolApis = protocols[protocol]
  if (!protocolApis || !protocolApis.apis) return null
  
  const apiConfig = protocolApis.apis[api]
  if (!apiConfig || !apiConfig.endpoint[chainId]) return null

  const results = await makeRequest(endpoint, apiConfig.config)
  return apiConfig.path ? getObjectPath(results, apiConfig.path) : results
}

const buildSubgraphQuery = (entity: string, fields: string[], params: Record<string, any> = {}) => {
  const paramsStr = JSON.stringify(params)
  const paramsParsed = paramsStr.substr(1).substr(0, paramsStr.length-2).replace(/"([^"]+)":/g, '$1:')
  return `{
    ${entity}(${paramsParsed}){
      ${fields.join(",")}
    }
  }`;
}

export const getSubgraphTrancheInfo = async (chainId: number, trancheAddress: string, start?: string | number, end?: string | number, fields?: string[], count: number = 0): Promise<any[] | null> => {
  const subgraphConfig = subgraphs.tranches

  // console.log('getSubgraphTrancheInfo', chainId, trancheAddress, subgraphConfig, subgraphConfig.endpoints[chainId])

  if (!subgraphConfig.enabled || !subgraphConfig.endpoints[chainId]){
    return [];
  }

  const currTime = Math.round(Date.now()/1000);
  const queryParams: Record<string, any> = {
    first: 1000,
    orderBy: "timeStamp",
    orderDirection: "asc",
    where: {
      "Tranche": trancheAddress.toLowerCase()
    }
  };

  if (start){
    queryParams.where.timeStamp_gte = start;
  }
  if (end){
    queryParams.where.timeStamp_lte = end;
  }

  fields = fields || subgraphConfig.entities.trancheInfos;
  const subgraphQuery = buildSubgraphQuery('trancheInfos', fields, queryParams);
  const postData = {
    query: subgraphQuery
  }

  const endpoint = subgraphConfig.endpoints[chainId]
  const results = await makePostRequest(endpoint, postData);

  // Handle errors
  if (results?.errors){
    if (count<5){
      await asyncWait(100)
      // console.log('Subgraph fetching errors, try again', trancheAddress, count)
      return await getSubgraphTrancheInfo(chainId, trancheAddress, start, end, fields, count+1)
    }
    return null
  }

  let subgraphData = getObjectPath(results, 'data.trancheInfos');
  const lastTimestamp = subgraphData && subgraphData.length>0 ? parseInt(subgraphData[subgraphData.length-1].timeStamp) : null;

  // Check if fetched enough results
  if (start && end && lastTimestamp && lastTimestamp>start && lastTimestamp<end && currTime-lastTimestamp>86400){
    const subgraphData_2 = await getSubgraphTrancheInfo(chainId, trancheAddress, lastTimestamp+1, end, fields);
    if (subgraphData_2){
      subgraphData = subgraphData.concat(subgraphData_2);
    }
  }

  return subgraphData;
}

export const makeEtherscanApiRequest = async (endpoint: string, keys: Explorer["keys"] = [], TTL = 180, apiKeyIndex = 0): Promise<any> => {
  const apiKey = keys[apiKeyIndex];
  const data = await makeRequest(endpoint + '&apikey=' + apiKey);

  if (data?.result && (data.message.match(/^OK/) || data.message === "No transactions found")) {
    return data.result;
  } else if (apiKeyIndex < keys.length - 1) {
    return await makeEtherscanApiRequest(endpoint, keys, TTL, apiKeyIndex + 1)
  }
  return null
}

export const saveSignature = async (address: string, message: string, signature: string): Promise<any> => {
  const apiConfig = getPlatformApiConfig(1, 'idle', 'saveSignature')
  const endpoint = getPlatformApisEndpoint(1, 'idle', 'saveSignature')
  if (!endpoint) return null
  return await makePostRequest(endpoint, {
    address,
    signature,
    message: btoa(message)
  }, apiConfig?.config)
}

export const checkSignature = async (address: string, message: string): Promise<any> => {
  const apiConfig = getPlatformApiConfig(1, 'idle', 'checkSignature')
  const endpoint = getPlatformApisEndpoint(1, 'idle', 'checkSignature', address)
  if (!endpoint) return null

  return await makePostRequest(endpoint, {
    message: btoa(message)
  }, apiConfig?.config)
}

export const verifySignature = async (web3: Web3, walletAddress: string, message: string, signature: string): Promise<boolean> => {
  const signatureAddress = await web3.eth.accounts.recover(message, signature)
  return cmpAddrs(signatureAddress, walletAddress)
}

export const verifyGnosisSignature = async (web3: Web3, walletAddress: string, message: string, signature: string): Promise<boolean> => {
  const gnosisSafeContract = new GenericContract(web3, web3.givenProvider.networkVersion, {
    name: 'GnosisSafe',
    abi: GnosisSafe as Abi,
    address: walletAddress
  })
  const messageHash = ethers.hashMessage(message)
  const signatureAddress = await gnosisSafeContract.call('isValidSignature', [messageHash, signature], {from: walletAddress})
  return cmpAddrs(signatureAddress, '0x20c13b0b')
}

export const getExplorerByChainId = (chainId: Nullable<number>): Explorer | null => {
  if (!chainId) return null
  const network = networks[+chainId]
  return explorers[network?.explorer] || null
}

export const getExplorerAddressUrl = (chainId: Nullable<number>, explorer: Nullable<Explorer>, address: string): string => {
  if (!chainId || !explorer) return ''
  return `${explorer.baseUrl[chainId]}/address/${address}`
}

export const getExplorerTxUrl = (chainId: Nullable<number>, txHash: string): string => {
  if (!chainId) return ''
  const explorer = getExplorerByChainId(chainId)
  if (!explorer) return ''
  return `${explorer.baseUrl[chainId]}/tx/${txHash}`
}
