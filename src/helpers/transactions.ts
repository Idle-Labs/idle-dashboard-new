import axios from 'axios'
import { BNify } from 'helpers/'
import BigNumber from 'bignumber.js'
import type { Explorer } from 'constants/networks'
import type { Transaction, VaultPosition, Balances } from 'constants/types'

export const makeRequest = async (endpoint: string, error_callback?: Function, config?: any): Promise<any> => {
  const data = await axios
    .get(endpoint, config)
    .catch(err => {
      if (typeof error_callback === 'function') {
        error_callback(err);
      }
    });

  return data || null;
}

export const makeEtherscanApiRequest = async (endpoint: string, keys: Explorer["keys"] = [], TTL: number = 180, apiKeyIndex: number = 0): Promise<any> => {
  const apiKey = keys[apiKeyIndex];
  const data = await makeRequest(endpoint + '&apikey=' + apiKey);

  if (data && data.data && data.data.result && (data.data.message.match(/^OK/) || data.data.message === "No transactions found")) {
    return data.data.result;
  } else if (apiKeyIndex < keys.length - 1) {
    return await makeEtherscanApiRequest(endpoint, keys, TTL, apiKeyIndex + 1);
  }
  return null;
}

export const getVaultsPositions = (vaultsTransactions: Record<string, Transaction[]>, vaultsBalances: Balances, vaultsPrices: Balances): Record<string, VaultPosition> => {
  return Object.keys(vaultsTransactions).reduce( (vaultsPositions: Record<string, VaultPosition>, assetId: string) => {

    const transactions = vaultsTransactions[assetId]

    if (!transactions || !transactions.length) return vaultsPositions

    const depositedAmount = transactions.reduce( (depositedAmount: BigNumber, transaction: Transaction) => {
      // console.log(assetId, transaction.action, transaction.underlyingAmount.toString(), transaction.idlePrice.toString())
      switch (transaction.action) {
        case 'deposit':
          depositedAmount = depositedAmount.plus(transaction.underlyingAmount)

        break;
        case 'redeem':
          depositedAmount = BigNumber.maximum(0, depositedAmount.minus(transaction.underlyingAmount))
        break;
        default:
        break;
      }

      return depositedAmount
    }, BNify(0))

    if (depositedAmount.lte(0)) return vaultsPositions

    const redeemableAmount = vaultsBalances[assetId].times(vaultsPrices[assetId])
    const earningsAmount = redeemableAmount.minus(depositedAmount)
    const earningsPercentage = redeemableAmount.div(depositedAmount).minus(1)
    const avgBuyPrice = BigNumber.maximum(1, vaultsPrices[assetId].div(earningsPercentage.plus(1)))

    vaultsPositions[assetId] = {
      avgBuyPrice,
      earningsAmount,
      depositedAmount,
      redeemableAmount,
      earningsPercentage,
    }

    // console.log(assetId, vaultsPrices[assetId].toString(), avgBuyPrice.toString(), depositedAmount.toString(), earningsAmount.toString(), earningsPercentage.toString())

    return vaultsPositions

  }, {})
}