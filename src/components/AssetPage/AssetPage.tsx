import { BNify } from 'helpers/'
import React, { useMemo, useState } from 'react'
import { Card } from 'components/Card/Card'
import { Amount } from 'components/Amount/Amount'
import { HistoryTimeframe } from 'constants/types'
// import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
// import { BalanceChart } from 'components/BalanceChart/BalanceChart'
import { GenericChart } from 'components/GenericChart/GenericChart'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { AssetGeneralData } from 'components/AssetGeneralData/AssetGeneralData'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { useBalanceChartData } from 'hooks/useBalanceChartData/useBalanceChartData'
import { usePerformanceChartData } from 'hooks/usePerformanceChartData/usePerformanceChartData'
import { ContainerProps, Heading, Box, Flex, Stack, Text, Tabs, Tab, TabList, SimpleGrid, HStack, VStack, Stat, StatArrow, SkeletonText } from '@chakra-ui/react'

export const AssetPage: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const { params } = useBrowserRouter()
  // const { account } = useWalletProvider()

  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.YEAR)
  const { isPortfolioLoaded, selectors: { selectAssetById, selectAssetBalanceUsd } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const assetBalance = useMemo(() => {
    if (!asset?.id) return
    return selectAssetBalanceUsd && selectAssetBalanceUsd(asset.id)
  }, [asset, selectAssetBalanceUsd])

  const hasBalance = useMemo(() => {
    return assetBalance && assetBalance.gt(0)
  }, [assetBalance])

  const { balanceChartData } = useBalanceChartData({ assetIds: [asset?.id], timeframe })
  const { performanceChartData } = usePerformanceChartData({ assetIds: [asset?.id], timeframe })

  const chartData = useMemo(() => {
    if (!isPortfolioLoaded) return
    return hasBalance ? balanceChartData : performanceChartData
  }, [isPortfolioLoaded, hasBalance, balanceChartData, performanceChartData])

  // console.log('locaton', location, 'params', params, account)

  // const onTabClick = useCallback((row: RowProps) => {
  //   return navigate(`${location?.pathname}/${row.original.id}`)
  // }, [navigate, location])

  const chartHeading = useMemo(() => {
    const earningsPercentage = hasBalance ? asset?.vaultPosition?.earningsPercentage : chartData?.total?.length && BNify(chartData.total[chartData.total.length-1].value).div(chartData.total[0].value).minus(1).times(100)
    const earningsDays = chartData?.total?.length ? BNify(chartData.total[chartData.total.length-1].date).minus(chartData.total[0].date).div(1000).div(86400) : BNify(0)
    const apy = earningsDays.gt(0) ? earningsPercentage.times(365).div(earningsDays) : BNify(0)
    return (
      <VStack
        spacing={1}
        alignItems={'flex-start'}
      >
        <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded}>
          <Translation translation={ hasBalance ? 'dashboard.portfolio.totalChart' : 'dashboard.portfolio.assetPerformance'} component={Text} textStyle={'tableCell'} fontWeight={400} color={'cta'} />
          <HStack
            spacing={4}
          >
            {
              hasBalance ? (
                <AssetProvider.BalanceUsd textStyle={['heading', 'h2']} />
              ) : (
                <Amount.Percentage value={earningsPercentage} textStyle={['heading', 'h2']} />
              )
            }
            <Stat>
              <HStack spacing={2}>
                {
                  hasBalance ? (
                    <AssetProvider.EarningsPerc textStyle={'captionSmall'} />
                  ) : apy.gt(0) && (
                    <HStack
                      spacing={1}
                    >
                      <Amount.Percentage value={apy} textStyle={'captionSmall'} />
                      <Text textStyle={'captionSmall'}>APY</Text>
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
          </HStack>
        </SkeletonText>
      </VStack>
    )
  }, [hasBalance, asset, chartData, isPortfolioLoaded])

  const fundsOverview = useMemo(() => {
    if (!asset || !hasBalance) return null
    return (
      <SimpleGrid
        spacing={14}
        width={'100%'}
        columns={[2, 4]}
        alignItems={'flex-start'}
      >
        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.deposited'} textStyle={'titleSmall'} />
          <AssetProvider.DepositedUsd textStyle={['heading', 'h3']} />
          <HStack spacing={1}>
            <AssetProvider.Deposited decimals={4} textStyle={'captionSmaller'} />
            <AssetProvider.Name textStyle={'captionSmaller'} />
          </HStack>
        </VStack>

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.earnings'} textStyle={'titleSmall'} />
          <AssetProvider.EarningsUsd textStyle={['heading', 'h3']} />
          <HStack spacing={1}>
            <AssetProvider.Earnings decimals={4} textStyle={'captionSmaller'} />
            <AssetProvider.Name textStyle={'captionSmaller'} />
          </HStack>
        </VStack>

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.fees'} textStyle={'titleSmall'} />
          <AssetProvider.FeesUsd textStyle={['heading', 'h3']} />
          <HStack spacing={1}>
            <AssetProvider.Fees decimals={4} textStyle={'captionSmaller'} />
            <AssetProvider.Name textStyle={'captionSmaller'} />
          </HStack>
        </VStack>

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.realizedApy'} textStyle={'titleSmall'} />
          <AssetProvider.RealizedApy textStyle={['heading', 'h3']} />
          <Text textStyle={'captionSmaller'}></Text>
        </VStack>
      </SimpleGrid>
    )
  }, [asset, hasBalance])

  return (
    <AssetProvider
      assetId={asset?.id}
    >
      <Box
        width={'100%'}
      >
        <Flex
          my={14}
          width={'100%'}
          id={'asset-top-header'}
          direction={['column', 'row']}
          justifyContent={['center', 'space-between']}
        >
          <Stack
            spacing={10}
            alignItems={'center'}
            justifyContent={'center'}
            direction={['column', 'row']}
          >
            <Stack
                direction={'row'}
                alignItems={'center'}
              >
              <AssetProvider.Icon size={'sm'} />
              <AssetProvider.Name textStyle={'h2'} />
            </Stack>
            <Tabs
              defaultIndex={0}
              variant={'unstyled'}
            >
              <TabList>
                <Translation component={Tab} translation={'navBar.earn'} />
                <Translation component={Tab} translation={'navBar.stats'} />
              </TabList>
            </Tabs>
          </Stack>
        </Flex>
        <Box>
          <Stack
            spacing={10}
            width={['100%', 2/3]}
          >
            <Box>
              <Flex mb={6}>
                <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded}>
                  <Translation component={Heading} as={'h3'} size={'md'} translation={hasBalance ? 'defi.fundsOverview' : 'defi.historicalPerformance'} />
                </SkeletonText>
              </Flex>
              <Card.Dark
                p={0}
              >
                <Stack
                  mt={8}
                  mx={8}
                  alignItems={'flex-start'}
                  direction={['column', 'row']}
                  justifyContent={['center', 'space-between']}
                >
                  {chartHeading}
                  <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
                </Stack>
                <GenericChart
                  data={chartData}
                  percentChange={0}
                  timeframe={timeframe}
                  isRainbowChart={false}
                  assetIds={[params.asset]}
                  setPercentChange={() => {}}
                  margins={{ top: 10, right: 0, bottom: 65, left: 0 }}
                />
              </Card.Dark>
            </Box>
            {fundsOverview}
            <AssetGeneralData assetId={asset?.id} />
          </Stack>
        </Box>
      </Box>
    </AssetProvider>
  )
}