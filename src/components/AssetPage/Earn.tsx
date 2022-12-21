import { strategies } from 'constants/'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import useLocalForge from 'hooks/useLocalForge'
import React, { useMemo, useState } from 'react'
import { Amount } from 'components/Amount/Amount'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { MaticNFTs } from 'components/MaticNFTs/MaticNFTs'
import { BNify, abbreviateNumber, isEmpty } from 'helpers/'
import { useWalletProvider } from 'contexts/WalletProvider'
import { HistoryTimeframe, BigNumber } from 'constants/types'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { VaultRewards } from 'components/VaultRewards/VaultRewards'
import { GenericChart } from 'components/GenericChart/GenericChart'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { AssetGeneralData } from 'components/AssetGeneralData/AssetGeneralData'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { useBalanceChartData } from 'hooks/useBalanceChartData/useBalanceChartData'
import { usePerformanceChartData } from 'hooks/usePerformanceChartData/usePerformanceChartData'
import { VaultUnderlyingProtocols } from 'components/VaultUnderlyingProtocols/VaultUnderlyingProtocols'
import { StrategyDescriptionCarousel } from 'components/StrategyDescriptionCarousel/StrategyDescriptionCarousel'
import { ContainerProps, Heading, Box, Stack, Text, SimpleGrid, HStack, Switch, VStack, SkeletonText } from '@chakra-ui/react'

