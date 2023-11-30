import { strategies } from 'constants/'
import { NavLink } from "react-router-dom"
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import useLocalForge from 'hooks/useLocalForge'
import { Amount } from 'components/Amount/Amount'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { MaticNFTs } from 'components/MaticNFTs/MaticNFTs'
import { useWalletProvider } from 'contexts/WalletProvider'
import React, { useMemo, useState, useEffect } from 'react'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { VaultRewards } from 'components/VaultRewards/VaultRewards'
import { GenericChart } from 'components/GenericChart/GenericChart'
import { bnOrZero, BNify, abbreviateNumber, isEmpty } from 'helpers/'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { HistoryTimeframe, BigNumber, Paragraph } from 'constants/types'
import { AssetGeneralData } from 'components/AssetGeneralData/AssetGeneralData'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { useBalanceChartData } from 'hooks/useBalanceChartData/useBalanceChartData'
import { AssetDiscountedFees } from 'components/AssetDiscountedFees/AssetDiscountedFees'
import { usePerformanceChartData } from 'hooks/usePerformanceChartData/usePerformanceChartData'
import { AssetDistributedRewards } from 'components/AssetDistributedRewards/AssetDistributedRewards'
import { VaultUnderlyingProtocols } from 'components/VaultUnderlyingProtocols/VaultUnderlyingProtocols'
import { StrategyDescriptionCarousel } from 'components/StrategyDescriptionCarousel/StrategyDescriptionCarousel'
import { Heading, Center, Box, Stack, Text, SimpleGrid, HStack, Switch, VStack, SkeletonText } from '@chakra-ui/react'

