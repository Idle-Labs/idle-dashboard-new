import React from 'react';
import { Grid } from '@visx/grid'
import { extent } from 'd3-array'
import { toDayjs } from 'helpers/'
import { Group } from '@visx/group'
import { BarStack } from '@visx/shape'
import { AxisBottom } from '@visx/axis'
import { localPoint } from '@visx/event'
import { ParentSize } from '@visx/responsive'
// import { LegendOrdinal } from '@visx/legend'
import { Amount } from 'components/Amount/Amount'
import { SeriesPoint } from '@visx/shape/lib/types'
import { useI18nProvider } from 'contexts/I18nProvider'
// import { timeParse, timeFormat } from 'd3-time-format'
import { useTheme, useColorModeValue } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'
import cityTemperature, { CityTemperature } from './cityTemperature'
import { scaleBand, scaleLinear, scaleOrdinal, scaleTime } from '@visx/scale'
import { TooltipWithBounds, useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip'

type CityName = 'deposit' | 'redeem'

type TooltipData = {
  bar: SeriesPoint<CityTemperature>;
  key: CityName;
  index: number;
  height: number;
  width: number;
  x: number;
  y: number;
  color: string;
};

export type BarStackProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  events?: boolean;
};

const purple1 = '#6c5efb';
const purple2 = '#c998ff';
export const purple3 = '#a44afe';
export const background = '#eaedff';
const defaultMargin = { top: 20, right: 0, bottom: 40, left: 0 };
const tooltipStyles = {
  ...defaultStyles,
  minWidth: 60,
  backgroundColor: 'rgba(0,0,0,0.9)',
  color: 'white',
};

const data = cityTemperature.slice(0, 12);
const keys = Object.keys(data[0]).filter((d) => d !== 'date') as CityName[];

const temperatureTotals = data.reduce((allTotals, currentDate: CityTemperature) => {
  const totalTemperature = keys.reduce((dailyTotal, k: CityName) => {
    dailyTotal += Math.abs(Number(currentDate[k]));
    return dailyTotal;
  }, 0);
  allTotals.push(totalTemperature);
  return allTotals;
}, [] as number[]);

// const parseDate = timeParse('%Y-%m-%d');
// const format = timeFormat('%b %d');

// accessors
const getDate = (d: any) => d.date;

// console.log('Max', Math.max(...temperatureTotals.map( t => Math.abs(t) )))

let tooltipTimeout: number;

export default function Example({
  width,
  height,
  events = false,
  margin = defaultMargin,
}: BarStackProps) {
  const theme = useTheme()
  const { locale } = useI18nProvider()
  const { tooltipOpen, tooltipLeft, tooltipTop, tooltipData, hideTooltip, showTooltip } = useTooltip<TooltipData>();

  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    // TooltipInPortal is rendered in a separate child of <body /> and positioned
    // with page coordinates which should be updated on scroll. consider using
    // Tooltip or TooltipWithBounds if you don't need to render inside a Portal
    scroll: true,
  });

  const formatDate = (d: any) => toDayjs(getDate(d)).locale(locale).format('LLL')

  const strokeColor = useColorModeValue(theme.colors.gray[200], theme.colors.gray[750])
  const labelColor = useColorModeValue(theme.colors.gray[300], theme.colors.table.axisLabel)

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

  // if (width < 10) return null;
  // bounds
  const yMax = height - margin.top
  const xMax = width - margin.left - margin.right

  // xScale.rangeRound([0, xMax]);
  // dateScale.rangeRound([0, xMax]);
  // temperatureScale.range([yMax, 0]);

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
    domain: extent(data, getDate) as [Date, Date],
  })

  // console.log(extent(data, getDate))

  const temperatureScale = scaleLinear<number>({
    nice: false,
    range: [yMax, 0],
    domain: [-Math.max(...temperatureTotals.map( t => Math.abs(t) )), Math.max(...temperatureTotals.map( t => Math.abs(t) ))],
  });

  const colorScale = scaleOrdinal<CityName, string>({
    domain: keys,
    range: [purple1, purple2, purple3],
  });

  const tooltipBg = useColorModeValue('white', theme.colors.card.bg)
  const tooltipBorder = useColorModeValue(theme.colors.gray[200], theme.colors.gray[700])
  const tooltipColor = useColorModeValue(theme.colors.gray[800], 'white')

  return (
    <div style={{ position: 'relative' }}>
      <svg ref={containerRef} width={width} height={height}>
        {/*<rect x={0} y={0} width={width} height={height} fill={background} rx={14} />*/}
        {/*<Grid
          top={margin.top}
          left={margin.left}
          xScale={dateScale}
          yScale={temperatureScale}
          width={xMax}
          height={yMax}
          stroke="black"
          strokeOpacity={0.1}
          xOffset={dateScale.bandwidth() / 2}
        />*/}
        <Group top={margin.top}>
          <BarStack<CityTemperature, CityName>
            data={data}
            keys={keys}
            x={getDate}
            color={colorScale}
            xScale={dateScale}
            offset={'diverging'}
            yScale={temperatureScale}
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
          top={height/2 + margin.top/2}
          scale={dateScale}
          stroke={'#ffffff'}
          tickFormat={() => ''}
        />
        <AxisBottom
          strokeWidth={0}
          hideTicks={true}
          scale={timeScale}
          top={height - margin.bottom}
          // tickFormat={formatDate}
          numTicks={width > 520 ? 5 : 5}
          tickLabelProps={() => AXIS_BOTTOM_TICK_LABEL_PROPS}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: margin.top / 2 - 10,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          fontSize: '14px',
        }}
      >
        {/*<LegendOrdinal scale={colorScale} direction="row" labelMargin="0 15px 0 0" />*/}
      </div>

      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
          style={{
            ...defaultStyles,
            background: tooltipBg,
            padding: '0.5rem',
            borderRadius: '8px',
            border: `1px solid ${tooltipBorder}`,
            color: tooltipColor
          }}
        >
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
        </TooltipWithBounds>
      )}
    </div>
  );
}

export const BarChart = () => {
  return (
    <ParentSize debounceTime={10}>
      { parent => (
        <Example
          width={parent.width}
          height={parent.height}
        />
      )}
    </ParentSize>
  )
}