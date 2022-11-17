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

type ExtraData = {
  colors: DonutChartColors
}

type UseCompositionChartDataReturn = {
  composition: DonutChartData[]
} & ExtraData

type UseCompositionChartData = (args: UseCompositionChartDataArgs) => UseCompositionChartDataReturn

export const useCompositionChartData: UseCompositionChartData = ({ assetIds, strategies: enabledStrategies }) => {
  const translate = useTranslate()
  const { selectors: { selectAssetsByIds } } = usePortfolioProvider()

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

  const composition = useMemo((): DonutChartData[] => {
    return Object.keys(strategiesBalance).map( (strategy: string) => {
      const label = translate(strategies[strategy].label)
      return {
        label,
        value: parseFloat(strategiesBalance[strategy])
      }
    })
  }, [strategiesBalance, translate])

  const colors = useMemo((): DonutChartColors => {
    return Object.values(strategies).reduce( (colors: DonutChartColors, strategy: StrategyProps) => {
      const label = translate(strategy.label)
      return {
        ...colors,
        [label]: strategy.color
      }
    }, {})
  }, [translate])

  return {
    colors,
    composition
  }
}