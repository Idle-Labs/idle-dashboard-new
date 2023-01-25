import dayjs from 'dayjs'
import omit from 'lodash/omit'
import { Group } from '@visx/group'
import { strategies } from 'constants/'
import { curveLinear } from '@visx/curve'
import { extent, Numeric } from 'd3-array'
import { Text as VisxText } from '@visx/text'
import React, { useCallback, useMemo } from 'react'
import { useI18nProvider } from 'contexts/I18nProvider'
import { useColorModeValue, useToken } from '@chakra-ui/system'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { RainbowData } from 'hooks/useBalanceChartData/useBalanceChartData'
import { useTheme, HStack, VStack, Stack, Text, Flex } from '@chakra-ui/react'
import { AreaSeries, AreaStack, Axis, Margin, Tooltip, XYChart } from '@visx/xychart'

export type RainbowChartProps = {
  data: RainbowData[]
  width: number
  height: number
  color: string
  formatFn: Function
  margins?: Margin
  axisEnabled?: boolean
  maxMinEnabled?: boolean
}

const getScaledX = (date: number, start: number, end: number, width: number) =>
  ((date - start) / (end - start)) * width

const getScaledY = (price: number, min: number, max: number, height: number) =>
  ((max - price) / (max - min)) * height

// https://codesandbox.io/s/github/airbnb/visx/tree/master/packages/visx-demo/src/sandboxes/visx-xychart?file=/customTheme.ts:50-280
export const RainbowChart: React.FC<RainbowChartProps> = ({
  data,
  width,
  height,
  color,
  formatFn,
  axisEnabled = true,
  // maxMinEnabled = true,
  margins = { top: 0, right: 0, bottom: 0, left: 0 },
}) => {
  const theme = useTheme()
  const colors = theme.colors
  const { locale } = useI18nProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()
  const assetIds = useMemo(() => Object.keys(omit(data[0], ['date', 'total'])), [data])
  const magicXAxisOffset = 35

  type Accessor = (d: RainbowData) => number
  const accessors = useMemo(() => {
    const initial: Record<'x' | 'y', Record<string, Accessor>> = { x: {}, y: {} }
    return assetIds.reduce((acc, cur) => {
      acc.x[cur] = (d: RainbowData) => d.date
      acc.y[cur] = (d: RainbowData) => d[cur]
      return acc
    }, initial)
  }, [assetIds])

  const xScale = useMemo(
    () => ({
      type: 'time' as const,
      range: [0, width] as [Numeric, Numeric],
      domain: extent(data, d => new Date(d.date)) as [Date, Date],
    }),
    [data, width],
  )

  const labelColor = theme.colors.table.axisLabel
  const tickLabelProps = useMemo(
    () => ({
      textAnchor: 'middle' as const,
      verticalAnchor: 'middle' as const,
      fontSize: 12,
      fontWeight: 'bold',
      fill: labelColor,
      letterSpacing: 0,
    }),
    [labelColor],
  )

  const totals = useMemo(() => data.map(d => d.total), [data])
  const minPrice = Math.min(...totals)
  const maxPrice = Math.max(...totals)
  const maxPriceDate = data.find(x => x.total === maxPrice)!.date
  const minPriceDate = data.find(x => x.total === minPrice)!.date

  const handleTextPosition = useCallback(
    (x: number): { x: number; anchor: 'end' | 'start' | 'middle' } => {
      const offsetWidth = width / 2
      const buffer = 16
      const end = width - offsetWidth
      if (x < offsetWidth) {
        return { x: x + buffer, anchor: 'start' }
      } else if (x > end) {
        return { x, anchor: 'end' }
      } else {
        return { x, anchor: 'start' }
      }
    },
    [width],
  )
  const scaledMaxPriceX = handleTextPosition(
    getScaledX(maxPriceDate, xScale.domain[0].getTime(), xScale.domain[1].getTime(), width),
  )
  const scaledMinPriceX = handleTextPosition(
    getScaledX(minPriceDate, xScale.domain[0].getTime(), xScale.domain[1].getTime(), width),
  )
  const yMax = Math.max(height - margins.top - margins.bottom, 0)
  const yScale = useMemo(
    () => ({
      type: 'linear' as const,
      range: [yMax + margins.top, margins.top], // values are reversed, y increases down - this is really [bottom, top] in cartersian coordinates
      domain: [minPrice ?? 0, maxPrice ?? 0],
      nice: true,
    }),
    [margins.top, maxPrice, minPrice, yMax],
  )
  const scaledMaxPriceY = getScaledY(maxPrice, minPrice, maxPrice, height - margins.bottom)
  const scaledMinPriceY = getScaledY(minPrice, minPrice, maxPrice, height - margins.bottom)

  const tooltipBg = useColorModeValue('white', theme.colors.card.bg)
  const tooltipBorder = useColorModeValue(colors.gray[200], colors.gray[600])
  const tooltipColor = useColorModeValue(colors.gray[800], 'white')
  const minMaxTextColor = useToken('colors', color)

  const areaLines = useMemo(
    () =>
      assetIds.map(assetId => {
        const asset = selectAssetById(assetId)
        return (
          <AreaSeries
            data={data}
            key={assetId}
            fillOpacity={0.1}
            dataKey={assetId}
            xAccessor={accessors.x[assetId]}
            yAccessor={accessors.y[assetId]}
            fill={strategies[asset?.type]?.color}
          />
        )
      }),
    [selectAssetById, accessors, assetIds, data],
  )

  const crosshairColor = colors.primary/*useMemo(() => {
    if (assetIds.length>1) return colors.primary
    const asset = selectAssetById(assetIds[0])
    if (asset && asset?.color) {
      return asset.color
    }
    return colors.primary
  }, [assetIds, selectAssetById, colors.primary])*/

  return (
    <XYChart margin={margins} height={height} width={width} xScale={xScale} yScale={yScale}>
      <AreaStack order='ascending' curve={curveLinear}>
        {areaLines}
      </AreaStack>
      {
        axisEnabled && (
          <Axis
            hideTicks
            key={'date'}
            hideAxisLine
            numTicks={5}
            orientation={'bottom'}
            top={height - magicXAxisOffset}
            tickLabelProps={() => tickLabelProps}
          />
        )
      }

      <Tooltip<RainbowData>
        applyPositionStyle
        style={{ zIndex: 10 }}
        showVerticalCrosshair
        verticalCrosshairStyle={{
          stroke: crosshairColor,
          strokeWidth: 2,
          opacity: 0.5,
          strokeDasharray: '5,2',
          pointerEvents: 'none',
        }}
        renderTooltip={({ tooltipData }) => {
          const { datum, key: assetId } = tooltipData?.nearestDatum!
          const price = datum[assetId]
          const { date } = datum
          return (
            <VStack
              p={2}
              spacing={1}
              borderWidth={1}
              borderRadius={'lg'}
              color={tooltipColor}
              bgColor={tooltipBg}
              alignItems={'flex-start'}
              borderColor={tooltipBorder}
            >
              <VStack
                spacing={2}
                width={'full'}
                alignItems={'flex-start'}
              >
                {
                  Object.keys(datum).filter( k => !['date','total'].includes(k) ).map( (assetId: string) => {
                    const asset = selectAssetById(assetId)
                    return (
                      <VStack
                        key={assetId}
                        spacing={0}
                        width={'full'}
                        alignItems={'flex-start'}
                      >
                        <AssetProvider assetId={assetId}>
                          <HStack
                            spacing={1}
                          >
                            <AssetProvider.Icon size={'2xs'} />
                            <AssetProvider.Name fontSize={'sm'} fontWeight={'bold'} />
                            <AssetProvider.Strategy fontSize={'sm'} color={strategies[asset?.type]?.color} fontWeight={'bold'} prefix={'('} suffix={')'} />
                          </HStack>
                        </AssetProvider>
                        <Text fontWeight={'bold'}>{formatFn(price)}</Text>
                      </VStack>
                    )
                  })
                }
              </VStack>
              <Text fontSize={'xs'} color={colors.gray[500]}>
                {dayjs(date).locale(locale).format('LLL')}
              </Text>
            </VStack>
          )
        }}
      />
      <Group top={margins.top} left={margins.left}>
        <g>
          <VisxText
            x={scaledMaxPriceX.x}
            textAnchor={scaledMaxPriceX.anchor}
            y={scaledMaxPriceY}
            fill={minMaxTextColor}
            fontSize='12px'
            dy='1rem'
            dx='-0.5rem'
          >
            {formatFn(maxPrice)}
          </VisxText>
        </g>
        <g>
          <VisxText
            x={scaledMinPriceX.x}
            textAnchor={scaledMinPriceX.anchor}
            y={scaledMinPriceY}
            fill={minMaxTextColor}
            fontSize='12px'
            dy='1rem'
            dx='-0.5rem'
            width={100}
          >
            {formatFn(minPrice)}
          </VisxText>
        </g>
      </Group>
    </XYChart>
  )
}
