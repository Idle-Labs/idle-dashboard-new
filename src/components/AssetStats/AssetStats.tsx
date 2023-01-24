import BigNumber from 'bignumber.js'
import type { Vault } from 'vaults/'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import useLocalForge from 'hooks/useLocalForge'
import { SECONDS_IN_YEAR } from 'constants/vars'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { HistoryTimeframe, AssetId } from 'constants/types'
import React, { useMemo, useCallback, useState } from 'react'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { GenericChart } from 'components/GenericChart/GenericChart'
import { useTVLChartData } from 'hooks/useTVLChartData/useTVLChartData'
import { useRateChartData } from 'hooks/useRateChartData/useRateChartData'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { StrategiesFilters } from 'components/StrategiesFilters/StrategiesFilters'
import { BNify, removeItemFromArray, abbreviateNumber, numberToPercentage } from 'helpers/'
import { useTheme, SimpleGrid, Box, Stack, HStack, VStack, Heading } from '@chakra-ui/react'
import { DonutChart, DonutChartData, DonutChartInitialData } from 'components/DonutChart/DonutChart'
import { RainbowData, usePerformanceChartData } from 'hooks/usePerformanceChartData/usePerformanceChartData'

export const AssetStats: React.FC = () => {
  const theme = useTheme()
  const translate = useTranslate()
  const { isMobile } = useThemeProvider()
  const { location, params } = useBrowserRouter()
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.MONTH)
  const { vaults, selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()
  const [ selectedStrategies, setSelectedStrategies ] = useLocalForge('selectedStrategies', Object.keys(strategies))

  const asset = useMemo(() => {
    return params.asset && selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const vault = useMemo(() => {
    return params.asset && selectVaultById && selectVaultById(params.asset)
  }, [selectVaultById, params.asset])

  const strategyColor = useMemo(() => {
    return asset && strategies[asset.type].color
  }, [asset])

  const availableStrategies = useMemo(() => {
    if (!asset?.type) return
    return ['AA','BB'].includes(asset.type) ? ['AA','BB'] : [asset.type]
  }, [asset])

  const assetIds = useMemo(() => {
    if (!asset?.type) return []
    switch (asset.type){
      case 'AA':
      case 'BB':
        const otherVaultType = removeItemFromArray<string>(['AA', 'BB'], asset.type)[0]
        const otherVault = vaults.find( (otherVault: Vault) => ("cdoConfig" in otherVault) && ("cdoConfig" in vault) && otherVault.type === otherVaultType && otherVault.cdoConfig.address === vault.cdoConfig.address )
        return [asset.id, otherVault?.id]
      default:
        return [asset.id]
    }
  }, [asset, vault, vaults])

  const filteredAssetIds: AssetId[] = useMemo(() => {
    return assetIds.filter( (assetId: AssetId) => {
      const asset = selectAssetById(assetId)
      return asset && selectedStrategies.includes(asset.type)
    })
  }, [selectAssetById, assetIds, selectedStrategies])

  const { tvlChartData } = useTVLChartData({ assetIds: filteredAssetIds, timeframe })
  const { performanceChartData } = usePerformanceChartData({ assetIds: filteredAssetIds, timeframe })
  const { rateChartData } = useRateChartData({ assetIds: filteredAssetIds, timeframe })

  // console.log('tvlChartData', tvlChartData)
  // console.log('rateChartData', rateChartData)
  // console.log('performanceChartData', performanceChartData)

  const toggleStrategy = useCallback((strategy: string) => {
    if (!selectedStrategies.includes(strategy)){
      setSelectedStrategies([
        ...selectedStrategies,
        strategy
      ])
    // Remove strategy
    } else {
      setSelectedStrategies(selectedStrategies.filter( (s: string) => s !== strategy ))
    }
  }, [selectedStrategies, setSelectedStrategies])

  const assetsApys = useMemo(() => {
    if (!performanceChartData?.rainbow?.length) return null
    return (
      <HStack
        spacing={4}
        width={'full'}
      >
        {
          filteredAssetIds.map( (assetId: AssetId) => {
            const asset = selectAssetById(assetId)
            const color = strategies[asset.type].color
            const startPoint: RainbowData = performanceChartData.rainbow[0]
            const endPoint: RainbowData = performanceChartData.rainbow[performanceChartData.rainbow.length-1]
            const gainSeconds = Math.round((endPoint.date-startPoint.date)/1000)
            const apy = BNify(endPoint![assetId]).div(startPoint[assetId]).minus(1).times(SECONDS_IN_YEAR).div(gainSeconds).times(100)
            return (
              <HStack
                spacing={1}
                alignItems={'baseline'}
                key={`asset_${assetId}`}
              >
                <Amount.Percentage textStyle={'heading'} fontSize={'lg'} color={color} value={apy} />
                <Translation translation={'defi.apy'} fontSize={'sm'} color={color} />
              </HStack>
            )
          })
        }
      </HStack>
    )
  }, [filteredAssetIds, selectAssetById, performanceChartData])

  const compositionData: DonutChartInitialData = useMemo(() => {
    const initialData = {
      data:[],
      colors:{}
    }
    // console.log('filteredAssetIds', filteredAssetIds)
    if (!filteredAssetIds) return initialData
    return (filteredAssetIds as Array<AssetId>).reduce( (donutChartData: DonutChartInitialData, assetId: AssetId) => {
      const asset = selectAssetById(assetId)
      if (!asset) return donutChartData
      donutChartData.colors[assetId] = strategies[asset.type].color as string
      donutChartData.data.push({
        value: parseFloat(BNify(asset.tvlUsd).toFixed(2)),
        label: asset.id,
        extraData: {
          asset
        }
      })
      return donutChartData
    }, initialData)
  }, [filteredAssetIds, selectAssetById])

  const getSliceData = useCallback((selectedSlice: DonutChartData) => {
    const totalFunds = compositionData.data.reduce( (total: BigNumber, data: DonutChartData) => total.plus(data.value), BNify(0))
    const formatFn = (n: any) => `$${abbreviateNumber(n)}`
    const selectedAsset = selectedSlice?.extraData?.asset
    // console.log('selectedSlice', selectedSlice)
    // if (!asset) return null
    const icon = selectedAsset?.icon || asset?.icon
    const label = selectedAsset ? translate(strategies[selectedAsset.type].label) : translate('dashboard.portfolio.totalChart')
    const value = selectedSlice ? formatFn(selectedSlice.value) : formatFn(totalFunds)
    const color = selectedAsset ? strategies[selectedAsset?.type].color : '#ffffff'

    // if (selectedSlice && !asset) return null

    return (
      <>
        {
          icon && (
            <image
              y={'35%'}
              href={icon}
              height={"34"}
              width={"34"}
              textAnchor={"middle"}
              x={isMobile ? '44.5%' : '46.5%'}
            />
          )
        }
        <text
          x={'50%'}
          y={'54%'}
          fontSize={26}
          fill={"white"}
          fontWeight={600}
          textAnchor={"middle"}
          pointerEvents={"none"}
        >
          {value}
        </text>
        <text
          x={'50%'}
          y={'61%'}
          fill={color}
          fontSize={14}
          fontWeight={400}
          textAnchor={"middle"}
          pointerEvents={"none"}
        >
          {label}
        </text>
      </>
    )
  }, [compositionData, asset, translate, isMobile])

  return (
    <Box
      mt={14}
      width={'100%'}
    >
      <Stack
        mb={10}
        spacing={10}
        width={'100%'}
        alignItems={['flex-start','center']}
        justifyContent={'flex-start'}
        direction={['column', 'row']}
      >
        <AssetLabel assetId={params.asset} fontSize={'h2'} />
        <HStack
          pb={3}
          flex={1}
          borderBottom={'1px solid'}
          borderColor={'divider'}
          justifyContent={'space-between'}
        >
          <StrategiesFilters toggleStrategy={toggleStrategy} selectedStrategies={selectedStrategies} availableStrategies={availableStrategies} />
          <TimeframeSelector variant={'button'} timeframe={timeframe} setTimeframe={setTimeframe} width={['100%', 'auto']} justifyContent={['center', 'initial']} />
        </HStack>
      </Stack>
      <VStack
        spacing={20}
        width={'full'}
      >
        <Stack
          spacing={6}
          width={'full'}
          direction={['column', 'row']}
        >
          <VStack
            spacing={6}
            width={['full', 2/3]}
            alignItems={'flex-start'}
          >
            <Translation translation={'stats.performances'} component={Heading} as={'h3'} textStyle={'heading'} fontSize={'xl'} />
            <Card.Dark
              p={6}
            >
              <VStack
                spacing={4}
                width={'full'}
              >
                {assetsApys}
                <GenericChart
                  percentChange={0}
                  assetIds={assetIds}
                  color={strategyColor}
                  timeframe={timeframe}
                  data={performanceChartData}
                  setPercentChange={() => {}}
                  height={isMobile ? '300px' : '350px'}
                  isRainbowChart={assetIds.length>1 ? true : false}
                  margins={{ top: 10, right: 0, bottom: 65, left: 0 }}
                  //formatFn={ !useDollarConversion ? ((n: any) => `${abbreviateNumber(n)} ${asset?.name}`) : undefined }
                />
              </VStack>
            </Card.Dark>
          </VStack>
          <VStack
            flex={1}
            spacing={6}
            width={['full', 'auto']}
            alignItems={'flex-start'}
          >
            <Translation translation={'stats.tvlDistribution'} component={Heading} as={'h3'} textStyle={'heading'} fontSize={'xl'} />
            <Card.Dark
              p={6}
              flex={1}
            >
              <DonutChart {...compositionData} getSliceData={getSliceData} />
            </Card.Dark>
          </VStack>
        </Stack>
        <SimpleGrid
          spacing={6}
          width={'full'}
          columns={[1, 3]}
        >
          <VStack
            spacing={6}
            width={'full'}
            alignItems={'flex-start'}
          >
            <Translation translation={'defi.tvl'} component={Heading} as={'h3'} textStyle={'heading'} fontSize={'xl'} />
            <Card.Dark
              p={6}
            >
              <GenericChart
                percentChange={0}
                data={tvlChartData}
                assetIds={assetIds}
                color={strategyColor}
                timeframe={timeframe}
                maxMinEnabled={false}
                setPercentChange={() => {}}
                height={isMobile ? '300px' : '350px'}
                isRainbowChart={assetIds.length>1 ? true : false}
                margins={{ top: 10, right: 0, bottom: 65, left: 0 }}
              />
            </Card.Dark>
          </VStack>
          <VStack
            spacing={6}
            width={'full'}
            alignItems={'flex-start'}
          >
            <Translation translation={'defi.apy'} component={Heading} as={'h3'} textStyle={'heading'} fontSize={'xl'} />
            <Card.Dark
              p={6}
            >
              <GenericChart
                percentChange={0}
                assetIds={assetIds}
                data={rateChartData}
                color={strategyColor}
                timeframe={timeframe}
                maxMinEnabled={false}
                setPercentChange={() => {}}
                height={isMobile ? '300px' : '350px'}
                formatFn={(n: any) => `${numberToPercentage(n)}`}
                isRainbowChart={assetIds.length>1 ? true : false}
                margins={{ top: 10, right: 0, bottom: 65, left: 0 }}
              />
            </Card.Dark>
          </VStack>
        </SimpleGrid>
      </VStack>
    </Box>
  )
}