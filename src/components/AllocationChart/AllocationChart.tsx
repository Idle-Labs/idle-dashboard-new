import { Group } from '@visx/group'
import { ScaleSVG } from '@visx/responsive'
import { ParentSize } from '@visx/responsive'
import { protocols } from 'constants/protocols'
import { BarStackHorizontal } from '@visx/shape'
import { Amount } from 'components/Amount/Amount'
import { SeriesPoint } from '@visx/shape/lib/types'
import type { Number, AssetId } from 'constants/types'
import { useTheme, Text, Box } from '@chakra-ui/react'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale'
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip'
import { defaultStyles as defaultTooltipStyles, withTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip'
import { useAllocationChartData, ProtocolAllocation, ProtocolName } from 'hooks/useAllocationChartData/useAllocationChartData'

type TooltipData = {
  bar: SeriesPoint<ProtocolAllocation>
  key: ProtocolName
  index: number
  height: number
  width: number
  x: number
  y: number
  color: string
}

export type BarStackHorizontalProps = {
  data: ProtocolAllocation,
  width: number
  height: number
  events?: boolean
  margin?: { top: number; right: number; bottom: number; left: number }
}

const defaultMargin = { top: 0, left: 0, right: 0, bottom: 0 }

let tooltipTimeout: number

type BarChartArgs = {
  data: ProtocolAllocation
}

const BarChart = withTooltip<BarStackHorizontalProps, TooltipData>(
  ({
    data,
    width,
    height,
    events = false,
    margin = defaultMargin,
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    hideTooltip,
    showTooltip,
  }: BarStackHorizontalProps & WithTooltipProvidedProps<TooltipData>) => {
    const theme = useTheme()

    // bounds
    const xMax = width - margin.left - margin.right
    const yMax = height - margin.top - margin.bottom

    const tooltipBg = useColorModeValue('white', theme.colors.card.bg)
    const tooltipBorder = useColorModeValue(theme.colors.gray[200], theme.colors.gray[700])
    const tooltipColor = useColorModeValue(theme.colors.gray[800], 'white')

    const keys = Object.keys(data) as ProtocolName[]
    const protocolColors = keys.map( protocol => `rgb(${protocols[protocol]?.colors?.rgb.join(',')})` )

    const allocationTotals = [data].reduce( (allTotals, currentDate) => {
      const totalTemperature = keys.reduce( (dailyTotal, k) => {
        dailyTotal += Number(currentDate[k])
        return dailyTotal
      }, 0)
      allTotals.push(totalTemperature)
      return allTotals
    }, [] as number[])

    // console.log('allocationTotals', data, keys, allocationTotals)

    // accessors
    const getDate = (d: ProtocolAllocation) => ''

    // scales
    const allocationScale = scaleLinear<number>({
      domain: [0, Math.max(...allocationTotals)],
      nice: true,
    })
    const dateScale = scaleBand<string>({
      domain: [data].map(getDate),
      padding: 0,
    })
    const colorScale = scaleOrdinal<ProtocolName, string>({
      domain: keys,
      range: protocolColors,
    })

    const tooltipStyles = {
      ...defaultTooltipStyles,
      background: tooltipBg,
      padding: '0.5rem',
      borderRadius: '8px',
      border: `1px solid ${tooltipBorder}`,
      color: tooltipColor,
    }
    // console.log('tooltipData', tooltipData)

    allocationScale.rangeRound([0, xMax])
    dateScale.rangeRound([yMax, 0])

    return width < 10 ? null : (
      <Box>
        <Box
          borderRadius={8}
          overflow={'hidden'}
          position={'relative'}
          height={`${height}px`}
        >
          <ScaleSVG width={width} height={`${height}px`}>
            <Group top={margin.top} left={margin.left}>
              <BarStackHorizontal<ProtocolAllocation, ProtocolName>
                y={getDate}
                data={[data]}
                keys={keys}
                height={yMax}
                xScale={allocationScale}
                yScale={dateScale}
                color={colorScale}
              >
                {(barStacks) =>
                  barStacks.map((barStack) =>
                    barStack.bars.map((bar) => (
                      <rect
                        x={bar.x}
                        y={bar.y}
                        fill={bar.color}
                        width={bar.width}
                        height={bar.height}
                        key={`barstack-horizontal-${barStack.index}-${bar.index}`}
                        onClick={() => {
                          if (events) alert(`clicked: ${JSON.stringify(bar)}`);
                        }}
                        onMouseLeave={() => {
                          tooltipTimeout = window.setTimeout(() => {
                            hideTooltip();
                          }, 200);
                        }}
                        onMouseMove={() => {
                          if (tooltipTimeout) clearTimeout(tooltipTimeout);
                          const top = bar.y + margin.top;
                          const left = bar.x + bar.width + margin.left;
                          showTooltip({
                            tooltipData: bar,
                            tooltipTop: top,
                            tooltipLeft: left,
                          });
                        }}
                      />
                    )),
                  )
                }
              </BarStackHorizontal>
            </Group>
          </ScaleSVG>
        </Box>
        {tooltipOpen && tooltipData && (
          <TooltipWithBounds
            key={Math.random()}
            top={tooltipTop}
            left={tooltipLeft}
            style={tooltipStyles}
          >
            <Text mb={2} color={colorScale(tooltipData.key)}>{protocols[tooltipData.key].label}</Text>
            {
              tooltipData.bar.data[tooltipData.key] && (
                <Amount.Percentage value={tooltipData.bar.data[tooltipData.key] as Number} textStyle={'tableCell'}></Amount.Percentage>
              )
            }
          </TooltipWithBounds>
        )}
      </Box>
    );
  },
);

type AllocationChartArgs = {
  assetId: AssetId | undefined
}

export const AllocationChart: React.FC<AllocationChartArgs> = ({ assetId }) => {

  const { allocations } = useAllocationChartData({assetId})

  return allocations ? (
    <ParentSize debounceTime={10}>
      { parent => (
        <BarChart {...parent} data={allocations}></BarChart>
      )}
    </ParentSize>
  ) : null
}