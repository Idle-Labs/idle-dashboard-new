import dayjs from 'dayjs'
import BigNumber from 'bignumber.js'
import { useState, useMemo, useEffect } from 'react'
// import { balanceChartDataMock } from './balanceChartData.mock'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { BNify, getTimestampRange, isEmpty, getTimeframeTimestamp } from 'helpers/'
import { AssetId, HistoryData, HistoryTimeframe, Asset, Transaction, MIN_TIMESTAMP } from 'constants/'

export type RainbowData = {
  date: number
  total: number
  [k: AssetId]: number
}

export type BalanceChartData = {
  total: HistoryData[]
  rainbow: RainbowData[]
}

export type UseBalanceChartDataReturn = {
  assets?: Asset[]
  balanceChartData: BalanceChartData
  balanceChartDataLoading: boolean
}

type UseBalanceChartDataArgs = {
  assetIds: AssetId[]
  accountId?: string
  strategies?: string[]
  allowFlatChart?: boolean
  timeframe?: HistoryTimeframe
  useDollarConversion?: boolean
}

type UseBalanceChartData = (args: UseBalanceChartDataArgs) => UseBalanceChartDataReturn

export const useBalanceChartData: UseBalanceChartData = ({
  assetIds,
  // accountId,
  strategies,
  timeframe,
  allowFlatChart = false,
  useDollarConversion = true
}) => {

  const {
    isPortfolioAccountReady,
    historicalPrices,
    historicalPricesUsd,
    selectors: {
      selectAssetsByIds,
      selectVaultTransactions,
      selectAssetHistoricalPriceByTimestamp,
      selectAssetHistoricalPriceUsdByTimestamp
    }
  } = usePortfolioProvider()

  const [balanceChartDataLoading, setBalanceChartDataLoading] = useState<boolean>(true)

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    const assets = selectAssetsByIds(assetIds)
    return assets.filter( (asset: Asset) => !strategies || !asset.type || strategies.includes(asset.type) )
  }, [assetIds, strategies, selectAssetsByIds])

  const timeframeStartTimestamp = useMemo((): number => {
    if (!timeframe) return MIN_TIMESTAMP
    return getTimeframeTimestamp(timeframe)
  }, [timeframe])

  const balanceChartData = useMemo((): BalanceChartData => {

    const chartData: BalanceChartData = {
      total: [],
      rainbow: []
    }

    // console.log('isPortfolioAccountReady', isPortfolioAccountReady, 'historicalPrices', historicalPrices, 'historicalPricesUsd', historicalPricesUsd)

    if (!isPortfolioAccountReady || isEmpty(historicalPrices) || isEmpty(historicalPricesUsd)) return chartData

    // console.log('historicalPricesUsd', historicalPricesUsd)

    const assetsBalancesByDate = assets.reduce( (assetsBalancesByDate: Record<number, Record<AssetId, number>>, asset: Asset) => {

      if (!asset?.id) return assetsBalancesByDate

      const assetId: AssetId = asset.id

      const vaultTransactions = selectVaultTransactions(assetId)

      if (!vaultTransactions.length) return assetsBalancesByDate

      // Loop through asset transactions
      const assetBalancesByDate = vaultTransactions.reduce( (balances: Record<string, any>, transaction: Transaction) => {
        const timestamp = +(dayjs(+(transaction.timeStamp)*1000).startOf('day').valueOf())

        switch (transaction.action) {
          case 'deposit':
            balances.total = balances.total.plus(transaction.idleAmount)
            // console.log('Deposit', dayjs(timestamp).format('YYYY-MM-DD'), asset.name, transaction.idleAmount.toString(), balances.total.toString())
          break;
          case 'redeem':
            balances.total = BigNumber.maximum(0, balances.total.minus(transaction.idleAmount))
            // console.log('Redeem', dayjs(timestamp).format('YYYY-MM-DD'), asset.name, transaction.idleAmount.toString(), balances.total.toString())
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
          assetsBalancesByDate[timestamp][asset.id] = parseFloat(assetBalancesByDate.byDate[timestamp].toFixed(8))
        }
      })

      // console.log(asset.id, transaction.action, assetBalancesByDate)

      return assetsBalancesByDate
    }, {})

    if (isEmpty(assetsBalancesByDate)){
      if (allowFlatChart){
        assetsBalancesByDate[timeframeStartTimestamp] = 0
      } else {
        return chartData
      }
    }

    // console.log('assetsBalancesByDate', assetsBalancesByDate)

    // Extend balances for each day between the first one and today
    const startTimestamp = +(Object.keys(assetsBalancesByDate).sort()[0])
    const endTimestamp = +(dayjs().endOf('day').valueOf())

    const timestampRange = getTimestampRange(startTimestamp, endTimestamp)

    // console.log('startTimestamp', startTimestamp, 'endTimestamp', endTimestamp, 'timestampRange', timestampRange)

    const assetsBalancesByDateExtended: Record<number, Record<AssetId, number>> = {}
    for (let timestampIndex = 0, prevTimestamp: number | null = null; timestampIndex < timestampRange.length; timestampIndex++) {
      const timestamp = timestampRange[timestampIndex]

      // Copy prev balances
      assetsBalancesByDateExtended[timestamp] = {
        ...(prevTimestamp ? assetsBalancesByDateExtended[prevTimestamp] : {}),
        ...assetsBalancesByDate[timestamp],
      }

      // console.log('assetsBalancesByDateExtended', prevTimestamp, timestamp, (prevTimestamp ? assetsBalancesByDateExtended[prevTimestamp] : {}), assetsBalancesByDateExtended[timestamp])

      prevTimestamp = timestamp
    }

    // Trailing prices
    const prevVaultPriceInfo: Record<AssetId, HistoryData> = {}
    const prevVaultPriceInfoUsd: Record<AssetId, HistoryData> = {}

    // Add totals
    Object.keys(assetsBalancesByDateExtended).forEach( (timestamp: any) => {

      const assetsBalances = assetsBalancesByDateExtended[timestamp]

      // Multiply balance by vault price
      Object.keys(assetsBalances).forEach( (assetId: AssetId) => {
        const asset = assets.find( (asset: Asset) => asset.id === assetId )
        const underlyingId: AssetId | undefined = asset?.underlyingId

        const vaultPriceInfo: HistoryData | null = selectAssetHistoricalPriceByTimestamp(assetId, timestamp) || prevVaultPriceInfo[assetId]
        
        // console.log('vaultPriceInfo', assetId, timestamp, vaultPriceInfo, assetsBalances[assetId])
        
        if (vaultPriceInfo) {
          assetsBalances[assetId] = parseFloat(BNify(assetsBalances[assetId]).times(BNify(vaultPriceInfo.value)).toFixed(8))
          prevVaultPriceInfo[assetId] = vaultPriceInfo
        }

        if (useDollarConversion) {
          const vaultPriceInfoUsd: HistoryData | null = selectAssetHistoricalPriceUsdByTimestamp(underlyingId, timestamp) || prevVaultPriceInfoUsd[assetId]
          // console.log('vaultPriceInfoUsd', assetId, underlyingId, timestamp, prevVaultPriceInfoUsd[assetId], vaultPriceInfoUsd, assetsBalances[assetId]);
          if (vaultPriceInfoUsd) {
            assetsBalances[assetId] = parseFloat(BNify(assetsBalances[assetId]).times(BNify(vaultPriceInfoUsd.value)).toFixed(8))
            prevVaultPriceInfoUsd[assetId] = vaultPriceInfoUsd
          }
        }
      })

      // Calculate total balance
      assetsBalances.total = Object.values(assetsBalances).reduce( (total: number, value: number) => (total+value), 0 )
    })

    // console.log('historicalPrices', historicalPrices)
    // console.log('assetsBalancesByDateExtended', assetsBalancesByDateExtended)

    // Generate total array
    chartData.total = Object.keys(assetsBalancesByDateExtended).reduce( (total: HistoryData[], timestamp: any ) => {
      if (timestamp<timeframeStartTimestamp) return total
      total.push({
        date: parseInt(timestamp),
        value: assetsBalancesByDateExtended[timestamp].total
      })
      return total
    }, [])

    // Generate rainbow array
    chartData.rainbow = Object.keys(assetsBalancesByDateExtended).reduce( (rainbow: RainbowData[], timestamp: any ) => {
      if (timestamp<timeframeStartTimestamp) return rainbow
      rainbow.push({
        date: parseInt(timestamp),
        total: assetsBalancesByDateExtended[timestamp].total,
        ...assetsBalancesByDateExtended[timestamp]
      })
      return rainbow
    }, [])
    
    return chartData
  // eslint-disable-next-line
  }, [assets, useDollarConversion, timeframeStartTimestamp, selectVaultTransactions, isPortfolioAccountReady, historicalPrices, historicalPricesUsd, selectAssetHistoricalPriceByTimestamp, selectAssetHistoricalPriceUsdByTimestamp])


  useEffect(() => {
    // console.log('balanceChartData', balanceChartData)
    if (!balanceChartData.rainbow.length) return
    setBalanceChartDataLoading(false)

    return () => {
      setBalanceChartDataLoading(true)
    }
  }, [balanceChartData])

  return {
    assets,
    balanceChartData,
    balanceChartDataLoading
  }
}