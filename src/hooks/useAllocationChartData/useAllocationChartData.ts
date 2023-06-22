import { useMemo } from 'react'
import { BNify, cmpAddrs } from 'helpers/'
import { protocols } from 'constants/protocols'
import type { IdleTokenProtocol } from 'constants/vaults'
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

  const { selectors: { selectAssetsByIds, selectVaultById } } = usePortfolioProvider()

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    return selectAssetsByIds(assetIds)
  }, [assetIds, selectAssetsByIds])

  const allocations = useMemo(() => {
    return assets.reduce( (allocations: Balances, asset: Asset) => {
      const vault = selectVaultById(asset.id)
      const assetAllocations = asset.allocations
      if (!assetAllocations || !vault || !("tokenConfig" in vault)) return allocations
      Object.keys(assetAllocations).forEach( (protocolAddress: string) => {
        const foundProtocol = vault.tokenConfig.protocols.find( (pInfo: IdleTokenProtocol) => cmpAddrs(pInfo.address, protocolAddress) )
        if (foundProtocol){
          if (!allocations[foundProtocol.name]){
            allocations[foundProtocol.name] = BNify(0)
          }
          allocations[foundProtocol.name] = allocations[foundProtocol.name].plus(assetAllocations[protocolAddress])
        }
      })
      return allocations
    }, {})
  }, [assets, selectVaultById])

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