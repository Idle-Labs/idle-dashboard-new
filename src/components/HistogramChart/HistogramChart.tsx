import { extent } from 'd3-array'
import { toDayjs } from 'helpers/'
import { Group } from '@visx/group'
import { BarStack } from '@visx/shape'
import { AxisBottom } from '@visx/axis'
import { localPoint } from '@visx/event'
import { ScaleSVG } from '@visx/responsive'
import { ParentSize } from '@visx/responsive'
import { Amount } from 'components/Amount/Amount'
import type { RainbowData } from 'constants/types'
import { SeriesPoint } from '@visx/shape/lib/types'
import { useI18nProvider } from 'contexts/I18nProvider'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { useTheme, Text, HStack, VStack } from '@chakra-ui/react'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { defaultStyles, withTooltip, TooltipWithBounds } from '@visx/tooltip'
import { scaleBand, scaleLinear, scaleOrdinal, scaleTime } from '@visx/scale'
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip'

export type HistogramChartKey = string
export type HistogramChartColors = Record<HistogramChartKey, string>
export type HistogramChartLabels = Record<HistogramChartKey, string | null>

export type HistogramChartData = RainbowData[]

type TooltipData = {
  bar: SeriesPoint<RainbowData>
  key: HistogramChartKey
  index: number
  height: number
  width: number
  x: number
  y: number
  color: string
}

type HistogramChartInitialData = {
  tooltip?: boolean
  data: HistogramChartData
  colors: HistogramChartColors
  labels: HistogramChartLabels
}

export type HistogramChartWithTooltipProps = {
  width: number
  height: number
  events?: boolean
  margin?: { top: number; right: number; bottom: number; left: number }
} & HistogramChartInitialData

const defaultMargin = { top: 20, left: 0, right: 0, bottom: 35 }

let tooltipTimeout: number

