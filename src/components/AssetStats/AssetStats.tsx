import BigNumber from 'bignumber.js'
import type { Vault } from 'vaults/'
import { strategies } from 'constants/'
import { selectProtocol } from 'selectors/'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import { Amount } from 'components/Amount/Amount'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { GenericContract } from 'contracts/GenericContract'
import { ProductTag } from 'components/ProductTag/ProductTag'
import { Scrollable } from 'components/Scrollable/Scrollable'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { DatePicker } from 'components/DatePicker/DatePicker'
import { AddressLink } from 'components/AddressLink/AddressLink'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { VolumeChart } from 'components/VolumeChart/VolumeChart'
import { GenericChart } from 'components/GenericChart/GenericChart'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { useTVLChartData } from 'hooks/useTVLChartData/useTVLChartData'
import React, { useMemo, useCallback, useState, useEffect } from 'react'
import { useRateChartData } from 'hooks/useRateChartData/useRateChartData'
import { DownloadCsvData } from 'components/DownloadCsvData/DownloadCsvData'
import { TransactionList } from 'components/TransactionList/TransactionList'
import { useVolumeChartData } from 'hooks/useVolumeChartData/useVolumeChartData'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { TranslationProps, Translation } from 'components/Translation/Translation'
import { Center, SimpleGrid, Stack, HStack, VStack, Heading, Flex } from '@chakra-ui/react'
import { useAllocationChartData } from 'hooks/useAllocationChartData/useAllocationChartData'
import { DonutChart, DonutChartData, DonutChartInitialData } from 'components/DonutChart/DonutChart'
import { RainbowData, usePerformanceChartData } from 'hooks/usePerformanceChartData/usePerformanceChartData'
import { Transaction, HistoryData, HistoryTimeframe, AssetId, DateRange, Balances } from 'constants/types'
import { BNify, getChartTimestampBounds, removeItemFromArray, abbreviateNumber, numberToPercentage, bnOrZero, floorTimestamp, isEmpty, formatMoney } from 'helpers/'

type AboutItemProps = {
  translation: TranslationProps["translation"]
  address: string
  chainId: number
}

const AboutItem: React.FC<AboutItemProps> = ({
  translation,
  address,
  chainId
}) => (
  <HStack
    py={4}
    width={'full'}
    justifyContent={'space-between'}
    borderBottomWidth={'1px'}
    borderBottomColor={'divider'}
  >
    <Translation translation={translation} textStyle={'tableCell'} />
    <AddressLink chainId={chainId} address={address} />
  </HStack>
)

