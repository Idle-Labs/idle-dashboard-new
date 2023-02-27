// import dayjs from 'dayjs'
import { BNify, toDayjs } from 'helpers/'
import { useColorModeValue } from '@chakra-ui/color-mode'
import { useToken } from '@chakra-ui/system'
import { useTheme } from '@chakra-ui/react'
import { HistoryData } from 'constants/types'
import { localPoint } from '@visx/event'
import { Group } from '@visx/group'
import { ScaleSVG } from '@visx/responsive'
import { useI18nProvider } from 'contexts/I18nProvider'
import { scaleLinear, scaleTime } from '@visx/scale'
import { Bar, Line } from '@visx/shape'
import { defaultStyles as defaultTooltipStyles, TooltipWithBounds, useTooltip } from '@visx/tooltip'
import { bisector, extent, max, min } from 'd3-array'
import React, { useCallback, useMemo } from 'react'
import { Amount } from 'components/Amount/Amount'

import { AreaChart } from './AreaChart'
import { LineChart } from './LineChart'
import { MaxPrice } from './MaxPrice'
import { MinPrice } from './MinPrice'

export interface PrimaryChartProps {
  data: HistoryData[]
  width: number
  height: number
  formatFn: Function
  color?: string
  axisEnabled?: boolean
  maxMinEnabled?: boolean
  margins?: { top: number; right: number; bottom: number; left: number }
}

// accessors
const getDate = (d: HistoryData): Date => d && new Date(d.date)
const getValue = (d: HistoryData) => BNify(d?.value).toNumber() || 0
const bisectDate = bisector<HistoryData, Date>(d => new Date(d.date)).left

