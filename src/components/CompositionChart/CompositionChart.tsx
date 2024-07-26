import { useCallback } from 'react'
import { abbreviateNumber, numberToPercentage } from 'helpers/'
import { useTranslate } from 'react-polyglot'
import type { AssetId } from 'constants/types'
import { useTheme, Box } from '@chakra-ui/react'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { DonutChart } from 'components/DonutChart/DonutChart'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import type { DonutChartColors, DonutChartData } from 'components/DonutChart/DonutChart'
import { useCompositionChartData, Compositions, UseCompositionChartDataReturn } from 'hooks/useCompositionChartData/useCompositionChartData'

type CompositionChartArgs = {
  type: keyof Compositions
  assetIds: AssetId[],
  strategies?: string[]
  height?: number,
  donutThickness?: number
  colors?: DonutChartColors
  selectedSlice?: DonutChartData
}

export const CompositionChart: React.FC<CompositionChartArgs> = ({
  assetIds,
  strategies: enabledStrategies,
  type,
  colors: colorsOverride,
  height = 350,
  donutThickness,
  selectedSlice
}) => {
  const theme = useTheme()
  const translate = useTranslate()
  const { isMobile } = useThemeProvider()
  const { protocolToken } = usePortfolioProvider()

  const {
    colors: activeColors,
    compositions
  }: UseCompositionChartDataReturn = useCompositionChartData({ assetIds, strategies: enabledStrategies })

  const colors = JSON.parse(JSON.stringify(activeColors))

  if (colorsOverride){
    Object.entries(colorsOverride).forEach( ([asset, color]) => {
      colors[type][asset] = color
    })
  }

  const getSliceData = useCallback((selectedSlice: DonutChartData) => {
    switch (type){
      case 'assets':
        const totalAssets = compositions[type].length
        const totalFunds = compositions[type].reduce( (total: number, asset: DonutChartData) => total += asset.value, 0)
        const formatFn = (n: any) => `$${abbreviateNumber(n)}`
        const asset = selectedSlice?.extraData?.asset
        const icon = asset?.icon || protocolToken?.icon
        const label = asset?.name || translate('navBar.assets')
        const value = selectedSlice ? numberToPercentage(selectedSlice.extraData.allocation.times(100), 1) : totalAssets

        if (selectedSlice && !asset) return null

        return (
          <>
            <text
              x={'50%'}
              y={'52%'}
              fill={"white"}
              fontSize={32}
              fontWeight={600}
              textAnchor={"middle"}
              pointerEvents={"none"}
            >
              {value}
            </text>
            <text
              x={'50%'}
              y={'67%'}
              fontSize={16}
              fontWeight={500}
              textAnchor={"middle"}
              pointerEvents={"none"}
              fill={theme.colors.cta}
            >
              {label}
            </text>
          </>
        )
      default:
      break;
    }
  }, [protocolToken, compositions, theme, translate, type])

  const getSliceDataEmpty = useCallback(() => {
    return (
      <>
        <text
          x={'50%'}
          y={'52%'}
          fill={"white"}
          fontSize={32}
          fontWeight={600}
          textAnchor={"middle"}
          pointerEvents={"none"}
        >
          0
        </text>
        <text
          x={'50%'}
          y={'67%'}
          fontSize={16}
          fontWeight={500}
          textAnchor={"middle"}
          pointerEvents={"none"}
          fill={theme.colors.cta}
        >
          Assets
        </text>
      </>
    )
  }, [theme])

  return (
    <Box
      height={height}
      width={'auto'}
    >
      {
        compositions && compositions[type] && compositions[type].length ? (
          <DonutChart
            colors={colors[type]}
            data={compositions[type]}
            getSliceData={getSliceData}
            donutThickness={donutThickness}
            selectedSlice={selectedSlice}
            activeColors={activeColors[type]}
          />
        ) : (
          <DonutChart
            selectedSlice={selectedSlice}
            donutThickness={donutThickness}
            getSliceData={getSliceDataEmpty}
            activeColors={activeColors[type]}
            colors={{
              placeholder1:'#555B67',
              // placeholder2:'#2a3243',
              // placeholder3:'#727680'
            }}
            data={[
              {
                value:100,
                label:'placeholder1'
              },
              /*
              {
                value:60,
                label:'placeholder2'
              },
              {
                value:30,
                label:'placeholder3'
              }
              */
            ]}
          />
        )
      }
    </Box>
  )
}