type AssetStatsProps = {
  assetOnly?: boolean
  showHeader?: boolean
  dateRange?: DateRange
  showAssetStrategy?: boolean
  timeframe?: HistoryTimeframe
}
export const AssetStats: React.FC<AssetStatsProps> = ({ showHeader = true, assetOnly = false, showAssetStrategy = false, timeframe: defaultTimeframe, dateRange: defaultDateRange }) => {
  const translate = useTranslate()
  const { params } = useBrowserRouter()
  const { isMobile } = useThemeProvider()
  const [ dateRange, setDateRange ] = useState<DateRange>({ startDate: null, endDate: null })
  const [ selectedStrategies, setSelectedStrategies ] = useState<string[] | undefined>(undefined)
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe | undefined>(HistoryTimeframe["WEEK"])
  const { vaults, contracts, selectors: { selectAssetById, selectVaultById, selectAssetHistoricalPriceUsdByTimestamp } } = usePortfolioProvider()

  const useDateRange = useMemo(() => {
    return !!dateRange.startDate && !!dateRange.endDate
  }, [dateRange])

  useEffect(() => {
    if (useDateRange){
      setTimeframe(undefined)
    }
  }, [useDateRange, setTimeframe])

  useEffect(() => {
    if (timeframe){
      setDateRange({
        endDate: null,
        startDate: null
      })
    }
  }, [timeframe, setDateRange])

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
    if (!vault || !asset?.type || !vaults.length) return []
    if (assetOnly) return [asset.id]
    switch (asset.type){
      case 'AA':
      case 'BB':
        const otherVaultType = removeItemFromArray<string>(['AA', 'BB'], asset.type)[0]
        const otherVault = vaults.find( (otherVault: Vault) => otherVault && ("cdoConfig" in otherVault) && ("cdoConfig" in vault) && otherVault.type === otherVaultType && otherVault.cdoConfig.address === vault.cdoConfig.address )
        return [asset.id, otherVault?.id]
      default:
        return [asset.id]
    }
  }, [asset, vault, vaults, assetOnly])

  const selectedTimeframe = useMemo(() => {
    return defaultTimeframe || timeframe
  }, [timeframe, defaultTimeframe])

  const selectedDateRange = useMemo(() => {
    return defaultDateRange || dateRange
  }, [dateRange, defaultDateRange])

  const useRatesForPerformanceChartData = asset?.type === 'BY'

  const { allocations, colors: allocationColors, labels: allocationLabels } = useAllocationChartData({ assetIds })
  const { rateChartData } = useRateChartData({ assetIds, timeframe: selectedTimeframe, dateRange: selectedDateRange })
  const { volumeChartData } = useVolumeChartData({ assetIds, timeframe: selectedTimeframe, dateRange: selectedDateRange })
  const { tvlChartData: tvlUsdChartData } = useTVLChartData({ assetIds, timeframe: selectedTimeframe, dateRange: selectedDateRange })
  const { performanceChartData } = usePerformanceChartData({ useRates: useRatesForPerformanceChartData, assetIds, timeframe: selectedTimeframe, dateRange: selectedDateRange })
  
  // console.log('performanceChartData', performanceChartData)

  const assetsAvgApy = useMemo(() => {
    const avgApys = assetIds.reduce( (avgApys: Balances, assetId: AssetId) => {
      return {
        ...avgApys,
        [assetId]: BNify(0)
      }
    }, {})

    if (isEmpty(performanceChartData.rainbow)) return avgApys

    return assetIds.reduce( (avgApys: Balances, assetId: AssetId) => {
      const asset = selectAssetById(assetId)

      const firstDataPoint = performanceChartData.rainbow[0] as RainbowData
      const lastDataPoint = [...performanceChartData.rainbow].pop() as RainbowData

      const assetFirstPrice = bnOrZero(firstDataPoint[assetId])
      const assetLastPrice = bnOrZero(lastDataPoint[assetId])

      const earningsDays = bnOrZero(lastDataPoint.date).minus(firstDataPoint.date).div(1000).div(86400)
      const earningsPercentage = assetLastPrice.div(assetFirstPrice).minus(1).times(100)
      let avgApy = earningsDays.gt(0) ? earningsPercentage.times(365).div(earningsDays) : BNify(0)

      if (asset?.apyBreakdown?.harvest && BNify(asset?.apyBreakdown?.harvest).gt(0)){
        avgApy = avgApy.plus(asset?.apyBreakdown?.harvest)
      }

      if (earningsPercentage && earningsDays.gt(0)){
        if (asset?.apyBreakdown?.rewards && BNify(asset?.apyBreakdown?.rewards).gt(0)){
          avgApy = avgApy.plus(asset?.apyBreakdown?.rewards)
        }
      }

      return {
        ...avgApys,
        [assetId]: avgApy
      }
    }, {...avgApys})
  }, [assetIds, performanceChartData, selectAssetById])

  const assetsApys = useMemo(() => {
    if (isEmpty(assetsAvgApy)) return null
    return (
      <HStack
        spacing={4}
        width={'full'}
      >
        {
          assetIds.map( (assetId: AssetId) => {
            const asset = selectAssetById(assetId)
            const color = strategies[asset.type].color
            const apy = assetsAvgApy[assetId]
            return (
              <HStack
                spacing={1}
                alignItems={'baseline'}
                key={`asset_${assetId}`}
              >
                <Amount.Percentage textStyle={'heading'} fontSize={'lg'} color={color} value={apy} />
                <Translation translation={'defi.avgApy'} fontSize={'sm'} color={'cta'} />
              </HStack>
            )
          })
        }
      </HStack>
    )
  }, [assetIds, assetsAvgApy, selectAssetById])

  const tvlUsd = useMemo((): BigNumber => {
    return assetIds.reduce( (totalTvlUsd: BigNumber, assetId: AssetId) => {
      const asset = selectAssetById(assetId)
      if (!asset) return totalTvlUsd
      return totalTvlUsd.plus(asset.tvlUsd)
    }, BNify(0))
  }, [assetIds, selectAssetById])

  const compositionData: DonutChartInitialData = useMemo(() => {
    const initialData: DonutChartInitialData = {
      data:[],
      colors:{}
    }
    // console.log('assetIds', assetIds)
    if (!assetIds) return initialData

    if (strategyConfig?.strategy === 'best'){

      const donutChartData = initialData

      Object.keys(allocations).forEach( (protocol: string) => {
        const protocolConfig = selectProtocol(protocol)
        const allocationPercentage = BNify(allocations[protocol])
        const allocationUsd = tvlUsd.times(allocationPercentage.div(100))
        donutChartData.colors[protocol] = allocationColors[protocol] as string
        donutChartData.data.push({
          value: parseFloat(allocationUsd.toFixed(2)),
          label: protocol,
          extraData: {
            icon: protocolConfig?.icon,
            color: allocationColors[protocol],
            label: allocationLabels[protocol]
          }
        })
      })

      return donutChartData
    } else {
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
    }
  }, [tvlUsd, assetIds, strategyConfig, selectAssetById, allocations, allocationColors, allocationLabels])

  // console.log('allocations', allocations)
  // console.log('compositionData', compositionData)

  const getSliceData = useCallback((selectedSlice: DonutChartData) => {
    const totalFunds = compositionData.data.reduce( (total: BigNumber, data: DonutChartData) => total.plus(data.value), BNify(0))
    const formatFn = (n: any) => `$${formatMoney(n, 0)}`
    const selectedAsset = selectedSlice?.extraData?.asset

    const customIcon = selectedSlice?.extraData?.icon
    const customLabel = selectedSlice?.extraData?.label
    const customColor = selectedSlice?.extraData?.color
    // console.log('selectedSlice', selectedSlice)
    // if (!asset) return null
    const icon = customIcon || selectedAsset?.icon || asset?.icon
    const label = customLabel || (selectedAsset ? translate(strategies[selectedAsset.type].label) : translate('dashboard.portfolio.totalChart'))
    const value = selectedSlice ? formatFn(selectedSlice.value) : formatFn(totalFunds)
    const color = customColor || (selectedAsset ? strategies[selectedAsset?.type].color : '#ffffff')

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
          fontWeight={700}
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

  const volume = useMemo((): BigNumber => {
    return volumeChartData.total.reduce( (total: BigNumber, data: HistoryData) => total.plus(Math.abs(data.value)), BNify(0) )
  }, [volumeChartData])

  const [
    timeframeStartTimestamp,
    timeframeEndTimestamp
  ] = useMemo(() => getChartTimestampBounds(selectedTimeframe, dateRange), [selectedTimeframe, dateRange])

  // console.log('timeframe', timeframe)
  // console.log('dateRange', dateRange)
  // console.log('timeframeStartTimestamp', timeframeStartTimestamp)
  // console.log('timeframeEndTimestamp', timeframeEndTimestamp)

  const collectedFees = useMemo((): Transaction[] => {
    const collectedFees = assetIds.reduce( ( collectedFees: Transaction[], assetId: AssetId) => {
      const asset = selectAssetById(assetId)
      if (!asset || !asset.collectedFees) return collectedFees

      // console.log('asset.collectedFees', assetId, asset.collectedFees)

      const collectedFeesWithAmountUsd = asset.collectedFees.map( (tx: Transaction) => {
        tx.amountUsd = tx.underlyingAmount
        const tokenPriceUsd = selectAssetHistoricalPriceUsdByTimestamp(tx.assetId, floorTimestamp(+tx.timeStamp*1000))
        if (tokenPriceUsd?.value){
          tx.amountUsd = tx.amountUsd.times(tokenPriceUsd.value)
        }
        return tx
      })

      return [
        ...collectedFees,
        ...collectedFeesWithAmountUsd
      ]
    }, [])
    return collectedFees.filter( (tx: Transaction) => (+tx.timeStamp*1000)>=timeframeStartTimestamp && (!timeframeEndTimestamp || (+tx.timeStamp*1000)<=timeframeEndTimestamp) )
  }, [assetIds, selectAssetById, selectAssetHistoricalPriceUsdByTimestamp, timeframeStartTimestamp, timeframeEndTimestamp])

  const collectedFeesUsd = useMemo((): BigNumber => {
    return collectedFees.reduce( (total: BigNumber, tx: Transaction) => total.plus(bnOrZero(tx.amountUsd)), BNify(0) )
  }, [collectedFees])

  // console.log('asset', asset)
  // console.log('assetIds', assetIds)
  // console.log('rateChartData', rateChartData)
  // console.log('collectedFees', collectedFees)
  // console.log('tvlUsdChartData', tvlUsdChartData)
  // console.log('volumeChartData', volumeChartData)
  // console.log('performanceChartData', performanceChartData)

  const aboutItems = useMemo(() => {
    const items = []
    
    if (vault){
      switch (strategyConfig?.strategy){
        case 'tranches':
          items.push({
            address: vault.cdoConfig.address,
            translation:'about.cdo',
          })
          items.push({
            address: vault.strategyConfig.address,
            translation:'about.strategy',
          })
        break;
        default:
        break;
      }
    }

    assetIds.forEach((assetId: AssetId) => {
      const asset = selectAssetById(assetId)
      if (!asset) return null
      items.push({
        address: asset.id,
        translation:[`about.${asset.type}`],
      })
    })

    strategyConfig?.feesCollectors?.forEach( (address: string) => {
      items.push({
        address,
        translation:'about.feeCollector'
      })
    })

    if (asset?.type === 'BY'){
      const timelockContract = contracts.find( (contract: GenericContract) => contract.name === 'Timelock' )
      if (timelockContract){
        items.push({
          address: timelockContract.id,
          translation:'about.timelock'
        })
      }

      const governorBravoContract = contracts.find( (contract: GenericContract) => contract.name === 'GovernorBravo' )
      if (governorBravoContract){
        items.push({
          address: governorBravoContract.id,
          translation:'about.governance'
        })
      }
    }

    return items.map( (item, index) => <AboutItem chainId={asset.chainId} key={index} {...item} /> )
  }, [assetIds, strategyConfig, selectAssetById, asset, vault, contracts])

  const aggregatedCards = useMemo(() => (
    <SimpleGrid
      spacing={4}
      width={'full'}
      columns={[1, 4]}
    >
      <Card>
        <Translation mb={1} translation={'defi.tvl'} textStyle={'captionSmall'} />
        <Amount.Usd abbreviate={false} decimals={0} value={tvlUsd} textStyle={'ctaStatic'} fontSize={'xl'} />
        {
          /*
          strategyConfig?.strategy === 'tranches' && (
            <HStack
              spacing={5}
            >
            {
              assetIds.map( (assetId: AssetId) => {
                const asset = selectAssetById(assetId)
                if (!asset) return null
                return (
                  <AssetProvider
                    assetId={assetId}
                    wrapFlex={false}
                    key={`asset_${assetId}`}
                  >
                    <AssetProvider.PoolUsd textStyle={'ctaStatic'} color={assetIds.length>1 ? `strategies.${asset?.type}` : 'primary'} fontSize={'sm'} />
                  </AssetProvider>
                )
              })
            }
            </HStack>
          )
          */
        }
      </Card>
      {
        strategyConfig?.strategy === 'tranches' ? (
          <Card>
            <Translation mb={1} translation={'defi.apyRatio'} textStyle={'captionSmall'} />
            <HStack
              spacing={5}
            >
            {
              assetIds.map( (assetId: AssetId) => {
                const asset = selectAssetById(assetId)
                if (!asset) return null
                return (
                  <AssetProvider
                    assetId={assetId}
                    wrapFlex={false}
                    key={`asset_${assetId}`}
                  >
                    <AssetProvider.ApyRatio textStyle={'ctaStatic'} color={assetIds.length>1 ? `strategies.${asset?.type}` : 'primary'} fontSize={'xl'} />
                  </AssetProvider>
                )
              })
            }
            </HStack>
          </Card>
        ) : (
          <Card>
            <Translation mb={1} translation={'defi.avgApy'} textStyle={'captionSmall'} />
            <Amount.Percentage value={avgApy} textStyle={'ctaStatic'} fontSize={'xl'} />
          </Card>
        )
      }
      <Card>
        <Translation mb={1} translation={'stats.totalVolume'} textStyle={'captionSmall'} />
        <Amount.Usd abbreviate={false} decimals={0} value={volume} textStyle={'ctaStatic'} fontSize={'xl'} />
      </Card>
      <Card>
        <Translation mb={1} translation={'stats.collectedFees'} textStyle={'captionSmall'} />
        <TokenAmount abbreviate={false} decimals={collectedFeesUsd.lt(10) ? 2 : 0} assetId={asset?.id} amount={collectedFeesUsd} showIcon={false} textStyle={'ctaStatic'} fontSize={'xl'} />
      </Card>
    </SimpleGrid>
  ), [tvlUsd, avgApy, volume, assetIds, asset, collectedFeesUsd, selectAssetById, strategyConfig])

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
              spacing={[4, 8]}
              alignItems={['flex-start','center']}
              justifyContent={'flex-start'}
              direction={['column', 'row']}
            >
              <HStack
                spacing={2}
                alignItems={'center'}
              >
                <AssetLabel assetId={params.asset} fontSize={'h2'} />
                <AssetProvider.ChainIcon width={6} height={6} />
              </HStack>
              <Stack
                pb={3}
                flex={1}
                spacing={[4, 0]}
                width={['full', 'auto']}
                borderBottom={'1px solid'}
                borderColor={'divider'}
                justifyContent={'space-between'}
                direction={['column', 'row']}
                alignItems={['flex-start','center']}
              >
                <HStack
                  spacing={6}
                  width={['full', 'auto']}
                  justifyContent={'flex-start'}
                >
                  <HStack
                    spacing={0}
                    position={'relative'}
                  >
                    <ProductTag type={strategyConfig?.strategy as string} py={2} />
                    <Flex
                      top={'-12px'}
                      right={'-12px'}
                      position={'absolute'}
                    >
                      <AssetProvider.Strategies />
                    </Flex>
                  </HStack>
                  {
                    strategyConfig?.stats?.header?.fields?.map( (field: string) => (
                      <AssetProvider.GeneralData key={`field_${field}`} field={field} color={'cta'} />
                    ))
                  }
                </HStack>
                <Stack
                  spacing={2}
                  width={['full', 'auto']}
                  direction={['column', 'row']}
                  justifyContent={['flex-start','center']}
                >
                  <TimeframeSelector variant={'button'} timeframe={timeframe} setTimeframe={setTimeframe} width={['100%', 'auto']} justifyContent={['center', 'initial']} />
                  <DatePicker selected={useDateRange} setDateRange={setDateRange} />
                </Stack>
              </Stack>
            </Stack>
          )
        }
        {aggregatedCards}
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
                  if (!asset) return null
                  return (
                    <AssetProvider
                      wrapFlex={false}
                      assetId={asset?.id}
                      key={`row_${assetId}`}
                    >
                      <VStack
                        spacing={6}
                        width={'full'}
                        alignItems={'flex-start'}
                      >
                        <Translation translation={strategies[asset?.type].label} textStyle={'ctaStatic'} fontWeight={600} fontSize={'lg'} />
                        <SimpleGrid
                          spacing={4}
                          columns={2}
                          width={'full'}
                        >
                          <Card>
                            <Translation mb={1} translation={'defi.avgApy'} textStyle={'captionSmall'} />
                            <Amount.Percentage value={assetsAvgApy[assetId]} textStyle={'ctaStatic'} color={`strategies.${asset?.type}`} fontSize={'xl'} />
                          </Card>
                          {
                            strategies[asset?.type].stats?.strategyData?.fields.map( (field: string) => (
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
                {
                  performanceChartData && !performanceChartData.rainbow?.length && (
                    <Center
                      layerStyle={'overlay'}
                      bg={'rgba(0, 0, 0, 0.4)'}
                    >
                      <Translation translation={'dashboard.assetChart.empty'} textAlign={'center'} py={1} px={3} bg={'rgba(0, 0, 0, 0.2)'} borderRadius={8} />
                    </Center>
                  )
                }
                <VStack
                  spacing={4}
                  width={'full'}
                >
                  {
                    performanceChartData && performanceChartData.rainbow?.length>0 && (
                      <HStack
                        width={'full'}
                        justifyContent={'space-between'}
                      >
                        {assetsApys}
                        <DownloadCsvData chartData={performanceChartData} isRainbowChart={true} fileName={`performances_${asset?.id}_${timeframeStartTimestamp}_${timeframeEndTimestamp}.csv`} />
                      </HStack>
                    )
                  }
                  <GenericChart
                    percentChange={0}
                    assetIds={assetIds}
                    color={strategyColor}
                    maxMinEnabled={true}
                    isRainbowChart={true}
                    data={performanceChartData}
                    setPercentChange={() => {}}
                    timeframe={selectedTimeframe}
                    height={isMobile ? '300px' : '350px'}
                    scaleType={assetIds.length>1 ? 'log' : 'linear'}
                    margins={{ top: 10, right: 0, bottom: 60, left: 0 }}
                    formatFn={(n: any) => `${abbreviateNumber(n, 8)} ${asset?.name}`}
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
                flex={1}
              >
                {
                  tvlUsdChartData && !tvlUsdChartData.rainbow?.length && (
                    <Center
                      layerStyle={'overlay'}
                      bg={'rgba(0, 0, 0, 0.4)'}
                    >
                      <Translation translation={'dashboard.assetChart.empty'} textAlign={'center'} py={1} px={3} bg={'rgba(0, 0, 0, 0.2)'} borderRadius={8} />
                    </Center>
                  )
                }
                <GenericChart
                  percentChange={0}
                  assetIds={assetIds}
                  maxMinEnabled={true}
                  isRainbowChart={true}
                  color={strategyColor}
                  data={tvlUsdChartData}
                  setPercentChange={() => {}}
                  timeframe={selectedTimeframe}
                  height={isMobile ? '300px' : '350px'}
                  formatFn={(n: any) => `$${formatMoney(n, 0)}`}
                  scaleType={assetIds.length>1 ? 'log' : 'linear'}
                  margins={{ top: 10, right: 0, bottom: 60, left: 0 }}
                  fileName={tvlUsdChartData && tvlUsdChartData.rainbow?.length>0 ? `tvls_${asset?.id}_${timeframeStartTimestamp}_${timeframeEndTimestamp}.csv` : null}
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
                flex={1}
              >
                {
                  rateChartData && !rateChartData.rainbow?.length && (
                    <Center
                      layerStyle={'overlay'}
                      bg={'rgba(0, 0, 0, 0.4)'}
                    >
                      <Translation translation={'dashboard.assetChart.empty'} textAlign={'center'} py={1} px={3} bg={'rgba(0, 0, 0, 0.2)'} borderRadius={8} />
                    </Center>
                  )
                }
                <GenericChart
                  percentChange={0}
                  assetIds={assetIds}
                  data={rateChartData}
                  color={strategyColor}
                  maxMinEnabled={true}
                  isRainbowChart={true}
                  setPercentChange={() => {}}
                  timeframe={selectedTimeframe}
                  height={isMobile ? '300px' : '350px'}
                  formatFn={(n: any) => `${numberToPercentage(n)}`}
                  margins={{ top: 10, right: 0, bottom: 60, left: 0 }}
                  fileName={rateChartData && rateChartData.rainbow?.length>0 ? `rates_${asset?.id}_${timeframeStartTimestamp}_${timeframeEndTimestamp}.csv` : null}
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
                <VStack
                  flex={1}
                  spacing={4}
                  width={'full'}
                  height={'full'}
                  alignItems={'flex-end'}
                >
                  <DownloadCsvData chartData={volumeChartData} isRainbowChart={true} fileName={`volumes_${asset?.id}_${timeframeStartTimestamp}_${timeframeEndTimestamp}.csv`} />
                  <VolumeChart
                    assetIds={assetIds}
                    dateRange={dateRange}
                    timeframe={selectedTimeframe}
                  />
                </VStack>
              </Card.Dark>
            </VStack>
          </SimpleGrid>
        </VStack>
        <SimpleGrid
          width={'full'}
          spacing={6}
          columns={[1, 2]}
        >
          <TransactionList assetIds={assetIds} transactions={collectedFees} showTitleOnMobile={true} title={'stats.collectedFees'} emptyText={'stats.collectedFeesEmpty'} maxH={600} />
          <Card>
            <VStack
              flex={1}
              spacing={0}
              height={'100%'}
              alignItems={'flex-start'}
              justifyContent={'flex-start'}
            >
              <Translation component={Card.Heading} translation={'common.about'} />
              <Scrollable maxH={600}>
                {aboutItems}
              </Scrollable>
            </VStack>
          </Card>
        </SimpleGrid>
      </VStack>
    </AssetProvider>
  )
}