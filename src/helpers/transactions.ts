import axios from 'axios'
import type { Explorer } from 'constants/networks'

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

export const makeEtherscanApiRequest = async (endpoint: string, keys: Explorer["keys"] = [], TTL: number = 180, apiKeyIndex: number = 0): Promise<any> => {
  const apiKey = keys[apiKeyIndex];
  const data = await makeRequest(endpoint + '&apikey=' + apiKey);

  if (data?.result && (data.message.match(/^OK/) || data.message === "No transactions found")) {
    return data.result;
  } else if (apiKeyIndex < keys.length - 1) {
    return await makeEtherscanApiRequest(endpoint, keys, TTL, apiKeyIndex + 1);
  }
  return null;
}
