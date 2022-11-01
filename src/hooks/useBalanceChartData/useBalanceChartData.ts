import dayjs from 'dayjs'
import BigNumber from 'bignumber.js'
import { asyncForEach, BNify } from 'helpers/'
import { useState, useMemo, useEffect } from 'react'
import { balanceChartDataMock } from './balanceChartData.mock'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetId, HistoryData, HistoryTimeframe, Asset, Transaction, Balances } from 'constants/types'

export type RainbowData = {
  date: number
  total: number
  [k: AssetId]: number
}

export type BalanceChartData = {
  total: HistoryData[]
  rainbow: RainbowData[]
}

type UseBalanceChartDataReturn = {
  assets?: Asset[]
  balanceChartData: BalanceChartData
  balanceChartDataLoading: boolean
}

type UseBalanceChartDataArgs = {
  assetIds: AssetId[]
  accountId?: string
  timeframe: HistoryTimeframe
}

type UseBalanceChartData = (args: UseBalanceChartDataArgs) => UseBalanceChartDataReturn

export const useBalanceChartData: UseBalanceChartData = args => {

  const { assetIds/*, timeframe*/ } = args
  const { isPortfolioLoaded, selectors: { selectAssetsByIds, selectVaultTransactions } } = usePortfolioProvider()
  const [balanceChartData, setBalanceChartData] = useState<BalanceChartData>({
    total: [],
    rainbow: [],
  })
  const [balanceChartDataLoading, setBalanceChartDataLoading] = useState<boolean>(true)


  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    return selectAssetsByIds(assetIds)
  }, [assetIds, selectAssetsByIds])

  console.log('assets', assets)

  useEffect(() => {
    if (!isPortfolioLoaded) return

    ;(async() => {
      const assetsBalancesByDate = await assets.reduce( async (promiseAssetBalancesByDate: Promise<Record<number, Record<AssetId, number>>>, asset: Asset) => {

        if (!asset?.id) return
        
        const assetsBalancesByDate = await promiseAssetBalancesByDate
        const vaultTransactions = selectVaultTransactions(asset.id)

        // Loop through asset transactions
        const assetBalancesByDate = vaultTransactions.reduce( (balances: Record<number, BigNumber>, transaction: Transaction) => {
          const date = +(dayjs(+(transaction.timeStamp)*1000).startOf('day').valueOf())

          if (!balances[date]) {
            balances[date] = BNify(0)
          }

          switch (transaction.action) {
            case 'deposit':
              balances[date] = balances[date].plus(transaction.underlyingAmount)
            break;
            case 'redeem':
              balances[date] = BigNumber.maximum(0, balances[date].minus(transaction.underlyingAmount))
            break;
            default:
            break;
          }

          return balances
        }, {})

        Object.keys(assetBalancesByDate).forEach( (date: any) => {
          if (!assetsBalancesByDate[date]) {
            assetsBalancesByDate[date] = {
              total: 0
            }
          }
          if (asset.id) {
            assetsBalancesByDate[date][asset.id] = parseFloat(assetBalancesByDate[date])
            assetsBalancesByDate[date].total += assetsBalancesByDate[date][asset.id]
          }
        })

        // console.log('vaultTransactions', asset.id, asset, vaultTransactions, assetBalancesByDate)

        return assetsBalancesByDate
      }, Promise.resolve({}))

      const total = Object.keys(assetsBalancesByDate).reduce( (total: HistoryData[], date: string ) => {
        total.push({
          date: parseInt(date),
          value: parseFloat(assetsBalancesByDate[date].total)
        })
        return total
      }, [])

      const rainbow = Object.keys(assetsBalancesByDate).reduce( (rainbow: RainbowData[], date: string ) => {
        rainbow.push({
          date: parseInt(date),
          ...assetsBalancesByDate[date]
        })
        return rainbow
      }, [])

      const balanceChartData = {
        total,
        rainbow
      }

      // console.log('balanceChartData', balanceChartData)
      setBalanceChartData(balanceChartData)
      setBalanceChartDataLoading(false)
    })()
  }, [assets, selectVaultTransactions, isPortfolioLoaded])

  return {
    assets,
    balanceChartData,
    balanceChartDataLoading
  }
}