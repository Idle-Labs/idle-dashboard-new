import { Card } from 'components/Card/Card'
import { useNavigate } from 'react-router-dom'
import useLocalForge from 'hooks/useLocalForge'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import { BNify, getRoutePath, isEmpty } from 'helpers/'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { useWalletProvider } from 'contexts/WalletProvider'
import React, { useState, useMemo, useCallback } from 'react'
import { Scrollable } from 'components/Scrollable/Scrollable'
import { Translation } from 'components/Translation/Translation'
import { Notification } from 'components/Header/NotificationList'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { BalanceChart } from 'components/BalanceChart/BalanceChart'
import { JoinCommunity } from 'components/JoinCommunity/JoinCommunity'
import { StrategyLabel } from 'components/StrategyLabel/StrategyLabel'
import type { DonutChartData } from 'components/DonutChart/DonutChart'
import { ProductUpdates } from 'components/ProductUpdates/ProductUpdates'
import { CompositionChart } from 'components/CompositionChart/CompositionChart'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { VaultRewardOverview } from 'components/VaultRewardOverview/VaultRewardOverview'
import { AssetId, BigNumber, Asset, HistoryTimeframe, VaultPosition } from 'constants/types'
import { StrategyAssetsCarousel } from 'components/StrategyAssetsCarousel/StrategyAssetsCarousel'
import { useCompositionChartData, UseCompositionChartDataReturn } from 'hooks/useCompositionChartData/useCompositionChartData'
import { ContainerProps, Box, Flex, Text, Skeleton, SkeletonText, SimpleGrid, Stack, VStack, HStack, Stat, StatArrow, Heading, Button, Center, Divider } from '@chakra-ui/react'

