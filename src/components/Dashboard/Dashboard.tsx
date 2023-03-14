import { Card } from 'components/Card/Card'
import { useNavigate } from 'react-router-dom'
import { VAULTS_MIN_TVL } from 'constants/vars'
import useLocalForge from 'hooks/useLocalForge'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { VaultCard } from 'components/VaultCard/VaultCard'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Scrollable } from 'components/Scrollable/Scrollable'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { AssetsIcons } from 'components/AssetsIcons/AssetsIcons'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { BalanceChart } from 'components/BalanceChart/BalanceChart'
import useBoundingRect from "hooks/useBoundingRect/useBoundingRect"
import React, { useRef, useState, useMemo, useCallback } from 'react'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { JoinCommunity } from 'components/JoinCommunity/JoinCommunity'
import { StrategyLabel } from 'components/StrategyLabel/StrategyLabel'
import type { DonutChartData } from 'components/DonutChart/DonutChart'
import { VaultsCarousel } from 'components/VaultsCarousel/VaultsCarousel'
// import { ProductUpdates } from 'components/ProductUpdates/ProductUpdates'
import { TransactionList } from 'components/TransactionList/TransactionList'
import { CompositionChart } from 'components/CompositionChart/CompositionChart'
import { StrategiesFilters } from 'components/StrategiesFilters/StrategiesFilters'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { TransactionButton } from 'components/TransactionButton/TransactionButton'
import { VaultRewardOverview } from 'components/VaultRewardOverview/VaultRewardOverview'
import { AssetId, BigNumber, Asset, HistoryTimeframe, VaultPosition } from 'constants/types'
// import { StrategyAssetsCarousel } from 'components/StrategyAssetsCarousel/StrategyAssetsCarousel'
import { BNify, getRoutePath, getLegacyDashboardUrl, checkSectionEnabled, openWindow, isEmpty, formatDate } from 'helpers/'
import { useCompositionChartData, UseCompositionChartDataReturn } from 'hooks/useCompositionChartData/useCompositionChartData'
import { Box, Text, Skeleton, SkeletonText, SimpleGrid, Stack, VStack, HStack, Stat, StatArrow, Heading, Button, Center } from '@chakra-ui/react'

