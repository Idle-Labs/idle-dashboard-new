import BigNumber from 'bignumber.js'
import type { Vault } from 'vaults/'
import { selectProtocol } from 'selectors/'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import { Amount } from 'components/Amount/Amount'
import { FEES_COLLECTORS, strategies } from 'constants/'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { GenericContract } from 'contracts/GenericContract'
import { Scrollable } from 'components/Scrollable/Scrollable'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { AddressLink } from 'components/AddressLink/AddressLink'
import { StrategyTag } from 'components/StrategyTag/StrategyTag'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { VolumeChart } from 'components/VolumeChart/VolumeChart'
import { GenericChart } from 'components/GenericChart/GenericChart'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { useTVLChartData } from 'hooks/useTVLChartData/useTVLChartData'
import React, { useMemo, useCallback, useState, useEffect } from 'react'
import { useRateChartData } from 'hooks/useRateChartData/useRateChartData'
import { TransactionList } from 'components/TransactionList/TransactionList'
import { SimpleGrid, Stack, HStack, VStack, Heading } from '@chakra-ui/react'
import { useVolumeChartData } from 'hooks/useVolumeChartData/useVolumeChartData'
import { TranslationProps, Translation } from 'components/Translation/Translation'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { Transaction, HistoryData, HistoryTimeframe, AssetId } from 'constants/types'
import { useAllocationChartData } from 'hooks/useAllocationChartData/useAllocationChartData'
import { DonutChart, DonutChartData, DonutChartInitialData } from 'components/DonutChart/DonutChart'
import { RainbowData, usePerformanceChartData } from 'hooks/usePerformanceChartData/usePerformanceChartData'
import { BNify, getTimeframeTimestamp, removeItemFromArray, abbreviateNumber, numberToPercentage } from 'helpers/'

type AboutItemProps = {
  translation: TranslationProps["translation"]
  address: string
}

const AboutItem: React.FC<AboutItemProps> = ({
  translation,
  address
}) => (
  <HStack
    py={4}
    width={'full'}
    justifyContent={'space-between'}
    borderBottomWidth={'1px'}
    borderBottomColor={'divider'}
  >
    <Translation translation={translation} textStyle={'tableCell'} />
    <AddressLink address={address} />
  </HStack>
)

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
  const [ selectedStrategies, setSelectedStrategies ] = useState<string[] | undefined>(undefined)
  const { vaults, contracts, selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

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

  const { rateChartData } = useRateChartData({ assetIds, timeframe: selectedTimeframe })
  const { volumeChartData } = useVolumeChartData({ assetIds, timeframe: selectedTimeframe })
  const { tvlChartData: tvlUsdChartData } = useTVLChartData({ assetIds, timeframe: selectedTimeframe })
  const { allocations, colors: allocationColors, labels: allocationLabels } = useAllocationChartData({ assetIds })
  const { performanceChartData } = usePerformanceChartData({ useRates: useRatesForPerformanceChartData, assetIds, timeframe: selectedTimeframe })
  // console.log('performanceChartData', performanceChartData)

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

  const tvlUsd = useMemo((): BigNumber => {
    return assetIds.reduce( (totalTvlUsd: BigNumber, assetId: AssetId) => {
      const asset = selectAssetById(assetId)
      totalTvlUsd = totalTvlUsd.plus(asset.tvlUsd)
      return totalTvlUsd
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
    const formatFn = (n: any) => `$${abbreviateNumber(n)}`
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

  const volume = useMemo((): BigNumber => {
    return volumeChartData.total.reduce( (total: BigNumber, data: HistoryData) => total.plus(Math.abs(data.value)), BNify(0) )
  }, [volumeChartData])

  const timeframeStartTimestamp = useMemo((): number => {
    if (!selectedTimeframe) return 0
    return getTimeframeTimestamp(selectedTimeframe)
  }, [selectedTimeframe])

  const collectedFees = useMemo((): Transaction[] => {
    const collectedFees = assetIds.reduce( ( collectedFees: Transaction[], assetId: AssetId) => {
      const asset = selectAssetById(assetId)
      if (!asset || !asset.collectedFees) return collectedFees
      return [
        ...collectedFees,
        ...asset.collectedFees
      ]
    }, [])
    return collectedFees.filter( (tx: Transaction) => (+tx.timeStamp*1000)>=timeframeStartTimestamp )
  }, [assetIds, selectAssetById, timeframeStartTimestamp])

  const collectedFeesUsd = useMemo((): BigNumber => {
    // const collectedFeesFiltered = collectedFees.filter( (tx: Transaction) => (+tx.timeStamp*1000)>=timeframeStartTimestamp )
    return collectedFees.reduce( (total: BigNumber, tx: Transaction) => total.plus(tx.underlyingAmount), BNify(0) )
  }, [collectedFees])

  // console.log('asset', asset)
  // console.log('rateChartData', rateChartData)
  // console.log('tvlUsdChartData', tvlUsdChartData)
  // console.log('volumeChartData', volumeChartData)
  // console.log('assetIds', assetIds)
  // console.log('collectedFees', collectedFees)
  // console.log('performanceChartData', performanceChartData)

  const aboutItems = useMemo(() => {
    const items = []
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
    assetIds.forEach((assetId: AssetId) => {
      const asset = selectAssetById(assetId)
      if (!asset) return null
      items.push({
        address: asset.id,
        translation:[`about.${asset.type}`],
      })
    })

    FEES_COLLECTORS.forEach( (address: string) => {
      items.push({
        address,
        translation:'about.feeCollector'
      })
    })

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

    return items.map( (item, index) => <AboutItem key={index} {...item} /> )
  }, [assetIds, strategyConfig, selectAssetById, vault, contracts])

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
            <TokenAmount assetId={asset?.id} amount={collectedFeesUsd} showIcon={false} textStyle={'ctaStatic'} fontSize={'xl'} />
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
                    maxMinEnabled={true}
                    isRainbowChart={true}
                    data={performanceChartData}
                    setPercentChange={() => {}}
                    timeframe={selectedTimeframe}
                    height={isMobile ? '300px' : '350px'}
                    margins={{ top: 10, right: 0, bottom: 60, left: 0 }}
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
                  assetIds={assetIds}
                  maxMinEnabled={true}
                  isRainbowChart={true}
                  color={strategyColor}
                  data={tvlUsdChartData}
                  setPercentChange={() => {}}
                  timeframe={selectedTimeframe}
                  height={isMobile ? '300px' : '350px'}
                  margins={{ top: 10, right: 0, bottom: 60, left: 0 }}
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
                  maxMinEnabled={true}
                  isRainbowChart={true}
                  setPercentChange={() => {}}
                  timeframe={selectedTimeframe}
                  height={isMobile ? '300px' : '350px'}
                  formatFn={(n: any) => `${numberToPercentage(n)}`}
                  margins={{ top: 10, right: 0, bottom: 60, left: 0 }}
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