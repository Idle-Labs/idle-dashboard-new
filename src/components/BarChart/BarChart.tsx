import { Group } from '@visx/group'
import { ScaleSVG } from '@visx/responsive'
import { ParentSize } from '@visx/responsive'
import { BarStackHorizontal } from '@visx/shape'
import { Amount } from 'components/Amount/Amount'
import { useTheme, Text } from '@chakra-ui/react'
import { SeriesPoint } from '@visx/shape/lib/types'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale'
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip'
import { defaultStyles as defaultTooltipStyles, withTooltip, TooltipWithBounds } from '@visx/tooltip'

export type BarChartKey = string
export type BarChartData = Record<BarChartKey, number>
export type BarChartColors = Record<BarChartKey, string>
export type BarChartLabels = Record<BarChartKey, string | null>

type TooltipData = {
  bar: SeriesPoint<BarChartData>
  key: BarChartKey
  index: number
  height: number
  width: number
  x: number
  y: number
  color: string
}

type BarChartInitialData = {
  tooltip?: boolean
  data: BarChartData
  colors: BarChartColors
  labels: BarChartLabels
}

export type BarStackHorizontalProps = {
  width: number
  height: number
  events?: boolean
  margin?: { top: number; right: number; bottom: number; left: number }
} & BarChartInitialData

const defaultMargin = { top: 0, left: 0, right: 0, bottom: 0 }

let tooltipTimeout: number

export const BarChartWithTooltip = withTooltip<BarStackHorizontalProps, TooltipData>(
  ({
    data,
    colors,
    labels,
    width,
    height,
    events = false,
    tooltip = true,
    margin = defaultMargin,
    tooltipOpen,
    // tooltipLeft = 0,
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

    const keys = Object.keys(data) as BarChartKey[]
    const keysColors = keys.map( key => colors[key] )

    const dataTotals = [data].reduce( (allTotals, currentDate) => {
      const total = keys.reduce( (dailyTotal, k) => {
        dailyTotal += Number(currentDate[k])
        return dailyTotal
      }, 0)
      allTotals.push(total)
      return allTotals
    }, [] as number[])

    // accessors
    const getDate = (/*d: BarChartData*/) => ''

    // scales
    const allocationScale = scaleLinear<number>({
      domain: [0, Math.max(...dataTotals)],
      nice: true,
    })
    const dateScale = scaleBand<string>({
      domain: [data].map(getDate),
      padding: 0,
    })
    const colorScale = scaleOrdinal<BarChartKey, string>({
      domain: keys,
      range: keysColors,
    })

    const tooltipStyles = {
      ...defaultTooltipStyles,
      background: tooltipBg,
      padding: '0.5rem',
      borderRadius: '8px',
      border: `1px solid ${tooltipBorder}`,
      color: tooltipColor,
    }

    allocationScale.rangeRound([0, xMax])
    dateScale.rangeRound([yMax, 0])

    return (
      <div style={{ position: 'relative' }}>
        <ScaleSVG width={width} height={height}>
          <Group top={margin.top} left={margin.left}>
            <BarStackHorizontal<BarChartData, BarChartKey>
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
                        hideTooltip();
                        // tooltipTimeout = window.setTimeout(() => {
                        // }, 100);
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
        {tooltip && tooltipOpen && tooltipData && (
          <TooltipWithBounds
            key={Math.random()}
            top={tooltipTop}
            left={tooltipData.x}
            style={tooltipStyles}
          >
            {
              labels[tooltipData.key] && (
                <Text mb={2} color={colorScale(tooltipData.key)}>{labels[tooltipData.key]}</Text>
              )
            }
            {
              tooltipData.bar.data[tooltipData.key] && (
                <Amount.Percentage value={tooltipData.bar.data[tooltipData.key] as number} textStyle={'tableCell'}></Amount.Percentage>
              )
            }
          </TooltipWithBounds>
        )}
      </div>
    )
  }
)

export const BarChart = ({
  data,
  colors,
  labels,
  tooltip
}: BarChartInitialData) => {
  return (
    <ParentSize debounceTime={10}>
      { parent => (
        <BarChartWithTooltip
          width={parent.width}
          height={parent.height}
          data={data}
          tooltip={tooltip}
          colors={colors}
          labels={labels}
        ></BarChartWithTooltip>
      )}
    </ParentSize>
  )
}