export const PrimaryChart = ({
  data,
  height,
  formatFn,
  width = 10,
  // axisEnabled = true,
  maxMinEnabled = true,
  color = 'chart.stroke',
  margins = { top: 0, right: 0, bottom: 0, left: 0 },
}: PrimaryChartProps) => {
  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
  } = useTooltip<HistoryData>()

  const theme = useTheme()
  const { locale } = useI18nProvider()

  const [chartColor] = useToken('colors', [color])
  const tooltipBg = useColorModeValue('white', theme.colors.card.bg)
  const tooltipBorder = useColorModeValue(theme.colors.gray[200], theme.colors.gray[700])
  const tooltipColor = useColorModeValue(theme.colors.gray[800], 'white')

  // bounds
  const xMax = useMemo(() => Math.max(width - margins.left - margins.right, 0), [width, margins])
  const yMax = useMemo(() => Math.max(height - margins.top - margins.bottom, 0), [height, margins])

  const minPrice = useMemo(() => Math.min(...data.map(getValue)), [data])
  const maxPrice = useMemo(() => Math.max(...data.map(getValue)), [data])
  // const minPriceIndex = useMemo(() => data.findIndex(x => getValue(x) === minPrice), [data, minPrice])
  // const maxPriceIndex = useMemo(() => data.findIndex(x => getValue(x) === maxPrice), [data, maxPrice])
  const minPriceIndex = useMemo(() => data.length-1, [data])
  const maxPriceIndex = useMemo(() => data.length-1, [data])
  const minPriceDate = useMemo(() => getDate(data[minPriceIndex]), [data, minPriceIndex])
  const maxPriceDate = useMemo(() => getDate(data[maxPriceIndex]), [data, maxPriceIndex])

  // scales
  const dateScale = useMemo(() => {
    return scaleTime({
      range: [0, xMax],
      domain: extent(data, getDate) as [Date, Date],
    })
  }, [xMax, data])

  const priceScale = useMemo(() => {
    return scaleLinear({
      range: [yMax + margins.top, margins.top],
      domain: [min(data, getValue) || 0, max(data, getValue) || 0],
      nice: true,
    })
    //
  }, [margins.top, yMax, data])

  const dateToLocale = useCallback( (tooltipData: HistoryData) => {
    // console.log('dateToLocale', tooltipData, locale, toDayjs(getDate(tooltipData)), )
    return toDayjs(getDate(tooltipData)).locale(locale).format('LLL')
  }, [locale])

  // tooltip handler
  const handleTooltip = useCallback(
    (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
      const { x } = localPoint(event) || { x: 0 }
      const currX = x - margins.left
      const x0 = dateScale.invert(currX)
      const index = bisectDate(data, x0, 1)
      const d0 = data[index - 1]
      const d1 = data[index]
      let d = d0

      // calculate the cursor position and convert where to position the tooltip box.
      if (d1 && getDate(d1)) {
        d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0
      }

      showTooltip({
        tooltipData: d,
        tooltipLeft: x,
        tooltipTop: priceScale(getValue(d)),
      })
    },
    [showTooltip, priceScale, dateScale, data, margins.left],
  )

  return (
    <div style={{ position: 'relative' }}>
      <ScaleSVG width={width} height={height}>
        <LineChart
          data={data}
          width={width}
          hideLeftAxis
          margin={{ ...margins }}
          yMax={yMax}
          xScale={dateScale}
          yScale={priceScale}
          stroke={chartColor}
          xTickFormat={(d) => formatFn(d)}
        />
        <AreaChart
          hideLeftAxis
          hideBottomAxis
          data={data}
          width={width}
          margin={{ ...margins }}
          yMax={yMax}
          xScale={dateScale}
          yScale={priceScale}
          gradientColor={chartColor}
        />
        {/* a transparent ele that track the pointer event, allow us to display tooltup */}
        <Bar
          x={margins.left}
          y={margins.top * 2}
          width={xMax}
          height={yMax}
          fill='transparent'
          rx={14}
          onTouchStart={handleTooltip}
          onTouchMove={handleTooltip}
          onMouseMove={handleTooltip}
          onMouseLeave={() => hideTooltip()}
        />
        {
          maxMinEnabled && (
            <Group top={margins.top} left={margins.left}>
              <MaxPrice
                yText={15}
                label={formatFn(maxPrice)}
                xDate={maxPriceDate}
                xScale={dateScale}
                width={width}
                yMax={yMax}
                stroke={chartColor}
              />
              <MinPrice
                yText={yMax + 5}
                label={formatFn(minPrice)}
                xScale={dateScale}
                xDate={minPriceDate}
                width={width}
                yMax={yMax}
                stroke={chartColor}
                margin={{ ...margins }}
              />
            </Group>
          )
        }
        {/* drawing the line and circle indicator to be display in cursor over a
          selected area */}
        {tooltipData && (
          <Group>
            <Line
              from={{ x: tooltipLeft, y: margins.top * 2 }}
              to={{ x: tooltipLeft, y: yMax + margins.top * 2 }}
              stroke={chartColor}
              strokeWidth={2}
              opacity={0.5}
              pointerEvents='none'
              strokeDasharray='5,2'
            />
            <circle
              cx={tooltipLeft}
              cy={tooltipTop + 1 + margins.top}
              r={3.5}
              fill={'white'}
              fillOpacity={1}
              pointerEvents={'none'}
            />
            {
              /*
              <circle
                cx={tooltipLeft}
                cy={tooltipTop + margins.top}
                r={4}
                fill={theme.colors.gray[300]}
                stroke='white'
                strokeWidth={2}
                pointerEvents='none'
              />
              */
            }
          </Group>
        )}
      </ScaleSVG>
      {tooltipData && (
        <div>
          <TooltipWithBounds
            key={Math.random()}
            top={tooltipTop - 12}
            left={tooltipLeft}
            style={{
              ...defaultTooltipStyles,
              background: tooltipBg,
              padding: '0.5rem',
              borderRadius: '8px',
              border: 0,
              color: tooltipColor,
            }}
          >
            <ul style={{ padding: '0', margin: '0', listStyle: 'none' }}>
              <li>
                <Amount abbreviate={false} fontWeight='bold' fontSize='lg' my={2} value={formatFn(tooltipData.value)} />
              </li>
              <li style={{ paddingBottom: '0.25rem', fontSize: '12px', color: theme.colors.gray[300] }}>
                {dateToLocale(tooltipData)}
              </li>
            </ul>
          </TooltipWithBounds>
        </div>
      )}
    </div>
  )
}
