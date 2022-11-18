import { abbreviateNumber } from 'helpers/'
import type { AssetId } from 'constants/types'
import { useTheme, Box } from '@chakra-ui/react'
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
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  const {
    compositions,
    colors,
  }: UseCompositionChartDataReturn = useCompositionChartData({ assetIds, strategies: enabledStrategies })

  const getSliceData = (selectedSlice: DonutChartData) => {
    if (!selectedSlice) return null
    switch (type){
      case 'assets':
        const formatFn = (n: any) => `$${abbreviateNumber(n)}`
        const asset = selectedSlice.extraData?.asset
        if (!asset) return null
        return (
          <>
            <image
              y={'36%'}
              x={'46.5%'}
              href={asset.icon}
              height={"34"}
              width={"34"}
              textAnchor={"middle"}
            />
            <text
              x={'50%'}
              y={'54%'}
              fill={"white"}
              fontSize={26}
              fontWeight={600}
              textAnchor={"middle"}
              pointerEvents={"none"}
            >
              {formatFn(selectedSlice.value)}
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
              {asset.name}
            </text>
          </>
        )
      break;
      default:
      break;
    }
  }

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