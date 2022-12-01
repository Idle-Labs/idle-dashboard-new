import { strategies } from 'constants/'
import { Card } from 'components/Card/Card'
import useLocalForge from 'hooks/useLocalForge'
import React, { useMemo, useState } from 'react'
import { Amount } from 'components/Amount/Amount'
import { MdKeyboardArrowLeft } from 'react-icons/md'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { BNify, abbreviateNumber, isEmpty } from 'helpers/'
import { useWalletProvider } from 'contexts/WalletProvider'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { HistoryTimeframe, BigNumber } from 'constants/types'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { VaultRewards } from 'components/VaultRewards/VaultRewards'
import { GenericChart } from 'components/GenericChart/GenericChart'
import { StrategyLabel } from 'components/StrategyLabel/StrategyLabel'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { TransactionList } from 'components/TransactionList/TransactionList'
import { AssetGeneralData } from 'components/AssetGeneralData/AssetGeneralData'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { useBalanceChartData } from 'hooks/useBalanceChartData/useBalanceChartData'
import { OperativeComponent } from 'components/OperativeComponent/OperativeComponent'
import { usePerformanceChartData } from 'hooks/usePerformanceChartData/usePerformanceChartData'
import { StrategyDescriptionCarousel } from 'components/StrategyDescriptionCarousel/StrategyDescriptionCarousel'
import { ContainerProps, Heading, Box, Flex, Stack, Text, Tabs, Tab, TabList, SimpleGrid, HStack, VStack, Stat, Switch/*, StatArrow*/, SkeletonText, Button, IconButton, IconButtonProps } from '@chakra-ui/react'

