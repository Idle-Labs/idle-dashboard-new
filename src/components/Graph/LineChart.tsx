import { useTheme } from '@chakra-ui/react'
import { HistoryData } from 'constants/types'
import { AxisBottom, AxisLeft } from '@visx/axis'
import { AxisScale } from '@visx/axis'
import { Group } from '@visx/group'
import { LinePath } from '@visx/shape'
import React from 'react'

export interface LineChartProps {
  data: HistoryData[]
  xScale: AxisScale<number>
  yScale: AxisScale<number>
  width: number
  yMax: number
  margin: { top: number; right: number; bottom: number; left: number }
  hideBottomAxis?: boolean
  stroke: string
  hideLeftAxis?: boolean
  top?: number
  left?: number
  children?: React.ReactNode
  xTickFormat?: (d: any) => any
}

export const LineChart = ({
  data,
  width,
  yMax,
  margin,
  xScale,
  yScale,
  hideBottomAxis = false,
  hideLeftAxis = false,
  stroke,
  top,
  left,
  xTickFormat,
  children,
}: LineChartProps) => {
  const theme = useTheme()
  const strokeColor = theme.colors.gray[750]
  const labelColor = theme.colors.table.axisLabel

  const AXIS_BOTTOM_TICK_LABEL_PROPS = {
    textAnchor: 'middle' as const,
    fontSize: 12,
    fontWeight: 'bold',
    fill: labelColor,
  }
  const AXIS_LEFT_TICK_LABEL_PROPS = {
    dx: '-0.25em',
    dy: '0.25em',
    fontSize: 12,
    textAnchor: 'end' as const,
    fill: labelColor,
  }
  if (!data) return null
  // accessors
  const getDate = (d: HistoryData) => new Date(d?.date)
  const getValue = (d: HistoryData) => d?.value

  if (width < 10) return null
  return (
    <>
      <Group left={left || margin.left} top={top || margin.top}>
        <LinePath<HistoryData>
          data={data}
          x={d => xScale(getDate(d)) || 0}
          y={d => yScale(getValue(d)) || 0}
          strokeWidth={1.5}
          stroke={stroke}
        />

        {!hideLeftAxis && (
          <AxisLeft
            scale={yScale}
            numTicks={5}
            stroke={strokeColor}
            tickStroke={strokeColor}
            tickLabelProps={() => AXIS_LEFT_TICK_LABEL_PROPS}
            tickFormat={d => {
              return xTickFormat ? xTickFormat(d) : d
            }}
          />
        )}
        {children}
      </Group>
      {!hideBottomAxis && (
        <AxisBottom
          hideTicks
          numTicks={6}
          scale={xScale}
          strokeWidth={0}
          top={yMax + margin.top + 25}
          tickLabelProps={() => AXIS_BOTTOM_TICK_LABEL_PROPS}
        />
      )}
    </>
  )
}
