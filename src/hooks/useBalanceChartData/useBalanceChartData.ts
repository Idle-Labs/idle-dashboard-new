import dayjs from 'dayjs'
import BigNumber from 'bignumber.js'
import { useState, useMemo, useEffect } from 'react'
import { BNify, getTimestampRange, isEmpty } from 'helpers/'
// import { balanceChartDataMock } from './balanceChartData.mock'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetId, HistoryData, HistoryTimeframe, Asset, Transaction } from 'constants/types'

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
  const { isPortfolioLoaded, historicalPrices, historicalPricesUsd, selectors: { selectAssetsByIds, selectVaultTransactions, selectAssetHistoricalPriceByTimestamp, selectAssetHistoricalPriceUsdByTimestamp } } = usePortfolioProvider()
  const [balanceChartData, setBalanceChartData] = useState<BalanceChartData>({
    total: [],
    rainbow: [],
  })
  const [balanceChartDataLoading, setBalanceChartDataLoading] = useState<boolean>(true)


  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    return selectAssetsByIds(assetIds)
  }, [assetIds, selectAssetsByIds])

  // console.log('assets', assets)

  useEffect(() => {
    if (!isPortfolioLoaded || isEmpty(historicalPrices) || isEmpty(historicalPricesUsd)) return

    // console.log('prices', prices)

    ;(async() => {
      const assetsBalancesByDate = await assets.reduce( async (promiseAssetBalancesByDate: Promise<Record<number, Record<AssetId, number>>>, asset: Asset) => {

        if (!asset?.id) return

        const assetId: AssetId = asset.id
        
        const assetsBalancesByDate = await promiseAssetBalancesByDate
        const vaultTransactions = selectVaultTransactions(assetId)

        if (!vaultTransactions) return

        // console.log('vaultTransactions', assetId, vaultTransactions)

        // Loop through asset transactions
        const assetBalancesByDate = vaultTransactions.reduce( (balances: Record<string, any>, transaction: Transaction) => {
          const timestamp = +(dayjs(+(transaction.timeStamp)*1000).startOf('day').valueOf())

          switch (transaction.action) {
            case 'deposit':
              balances.total = balances.total.plus(transaction.idleAmount)
            break;
            case 'redeem':
              balances.total = BigNumber.maximum(0, balances.total.minus(transaction.idleAmount))
            break;
            default:
            break;
          }

          balances.byDate[timestamp] = balances.total

          return balances
        }, {
          total: BNify(0),
          byDate: {}
        })

        Object.keys(assetBalancesByDate.byDate).forEach( (timestamp: any) => {
          if (!assetsBalancesByDate[timestamp]) {
            assetsBalancesByDate[timestamp] = {}
          }
          if (asset.id) {
            assetsBalancesByDate[timestamp][asset.id] = parseFloat(assetBalancesByDate.byDate[timestamp])
          }
        })

        // console.log('vaultTransactions', asset.id, asset, vaultTransactions, assetBalancesByDate)

        return assetsBalancesByDate
      }, Promise.resolve({}))

      if (isEmpty(assetsBalancesByDate)) return

      // console.log('assetsBalancesByDate', assetsBalancesByDate)

      // Extend balances for each day between the first one and today
      const startTimestamp = +(Object.keys(assetsBalancesByDate).sort()[0])
      const endTimestamp = +(dayjs().endOf('day').valueOf())


      const timestampRange = getTimestampRange(startTimestamp, endTimestamp)
      const assetsBalancesByDateExtended: Record<number, Record<AssetId, number>> = {}
      for (let timestampIndex: number = 0, prevTimestamp: number | null = null; timestampIndex < timestampRange.length; timestampIndex++) {
        const timestamp = timestampRange[timestampIndex]

        // Copy prev balances
        assetsBalancesByDateExtended[timestamp] = {
          ...(prevTimestamp ? assetsBalancesByDateExtended[prevTimestamp] : {}),
          ...assetsBalancesByDate[timestamp],
        }

        // console.log('assetsBalancesByDateExtended', prevTimestamp, timestamp, (prevTimestamp ? assetsBalancesByDateExtended[prevTimestamp] : {}), assetsBalancesByDateExtended[timestamp])

        prevTimestamp = timestamp
      }

      // console.log('assetsBalancesByDateExtended', assetsBalancesByDateExtended)

      // Add totals
      Object.keys(assetsBalancesByDateExtended).forEach( (timestamp: any) => {

        const assetsBalances = assetsBalancesByDateExtended[timestamp]

        // Multiply balance by vault price
        Object.keys(assetsBalances).forEach( (assetId: AssetId) => {

          const asset = assets.find( (asset: Asset) => asset.id === assetId )
          const underlyingId: AssetId = asset?.underlyingId

          const vaultPriceInfo = selectAssetHistoricalPriceByTimestamp(assetId, timestamp)
          // console.log('vaultPriceInfo', assetId, timestamp, vaultPriceInfo, assetsBalances[assetId])
          if (vaultPriceInfo) {
            assetsBalances[assetId] = parseFloat(BNify(assetsBalances[assetId]).times(BNify(vaultPriceInfo.value)).toFixed(8))
          }

          const vaultPriceInfoUsd = selectAssetHistoricalPriceUsdByTimestamp(underlyingId, timestamp)
          // console.log('vaultPriceInfoUsd', assetId, underlyingId, timestamp, vaultPriceInfoUsd, assetsBalances[assetId]);
          if (vaultPriceInfoUsd) {
            assetsBalances[assetId] = parseFloat(BNify(assetsBalances[assetId]).times(BNify(vaultPriceInfoUsd.value)).toFixed(8))
          }
        })

        // Calculate total balance
        assetsBalances.total = Object.values(assetsBalances).reduce( (total: number, value: number) => (total+value), 0 )
      })

      // console.log('assetsBalancesByDateExtended', assetsBalancesByDateExtended)

      // Generate total array
      const total = Object.keys(assetsBalancesByDateExtended).reduce( (total: HistoryData[], timestamp: any ) => {
        total.push({
          date: parseInt(timestamp),
          value: assetsBalancesByDateExtended[timestamp].total
        })
        return total
      }, [])

      // Generate rainbow array
      const rainbow = Object.keys(assetsBalancesByDateExtended).reduce( (rainbow: RainbowData[], timestamp: any ) => {
        rainbow.push({
          date: parseInt(timestamp),
          total: assetsBalancesByDateExtended[timestamp].total,
          ...assetsBalancesByDateExtended[timestamp]
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
  }, [assets, selectVaultTransactions, isPortfolioLoaded, historicalPrices, historicalPricesUsd, selectAssetHistoricalPriceByTimestamp, selectAssetHistoricalPriceUsdByTimestamp])

  return {
    assets,
    balanceChartData,
    balanceChartDataLoading
  }
}