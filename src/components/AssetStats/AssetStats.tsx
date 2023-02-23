import BigNumber from 'bignumber.js'
import type { Vault } from 'vaults/'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import { SECONDS_IN_YEAR } from 'constants/vars'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { StrategyTag } from 'components/StrategyTag/StrategyTag'
import { Translation } from 'components/Translation/Translation'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { VolumeChart } from 'components/VolumeChart/VolumeChart'
import { GenericChart } from 'components/GenericChart/GenericChart'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { useTVLChartData } from 'hooks/useTVLChartData/useTVLChartData'
import { HistoryData, HistoryTimeframe, AssetId } from 'constants/types'
import React, { useMemo, useCallback, useState, useEffect } from 'react'
import { useRateChartData } from 'hooks/useRateChartData/useRateChartData'
import { SimpleGrid, Stack, HStack, VStack, Heading } from '@chakra-ui/react'
import { useVolumeChartData } from 'hooks/useVolumeChartData/useVolumeChartData'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { StrategiesFilters } from 'components/StrategiesFilters/StrategiesFilters'
import { DonutChart, DonutChartData, DonutChartInitialData } from 'components/DonutChart/DonutChart'
import { RainbowData, usePerformanceChartData } from 'hooks/usePerformanceChartData/usePerformanceChartData'
import { BNify, bnOrZero, getTimeframeTimestamp, removeItemFromArray, abbreviateNumber, numberToPercentage } from 'helpers/'


// type AssetDynamicCardProps = {
//   assetId: AssetId
// }

// const AssetDynamicCard: React.FC<AssetDynamicCardProps> = ({ assetId }) => {
//   const { selectors: { selectAssetById } } = usePortfolioProvider()
//   const asset = useMemo(() => selectAssetById(asset.id), [assetId])
//   const strategyConfig

//   switch (asset.type){

//   }
// }