export const Earn: React.FC = () => {
  const translate = useTranslate()
  const { params } = useBrowserRouter()
  const { account } = useWalletProvider()
  const { isMobile } = useThemeProvider()
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.WEEK)
  const [ useDollarConversion, setUseDollarConversion ] = useLocalForge('useDollarConversion', true)
  const {
    stakingData,
    isPortfolioLoaded,
    isVaultsPositionsLoaded,
    selectors: {
      selectAssetById,
      selectVaultById,
      selectAssetBalance,
      selectAssetBalanceUsd
    }
  } = usePortfolioProvider()

  const strategy = useMemo(() => {
    return Object.keys(strategies).find( strategy => strategies[strategy].route === params.strategy )
  }, [params])

  const strategyColor = useMemo(() => {
    return strategy && strategies[strategy].color
  }, [strategy])

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const vault = useMemo(() => {
    return asset && selectVaultById && selectVaultById(asset.id)
  }, [selectVaultById, asset])

  const assetBalanceUnderlying = useMemo(() => {
    if (!asset?.id) return
    return selectAssetBalance && selectAssetBalance(asset.id)
  }, [asset, selectAssetBalance])

  const assetBalance = useMemo(() => {
    if (!asset?.id) return
    return selectAssetBalanceUsd && selectAssetBalanceUsd(asset.id)
  }, [asset, selectAssetBalanceUsd])

  const userHasBalance = useMemo(() => {
    return asset?.vaultPosition && assetBalance && assetBalance.gt(0)
  }, [asset, assetBalance])

  // console.log('asset', asset, assetBalance, userHasBalance)

  const { balanceChartData } = useBalanceChartData({ assetIds: [asset?.id], timeframe, useDollarConversion })
  const { performanceChartData } = usePerformanceChartData({ assetIds: [asset?.id], timeframe })

  // console.log('balanceChartData', balanceChartData)

  const chartData = useMemo(() => {
    if (!isPortfolioLoaded) return
    return userHasBalance ? balanceChartData : performanceChartData
  }, [isPortfolioLoaded, userHasBalance, balanceChartData, performanceChartData])

  useEffect(() => {
    if (!isPortfolioLoaded) return
    if (useDollarConversion && !userHasBalance){
      setUseDollarConversion(false)
    }
  }, [isPortfolioLoaded, useDollarConversion, userHasBalance, setUseDollarConversion])

  // console.log('performanceChartData', timeframe, performanceChartData)

  // const onTabClick = useCallback((row: RowProps) => {
  //   return navigate(`${location?.pathname}/${row.original.id}`)
  // }, [navigate, location])

  const chartHeading = useMemo(() => {
    const earningsPercentage = userHasBalance ? asset?.vaultPosition?.earningsPercentage : chartData?.total?.length && BNify(chartData.total[chartData.total.length-1].value).div(chartData.total[0].value).minus(1).times(100)
    const earningsDays = chartData?.total?.length ? BNify(chartData.total[chartData.total.length-1].date).minus(chartData.total[0].date).div(1000).div(86400) : BNify(0)
    const isLoaded = (chartData?.total/* && chartData.total.length>0*/) && !!isPortfolioLoaded && (!account || isVaultsPositionsLoaded)
    
    let apy = earningsPercentage && earningsDays.gt(0) ? earningsPercentage.times(365).div(earningsDays) : bnOrZero(asset?.apy)

    if (asset?.apyBreakdown?.harvest && BNify(asset?.apyBreakdown?.harvest).gt(0)){
      apy = apy.plus(asset?.apyBreakdown?.harvest)
    }

    if (earningsPercentage && earningsDays.gt(0)){
      if (asset?.apyBreakdown?.rewards && BNify(asset?.apyBreakdown?.rewards).gt(0)){
        apy = apy.plus(asset?.apyBreakdown?.rewards)
      }
    }
    return (
      <VStack
        spacing={1}
        width={['full','auto']}
        alignItems={['center','flex-start']}
      >
        <SkeletonText noOfLines={2} isLoaded={isLoaded}>
          <Translation translation={ userHasBalance ? 'dashboard.portfolio.totalChart' : 'dashboard.portfolio.assetPerformance'} component={Text} textStyle={'caption'} textAlign={['center','left']} />
          <HStack
            spacing={3}
            width={['full','auto']}
            alignItems={'baseline'}
          >
            {
              userHasBalance ? (
                useDollarConversion ? <AssetProvider.BalanceUsd textStyle={'heading'} textAlign={['center','left']} fontSize={'3xl'} /> : <AssetProvider.Redeemable textStyle={'heading'} textAlign={['center','left']} fontSize={'3xl'} suffix={` ${asset?.name}`} />
              ) : (
                <Stack
                  spacing={[0, 2]}
                  alignItems={'baseline'}
                  direction={['column', 'row']}
                >
                  <Amount.Percentage value={apy} suffix={' APY'} textStyle={'heading'} textAlign={['center','left']} fontSize={'3xl'} />
                  {
                    asset?.apyBreakdown?.gauge && BNify(asset?.apyBreakdown?.gauge).gt(0) && (
                      <Amount.Percentage prefix={'+'} value={asset?.apyBreakdown?.gauge} suffix={` (${translate('assets.assetDetails.apyBreakdown.gauge')})`} textStyle={'caption'} />
                    )/* : asset?.apyBreakdown?.harvest && BNify(asset?.apyBreakdown?.harvest).gt(0) && (
                      <Amount.Percentage prefix={'+'} value={asset?.apyBreakdown?.harvest} suffix={` (${translate('assets.assetDetails.apyBreakdown.harvest')})`} textStyle={'caption'} />
                    )*/
                  }
                </Stack>
              )
            }
            {
              /*
                <Stat>
                  <HStack spacing={2}>
                    {
                      userHasBalance ? (
                        <AssetProvider.RealizedApy suffix={' APY'} textStyle={'caption'} />
                      ) : apy.gt(0) && (
                        <HStack
                          spacing={1}
                        >
                          <Amount.Percentage value={apy} suffix={' APY'} textStyle={'caption'} />
                        </HStack>
                      )
                    }
                    {
                      earningsPercentage && (
                        <StatArrow type={earningsPercentage.gt(0) ? 'increase' : 'decrease'} />
                      )
                    }
                  </HStack>
                </Stat>
              */
            }
          </HStack>
        </SkeletonText>
      </VStack>
    )
  }, [asset, userHasBalance, translate, chartData, useDollarConversion, account, isVaultsPositionsLoaded, isPortfolioLoaded])

  const feeDiscountEnabled = useMemo(() => {
    return asset && "flags" in asset && !!asset.flags?.feeDiscountEnabled
  }, [asset])

  const fundsOverview = useMemo(() => {
    if (!asset || !userHasBalance) return null
    return (
      <SimpleGrid
        width={'full'}
        columns={[2, 4]}
        spacing={[10, 14]}
        alignItems={'flex-start'}
      >
        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.deposited'} textStyle={'titleSmall'} />
          <AssetProvider.DepositedUsd textStyle={'heading'} fontSize={'h3'} />
          <HStack spacing={1}>
            <AssetProvider.Deposited decimals={4} textStyle={'captionSmaller'} />
            <AssetProvider.Name textStyle={'captionSmaller'} />
          </HStack>
        </VStack>
        {
          /*
          <VStack
            spacing={2}
            justifyContent={'center'}
          >
            <Translation component={Text} translation={'defi.redeemable'} textStyle={'titleSmall'} />
            <AssetProvider.BalanceUsd textStyle={'heading'} fontSize={'h3'} />
            <HStack spacing={1}>
              <AssetProvider.Redeemable decimals={4} textStyle={'captionSmaller'} />
              <AssetProvider.Name textStyle={'captionSmaller'} />
            </HStack>
          </VStack>
          */
        }

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.netEarnings'} textStyle={'titleSmall'} />
          <AssetProvider.NetEarningsUsd textStyle={'heading'} fontSize={'h3'} />
          <HStack spacing={1}>
            <AssetProvider.NetEarnings decimals={4} textStyle={'captionSmaller'} />
            <AssetProvider.Name textStyle={'captionSmaller'} />
          </HStack>
        </VStack>

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.fees'} textStyle={'titleSmall'} />
          <AssetProvider.FeesUsd textStyle={'heading'} fontSize={'h3'} />
          {
            feeDiscountEnabled && (
              bnOrZero(stakingData?.feeDiscount).gt(0) ? (
                <Translation translation={'assets.fundsOverview.discount'} params={{discount: bnOrZero(stakingData?.feeDiscount)}} fontWeight={'600'} color={'brightGreen'} fontSize={'xs'} />
              ) : (
                <NavLink to={'/stake'}>
                  <Translation translation={'feeDiscount.enable'} color={'link'} fontSize={'xs'} />
                </NavLink>
              )
            )
          }
        </VStack>

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.realizedApy'} textStyle={'titleSmall'} />
          <AssetProvider.RealizedApy textStyle={'heading'} fontSize={'h3'} />
          <Text textStyle={'captionSmaller'}></Text>
        </VStack>
      </SimpleGrid>
    )
  }, [asset, stakingData, userHasBalance, feeDiscountEnabled])

  const strategyDescriptionCarousel = useMemo(() => {
    if (!strategy || !isPortfolioLoaded) return null
    const strategyProps = strategies[strategy]
    if (!strategyProps?.carouselItems) return null
    return (
      <StrategyDescriptionCarousel color={strategyColor} strategy={strategy} delay={10000} />
    )
  }, [strategy, strategyColor, isPortfolioLoaded])

  const strategyDescription = useMemo(() => {
    if (!vault || !("description" in vault) || !vault.description) return null
    return (
      <VStack
        spacing={6}
        alignItems={'flex-start'}
      >
        <Translation component={Heading} as={'h3'} fontSize={'h3'} translation={'defi.strategyDescription'} />
        <Card.Dark>
          <Text dangerouslySetInnerHTML={{__html: vault.description}} />
        </Card.Dark>
      </VStack>
    )
  }, [vault])

  const coveredRisks = useMemo(() => {
    if (!vault || !("risks" in vault) || !vault.risks) return null
    return (
      <VStack
        pt={4}
        spacing={6}
        alignItems={'flex-start'}
      >
        <Translation component={Heading} as={'h3'} fontSize={'h3'} translation={'defi.coveredRisks'} />
        <Card.Dark>
          <VStack
            spacing={4}
          >
            {
              vault.risks.map( (paragraph: Paragraph, index: number) => {
                return (
                  <VStack
                    spacing={2}
                    width={'full'}
                    alignItems={'flex-start'}
                    key={`paragraph_${index}`}
                  >
                    {
                      paragraph.title && (
                        <Heading as={'h4'} fontSize={'h4'} dangerouslySetInnerHTML={{__html: paragraph.title}} />
                      )
                    }
                    {
                      paragraph.description && (
                        <Text dangerouslySetInnerHTML={{__html: paragraph.description}} />
                      )
                    }
                  </VStack>
                )
              })
            }
          </VStack>
        </Card.Dark>
      </VStack>
    )
  }, [vault])

  const vaultRewards = useMemo(() => {
    // console.log('vaultRewards', asset)
    if (!asset || isEmpty(asset.rewards)) return null
    const totalRewards = (Object.values(asset.rewards) as BigNumber[]).reduce( (totalRewards: BigNumber, amount: BigNumber) => totalRewards.plus(amount), BNify(0) )
    return totalRewards.gt(0) ? (
      <VaultRewards assetId={asset?.id} />
    ) : null
  }, [asset])

  const decimals = useMemo(() => {
    return !useDollarConversion && bnOrZero(assetBalanceUnderlying).lt(1000) ? 3 : 2
  }, [assetBalanceUnderlying, useDollarConversion])

  return (
    <>
      <Box>
        <HStack
          mb={6}
          spacing={6}
          alignItems={'center'}
        >
          <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded}>
            <Translation component={Heading} as={'h3'} fontSize={'lg'} translation={userHasBalance ? 'defi.fundsOverview' : 'defi.historicalPerformance'} />
          </SkeletonText>
          {
            userHasBalance && (
              <HStack
                spacing={2}
              >
                <AssetProvider.Name fontWeight={600} />
                <Switch size={'md'} isChecked={useDollarConversion} onChange={ (e) => setUseDollarConversion(e.target.checked) } />
                <Text fontWeight={600}>USD</Text>
              </HStack>
            )
          }
        </HStack>
        <Card.Flex
          p={0}
          overflow={'hidden'}
          direction={'column'}
          minH={['auto', 460]}
          position={'relative'}
          layerStyle={'cardDark'}
          justifyContent={'space-between'}
        >
          {
            chartData && !chartData.total?.length && (
              <Center
                layerStyle={'overlay'}
                bg={'rgba(0, 0, 0, 0.4)'}
              >
                <Translation translation={'dashboard.assetChart.empty'} textAlign={'center'} component={Text} py={1} px={3} bg={'rgba(0, 0, 0, 0.2)'} borderRadius={8} />
              </Center>
            )
          }
          <Stack
            pt={[6, 8]}
            px={[6, 8]}
            pb={[4, 0]}
            zIndex={9}
            width={'full'}
            alignItems={'flex-start'}
            direction={['column', 'row']}
            justifyContent={['center', 'space-between']}
          >
            {chartHeading}
            {
              (!userHasBalance || (chartData && chartData.total?.length>0)) && (
                <TimeframeSelector width={['full', 'auto']} justifyContent={['center', 'flex-end']} timeframe={timeframe} setTimeframe={setTimeframe} />
              )
            }
          </Stack>
          <GenericChart
            data={chartData}
            percentChange={0}
            color={strategyColor}
            timeframe={timeframe}
            isRainbowChart={false}
            assetIds={[params.asset]}
            setPercentChange={() => {}}
            height={isMobile ? '300px' : '350px'}
            margins={{ top: 10, right: 0, bottom: 65, left: 0 }}
            formatFn={ !useDollarConversion ? ((n: any) => `${abbreviateNumber(n, decimals)} ${asset?.name}`) : undefined }
            // formatFn={(n: any) => `${abbreviateNumber(n)} ${asset?.name}`}
          />
        </Card.Flex>
      </Box>
      {fundsOverview}
      <AssetDiscountedFees assetId={asset?.id} />
      <AssetDistributedRewards assetId={asset?.id} />
      <MaticNFTs assetId={asset?.id} />
      {vaultRewards}
      <VStack
        spacing={4}
        width={'full'}
      >
        {strategyDescriptionCarousel}
        {strategyDescription}
        {coveredRisks}
      </VStack>
      <AssetGeneralData assetId={asset?.id} />
      <VaultUnderlyingProtocols assetId={asset?.id} />
    </>
  )
}