export const AssetPage: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const { params } = useBrowserRouter()
  const { screenSize } = useThemeProvider()
  const { account, walletInitialized } = useWalletProvider()
  const [ showDeposit, setShowDeposit ] = useState<boolean>(false)
  const [ showTransactions, setShowTransactions ] = useState<boolean>(false)
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.YEAR)
  const [ useDollarConversion, setUseDollarConversion ] = useLocalForge('useDollarConversion', true)
  const { isPortfolioLoaded, isVaultsPositionsLoaded, selectors: { selectAssetById, selectAssetBalanceUsd } } = usePortfolioProvider()

  const isMobile = useMemo(() => screenSize==='sm', [screenSize])

  const strategy = useMemo(() => {
    return Object.keys(strategies).find( strategy => strategies[strategy].route === params.strategy )
  }, [params])

  const strategyColor = useMemo(() => {
    return strategy && strategies[strategy].color
  }, [strategy])

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const assetBalance = useMemo(() => {
    if (!asset?.id) return
    return selectAssetBalanceUsd && selectAssetBalanceUsd(asset.id)
  }, [asset, selectAssetBalanceUsd])

  const userHasBalance = useMemo(() => {
    return assetBalance && assetBalance.gt(0)
  }, [assetBalance])

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

    const isLoaded = (chartData?.total && chartData.total.length>0) && !!isPortfolioLoaded && (!account || isVaultsPositionsLoaded)
    return (
      <VStack
        spacing={1}
        width={['100%','auto']}
        alignItems={['center','flex-start']}
      >
        <SkeletonText noOfLines={2} isLoaded={isLoaded}>
          <Translation translation={ userHasBalance ? 'dashboard.portfolio.totalChart' : 'dashboard.portfolio.assetPerformance'} component={Text} textStyle={'caption'} textAlign={['center','left']} />
          <HStack
            spacing={3}
            width={['100%','auto']}
            alignItems={'baseline'}
          >
            {
              userHasBalance ? (
                useDollarConversion ? <AssetProvider.BalanceUsd textStyle={'heading'} textAlign={['center','left']} fontSize={'2xl'} /> : <AssetProvider.Redeemable textStyle={'heading'} textAlign={['center','left']} fontSize={'2xl'} suffix={` ${asset?.name}`} />
              ) : (
                <Amount.Percentage value={apy} suffix={' APY'} textStyle={'heading'} textAlign={['center','left']} fontSize={'2xl'} />
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
  }, [userHasBalance, asset, account, useDollarConversion, isVaultsPositionsLoaded, chartData, isPortfolioLoaded])

  const fundsOverview = useMemo(() => {
    if (!asset || !userHasBalance) return null
    return (
      <SimpleGrid
        width={'100%'}
        columns={[2, 3]}
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
          <Translation component={Text} translation={'defi.earnings'} textStyle={'titleSmall'} />
          <AssetProvider.EarningsUsd textStyle={'heading'} fontSize={'h3'} />
          <HStack spacing={1}>
            <AssetProvider.Earnings decimals={4} textStyle={'captionSmaller'} />
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
    if (!strategy || !walletInitialized || !isPortfolioLoaded) return null
    const strategyProps = strategies[strategy]
    if (!strategyProps?.carouselItems) return null
    return (
      <StrategyDescriptionCarousel color={strategyColor} strategy={strategy} delay={10000} />
    )
  }, [strategy, strategyColor, walletInitialized, isPortfolioLoaded])

  const vaultRewards = useMemo(() => {
    if (!asset || isEmpty(asset.rewards)) return null
    const totalRewards = (Object.values(asset.rewards) as BigNumber[]).reduce( (totalRewards: BigNumber, amount: BigNumber) => totalRewards.plus(amount), BNify(0) )
    return totalRewards.gt(0) ? (
      <VStack
        spacing={6}
        width={'100%'}
        id={'vault-rewards'}
        alignItems={'flex-start'}
      >
        <Translation translation={'assets.assetDetails.generalData.claimableRewards'} component={Text} textStyle={'heading'} fontSize={'h3'} />
        <VaultRewards assetId={asset?.id} />
      </VStack>
    ) : null
  }, [asset])

  return (
    <AssetProvider
      wrapFlex={true}
      assetId={asset?.id}
    >
      <Box
        width={'100%'}
      >
        <Flex
          my={[10, 14]}
          width={'100%'}
          id={'asset-top-header'}
          direction={['column', 'row']}
          justifyContent={['center', 'space-between']}
        >
          <Stack
            width={'100%'}
            spacing={[7, 10]}
            alignItems={'center'}
            justifyContent={'center'}
            direction={['column', 'row']}
          >
            <AssetLabel assetId={asset?.id} fontSize={'h2'} />
            <Stack
              flex={1}
              direction={'row'}
              width={['100%', 'auto']}
              borderBottom={'1px solid'}
              borderColor={'divider'}
              justifyContent={'space-between'}
            >
              <Tabs
                defaultIndex={0}
                variant={'unstyled'}
                width={['100%', 'auto']}
              >
                <TabList>
                  <Translation component={Tab} width={['50%', 'auto']} translation={'navBar.earn'} />
                  <Translation component={Tab} width={['50%', 'auto']} translation={'navBar.stats'} />
                </TabList>
              </Tabs>
              {
                !isMobile && (
                  <StrategyLabel strategy={strategy} color={'cta'} textStyle={'italic'} />
                )
              }
            </Stack>
          </Stack>
        </Flex>
        <HStack
          spacing={[0, 10]}
          alignItems={'space-between'}
        >
          <Stack
            flex={1}
            mb={[20, 0]}
            spacing={10}
            width={['100%', 14/20]}
          >
            {/*!userHasBalance && strategyDescriptionCarousel*/}
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
                  asset && (
                    <HStack
                      spacing={2}
                    >
                      <AssetProvider.Name />
                      <Switch size={'md'} isChecked={useDollarConversion} onChange={ (e) => setUseDollarConversion(e.target.checked) } />
                      <Text>USD</Text>
                    </HStack>
                  )
                }
              </HStack>
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
                />
              </Card.Dark>
            </Box>
            {fundsOverview}
            {!userHasBalance && strategyDescriptionCarousel}
            <AssetGeneralData assetId={asset?.id} />
            {userHasBalance && strategyDescriptionCarousel}
            {vaultRewards}

            {
              isMobile && (
                <Flex
                  p={4}
                  left={0}
                  bottom={0}
                  border={0}
                  width={'100%'}
                  bg={'card.bgDark'}
                  position={'fixed'}
                >
                  <Translation component={Button} translation={['common.start', 'common.deposit']} variant={'ctaFull'} onClick={() => setShowDeposit(true)} />
                </Flex>
              )
            }
          </Stack>
          <VStack
            left={0}
            zIndex={99999}
            spacing={[0, 6]}
            id={'right-side'}
            width={['100vw', '27em']}
            height={['100vh', 'auto']}
            position={['fixed', 'relative']}
            top={[showDeposit ? 0 : '100vh', 0]}
            bg={isMobile ? 'rgba(0, 0, 0, 0.5)' : undefined}
            sx={isMobile ? {transition:'top 0.3s ease-in-out'} : {}}
          >
            <VStack
              bottom={0}
              spacing={0}
              width={'100%'}
              height={['100vh', 'auto']}
              position={['fixed', 'relative']}
              top={[showDeposit ? 0 : '100vh', 0]}
              sx={isMobile ? {transition:'top 0.3s ease-in-out'} : {}}
            >
              {
                isMobile && (
                  <HStack
                    px={4}
                    py={2}
                    bg={'card.bg'}
                    width={'100%'}
                    borderBottom={'1px solid'}
                    borderBottomColor={'divider'}
                    justifyContent={'space-between'}
                  >
                    <Translation alignItems={'center'} display={'flex'} variant={'unstyled'} translation={'common.exit'} component={Button} leftIcon={<MdKeyboardArrowLeft size={24} />} onClick={() => setShowDeposit(false)} />
                    <Translation alignItems={'center'} display={'flex'} variant={'unstyled'} translation={['common.show', 'navBar.transactions']} component={Button} onClick={() => setShowTransactions(true)} />
                  </HStack>
                )
              }
              <OperativeComponent flex={1} minHeight={isMobile ? 'auto' : '590px'} borderRadius={isMobile ? 0 : undefined} assetId={asset?.id} />
            </VStack>
            <VStack
              bottom={0}
              spacing={0}
              width={'100%'}
              height={['100vh', 'auto']}
              position={['fixed', 'relative']}
              top={[showTransactions ? 0 : '100vh', 0]}
              sx={isMobile ? {transition:'top 0.3s ease-in-out'} : {}}
            >
              {
                isMobile && (
                  <HStack
                    px={4}
                    py={2}
                    bg={'card.bg'}
                    width={'100%'}
                    borderBottom={'1px solid'}
                    borderBottomColor={'divider'}
                    justifyContent={'space-between'}
                  >
                    <Translation alignItems={'center'} display={'flex'} variant={'unstyled'} translation={'common.back'} component={Button} leftIcon={<MdKeyboardArrowLeft size={24} />} onClick={() => setShowTransactions(false)} />
                    <Translation textStyle={'ctaStatic'} translation={'assets.assetDetails.assetHistory.transactionHistory'} component={Text} />
                  </HStack>
                )
              }
              <TransactionList assetId={asset?.id} />
            </VStack>
          </VStack>
        </HStack>
      </Box>
    </AssetProvider>
  )
}