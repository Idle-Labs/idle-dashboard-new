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

  console.log('compositions', compositions)

  const getSliceData = (selectedSlice: DonutChartData) => {
    if (!selectedSlice) return null
    switch (type){
      case 'assets':
        const formatFn = (n: any) => `$${abbreviateNumber(n)}`
        const asset = selectedSlice.extraData.asset
        return (
          <>
            {/*<line x1={'50%'} y1={0} x2={'50%'} y2={'100%'} stroke={'white'} />
            <line y1={'50%'} x1={0} y2={'50%'} x2={'100%'} stroke={'white'} />*/}
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

  return compositions && compositions[type] ? (
    <Box
      height={350}
      width={'100%'}
    >
      <DonutChart
        colors={colors[type]}
        data={compositions[type]}
        getSliceData={getSliceData}
      />
    </Box>
  ) : null
}