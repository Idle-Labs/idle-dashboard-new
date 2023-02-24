import { useMemo } from 'react'
import { BNify } from 'helpers/'
import { protocols } from 'constants/protocols'
import type { Asset, AssetId, Balances } from 'constants/types'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import type { BarChartKey, BarChartData, BarChartColors, BarChartLabels } from 'components/BarChart/BarChart'

type UseAllocationChartDataArgs = {
  assetIds: AssetId[]
}

type ExtraData = {
  labels: BarChartLabels
  colors: BarChartColors
}

type UseAllocationChartDataReturn = {
  allocations: BarChartData
} & ExtraData

type UseAllocationChartData = (args: UseAllocationChartDataArgs) => UseAllocationChartDataReturn

export const useAllocationChartData: UseAllocationChartData = ({ assetIds }) => {

  const { selectors: { selectAssetsByIds } } = usePortfolioProvider()

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    return selectAssetsByIds(assetIds)
  }, [assetIds, selectAssetsByIds])

  const allocations = useMemo(() => {
    return assets.reduce( (allocations: Balances, asset: Asset) => {
      const assetAllocations = asset.allocations
      if (!assetAllocations) return allocations
      Object.keys(assetAllocations).forEach( (protocol: string) => {
        if (!allocations[protocol]){
          allocations[protocol] = BNify(0)
        }
        allocations[protocol] = allocations[protocol].plus(assetAllocations[protocol])
      })
      return allocations
    }, {})
  }, [assets])

  const extraData = useMemo((): ExtraData => {
    if (!allocations || !Object.keys(allocations).length) return {
      labels: {},
      colors: {}
    }
    return Object.keys(allocations).reduce( (extraData: ExtraData, protocoKey: BarChartKey) => {
      return {
        ...extraData,
        labels: {
          ...extraData.labels,
          [protocoKey]: protocols[protocoKey].label
        },
        colors: {
          ...extraData.colors,
          [protocoKey]: `rgb(${protocols[protocoKey]?.colors?.rgb.join(',')})`
        }
      }
    }, {
      labels: {},
      colors: {}
    })
  }, [allocations])

  return {
    labels: extraData.labels,
    colors: extraData.colors,
    allocations
  }
}