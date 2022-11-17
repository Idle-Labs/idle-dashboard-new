import { useMemo } from 'react'
import { BNify } from 'helpers/'
import { useTranslate } from 'react-polyglot'
import type { Asset, AssetId, Balances } from 'constants/types'
import { strategies, StrategyProps } from 'constants/strategies'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import type { DonutChartKey, DonutChartData, DonutChartColors } from 'components/DonutChart/DonutChart'

type UseCompositionChartDataArgs = {
  assetIds: AssetId[]
  strategies?: string[]
}

type Colors = {
  [key: string]: DonutChartColors
}

type ExtraData = {
  colors: Colors
}

export type Compositions = {
  [key: string]: DonutChartData[]
}

export type UseCompositionChartDataReturn = {
  compositions: Compositions
} & ExtraData

type UseCompositionChartData = (args: UseCompositionChartDataArgs) => UseCompositionChartDataReturn

export const useCompositionChartData: UseCompositionChartData = ({ assetIds, strategies: enabledStrategies }) => {
  const translate = useTranslate()
  const { selectors: { selectAssetById, selectAssetsByIds } } = usePortfolioProvider()

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return []
    return selectAssetsByIds(assetIds)
  }, [assetIds, selectAssetsByIds])

  const strategiesBalance = useMemo(() => {
    const filteredAssets = assets.filter( (asset: Asset) => asset.type && (!enabledStrategies || enabledStrategies.includes(asset.type)) )
    return filteredAssets.reduce( (strategiesBalances: Balances, asset: Asset) => {
      if (!asset.type || !asset.vaultPosition) return strategiesBalances
      if (!strategiesBalances[asset.type]) {
        strategiesBalances[asset.type] = BNify(0)
      }
      strategiesBalances[asset.type] = strategiesBalances[asset.type].plus(asset.vaultPosition.usd.redeemable)
      return strategiesBalances
    }, {})
  }, [assets, enabledStrategies])

  const assetsBalances = useMemo(() => {
    const filteredAssets = assets.filter( (asset: Asset) => asset.type && (!enabledStrategies || enabledStrategies.includes(asset.type)) )
    return filteredAssets.reduce( (assetsBalances: Balances, asset: Asset) => {
      if (!asset.underlyingId || !asset.vaultPosition) return assetsBalances

      const underlyingAsset = selectAssetById(asset.underlyingId)
      if (!underlyingAsset) return assetsBalances

      if (!assetsBalances[underlyingAsset.id]) {
        assetsBalances[underlyingAsset.id] = BNify(0)
      }
      assetsBalances[underlyingAsset.id] = assetsBalances[underlyingAsset.id].plus(asset.vaultPosition.usd.redeemable)
      return assetsBalances
    }, {})
  }, [assets, enabledStrategies, selectAssetById])

  const compositions: Compositions = {
    assets: [],
    strategies: []
  }

  compositions.strategies = useMemo((): DonutChartData[] => {
    return Object.keys(strategiesBalance).map( (strategy: string) => {
      const label = translate(strategies[strategy].label)
      return {
        label,
        value: parseFloat(strategiesBalance[strategy])
      }
    })
  }, [strategiesBalance, translate])

  compositions.assets = useMemo((): DonutChartData[] => {
    return Object.keys(assetsBalances).reduce( (compositionAssets: DonutChartData[], assetId: string) => {
      const asset = selectAssetById(assetId)
      if (!asset) return compositionAssets
      return [
        ...compositionAssets,
        {
          label: asset.name,
          extraData: {
            asset
          },
          value: parseFloat(assetsBalances[assetId])
        }
      ]
    }, [])
  }, [assetsBalances, selectAssetById])

  const colors: Colors = {
    assets: {},
    strategies: {}
  }

  colors.strategies = useMemo((): DonutChartColors => {
    return Object.values(strategies).reduce( (colors: DonutChartColors, strategy: StrategyProps) => {
      const label = translate(strategy.label)
      return {
        ...colors,
        [label]: strategy.color
      }
    }, {})
  }, [translate])

  colors.assets = useMemo((): DonutChartColors => {
    return Object.keys(assetsBalances).reduce( (colors: DonutChartColors, assetId: string) => {
      const asset = selectAssetById(assetId)
      if (!asset) return colors
      const label = asset.name
      return {
        ...colors,
        [label]: asset.color
      }
    }, {})
  }, [assetsBalances, selectAssetById])

  return {
    colors,
    compositions
  }
}