export const Dashboard: React.FC = () => {
  const { isMobile } = useThemeProvider()
  const [ ref, dimensions ] = useBoundingRect()
  const [ , setPercentChange ] = useState(0)
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.YEAR)
  const [ selectedStrategies, setSelectedStrategies ] = useLocalForge('selectedStrategies', Object.keys(strategies))

  const navigate = useNavigate()
  const { account, walletInitialized } = useWalletProvider()
  const { assetsData, stakingData, isVaultsPositionsLoaded, isPortfolioLoaded, vaultsPositions, gaugesRewards, vaultsRewards, selectors: { selectAssetById, selectAssetsByIds, selectVaultsAssetsByType, selectVaultsByType } } = usePortfolioProvider()

  const enabledStrategies = useMemo(() => Object.keys(strategies).filter( strategy => strategies[strategy].visible ), [])

  const accountAndPortfolioLoaded = useMemo(() => {
    return walletInitialized && isPortfolioLoaded && (!account || isVaultsPositionsLoaded)
  }, [walletInitialized, account, isPortfolioLoaded, isVaultsPositionsLoaded])

  const stakedIdleVault = useMemo(() => {
    return selectVaultsByType && selectVaultsByType('STK')?.[0]
  }, [selectVaultsByType])

  const assetIds = useMemo(() => {
    if (!selectAssetsByIds) return []
    const assetIds = Object.keys(vaultsPositions)
    const assets = selectAssetsByIds(assetIds)
    return assets.filter( (asset: Asset) => !selectedStrategies || !asset.type || (selectedStrategies.includes(asset.type) && enabledStrategies.includes(asset.type)) ).map( (asset: Asset) => asset.id )
  }, [vaultsPositions, selectedStrategies, enabledStrategies, selectAssetsByIds])

  const allAssetIds = useMemo(() => {
    return Object.values(assetsData).filter( (asset: Asset) => asset.id && (!asset.type || enabledStrategies.includes(asset.type)) ).map( (asset: Asset) => asset.id as string )
  }, [assetsData, enabledStrategies])

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

  // console.log('totalFunds', vaultsPositions, totalFunds.toString())

  const earningsPercentage = useMemo(() => {
    return totalFunds.div(totalDeposited).minus(1).times(100)
  }, [totalDeposited, totalFunds])

  const userHasFunds = useMemo(() => {
    return account && isVaultsPositionsLoaded && Object.keys(vaultsPositions).length>0
  }, [account, isVaultsPositionsLoaded, vaultsPositions])

  const { compositions }: UseCompositionChartDataReturn = useCompositionChartData({ assetIds: Object.keys(vaultsPositions), strategies: enabledStrategies })

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
    if (!selectVaultsAssetsByType) return null
    return (
      <SimpleGrid
        mt={6}
        spacing={6}
        width={'100%'}
        columns={[1, 3]}
      >
        {
          compositions.strategies.filter( (strategyComposition: DonutChartData) => enabledStrategies.includes(strategyComposition.extraData.strategy.type) ).map( (strategyComposition: DonutChartData, index: number) => {
            const strategy = strategyComposition.extraData.strategy
            const strategyPath = getRoutePath('earn', [strategy.route])
            const avgRealizedApy = strategyComposition.extraData.avgRealizedApy
            const strategyAssets = selectVaultsAssetsByType(strategy.type).filter( (asset: Asset) => asset.tvlUsd?.gt(VAULTS_MIN_TVL) )
            const strategyPositions = userHasFunds ? Object.keys(vaultsPositions).filter( (assetId: AssetId) => {
              const asset = selectAssetById(assetId)
              return asset?.type === strategy.type
            }) : []

            const CardComponent = strategyPositions.length>0 ? Card : Card.Dark

            return (
              <CardComponent
                py={4}
                px={6}
                key={`strategy_${index}`}
              >
                <VStack
                  spacing={4}
                  width={'100%'}
                >
                  <HStack
                    pb={4}
                    width={'100%'}
                    borderBottom={'1px solid'}
                    borderColor={'divider'}
                    justifyContent={'space-between'}
                  >
                    <StrategyLabel strategy={strategy.type} fontSize={'h3'} />
                    <Translation component={Button} translation={strategyComposition.value>0 ? 'common.manage' : `common.enter`} onClick={() => navigate(`${strategyPath}`)} variant={'ctaPrimary'} py={2} height={'auto'} />
                  </HStack>
                  {
                    strategyPositions.length>0 ? (
                      <HStack
                        width={'100%'}
                        justifyContent={'space-between'}
                      >
                        <HStack
                          spacing={2}
                          alignItems={'center'}
                        >
                          <Translation translation={'defi.balance'} component={Text} textStyle={'captionSmall'} />
                          <SkeletonText noOfLines={2} isLoaded={!!isVaultsPositionsLoaded}>
                            {
                              strategyComposition.value>0 ? (
                                <Amount.Usd value={strategyComposition.value} textStyle={['ctaStatic', 'h3']} />
                              ) : (
                                <Translation component={Text} translation={`common.noDeposits`} textStyle={['ctaStatic', 'h3']} />
                              )
                            }
                          </SkeletonText>
                        </HStack>
                        <HStack
                          spacing={2}
                          alignItems={'center'}
                        >
                          <Translation translation={'defi.avgApy'} component={Text} textStyle={'captionSmall'} />
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
                    ) : (
                      <HStack
                        width={'100%'}
                      >
                        <Translation translation={'dashboard.strategies.bestPerforming'} component={Text} textStyle={'captionSmall'} />
                      </HStack>
                    )
                  }
                  <Scrollable
                    minH={190}
                    maxH={190}
                  >
                    <VStack
                      spacing={2}
                      width={'100%'}
                    >
                      {
                        !isPortfolioLoaded || (account && !isVaultsPositionsLoaded) ? (
                          <>
                            <Skeleton width={'100%'} height={10} />
                            <Skeleton width={'100%'} height={10} />
                            <Skeleton width={'100%'} height={10} />
                            <Skeleton width={'100%'} height={10} />
                          </>
                        ) : strategyPositions.length>0 ?
                          strategyPositions.sort((a: AssetId, b: AssetId) => vaultsPositions[a].usd?.redeemable && vaultsPositions[b].usd?.redeemable ? (vaultsPositions[a].usd.redeemable.gt(vaultsPositions[b].usd.redeemable.toString()) ? -1 : 1) : 1 ).map( (assetId: AssetId) => (
                            <VaultCard.Inline
                              bg={'card.bgLight'}
                              key={`vault_${assetId}`}
                              onClick={() => navigate(`${strategyPath}/${assetId}`)}
                              assetId={assetId}
                              fields={[
                                {
                                  label:'defi.balance',
                                  field:'balanceUsd'
                                },
                                {
                                  label: isMobile ? 'defi.apy' : 'defi.realizedApy',
                                  field:'realizedApy'
                                }
                              ]}
                            />
                          ))
                        : strategyAssets.sort((a: Asset, b: Asset) => a.apy && b.apy ? (a.apy.gt(b.apy.toString()) ? -1 : 1) : 1 ).slice(0, 4).map( (asset: Asset) => (
                          <VaultCard.Inline
                            key={`vault_${asset.id}`}
                            onClick={() => navigate(`${strategyPath}/${asset.id}`)}
                            assetId={`${asset.id}`}
                            fields={[
                              {
                                label:'defi.tvl',
                                field:'tvl'
                              },
                              {
                                label:'defi.apy',
                                field:'apy'
                              }
                            ]}
                          />
                        ))
                      }
                    </VStack>
                  </Scrollable>
                </VStack>
              </CardComponent>
            )
          })
        }
      </SimpleGrid>
    )
  }, [userHasFunds, enabledStrategies, account, isMobile, isPortfolioLoaded, selectAssetById, navigate, compositions, vaultsPositions, isVaultsPositionsLoaded, selectVaultsAssetsByType])
  
  /*
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
                      <Translation component={Button} translation={`common.deposit`} onClick={() => navigate(`${strategyPath}`)} variant={'ctaPrimary'} px={10} py={2} />
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
  */

  const vaultsRewardsOverview = useMemo(() => {
    if (!accountAndPortfolioLoaded){
      return (
        <Skeleton width={'100%'} height={'100px'} />
      )
    }

    const strategyProps = strategies.BY
    const strategyPath = getRoutePath('earn', [strategyProps.route as string])

    if (isEmpty(vaultsRewards)) {
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
            <Translation translation={'dashboard.rewards.vaults.empty.body'} component={Text} textAlign={['center', 'left']} />
            <Translation component={Button} translation={`dashboard.rewards.vaults.empty.cta`} onClick={() => navigate(`${strategyPath}`)} variant={['ctaPrimaryOutline']} px={10} py={2} />
          </Stack>
        </Card>
      )
    }

    // console.log('vaultsRewardsOverview', vaultsRewards)
    
    return (
      <VStack
        spacing={6}
        width={'full'}
        alignItems={'flex-start'}
      >
        <SimpleGrid
          spacing={6}
          width={'100%'}
          columns={[1, 3]}
        >
          {
            Object.keys(vaultsRewards).map( (assetId: AssetId) =>
              <VaultRewardOverview
                key={`reward_${assetId}`}
                assetId={assetId}
                {...vaultsRewards[assetId]}
              />
            )
          }
        </SimpleGrid>
        <Translation component={Button} translation={`dashboard.rewards.vaults.cta`} width={['full', 'auto']} onClick={() => navigate(`${strategyPath}`)} variant={['ctaPrimaryOutline']} px={10} py={2} />
      </VStack>
    )
    
  }, [vaultsRewards, navigate, accountAndPortfolioLoaded])

  const gaugeRewards = useMemo(() => {
    if (!accountAndPortfolioLoaded){
      return (
        <Skeleton width={'100%'} height={'100px'} />
      )
    }

    const strategyProps = strategies.AA
    const strategyPath = getRoutePath('earn', [strategyProps.route as string])

    if (isEmpty(gaugesRewards)) {
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
            <Translation translation={'dashboard.rewards.gauges.empty.body'} component={Text} textAlign={['center', 'left']} />
            <Translation component={Button} translation={`dashboard.rewards.gauges.empty.cta`} onClick={() => navigate(`${strategyPath}`)} variant={['ctaPrimaryOutline']} px={10} py={2} />
          </Stack>
        </Card>
      )
    }
    
    return (
      <VStack
        spacing={6}
        width={'full'}
        alignItems={'flex-start'}
      >
        <VStack
          spacing={4}
          width={'100%'}
        >
          {
            Object.keys(gaugesRewards).map( rewardId => {
              const rewardData = gaugesRewards[rewardId]
              return (
                <AssetProvider
                  wrapFlex={false}
                  assetId={rewardId}
                  key={`reward_${rewardId}`}
                >
                  <Card
                    p={6}
                    px={8}
                    width={'100%'}
                  >
                    <Stack
                      spacing={0}
                      width={'100%'}
                      alignItems={'center'}
                      direction={['column', 'row']}
                      justifyContent={'space-between'}
                    >
                      <SimpleGrid
                        width={'100%'}
                        spacing={[4, 0]}
                        columns={[2, 5]}
                      >
                        <VStack
                          spacing={2}
                          alignItems={'flex-start'}
                          justifyContent={'flex-start'}
                        >
                          <Translation component={Text} translation={'defi.asset'} textStyle={'captionSmall'} />
                          <AssetProvider.GeneralData size={'xs'} field={'asset'} />
                        </VStack>

                        <VStack
                          spacing={2}
                          alignItems={'flex-start'}
                          justifyContent={'flex-start'}
                        >
                          <Translation component={Text} translation={'defi.gauges'} textStyle={'captionSmall'} />
                          <AssetsIcons size={'xs'} assetIds={rewardData.gauges} showTooltip={true} />
                        </VStack>

                        <VStack
                          spacing={2}
                          alignItems={'flex-start'}
                          justifyContent={'flex-start'}
                        >
                          <Translation component={Text} translation={'defi.apy'} textStyle={'captionSmall'} />
                          <Amount.Percentage textStyle={'tableCell'} value={BNify(rewardData.apr).gt(0) ? rewardData.apr : null} />
                        </VStack>

                        <VStack
                          spacing={2}
                          alignItems={'flex-start'}
                          justifyContent={'flex-start'}
                        >
                          <Translation component={Text} translation={'defi.dailyDistribution'} textStyle={'captionSmall'} />
                          <HStack
                            spacing={1}
                            width={'100%'}
                          >
                            <Amount textStyle={'tableCell'} value={rewardData.rate} decimals={4} />
                            <AssetProvider.Symbol textStyle={'tableCell'} />
                          </HStack>
                        </VStack>

                        <VStack
                          spacing={2}
                          alignItems={'flex-start'}
                          justifyContent={'flex-start'}
                        >
                          <Translation component={Text} translation={'defi.claimable'} textStyle={'captionSmall'} />
                          <HStack
                            spacing={1}
                            width={'100%'}
                          >
                            <Amount textStyle={'tableCell'} value={rewardData.balance} decimals={BNify(rewardData.balance).lt(1) ? 4 : 2} />
                            <AssetProvider.Symbol textStyle={'tableCell'} />
                          </HStack>
                        </VStack>
                      </SimpleGrid>
                      {/*<Translation component={Button} translation={`defi.claim`} onClick={() => {}} variant={['ctaPrimaryOutline']} disabled={rewardData.balance.lte(0)} px={10} py={2} />*/}
                    </Stack>
                  </Card>
                </AssetProvider>
              )
            })
          }
        </VStack>
        <Translation component={Button} translation={`dashboard.rewards.gauges.cta`} width={['full', 'auto']} onClick={() => navigate(strategyPath)} variant={['ctaPrimaryOutline']} px={10} py={2} />
      </VStack>
    )
    
  }, [navigate, gaugesRewards, accountAndPortfolioLoaded])

  const stakingRewards = useMemo(() => {
    if (!accountAndPortfolioLoaded || !stakedIdleVault || !stakingData){
      return (
        <Skeleton width={'100%'} height={'100px'} />
      )
    }

    const strategyPath = getRoutePath('stake')
    const stakingEnabled = checkSectionEnabled('stake')
    const strategyLegacyUrl = getLegacyDashboardUrl('stake')
    const contractSendMethod = stakedIdleVault.getClaimRewardsContractSendMethod()

    return stakingData.position.balance.lte(0) ? (
      <Card
        width={'100%'}
      >
        <Stack
          spacing={[10, 0]}
          alignItems={'center'}
          direction={['column', 'row']}
          justifyContent={'space-between'}
        >
          <Translation translation={'dashboard.rewards.staking.empty.body'} params={{apy: stakingData.maxApr.toFixed(2)}} component={Text} textAlign={['center', 'left']} />
          <Translation component={Button} translation={`dashboard.rewards.staking.empty.cta`} onClick={() => stakingEnabled ? navigate(strategyPath) : openWindow(strategyLegacyUrl) } variant={['ctaPrimaryOutline']} px={10} py={2} />
        </Stack>
      </Card>
    ) : (
      <VStack
        spacing={6}
        width={'full'}
        alignItems={'flex-start'}
      >
        <Card
          p={6}
          px={8}
          width={'100%'}
        >
          <Stack
            width={'100%'}
            spacing={[4, 14]}
            alignItems={'center'}
            direction={['column', 'row']}
            justifyContent={'space-between'}
          >
            <HStack
              width={'100%'}
              spacing={[0, 6]}
              flexWrap={['wrap', 'nowrap']}
              justifyContent={['flex-start', 'space-between']}
            >
              <VStack
                pb={[2, 0]}
                spacing={[1, 2]}
                width={['50%', 'auto']}
                alignItems={'flex-start'}
                justifyContent={'flex-start'}
              >
                <Translation component={Text} translation={'staking.totalSupply'} textStyle={'captionSmall'} />
                <TokenAmount assetId={stakingData?.stkIDLE.asset?.id} showIcon={false} amount={stakingData.stkIDLE.totalSupply} textStyle={'tableCell'} />
              </VStack>

              <VStack
                pb={[2, 0]}
                spacing={[1, 2]}
                width={['50%', 'auto']}
                alignItems={'flex-start'}
                justifyContent={'flex-start'}
              >
                <Translation component={Text} translation={'defi.balance'} textStyle={'captionSmall'} />
                <TokenAmount assetId={stakingData?.stkIDLE.asset?.id} showIcon={false} amount={stakingData.position.balance} textStyle={'tableCell'} />
              </VStack>

              <VStack
                pb={[2, 0]}
                spacing={[1, 2]}
                width={['50%', 'auto']}
                alignItems={'flex-start'}
                justifyContent={'flex-start'}
              >
                <Translation component={Text} translation={'defi.share'} textStyle={'captionSmall'} />
                <Amount.Percentage value={stakingData.position.share} textStyle={'tableCell'} />
              </VStack>

              <VStack
                pb={[2, 0]}
                spacing={[1, 2]}
                width={['50%', 'auto']}
                alignItems={'flex-start'}
                justifyContent={'flex-start'}
              >
                <Translation component={Text} translation={'defi.claimable'} textStyle={'captionSmall'} />
                <TokenAmount assetId={stakingData?.IDLE.asset?.id} showIcon={false} amount={stakingData.position.claimable} textStyle={'tableCell'} />
              </VStack>

              <VStack
                pb={[2, 0]}
                spacing={[1, 2]}
                width={['100%', 'auto']}
                alignItems={'flex-start'}
                justifyContent={'flex-start'}
              >
                <Translation component={Text} translation={'staking.lockEnd'} textStyle={'captionSmall'} />
                <Text textStyle={'tableCell'}>{formatDate(stakingData.position.lockEnd)}</Text>
              </VStack>
            </HStack>
            <TransactionButton text={'defi.claim'} vaultId={stakedIdleVault.id} assetId={stakedIdleVault.id} contractSendMethod={contractSendMethod} actionType={'claim'} amount={stakingData.position.claimable.toString()} width={['100%', '150px']} disabled={stakingData.position.claimable.lte(0)} />
          </Stack>
        </Card>
        <Translation component={Button} translation={`dashboard.rewards.staking.cta`} width={['full', 'auto']} onClick={() => stakingEnabled ? navigate(strategyPath) : openWindow(strategyLegacyUrl) } variant={['ctaPrimaryOutline']} px={10} py={2} />
      </VStack>
    )
  }, [stakedIdleVault, stakingData, navigate, accountAndPortfolioLoaded])

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
          <Translation translation={'dashboard.rewards.staking.title'} component={Text} textStyle={'heading'} fontSize={'h3'} />
          {stakingRewards}
        </VStack>

        <VStack
          spacing={6}
          width={'100%'}
          id={'gauges-rewards'}
          alignItems={'flex-start'}
        >
          <StrategyLabel strategy={'AA'} customText={'dashboard.rewards.gauges.title'}  textStyle={'heading'} fontSize={'h3'} />
          {/*<Translation translation={'dashboard.rewards.gauges.title'} component={Text} textStyle={'heading'} fontSize={'h3'} />*/}
          {gaugeRewards}
        </VStack>

        <VStack
          spacing={6}
          width={'100%'}
          id={'best-yield-rewards'}
          alignItems={'flex-start'}
        >
          <StrategyLabel strategy={'BY'} customText={'dashboard.rewards.vaults.title'}  textStyle={'heading'} fontSize={'h3'} />
          {vaultsRewardsOverview}
        </VStack>
      </VStack>
    )
  }, [vaultsRewardsOverview, gaugeRewards, stakingRewards])

  // const leftSideContent = useMemo(() => {
  //   if (!accountAndPortfolioLoaded) {
  //     return (
  //       <VStack
  //         spacing={6}
  //         width={'100%'}
  //         alignItems={'flex-start'}
  //       >
  //         <SkeletonText
  //           noOfLines={2}
  //           minW={'150px'}
  //         >
  //         </SkeletonText>
  //         <Skeleton width={'100%'} height='20px' />
  //         <Skeleton width={'100%'} height='20px' />
  //         <Skeleton width={'100%'} height='20px' />
  //       </VStack>
  //     )
  //   }

  //   return strategiesRewards
  // }, [accountAndPortfolioLoaded, strategiesRewards])

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
      <VaultsCarousel />
      <Stack
        mb={10}
        pt={[16, 12]}
        spacing={10}
        width={'100%'}
        alignItems={['flex-start','center']}
        justifyContent={'flex-start'}
        direction={['column', 'row']}
      >
        <Translation translation={'navBar.dashboard'} component={Heading} as={'h2'} size={'3xl'} />
        {
          !isMobile && (
            <HStack
              pb={3}
              flex={1}
              borderBottom={'1px solid'}
              borderColor={'divider'}
            >
              <StrategiesFilters toggleStrategy={toggleStrategy} selectedStrategies={selectedStrategies} checkUserFunds={true} showOnMobile={false} />
            </HStack>
          )
        }
      </Stack>
      <Stack
        flex={1}
        spacing={6}
        width={'100%'}
        direction={['column', 'row']}
      >
        <VStack
          spacing={6}
          width={['full', '66.3%']}
          alignItems={'flex-start'}
        >
          <Translation display={['none', 'block']} translation={'dashboard.portfolio.performance'} component={Text} textStyle={'heading'} fontSize={'h3'} />
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
              totalFunds.lte(0) && (
                <Center
                  layerStyle={'overlay'}
                  bg={'rgba(0, 0, 0, 0.4)'}
                >
                  <Translation translation={account ? 'dashboard.performanceChart.empty' : 'dashboard.performanceChart.emptyNotConnected'} textAlign={'center'} component={Text} py={1} px={3} bg={'rgba(0, 0, 0, 0.2)'} borderRadius={8} />
                </Center>
              )
            }
            <Stack
              pt={[6, 8]}
              px={[6, 8]}
              pb={[4, 0]}
              width={'100%'}
              alignItems={'flex-start'}
              direction={['column', 'row']}
              justifyContent={['center', 'space-between']}
            >
              {
                userHasFunds && (
                  <VStack
                    width={'100%'}
                    spacing={[5, 1]}
                    alignItems={['center', 'flex-start']}
                  >
                    <SkeletonText noOfLines={2} isLoaded={!!isVaultsPositionsLoaded}>
                      <Translation display={['none', 'block']} translation={'dashboard.portfolio.totalChart'} component={Text} textStyle={'tableCell'} fontWeight={400} color={'cta'} />
                      <HStack
                        spacing={[2, 4]}
                        alignItems={'baseline'}
                      >
                        <Amount.Usd value={totalFunds} textStyle={'heading'} fontSize={'3xl'} />
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
                )
              }
              {
                userHasFunds && <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} width={['100%', 'auto']} justifyContent={['center', 'initial']} />
              }
            </Stack>
            <BalanceChart
              percentChange={0}
              color={chartColor}
              timeframe={timeframe}
              assetIds={allAssetIds}
              isRainbowChart={false}
              strategies={selectedStrategies}
              setPercentChange={setPercentChange}
              margins={{ top: 10, right: 0, bottom: 65, left: 0 }}
            />
          </Card.Flex>
        </VStack>

        <VStack
          flex={1}
          spacing={6}
          width={['100%', '500px']}
          alignItems={'flex-start'}
        >
          <Translation translation={'dashboard.portfolio.composition'} component={Text} textStyle={'heading'} fontSize={'h3'} />
          <Card.Dark
            p={0}
            flex={1}
            px={[6, 0]}
            display={'flex'}
            alignItems={'center'}
          >
            {
              totalFunds.lte(0) && (
                <Center
                  layerStyle={'overlay'}
                  bg={'rgba(0, 0, 0, 0.4)'}
                >
                  <Translation translation={account ? 'dashboard.compositionChart.empty' : 'dashboard.compositionChart.emptyNotConnected'} textAlign={'center'} component={Text} py={1} px={3} bg={'rgba(0, 0, 0, 0.2)'} borderRadius={8} />
                </Center>
              )
            }
            <CompositionChart assetIds={assetIds} strategies={selectedStrategies} type={'assets'} />
          </Card.Dark>
        </VStack>
      </Stack>
      
      {strategiesOverview}

      {
        account && (
          <Stack
            spacing={6}
            mt={[10, 20]}
            width={'100%'}
            direction={['column', 'row']}
          >
            <VStack
              flex={1}
              alignItems={'flex-start'}
              ref={ref as typeof useRef}
            >
              {strategiesRewards}
            </VStack>
            <VStack
              spacing={6}
              width={['100%', '500px']}
              alignItems={'flex-start'}
            >
              <TransactionList assetIds={allAssetIds} maxH={[400, Math.max(400, dimensions?.height)]} showTitleOnMobile={true} />
            </VStack>
          </Stack>
        )
      }

      <JoinCommunity />
    </Box>
  )
}
