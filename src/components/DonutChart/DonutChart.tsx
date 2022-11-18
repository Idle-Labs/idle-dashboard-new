import { Group } from '@visx/group';
import React, { useState } from 'react';
import { scaleOrdinal } from '@visx/scale'
import { ParentSize } from '@visx/responsive'
import { animated, useTransition, interpolate } from '@react-spring/web';
import Pie, { ProvidedProps, PieArcDatum } from '@visx/shape/lib/shapes/Pie';

export type DonutChartKey = string
export type DonutChartData = {
  label: DonutChartKey
  value: number
  extraData?: any
}
export type DonutChartColors = Record<DonutChartKey, string>

type DonutChartInitialData = {
  getSliceData?: Function
  data: DonutChartData[]
  colors: DonutChartColors
}

const defaultMargin = { top: 0, right: 0, bottom: 0, left: 0 };

export type PieProps = {
  width: number;
  height: number;
  margin?: typeof defaultMargin;
  animate?: boolean;
} & DonutChartInitialData

export function PieChart({
  data,
  colors,
  width,
  height,
  margin = defaultMargin,
  animate = true,
  getSliceData
}: PieProps) {
  const [selectedSlice, setSelectedSlice] = useState<DonutChartData | null>(null);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const radius = Math.min(innerWidth, innerHeight) / 2;
  const centerY = innerHeight / 2;
  const centerX = innerWidth / 2;
  const donutThickness = 30;

  const keys = data.map( d => d.label )
  const keysColors = keys.map( key => colors[key] )

  const getColor = scaleOrdinal({
    domain: keys,
    range: keysColors,
  })

  const sliceData = getSliceData && getSliceData(selectedSlice)

  // accessor functions
  const pieValue = (d: DonutChartData) => d.value;

  return (
    <svg width={width} height={height}>
      <rect rx={14} width={width} height={height} fill="url('#visx-pie-gradient')" />
      {sliceData}
      <Group top={centerY + margin.top} left={centerX + margin.left}>
        <Pie
          padAngle={0}
          cornerRadius={0}
          pieValue={pieValue}
          outerRadius={radius}
          innerRadius={radius - donutThickness}
          data={data/*selectedSlice ? data.filter( d => d.label === selectedSlice ) : data*/}
        >
          {(pie) => (
            <AnimatedPie<DonutChartData>
              {...pie}
              animate={animate}
              getKey={(arc) => arc.data.label}
              onMouseOver={({data}) =>
                setSelectedSlice(data)
              }
              onMouseOut={() => setSelectedSlice(null)}
              getColor={(arc) => getColor(arc.data.label)}
            />
          )}
        </Pie>
      </Group>
    </svg>
  );
}

// react-spring transition definitions
type AnimatedStyles = { startAngle: number; endAngle: number; opacity: number };

const fromLeaveTransition = ({ endAngle }: PieArcDatum<any>) => ({
  // enter from 360° if end angle is > 180°
  startAngle: endAngle > Math.PI ? 2 * Math.PI : 0,
  endAngle: endAngle > Math.PI ? 2 * Math.PI : 0,
  opacity: 0,
});
const enterUpdateTransition = ({ startAngle, endAngle }: PieArcDatum<any>) => ({
  startAngle,
  endAngle,
  opacity: 1,
});

type AnimatedPieProps<Datum> = ProvidedProps<Datum> & {
  animate?: boolean;
  getKey: (d: PieArcDatum<Datum>) => string;
  getColor: (d: PieArcDatum<Datum>) => string;
  onClickDatum?: (d: PieArcDatum<Datum>) => void;
  onMouseOver?: (d: PieArcDatum<Datum>) => void;
  onMouseOut?: (d: PieArcDatum<Datum>) => void;
  delay?: number;
};

function AnimatedPie<Datum>({
  animate,
  arcs,
  path,
  getKey,
  getColor,
  onMouseOut,
  onMouseOver,
  onClickDatum,
}: AnimatedPieProps<Datum>) {
  const transitions = useTransition<PieArcDatum<Datum>, AnimatedStyles>(arcs, {
    from: animate ? fromLeaveTransition : enterUpdateTransition,
    enter: enterUpdateTransition,
    update: enterUpdateTransition,
    leave: animate ? fromLeaveTransition : enterUpdateTransition,
    keys: getKey,
  });
  return transitions((props, arc, { key }) => {
    const [centroidX, centroidY] = path.centroid(arc);
    const hasSpaceForLabel = arc.endAngle - arc.startAngle >= 0.1;

    return (
      <g key={key}>
        <animated.path
          // compute interpolated path d attribute from intermediate angle values
          d={interpolate([props.startAngle, props.endAngle], (startAngle, endAngle) =>
            path({
              ...arc,
              startAngle,
              endAngle,
            }),
          )}
          fill={getColor(arc)}
          onClick={() => onClickDatum && onClickDatum(arc)}
          onMouseOver={() => onMouseOver && onMouseOver(arc)}
          onMouseOut={() => onMouseOut && onMouseOut(arc)}
          onTouchStart={() => onClickDatum && onClickDatum(arc)}
        />
      </g>
    )
  })
}

export const DonutChart = ({
  data,
  colors,
  getSliceData
}: DonutChartInitialData) => {
  return (
    <ParentSize debounceTime={10}>
      { parent => (
        <PieChart
          data={data}
          colors={colors}
          width={parent.width}
          height={parent.height}
          getSliceData={getSliceData}
        />
      )}
    </ParentSize>
  )
}