type AssetStatsProps = {
  assetOnly?: boolean
  showHeader?: boolean
  showAssetStrategy?: boolean
  timeframe?: HistoryTimeframe
}
export const AssetStats: React.FC<AssetStatsProps> = ({ showHeader = true, assetOnly = false, showAssetStrategy = false, timeframe: defaultTimeframe }) => {
  const translate = useTranslate()
  const { params } = useBrowserRouter()
  const { isMobile } = useThemeProvider()
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe["WEEK"])
  const { vaults, selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()
  const [ selectedStrategies, setSelectedStrategies ] = useState<string[] | undefined>(undefined)

  const asset = useMemo(() => {
    return params.asset && selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const vault = useMemo(() => {
    return params.asset && selectVaultById && selectVaultById(params.asset)
  }, [selectVaultById, params.asset])

  const strategyConfig = useMemo(() => {
    return asset && strategies[asset.type]
  }, [asset])

  const strategyColor = useMemo(() => {
    return strategyConfig && strategyConfig.color
  }, [strategyConfig])

  const availableStrategies = useMemo(() => {
    if (!asset?.type) return
    if (showAssetStrategy) return [asset.type]
    return ['AA','BB'].includes(asset.type) ? ['AA','BB'] : [asset.type]
  }, [asset, showAssetStrategy])

  useEffect(() => {
    if (availableStrategies && !selectedStrategies){
      setSelectedStrategies(availableStrategies)
    }
  }, [selectedStrategies, availableStrategies, setSelectedStrategies])

  const assetIds = useMemo(() => {
    if (!asset?.type) return []
    if (assetOnly) return [asset.id]
    switch (asset.type){
      case 'AA':
      case 'BB':
        const otherVaultType = removeItemFromArray<string>(['AA', 'BB'], asset.type)[0]
        const otherVault = vaults.find( (otherVault: Vault) => ("cdoConfig" in otherVault) && ("cdoConfig" in vault) && otherVault.type === otherVaultType && otherVault.cdoConfig.address === vault.cdoConfig.address )
        return [asset.id, otherVault?.id]
      default:
        return [asset.id]
    }
  }, [asset, vault, vaults, assetOnly])

  const selectedTimeframe = useMemo(() => {
    return defaultTimeframe || timeframe
  }, [timeframe, defaultTimeframe])

  const useRatesForPerformanceChartData = asset?.type === 'BY'

  const { volumeChartData } = useVolumeChartData({ assetIds, timeframe: selectedTimeframe })
  const { tvlChartData: tvlUsdChartData } = useTVLChartData({ assetIds, timeframe: selectedTimeframe })
  const { performanceChartData } = usePerformanceChartData({ useRates: useRatesForPerformanceChartData, assetIds, timeframe: selectedTimeframe })
  const { rateChartData } = useRateChartData({ assetIds, timeframe: selectedTimeframe })
  // console.log('performanceChartData', performanceChartData)

  const toggleStrategy = useCallback((strategy: string) => {
    // console.log('selectedStrategies', selectedStrategies)
    if (!selectedStrategies || (selectedStrategies.length === 1 && selectedStrategies.includes(strategy))) return

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
    if (!rateChartData?.rainbow?.length) return null
    return (
      <HStack
        spacing={4}
        width={'full'}
      >
        {
          assetIds.map( (assetId: AssetId) => {
            const asset = selectAssetById(assetId)
            const color = strategies[asset.type].color
            const apy = rateChartData.rainbow.reduce( (total: BigNumber, data: RainbowData) => {
              if (BNify(data[asset.id]).gt(9999)) return total
              return total.plus(data[asset.id])
            }, BNify(0)).div(rateChartData.rainbow.length)
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
  }, [assetIds, selectAssetById, rateChartData])

  const compositionData: DonutChartInitialData = useMemo(() => {
    const initialData = {
      data:[],
      colors:{}
    }
    // console.log('assetIds', assetIds)
    if (!assetIds) return initialData
    return (assetIds as Array<AssetId>).reduce( (donutChartData: DonutChartInitialData, assetId: AssetId) => {
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
  }, [assetIds, selectAssetById])

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

  const avgApy = useMemo((): BigNumber => {
    return rateChartData.total.reduce( (total: BigNumber, data: HistoryData) => {
      if (BNify(data.value).gt(9999)) return total
      return total.plus(data.value)
    }, BNify(0) ).div(rateChartData.total.length)
  }, [rateChartData])

  const assetsAvgApy = useMemo(() => {
    const sums = rateChartData.rainbow.reduce( (totals: Record<AssetId, BigNumber>, data: RainbowData) => {
      assetIds.forEach( (assetId: AssetId) => {
        if (!totals[assetId]){
          totals[assetId] = BNify(0)
        }
        totals[assetId] = totals[assetId].plus(data[assetId])
      })
      return totals
    }, {})
    return Object.keys(sums).reduce( (avgApys: Record<AssetId, BigNumber>, assetId: AssetId) => {
      avgApys[assetId] = sums[assetId].div(rateChartData.rainbow.length)
      return avgApys
    }, {})
  }, [assetIds, rateChartData])

  // console.log('assetsAvgApy', assetIds, assetsAvgApy)

  const tvlUsd = useMemo((): BigNumber => {
    return assetIds.reduce( (totalTvlUsd: BigNumber, assetId: AssetId) => {
      const asset = selectAssetById(assetId)
      totalTvlUsd = totalTvlUsd.plus(asset.tvlUsd)
      return totalTvlUsd
    }, BNify(0))
  }, [assetIds, selectAssetById])

  const volume = useMemo((): BigNumber => {
    return volumeChartData.total.reduce( (total: BigNumber, data: HistoryData) => total.plus(Math.abs(data.value)), BNify(0) )
  }, [volumeChartData])

  const timeframeStartTimestamp = useMemo((): number => {
    if (!selectedTimeframe) return 0
    return getTimeframeTimestamp(selectedTimeframe)
  }, [selectedTimeframe])

  const collectedFees = useMemo((): BigNumber => {
    if (!asset?.collectedFees) return BNify(0)
    const collectedFeesFiltered = asset.collectedFees.filter( (data: HistoryData) => data.date>=timeframeStartTimestamp )
    return collectedFeesFiltered.reduce( (total: BigNumber, data: HistoryData) => total.plus(data.value), BNify(0) )
  }, [asset, timeframeStartTimestamp])

  // console.log('asset', asset)
  // console.log('rateChartData', rateChartData)
  // console.log('tvlUsdChartData', tvlUsdChartData)
  // console.log('volumeChartData', volumeChartData)
  // console.log('assetIds', assetIds)
  // console.log('collectedFees', collectedFees.toString())
  // console.log('performanceChartData', performanceChartData)

  return (
    <AssetProvider
      assetId={params.asset}
      wrapFlex={false}
    >
      <VStack
        spacing={16}
        width={'full'}
      >
        {
          showHeader && (
            <Stack
              mt={14}
              width={'100%'}
              spacing={[4, 10]}
              alignItems={['flex-start','center']}
              justifyContent={'flex-start'}
              direction={['column', 'row']}
            >
              <AssetLabel assetId={params.asset} fontSize={'h2'} />
              <Stack
                pb={3}
                flex={1}
                spacing={[4, 0]}
                borderBottom={'1px solid'}
                borderColor={'divider'}
                justifyContent={'space-between'}
                direction={['column', 'row']}
                alignItems={['flex-start','center']}
              >
                <HStack
                  spacing={4}
                  width={['full', 'auto']}
                  justifyContent={'flex-start'}
                >
                  <StrategyTag strategy={strategyConfig?.strategy as string} py={2} />
                  {
                    strategyConfig?.stats?.header?.fields?.map( (field: string) => (
                      <AssetProvider.GeneralData key={`field_${field}`} field={field} />
                    ))
                  }
                </HStack>
                <TimeframeSelector variant={'button'} timeframe={timeframe} setTimeframe={setTimeframe} width={['100%', 'auto']} justifyContent={['center', 'initial']} />
              </Stack>
            </Stack>
          )
        }
        <SimpleGrid
          spacing={4}
          width={'full'}
          columns={[1, 4]}
        >
          <Card>
            <Translation mb={1} translation={'defi.tvl'} textStyle={'captionSmall'} />
            <Amount.Usd value={tvlUsd} textStyle={'ctaStatic'} fontSize={'xl'} />
          </Card>
          <Card>
            <Translation mb={1} translation={'defi.avgApy'} textStyle={'captionSmall'} />
            <Amount.Percentage value={avgApy} textStyle={'ctaStatic'} fontSize={'xl'} />
          </Card>
          <Card>
            <Translation mb={1} translation={'stats.totalVolume'} textStyle={'captionSmall'} />
            <Amount.Usd value={volume} textStyle={'ctaStatic'} fontSize={'xl'} />
          </Card>
          <Card>
            <Translation mb={1} translation={'stats.collectedFees'} textStyle={'captionSmall'} />
            <TokenAmount assetId={asset?.id} amount={collectedFees} showIcon={false} textStyle={'ctaStatic'} fontSize={'xl'} />
          </Card>
        </SimpleGrid>
        {
          !assetOnly && strategyConfig?.strategy === 'tranches' && (
            <SimpleGrid
              spacing={4}
              width={'full'}
              columns={[1, 2]}
            >
              {
                assetIds.map( (assetId: AssetId) => {
                  const asset = selectAssetById(assetId)
                  return (
                    <AssetProvider
                      wrapFlex={false}
                      assetId={asset.id}
                      key={`row_${assetId}`}
                    >
                      <VStack
                        spacing={6}
                        width={'full'}
                        alignItems={'flex-start'}
                      >
                        <Translation translation={strategies[asset.type].label} textStyle={'ctaStatic'} fontWeight={600} fontSize={'lg'} />
                        <SimpleGrid
                          spacing={4}
                          columns={2}
                          width={'full'}
                        >
                          <Card>
                            <Translation mb={1} translation={'defi.avgApy'} textStyle={'captionSmall'} color={`strategies.${asset.type}`} />
                            <Amount.Percentage value={assetsAvgApy[assetId]} textStyle={'ctaStatic'} fontSize={'xl'} />
                          </Card>
                          {
                            strategies[asset.type].stats?.strategyData?.fields.map( (field: string) => (
                              <Card
                                key={`field_${field}`}
                              >
                                <Translation mb={1} translation={`stats.${field}`} textStyle={'captionSmall'} />
                                <AssetProvider.GeneralData field={field} textStyle={'ctaStatic'} fontSize={'xl'} />
                              </Card>
                            ))
                          }
                        </SimpleGrid>
                      </VStack>
                    </AssetProvider>
                  )
                })
              }
            </SimpleGrid>
          )
        }
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
              <Translation translation={'stats.performances'} component={Heading} as={'h3'} textStyle={'heading'} fontSize={'lg'} />
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
                    isRainbowChart={true}
                    data={performanceChartData}
                    setPercentChange={() => {}}
                    timeframe={selectedTimeframe}
                    height={isMobile ? '300px' : '350px'}
                    margins={{ top: 10, right: 0, bottom: 40, left: 0 }}
                    formatFn={(n: any) => `$${abbreviateNumber(n, 3)}`}
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
              <Translation translation={'stats.tvlDistribution'} component={Heading} as={'h3'} textStyle={'heading'} fontSize={'lg'} />
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
              <Translation translation={'defi.tvl'} component={Heading} as={'h3'} textStyle={'heading'} fontSize={'lg'} />
              <Card.Dark
                p={6}
              >
                <GenericChart
                  percentChange={0}
                  data={tvlUsdChartData}
                  assetIds={assetIds}
                  color={strategyColor}
                  maxMinEnabled={false}
                  isRainbowChart={true}
                  setPercentChange={() => {}}
                  timeframe={selectedTimeframe}
                  height={isMobile ? '300px' : '350px'}
                  margins={{ top: 10, right: 0, bottom: 40, left: 0 }}
                />
              </Card.Dark>
            </VStack>
            <VStack
              spacing={6}
              width={'full'}
              alignItems={'flex-start'}
            >
              <Translation translation={'defi.apy'} component={Heading} as={'h3'} textStyle={'heading'} fontSize={'lg'} />
              <Card.Dark
                p={6}
              >
                <GenericChart
                  percentChange={0}
                  assetIds={assetIds}
                  data={rateChartData}
                  color={strategyColor}
                  maxMinEnabled={false}
                  isRainbowChart={true}
                  setPercentChange={() => {}}
                  timeframe={selectedTimeframe}
                  height={isMobile ? '300px' : '350px'}
                  formatFn={(n: any) => `${numberToPercentage(n)}`}
                  margins={{ top: 10, right: 0, bottom: 40, left: 0 }}
                />
              </Card.Dark>
            </VStack>
            <VStack
              spacing={6}
              width={'full'}
              alignItems={'flex-start'}
            >
              <Translation translation={'stats.volumes'} component={Heading} as={'h3'} textStyle={'heading'} fontSize={'lg'} />
              <Card.Dark
                p={6}
                flex={1}
              >
                <VolumeChart timeframe={selectedTimeframe} assetIds={assetIds} />
              </Card.Dark>
            </VStack>
          </SimpleGrid>
        </VStack>
      </VStack>
    </AssetProvider>
  )
}