export const Dashboard: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const { screenSize } = useThemeProvider()
  const [ percentChange, setPercentChange ] = useState(0)
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.YEAR)
  const [ selectedStrategies, setSelectedStrategies ] = useLocalForge('selectedStrategies', Object.keys(strategies))

  const navigate = useNavigate()
  const { account, walletInitialized } = useWalletProvider()
  const { isVaultsPositionsLoaded, vaultsPositions, selectors: { selectAssetsByIds }, rewards } = usePortfolioProvider()

  const accountAndPortfolioLoaded = useMemo(() => {
    return !walletInitialized || (account && !isVaultsPositionsLoaded)
  }, [walletInitialized, account, isVaultsPositionsLoaded])

  const assetIds = useMemo(() => {
    if (!selectAssetsByIds) return []
    const assetIds = Object.keys(vaultsPositions)
    const assets = selectAssetsByIds(assetIds)
    return assets.filter( (asset: Asset) => !selectedStrategies || !asset.type || selectedStrategies.includes(asset.type) ).map( (asset: Asset) => asset.id )
  }, [vaultsPositions, selectedStrategies, selectAssetsByIds])

  const totalDeposited = useMemo(() => {
    return Object.keys(vaultsPositions).filter( assetId => assetIds.includes(assetId) ).map( assetId => vaultsPositions[assetId] ).reduce( (amount: BigNumber, vaultPosition: VaultPosition) => {
      return amount.plus(vaultPosition.usd.deposited)
    }, BNify(0))
  }, [assetIds, vaultsPositions])

  const totalFunds = useMemo(() => {
    return Object.keys(vaultsPositions).filter( assetId => assetIds.includes(assetId) ).map( assetId => vaultsPositions[assetId] ).reduce( (amount: BigNumber, vaultPosition: VaultPosition) => {
      return amount.plus(vaultPosition.usd.redeemable)
    }, BNify(0))
  }, [assetIds, vaultsPositions])

  const earningsPercentage = useMemo(() => {
    return totalFunds.div(totalDeposited).minus(1).times(100)
  }, [totalDeposited, totalFunds])

  const { compositions }: UseCompositionChartDataReturn = useCompositionChartData({ assetIds: Object.keys(vaultsPositions) })

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

  const strategiesOverview = useMemo(() => {
    if (!account || !walletInitialized) return null
    return (
      <SimpleGrid
        mt={6}
        spacing={6}
        width={'100%'}
        columns={[1, 3]}
      >
        {
          compositions.strategies.map( (strategyComposition: DonutChartData, index: number) => {
            const strategy = strategyComposition.extraData.strategy
            const strategyPath = getRoutePath('earn', [strategy.route])
            const avgRealizedApy = strategyComposition.extraData.avgRealizedApy
            return (
              <Card.Dark
                p={6}
                key={`strategy_${index}`}
              >
                <HStack
                  spacing={4}
                  justifyContent={'space-between'}
                >
                  <HStack
                    spacing={4}
                  >
                    <StrategyLabel strategy={strategy.type} sx={{whiteSpace:'nowrap'}} />
                    <Divider orientation={'vertical'} height={4} />
                    <SkeletonText noOfLines={2} isLoaded={!!isVaultsPositionsLoaded}>
                      {
                        strategyComposition.value>0 ? (
                          <Amount.Usd value={strategyComposition.value} textStyle={['ctaStatic', 'h3']} />
                        ) : (
                          <Translation component={Text} translation={`common.noDeposits`} textStyle={['ctaStatic', 'h3']} />
                        )
                      }
                    </SkeletonText>
                    <HStack
                      spacing={2}
                      alignItems={'center'}
                    >
                      <Translation translation={'defi.apy'} component={Text} textStyle={'captionSmall'} />
                      <SkeletonText noOfLines={2} minWidth={'50px'} isLoaded={!!isVaultsPositionsLoaded}>
                        {
                          strategyComposition.value>0 ? (
                            <Amount.Percentage value={avgRealizedApy} textStyle={['ctaStatic', 'h3']} />
                          ) : (
                            <Text textStyle={['ctaStatic', 'h3']}>-</Text>
                          )
                        }
                      </SkeletonText>
                    </HStack>
                  </HStack>
                  <Translation display={['none', 'block']} component={Button} translation={strategyComposition.value>0 ? 'common.manage' : `common.enter`} onClick={() => navigate(strategyPath as string)} variant={'ctaPrimary'} py={2} height={'auto'} />
                </HStack>
              </Card.Dark>
            )
          })
        }
      </SimpleGrid>
    )
  }, [walletInitialized, account, navigate, compositions, isVaultsPositionsLoaded])

  const products = useMemo(() => {
    return (
      <VStack
        spacing={6}
        width={'100%'}
        alignItems={'flex-start'}
      >
        <Translation mb={13} translation={'defi.strategies'} component={Heading} as={'h2'} size={'3xl'} />
        <VStack
          spacing={4}
          width={'100%'}
        >
          {
            Object.keys(strategies).map( (strategy: string) => {
              const strategyProps = strategies[strategy]
              const strategyPath = getRoutePath('earn', [strategyProps.route])
              return (
                <Card.Dark
                  py={4}
                  px={6}
                  key={`strategy_${strategy}`}
                >
                  <Flex
                    direction={'row'}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                  >
                    <Flex
                      width={'180px'}
                    >
                      <StrategyLabel strategy={strategy} textStyle={['ctaStatic', 'h3']} />
                    </Flex>
                    <StrategyAssetsCarousel strategy={strategy} />
                    <Flex
                      width={'170px'}
                      justifyContent={'flex-end'}
                    >
                      <Translation component={Button} translation={`common.deposit`} onClick={() => navigate(strategyPath as string)} variant={'ctaPrimary'} px={10} py={2} />
                    </Flex>
                  </Flex>
                </Card.Dark>
              )
            })
          }
        </VStack>
      </VStack>
    )
  }, [navigate])

  const vaultsRewards = useMemo(() => {
    if (isEmpty(rewards)) {
      const strategyProps = strategies.BY
      const strategyPath = getRoutePath('earn', [strategyProps.route])
      return (
        <Card
          width={'100%'}
        >
          <Stack
            spacing={[10, 0]}
            alignItems={'center'}
            direction={['column', 'row']}
            justifyContent={'space-between'}
          >
            <Translation translation={'defi.empty.rewards.body'} component={Text} textAlign={['center', 'left']} />
            <Translation component={Button} translation={`defi.empty.rewards.cta`} onClick={() => navigate(strategyPath as string)} variant={['ctaPrimaryOutline']} px={10} py={2} />
          </Stack>
        </Card>
      )
    }
    
    return (
      <SimpleGrid
        spacing={6}
        width={'100%'}
        columns={[1, 3]}
      >
        {
          Object.keys(rewards).map( (assetId: AssetId) =>
            <VaultRewardOverview
              key={`reward_${assetId}`}
              assetId={assetId}
              {...rewards[assetId]}
            />
          )
        }
      </SimpleGrid>
    )
    
  }, [rewards, navigate])

  const strategiesRewards = useMemo(() => {
    return (
      <VStack
        width={'100%'}
        spacing={[10, 20]}
      >
        <VStack
          spacing={6}
          width={'100%'}
          id={'staking-rewards'}
          alignItems={'flex-start'}
        >
          <Translation translation={'dashboard.rewards.staking.title'} component={Text} textStyle={['heading', 'h3']} />
          <Card
            width={'100%'}
          >
            <Stack
              spacing={[10, 0]}
              alignItems={'center'}
              direction={['column', 'row']}
              justifyContent={'space-between'}
            >
              <Translation translation={'dashboard.rewards.staking.empty.body'} component={Text} textAlign={['center', 'left']} />
              <Translation component={Button} translation={`dashboard.rewards.staking.empty.cta`} onClick={() => {}} variant={['ctaPrimaryOutline']} px={10} py={2} />
            </Stack>
          </Card>
        </VStack>

        <VStack
          spacing={6}
          width={'100%'}
          id={'gauges-rewards'}
          alignItems={'flex-start'}
        >
          <Translation translation={'dashboard.rewards.gauges.title'} component={Text} textStyle={['heading', 'h3']} />
          <Card
            width={'100%'}
          >
            <Stack
              spacing={[10, 0]}
              alignItems={'center'}
              direction={['column', 'row']}
              justifyContent={'space-between'}
            >
              <Translation translation={'dashboard.rewards.gauges.empty.body'} component={Text} textAlign={['center', 'left']} />
              <Translation component={Button} translation={`dashboard.rewards.gauges.empty.cta`} onClick={() => {}} variant={['ctaPrimaryOutline']} px={10} py={2} />
            </Stack>
          </Card>
        </VStack>

        <VStack
          spacing={6}
          width={'100%'}
          id={'best-yield-rewards'}
          alignItems={'flex-start'}
        >
          <Translation translation={'defi.empty.rewards.title'} component={Text} textStyle={['heading', 'h3']} />
          {vaultsRewards}
        </VStack>
      </VStack>
    )
  }, [vaultsRewards])

  const leftSideContent = useMemo(() => {
    if (accountAndPortfolioLoaded) {
      return (
        <VStack
          spacing={6}
          width={'100%'}
          alignItems={'flex-start'}
        >
          <SkeletonText
            noOfLines={2}
            minW={'150px'}
          >
          </SkeletonText>
          <Skeleton width={'100%'} height='20px' />
          <Skeleton width={'100%'} height='20px' />
          <Skeleton width={'100%'} height='20px' />
        </VStack>
      )
    }

    if (totalFunds?.gt(0)){
      return strategiesRewards
    } else {
      return products
    }
    
  }, [accountAndPortfolioLoaded, totalFunds, products, strategiesRewards])

  const strategiesFilters = useMemo(() => {
    if (!account || screenSize==='sm') return null
    return (
      <Stack
        py={4}
        flex={1}
        spacing={3}
        direction={'row'}
        borderBottom={'1px solid'}
        borderColor={'divider'}
      >
        {
          Object.keys(strategies).map( (strategy: string) => {
            return (
              <Button
                minW={'180px'}
                variant={'filter'}
                key={`strategy_${strategy}`}
                onClick={() => toggleStrategy(strategy)}
                aria-selected={selectedStrategies.includes(strategy)}
              >
                <StrategyLabel
                  color={'primary'}
                  strategy={strategy}
                />
              </Button>
            )
          })
        }
      </Stack>
    )
  }, [account, screenSize, toggleStrategy, selectedStrategies])

  const chartColor = useMemo(() => {
    if (selectedStrategies.length===1){
      return strategies[selectedStrategies[0]].color
    }
    return undefined
  }, [selectedStrategies])

  return (
    <Box
      mt={12}
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
        <Translation translation={'navBar.dashboard'} component={Heading} as={'h2'} size={'3xl'} />
        {strategiesFilters}
      </Stack>
      <Stack
        flex={1}
        spacing={6}
        width={'100%'}
        direction={['column', 'row']}
      >
        <VStack
          flex={1}
          spacing={6}
          alignItems={'flex-start'}
        >
          <Translation display={['none', 'block']} translation={'dashboard.portfolio.performance'} component={Text} textStyle={['heading', 'h3']} />
          <Card.Dark
            p={0}
            overflow={'hidden'}
          >
            {
              (!account || (isVaultsPositionsLoaded && totalFunds.lte(0))) && (
                <Center
                  layerStyle={'overlay'}
                  bg={'rgba(0, 0, 0, 0.4)'}
                >
                  <Translation translation={'dashboard.performanceChart.empty'} component={Text} py={1} px={3} bg={'rgba(0, 0, 0, 0.2)'} borderRadius={8} />
                </Center>
              )
            }
            <Stack
              mt={[6, 8]}
              mx={[6, 8]}
              alignItems={'flex-start'}
              direction={['column', 'row']}
              justifyContent={['center', 'space-between']}
            >
              <VStack
                width={'100%'}
                spacing={[5, 1]}
                alignItems={['center', 'flex-start']}
              >
                <SkeletonText noOfLines={2} isLoaded={!!isVaultsPositionsLoaded}>
                  <Translation display={['none', 'block']} translation={'dashboard.portfolio.totalChart'} component={Text} textStyle={'tableCell'} fontWeight={400} color={'cta'} />
                  <HStack
                    spacing={4}
                    alignItems={'baseline'}
                  >
                    <Amount.Usd value={totalFunds} textStyle={'heading'} fontSize={'2xl'} />
                    {
                      totalFunds.gt(0) && (
                        <Stat>
                          <HStack spacing={2}>
                            <Amount.Percentage value={earningsPercentage} textStyle={'captionSmall'} />
                            <StatArrow type={earningsPercentage.gt(0) ? 'increase' : 'decrease'} />
                          </HStack>
                        </Stat>
                      )
                    }
                  </HStack>
                </SkeletonText>
              </VStack>
              {
                isVaultsPositionsLoaded && <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} width={['100%', 'auto']} justifyContent={['center', 'initial']} />
              }
            </Stack>
            <BalanceChart
              percentChange={0}
              color={chartColor}
              assetIds={assetIds}
              timeframe={timeframe}
              isRainbowChart={false}
              strategies={selectedStrategies}
              setPercentChange={setPercentChange}
              margins={{ top: 10, right: 0, bottom: 65, left: 0 }}
            />
          </Card.Dark>
        </VStack>

        <VStack
          spacing={6}
          width={['100%', '500px']}
          alignItems={'flex-start'}
        >
          <Translation translation={'dashboard.portfolio.composition'} component={Text} textStyle={['heading', 'h3']} />
          <Card.Dark
            p={0}
            flex={1}
            px={[6, 0]}
            display={'flex'}
            alignItems={'center'}
          >
            {
              (!account || (isVaultsPositionsLoaded && totalFunds.lte(0))) && (
                <Center
                  layerStyle={'overlay'}
                  bg={'rgba(0, 0, 0, 0.4)'}
                >
                  <Translation translation={'dashboard.compositionChart.empty'} component={Text} py={1} px={3} bg={'rgba(0, 0, 0, 0.2)'} borderRadius={8} />
                </Center>
              )
            }
            <CompositionChart assetIds={assetIds} strategies={selectedStrategies} type={'assets'} />
          </Card.Dark>
        </VStack>
      </Stack>
      
      {strategiesOverview}

      <Stack
        mt={20}
        spacing={6}
        width={'100%'}
        direction={['column', 'row']}
      >
        <VStack
          flex={1}
          alignItems={'flex-start'}
        >
          {leftSideContent}
        </VStack>
        <VStack
          spacing={6}
          width={['100%', '500px']}
          alignItems={'flex-start'}
        >
          <ProductUpdates />
        </VStack>
      </Stack>

      <JoinCommunity />
    </Box>
  )
}
