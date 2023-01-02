import { useCallback } from 'react'
import { abbreviateNumber } from 'helpers/'
import { useTranslate } from 'react-polyglot'
import type { AssetId } from 'constants/types'
import { useTheme, Box } from '@chakra-ui/react'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { DonutChart } from 'components/DonutChart/DonutChart'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import type { DonutChartData } from 'components/DonutChart/DonutChart'
import { useCompositionChartData, Compositions, UseCompositionChartDataReturn } from 'hooks/useCompositionChartData/useCompositionChartData'

type CompositionChartArgs = {
  type: keyof Compositions
  assetIds: AssetId[],
  strategies?: string[]
}

export const CompositionChart: React.FC<CompositionChartArgs> = ({ assetIds, strategies: enabledStrategies, type }) => {
  const theme = useTheme()
  const translate = useTranslate()
  const { isMobile } = useThemeProvider()
  const { protocolToken } = usePortfolioProvider()

  const {
    compositions,
    colors,
  }: UseCompositionChartDataReturn = useCompositionChartData({ assetIds, strategies: enabledStrategies })

  const getSliceData = useCallback((selectedSlice: DonutChartData) => {
    switch (type){
      case 'assets':
        const totalFunds = compositions[type].reduce( (total: number, asset: DonutChartData) => total += asset.value, 0)
        const formatFn = (n: any) => `$${abbreviateNumber(n)}`
        const asset = selectedSlice?.extraData?.asset
        const icon = asset?.icon || protocolToken?.icon
        const label = asset?.name || translate('dashboard.portfolio.totalChart')
        const value = selectedSlice ? formatFn(selectedSlice.value) : formatFn(totalFunds)

        if (selectedSlice && !asset) return null

        return (
          <>
            {
              icon && (
                <image
                  y={'35%'}
                  href={icon}
                  height={"34"}
                  width={"34"}
                  textAnchor={"middle"}
                  x={isMobile ? '44.5%' : '46.5%'}
                />
              )
            }
            <text
              x={'50%'}
              y={'54%'}
              fill={"white"}
              fontSize={26}
              fontWeight={600}
              textAnchor={"middle"}
              pointerEvents={"none"}
            >
              {value}
            </text>
            <text
              x={'50%'}
              y={'61%'}
              fontSize={14}
              fontWeight={400}
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
  }, [protocolToken, compositions, theme, translate, type, isMobile])

  // console.log('compositions', compositions)

  return (
    <Box
      height={350}
      width={'100%'}
    >
      {
        compositions && compositions[type] && compositions[type].length ? (
          <DonutChart
            colors={colors[type]}
            data={compositions[type]}
            getSliceData={getSliceData}
          />
        ) : (
          <DonutChart
            colors={{
              placeholder1:'#4c515d',
              placeholder2:'#2a3243',
              placeholder3:'#727680'
            }}
            data={[
              {
                value:40,
                label:'placeholder1'
              },
              {
                value:60,
                label:'placeholder2'
              },
              {
                value:30,
                label:'placeholder3'
              }
            ]}
          />
        )
      }
    </Box>
  )
}