const HistogramChartWithTooltip = withTooltip<HistogramChartWithTooltipProps, TooltipData>(
  ({
    data,
    colors,
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
  }: HistogramChartWithTooltipProps & WithTooltipProvidedProps<TooltipData>) => {
    const theme = useTheme()
    const { locale } = useI18nProvider()
    
    const getDate = (d: any) => d.date// toDayjs(d.date).toDate()
    const formatDate = (d: any) => toDayjs(getDate(d)).locale(locale).format('LLL')

    const strokeColor = 'white'
    const axisLabelColor = theme.colors.table.axisLabel

    const AXIS_BOTTOM_TICK_LABEL_PROPS = {
      textAnchor: 'middle' as const,
      fontSize: 12,
      fontWeight: 'bold',
      fill: axisLabelColor,
    }

    // const AXIS_LEFT_TICK_LABEL_PROPS = {
    //   dx: '-0.25em',
    //   dy: '0.25em',
    //   fontSize: 12,
    //   textAnchor: 'end' as const,
    //   fill: axisLabelColor,
    // }

    // bounds
    const yMax = height - margin.top - margin.bottom - 10
    const xMax = width - margin.left - margin.right

    const keys = Object.keys(colors)
    const keysColors = keys.map( key => colors[key] )

    const dataTotals = data.map( d => d.total )

    // console.log('data', keys, colors, data, xMax)

    // scales
    const dateScale = scaleBand<string>({
      padding: 0.2,
      range: [0, xMax],
      domain: data.map(getDate),
    });
      
    // scales
    const timeScale = scaleTime({
      range: [0, xMax],
      // domain: data.map(getDate),
      domain: extent(data, (d: any) => toDayjs(d.date).toDate() ) as [Date, Date],
    })

    const maxValue = Math.max(...dataTotals.map( t => Math.abs(t) ))
    const minValue = -maxValue

    const dataScale = scaleLinear<number>({
      nice: false,
      range: [yMax, 0],
      domain: [minValue, maxValue]
    });

    const colorScale = scaleOrdinal<HistogramChartKey, string>({
      domain: keys,
      range: keysColors,
    });

    const tooltipBg = useColorModeValue('white', theme.colors.card.bg)
    const tooltipBorder = useColorModeValue(theme.colors.gray[200], theme.colors.gray[700])
    const tooltipColor = useColorModeValue(theme.colors.gray[800], 'white')

    return (
      <div style={{ position: 'relative' }}>
        <ScaleSVG width={width} height={height}>
          {/*<rect x={0} y={0} width={width} height={height} fill={background} rx={14} />*/}
          {/*<Grid
            top={margin.top}
            left={margin.left}
            xScale={dateScale}
            yScale={dataScale}
            width={xMax}
            height={yMax}
            stroke="black"
            strokeOpacity={0.1}
            xOffset={dateScale.bandwidth() / 2}
          />*/}
          <Group top={margin.top}>
            <BarStack<RainbowData, HistogramChartKey>
              data={data}
              keys={keys}
              x={getDate}
              color={colorScale}
              xScale={dateScale}
              yScale={dataScale}
              offset={'diverging'}
            >
              {(barStacks) =>
                barStacks.map((barStack) =>
                  barStack.bars.map((bar) => (
                    <rect
                      key={`bar-stack-${barStack.index}-${bar.index}`}
                      x={bar.x}
                      y={bar.y}
                      height={bar.height}
                      width={bar.width}
                      fill={bar.color}
                      onClick={() => {
                        if (events) alert(`clicked: ${JSON.stringify(bar)}`);
                      }}
                      onMouseLeave={() => {
                        tooltipTimeout = window.setTimeout(() => {
                          hideTooltip();
                        }, 300);
                      }}
                      onMouseMove={(event) => {
                        if (tooltipTimeout) clearTimeout(tooltipTimeout);
                        // TooltipInPortal expects coordinates to be relative to containerRef
                        // localPoint returns coordinates relative to the nearest SVG, which
                        // is what containerRef is set to in this example.
                        const eventSvgCoords = localPoint(event);
                        const left = bar.x + bar.width / 2;
                        showTooltip({
                          tooltipData: bar,
                          tooltipTop: eventSvgCoords?.y,
                          tooltipLeft: left,
                        });
                      }}
                    />
                  )),
                )
              }
            </BarStack>
          </Group>
          {/*<AxisBottom
            top={height - margin.top}
            scale={dateScale}
            tickFormat={formatDate}
            stroke={purple3}
            tickStroke={purple3}
            tickLabelProps={() => ({
              fill: purple3,
              fontSize: 11,
              textAnchor: 'middle',
            })}
          />*/}
          <AxisBottom
            strokeWidth={1}
            hideTicks={true}
            top={yMax/2 + margin.top}
            scale={dateScale}
            stroke={strokeColor}
            tickFormat={() => ''}
          />
          <AxisBottom
            hideTicks
            hideAxisLine
            numTicks={5}
            scale={timeScale}
            top={height - margin.bottom}
            // tickFormat={formatDate}
            tickLabelProps={() => AXIS_BOTTOM_TICK_LABEL_PROPS}
          />
        </ScaleSVG>
        {tooltip && tooltipOpen && tooltipData && (
          <TooltipWithBounds
            key={Math.random()}
            top={tooltipTop}
            left={tooltipData.x}
            style={{
              ...defaultStyles,
              border:'none',
              backgroundColor:'transparent',
              paddingTop: 0,
              paddingLeft: 0,
              paddingBottom: 0,
              paddingRight: 0
            }}
          >
            <VStack
              p={2}
              spacing={3}
              width={'full'}
              alignItems={'flex-start'}
              borderRadius={'lg'}
              borderColor={tooltipBorder}
              borderWidth={1}
              color={tooltipColor}
              bgColor={tooltipBg}
            >
              <VStack
                spacing={4}
                width={'full'}
                alignItems={'flex-start'}
              >
                {
                  Object.keys(tooltipData.bar.data).filter( k => !['date','total'].includes(k) ).map( (assetId: string) => (
                    <VStack
                      spacing={2}
                      key={assetId}
                      width={'full'}
                      alignItems={'flex-start'}
                    >
                      <AssetProvider assetId={assetId}>
                        <HStack
                          spacing={1}
                        >
                          <AssetProvider.Icon size={'2xs'} />
                          <AssetProvider.Name fontWeight={'bold'} />
                          <AssetProvider.Strategy color={'gray.500'} fontWeight={'bold'} prefix={'('} suffix={')'} />
                        </HStack>
                      </AssetProvider>
                      <Amount.Usd abbreviate={false} decimals={0} fontWeight={'bold'} fontSize={'md'} value={tooltipData.bar.data[assetId]} color={colorScale(assetId)} />
                    </VStack>
                  ))
                }
              </VStack>
              <Text fontSize={'xs'} color={theme.colors.gray[500]}>
                {formatDate(tooltipData.bar.data)}
              </Text>
            </VStack>
            {
              /*
              <ul style={{ padding: '0', margin: '0', listStyle: 'none' }}>
                <li>
                  <Translation translation={`common.${tooltipData.key.toLowerCase()}`} fontWeight={'bold'} color={colorScale(tooltipData.key)} />
                </li>
                <li>
                  <Amount.Usd abbreviate={false} fontWeight='bold' fontSize='lg' my={2} value={tooltipData.bar.data[tooltipData.key]} />
                </li>
                <li style={{ paddingBottom: '0.25rem', fontSize: '12px', color: theme.colors.gray[300] }}>
                  {formatDate(tooltipData.bar.data)}
                </li>
              </ul>
              */
            }
          </TooltipWithBounds>
        )}
      </div>
    )
  }
)

export const HistogramChart = ({
  data,
  colors,
  labels,
  tooltip
}: HistogramChartInitialData) => {
  return (
    <ParentSize debounceTime={10}>
      { parent => (
        <HistogramChartWithTooltip
          width={parent.width}
          height={parent.height}
          data={data}
          tooltip={tooltip}
          colors={colors}
          labels={labels}
        />
      )}
    </ParentSize>
  )
}