export const Earn: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const translate = useTranslate()
  const { params } = useBrowserRouter()
  const { account } = useWalletProvider()
  const { isMobile } = useThemeProvider()
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.MONTH)
  const [ useDollarConversion, setUseDollarConversion ] = useLocalForge('useDollarConversion', true)
  const { isPortfolioLoaded, isVaultsPositionsLoaded, selectors: { selectAssetById, selectVaultById, selectAssetBalanceUsd } } = usePortfolioProvider()

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

  const chartData = useMemo(() => {
    if (!isPortfolioLoaded) return
    return userHasBalance ? balanceChartData : performanceChartData
  }, [isPortfolioLoaded, userHasBalance, balanceChartData, performanceChartData])

  // const onTabClick = useCallback((row: RowProps) => {
  //   return navigate(`${location?.pathname}/${row.original.id}`)
  // }, [navigate, location])

  const chartHeading = useMemo(() => {
    const earningsPercentage = userHasBalance ? asset?.vaultPosition?.earningsPercentage : chartData?.total?.length && BNify(chartData.total[chartData.total.length-1].value).div(chartData.total[0].value).minus(1).times(100)
    const earningsDays = chartData?.total?.length ? BNify(chartData.total[chartData.total.length-1].date).minus(chartData.total[0].date).div(1000).div(86400) : BNify(0)
    const apy = earningsPercentage && earningsDays.gt(0) ? earningsPercentage.times(365).div(earningsDays) : BNify(0)

    // const earningsPercentage = performanceChartData?.total?.length && BNify(performanceChartData.total[performanceChartData.total.length-1].value).div(performanceChartData.total[0].value).minus(1).times(100)
    // const earningsDays = performanceChartData?.total?.length ? BNify(performanceChartData.total[performanceChartData.total.length-1].date).minus(performanceChartData.total[0].date).div(1000).div(86400) : BNify(0)
    // const apy = earningsPercentage && earningsDays.gt(0) ? earningsPercentage.times(365).div(earningsDays) : BNify(0)    

    const isLoaded = (chartData?.total && chartData.total.length>0) && !!isPortfolioLoaded && (!account || isVaultsPositionsLoaded)
    
    return (
      <VStack
        spacing={1}
        width={['100%','auto']}
        alignItems={['center','flex-start']}
      >
        <SkeletonText noOfLines={2} isLoaded={isLoaded}>
          <Translation translation={ userHasBalance ? 'dashboard.portfolio.totalChart' : 'dashboard.portfolio.assetPerformance'} component={Text} textStyle={'caption'} textAlign={['center','left']} />
          {/*<Translation translation={'dashboard.portfolio.assetPerformance'} component={Text} textStyle={'caption'} textAlign={['center','left']} />*/}
          <HStack
            spacing={3}
            width={['100%','auto']}
            alignItems={'baseline'}
          >
            {/*<Amount.Percentage value={apy} suffix={' APY'} textStyle={'heading'} textAlign={['center','left']} fontSize={'2xl'} />*/}
            {
              userHasBalance ? (
                useDollarConversion ? <AssetProvider.BalanceUsd textStyle={'heading'} textAlign={['center','left']} fontSize={'2xl'} /> : <AssetProvider.Redeemable textStyle={'heading'} textAlign={['center','left']} fontSize={'2xl'} suffix={` ${asset?.name}`} />
              ) : (
                <Stack
                  spacing={[0, 2]}
                  alignItems={'baseline'}
                  direction={['column', 'row']}
                >
                  <Amount.Percentage value={apy} suffix={' APY'} textStyle={'heading'} textAlign={['center','left']} fontSize={'2xl'} />
                  {
                    asset?.apyBreakdown?.gauge && BNify(asset?.apyBreakdown?.gauge).gt(0) && (
                      <Amount.Percentage prefix={'+'} value={asset?.apyBreakdown?.gauge} suffix={` (${translate('assets.assetDetails.apyBreakdown.gauge')})`} textStyle={'caption'} />
                    )
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

  const fundsOverview = useMemo(() => {
    if (!asset || !userHasBalance) return null
    return (
      <SimpleGrid
        width={'100%'}
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

        {
          /*
          <VStack
            spacing={2}
            justifyContent={'center'}
          >
            <Translation component={Text} translation={'defi.fees'} textStyle={'titleSmall'} />
            <AssetProvider.FeesUsd textStyle={'heading'} fontSize={'h3'} />
            <HStack spacing={1}>
              <AssetProvider.Fees decimals={4} textStyle={'captionSmaller'} />
              <AssetProvider.Name textStyle={'captionSmaller'} />
            </HStack>
          </VStack>
          */
        }

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
  }, [asset, userHasBalance])

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
        <Translation component={Heading} as={'h3'} size={'md'} translation={'defi.strategyDescription'} />
        <Card.Dark>
          <Text dangerouslySetInnerHTML={{__html: vault.description}} />
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

  return (
    <>
      <Box>
        <HStack
          mb={6}
          spacing={6}
          alignItems={'center'}
        >
          <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded}>
            <Translation component={Heading} as={'h3'} size={'md'} translation={userHasBalance ? 'defi.fundsOverview' : 'defi.historicalPerformance'} />
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
          layerStyle={'cardDark'}
          justifyContent={'space-between'}
        >
          <Stack
            pt={[6, 8]}
            px={[6, 8]}
            pb={[4, 0]}
            width={'100%'}
            alignItems={'flex-start'}
            direction={['column', 'row']}
            justifyContent={['center', 'space-between']}
          >
            {chartHeading}
            <TimeframeSelector width={['100%', 'auto']} justifyContent={['center', 'flex-end']} timeframe={timeframe} setTimeframe={setTimeframe} />
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
            formatFn={ !useDollarConversion ? ((n: any) => `${abbreviateNumber(n)} ${asset?.name}`) : undefined }
            // formatFn={(n: any) => `${abbreviateNumber(n)} ${asset?.name}`}
          />
        </Card.Flex>
      </Box>
      {fundsOverview}
      <MaticNFTs assetId={asset?.id} />
      {vaultRewards}
      <VStack
        spacing={4}
        width={'100%'}
      >
        {strategyDescriptionCarousel}
        {strategyDescription}
      </VStack>
      <AssetGeneralData assetId={asset?.id} />
      <VaultUnderlyingProtocols assetId={asset?.id} />
    </>
  )
}