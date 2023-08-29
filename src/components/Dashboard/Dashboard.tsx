import BigNumber from 'bignumber.js'
import { Card } from 'components/Card/Card'
import { useNavigate } from 'react-router-dom'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import { MdKeyboardArrowRight } from 'react-icons/md'
import React, { useRef, useState, useMemo } from 'react'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { products, ProductProps } from 'constants/products'
import { useWalletProvider } from 'contexts/WalletProvider'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { AssetsIcons } from 'components/AssetsIcons/AssetsIcons'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import useBoundingRect from "hooks/useBoundingRect/useBoundingRect"
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { JoinCommunity } from 'components/JoinCommunity/JoinCommunity'
import { StrategyLabel } from 'components/StrategyLabel/StrategyLabel'
import { VaultsCarousel } from 'components/VaultsCarousel/VaultsCarousel'
import { selectVisibleStrategies } from 'selectors/selectVisibleStrategies'
import { PartnersPrograms } from 'components/PartnersPrograms/PartnersPrograms'
import { StrategyOverview } from 'components/StrategyOverview/StrategyOverview'
import { AssetId, Asset, HistoryTimeframe, VaultPosition } from 'constants/types'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { TransactionButton } from 'components/TransactionButton/TransactionButton'
import { DonutChart, DonutChartInitialData } from 'components/DonutChart/DonutChart'
import { VaultRewardOverview } from 'components/VaultRewardOverview/VaultRewardOverview'
import { BalanceChartProvider, BalanceChart } from 'components/BalanceChart/BalanceChart'
import { DepositedAssetsTable } from 'components/DepositedAssetsTable/DepositedAssetsTable'
import { Box, Text, Skeleton, SkeletonText, SimpleGrid, Stack, VStack, HStack, Heading, Button, Image, Flex } from '@chakra-ui/react'
import { bnOrZero, BNify, getRoutePath, getLegacyDashboardUrl, checkSectionEnabled, openWindow, isEmpty, formatDate } from 'helpers/'

export const Dashboard: React.FC = () => {
  const { theme } = useThemeProvider()
  const [ , setPercentChange ] = useState(0)
  const [ ref, dimensions ] = useBoundingRect()
  const selectedStrategies = useMemo(() => Object.keys(strategies), [])
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.YEAR)

  const navigate = useNavigate()
  const { account, walletInitialized } = useWalletProvider()
  const {
    assetsData,
    stakingData,
    isPortfolioAccountReady,
    isVaultsPositionsLoaded,
    isPortfolioLoaded,
    vaultsPositions,
    gaugesRewards,
    vaultsRewards,
    selectors: {
      selectAssetsByIds,
      selectAssetStrategies,
      selectVaultsAssetsByType,
      selectVaultsByType
    }
  } = usePortfolioProvider()

  const enabledStrategies = useMemo(() => selectVisibleStrategies(), [])

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

  const totalFunds = useMemo(() => {
    return Object.keys(vaultsPositions).filter( assetId => assetIds.includes(assetId) ).map( assetId => vaultsPositions[assetId] ).reduce( (amount: BigNumber, vaultPosition: VaultPosition) => {
      return amount.plus(vaultPosition.usd.redeemable)
    }, BNify(0))
  }, [assetIds, vaultsPositions])

  const aggregatedUsdPosition: VaultPosition["usd"] = useMemo(() => {
    return Object.keys(vaultsPositions).filter( assetId => assetIds.includes(assetId) ).map( assetId => vaultsPositions[assetId] ).reduce( (aggregatedUsdPosition: VaultPosition["usd"], vaultPosition: VaultPosition) => {
      aggregatedUsdPosition.staked = aggregatedUsdPosition.staked.plus(vaultPosition.usd.staked)
      aggregatedUsdPosition.earnings = aggregatedUsdPosition.earnings.plus(vaultPosition.usd.earnings)
      aggregatedUsdPosition.deposited = aggregatedUsdPosition.deposited.plus(vaultPosition.usd.deposited)
      aggregatedUsdPosition.redeemable = aggregatedUsdPosition.redeemable.plus(vaultPosition.usd.redeemable)
      return aggregatedUsdPosition
    }, {
      staked: BNify(0),
      earnings: BNify(0),
      deposited: BNify(0),
      redeemable: BNify(0),
    })
  }, [assetIds, vaultsPositions])

  const avgRealizedApy = useMemo(() => {
    const realizedApyData = Object.keys(vaultsPositions).filter( assetId => assetIds.includes(assetId) ).map( assetId => vaultsPositions[assetId] ).reduce( (realizedApyData: Record<string, BigNumber>, vaultPosition: VaultPosition) => {
      realizedApyData.num = realizedApyData.num.plus(bnOrZero(vaultPosition.usd.redeemable).times(bnOrZero(vaultPosition.realizedApy)))
      realizedApyData.den = realizedApyData.den.plus(vaultPosition.usd.redeemable)
      // console.log('avgRealizedApy', vaultPosition.usd.redeemable.toString(), vaultPosition.realizedApy.toString())
      return realizedApyData
    }, {
      num: BNify(0),
      den: BNify(0)
    })
    return realizedApyData.num.div(realizedApyData.den)
  }, [assetIds, vaultsPositions])

  // const userHasFunds = useMemo(() => {
  //   return account && isVaultsPositionsLoaded && Object.keys(vaultsPositions).length>0
  // }, [account, isVaultsPositionsLoaded, vaultsPositions])

  // console.log('vaultsPositions', vaultsPositions)

  const riskExposures = useMemo(() => {
    return Object.keys(vaultsPositions).reduce( (riskExposures: Record<string, any>, assetId: AssetId) => {
      const vaultPosition = vaultsPositions[assetId]
      const assetStrategies = selectAssetStrategies(assetId)
      // console.log('assetStrategies', assetId, assetStrategies)
      assetStrategies.forEach( (assetStrategy: string) => {
        riskExposures[assetStrategy].total = riskExposures[assetStrategy].total.plus(vaultPosition.usd.redeemable)
        riskExposures[assetStrategy].perc = riskExposures[assetStrategy].total.div(totalFunds)
      })
      return riskExposures
    }, {
      AA: {
        perc: BNify(0),
        total: BNify(0)
      },
      BB: {
        perc: BNify(0),
        total: BNify(0)
      }
    })
  }, [vaultsPositions, totalFunds, selectAssetStrategies])

  const riskExposureDonutChart = useMemo(() => {
    const compositionData: DonutChartInitialData = totalFunds.gt(0) ? Object.keys(riskExposures).reduce( (donutChartData: DonutChartInitialData, strategy: string) => {
      donutChartData.colors[strategy] = strategies[strategy].color as string
      donutChartData.data.push({
        label: strategy,
        value: riskExposures[strategy].perc.times(100).toFixed(2)
      })
      return donutChartData
    }, {
      data:[],
      colors:{}
    }) : {
      data:[{
        value:1,
        label:'empty',
      }],
      colors:{
        empty: theme.colors.ctaDisabled
      }
    }

    // const getSliceData = (selectedSlice: DonutChartData) => {
      // console.log(selectedSlice)
    // }

    return (
      <DonutChart {...compositionData} getSliceData={() => {}} donutThickness={6} />
    )
  }, [theme, totalFunds, riskExposures])

  const fundsOverview = useMemo(() => {
    if (totalFunds.lte(0)) return null
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
          <Amount.Usd textStyle={'heading'} fontSize={'h3'} value={aggregatedUsdPosition.deposited} />
        </VStack>

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.redeemable'} textStyle={'titleSmall'} />
          <Amount.Usd textStyle={'heading'} fontSize={'h3'} value={aggregatedUsdPosition.redeemable} />
        </VStack>

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.earnings'} textStyle={'titleSmall'} />
          <Amount.Usd textStyle={'heading'} fontSize={'h3'} value={aggregatedUsdPosition.earnings} />
        </VStack>

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.avgRealizedApy'} textStyle={'titleSmall'} />
          <Amount.Percentage textStyle={'heading'} fontSize={'h3'} value={avgRealizedApy} />
        </VStack>
      </SimpleGrid>
    )
  }, [totalFunds, aggregatedUsdPosition, avgRealizedApy])

  const productsOverview = useMemo(() => {
    if (!selectVaultsAssetsByType) return null

    return (
      <VStack
        width={'full'}
        spacing={[4, 6]}
      >
        {
          products.map( (productConfig: ProductProps) => {
            // const strategyPath = getRoutePath('earn', [productConfig.route])
            const productAssets = productConfig.strategies.reduce( (productAssets: Asset[], strategy: string) => {
              return [
                ...productAssets,
                ...selectVaultsAssetsByType(strategy)
              ]
            }, [])

            const aggregatedData = productAssets.reduce( (aggregatedData: Record<string, BigNumber | null>, asset: Asset) => {
              aggregatedData.totalTVL = bnOrZero(aggregatedData.totalTVL).plus(bnOrZero(asset.tvlUsd))
              aggregatedData.minApy = bnOrZero(aggregatedData.minApy).lte(0) ? bnOrZero(asset.apy) : BigNumber.minimum(bnOrZero(aggregatedData.minApy), bnOrZero(asset.apy))
              aggregatedData.maxApy = !aggregatedData.maxApy ? bnOrZero(asset.apy) : BigNumber.maximum(bnOrZero(aggregatedData.maxApy), bnOrZero(asset.apy))
              return aggregatedData
            }, {
              minApy: null,
              maxApy: null,
              totalTVL: BNify(0)
            })

            const productPositions = Object.keys(vaultsPositions).filter( (assetId: AssetId) => {
              return productAssets.find( (asset: Asset) => asset.id === assetId )
            })

            return (
              <Card
                px={[5, 7]}
                py={[4, 6]}
                bg={productConfig.color}
                key={`product_${productConfig.strategy}`}
              >
                <VStack
                  spacing={6}
                  width={'full'}
                  alignItems={'flex-start'}
                >
                  <HStack
                    spacing={6}
                    width={'full'}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                  >
                    <VStack
                      spacing={6}
                      width={'full'}
                      alignItems={'flex-start'}
                    >
                      <Translation translation={productConfig.label} component={Heading} as={'h3'} fontSize={'h3'} />
                      {
                        productPositions.length>0 ? (
                          <StrategyOverview showHeader={false} strategies={productConfig.strategies} textProps={{fontSize:['md', 'lg']}} />
                        ) : (
                          <HStack
                            spacing={10}
                            width={'full'}
                          >
                            <VStack
                              spacing={2}
                              alignItems={'flex-start'}
                            >
                              <Translation translation={'stats.totalTVL'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
                              <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'100%'}>
                                <Amount.Usd value={aggregatedData.totalTVL} textStyle={'ctaStatic'} fontSize={'lg'} lineHeight={'initial'} />
                              </SkeletonText>
                            </VStack>
                            <VStack
                              spacing={2}
                              alignItems={'flex-start'}
                            >
                              <Translation translation={'stats.minApy'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
                              <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'100%'}>
                                <Amount.Percentage value={aggregatedData.minApy} textStyle={'ctaStatic'} fontSize={'lg'} lineHeight={'initial'} />
                              </SkeletonText>
                            </VStack>
                            <VStack
                              spacing={2}
                              alignItems={'flex-start'}
                            >
                              <Translation translation={'stats.maxApy'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
                              <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'100%'}>
                                <Amount.Percentage value={aggregatedData.maxApy} textStyle={'ctaStatic'} fontSize={'lg'} lineHeight={'initial'} />
                              </SkeletonText>
                            </VStack>
                          </HStack>
                        )
                      }
                    </VStack>
                    <MdKeyboardArrowRight
                      size={24}
                      color={theme.colors.primary}
                    />
                  </HStack>
                </VStack>
              </Card>
            )
          })
        }
        <Card
          px={[5, 7]}
          py={[4, 6]}
        >
          <VStack
            spacing={6}
            width={'full'}
            alignItems={'flex-start'}
          >
            <HStack
              flex={1}
              spacing={6}
              width={'full'}
              alignItems={'flex-start'}
              justifyContent={'space-between'}
            >
              <VStack
                spacing={6}
                alignItems={'flex-start'}
              >
                <Translation translation={'dashboard.portfolio.riskExposure'} component={Heading} as={'h3'} fontSize={'h3'} />
                <HStack
                  spacing={6}
                >
                  {
                    Object.keys(riskExposures).map( (strategy: string) => (
                      <VStack
                        spacing={2}
                        alignItems={'flex-start'}
                      >
                        <Translation translation={strategies[strategy].riskProfile} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
                        <HStack
                          spacing={2}
                        >
                          <Amount.Percentage value={riskExposures[strategy].perc.times(100)} textStyle={'ctaStatic'} fontSize={['md', 'lg']} lineHeight={'initial'} />
                          <Image src={`images/strategies/${strategy}.svg`} w={6} h={6} />
                        </HStack>
                      </VStack>
                    ))
                  }
                </HStack>
              </VStack>
              <Box
                width={100}
                height={100}
              >
                {riskExposureDonutChart}
              </Box>
            </HStack>
          </VStack>
        </Card>
      </VStack>
    )
  }, [isPortfolioLoaded, selectVaultsAssetsByType, vaultsPositions, riskExposures, riskExposureDonutChart, theme])
  
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
          <Translation translation={'dashboard.rewards.staking.empty.body'} params={{apy: stakingData.maxApr.toFixed(2)}} isHtml={true} component={Text} textAlign={['center', 'left']} />
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
                <Translation component={Text} translation={'defi.deposited'} textStyle={'captionSmall'} />
                <TokenAmount assetId={stakingData?.IDLE.asset?.id} showIcon={false} amount={stakingData.position.deposited} textStyle={'tableCell'} />
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
          id={'best-yield-rewards'}
          alignItems={'flex-start'}
        >
          <StrategyLabel strategy={'BY'} customText={'dashboard.rewards.vaults.title'}  textStyle={'heading'} fontSize={'h3'} />
          {vaultsRewardsOverview}
        </VStack>
        
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
      mt={5}
      width={'100%'}
    >
      {/*<AnnouncementBanner text={'announcements.eulerHack'} />*/}
      <VaultsCarousel />
      <Stack
        mt={0}
        mb={10}
        pt={[16, 20]}
        spacing={10}
        width={'100%'}
        alignItems={['flex-start','center']}
        justifyContent={'flex-start'}
        direction={['column', 'row']}
      >
        <Translation translation={'navBar.dashboard'} component={Heading} as={'h2'} size={'3xl'} />
        {
          /*
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
          */
        }
      </Stack>
      <Stack
        flex={1}
        spacing={20}
        width={'100%'}
        direction={['column', 'row']}
      >
        <VStack
          flex={1}
          spacing={6}
          width={['full', '66.3%']}
          alignItems={'flex-start'}
        >
          <Flex
            p={0}
            width={'full'}
            overflow={'hidden'}
            direction={'column'}
            minH={['auto', 410]}
            position={'relative'}
            justifyContent={'space-between'}
          >
            {
              /*
              totalFunds.lte(0) && (
                <Center
                  layerStyle={'overlay'}
                  bg={'rgba(0, 0, 0, 0.4)'}
                >
                  <Translation translation={account ? 'dashboard.performanceChart.empty' : 'dashboard.performanceChart.emptyNotConnected'} textAlign={'center'} component={Text} py={1} px={3} bg={'rgba(0, 0, 0, 0.2)'} borderRadius={8} />
                </Center>
              )
              */
            }
            <BalanceChartProvider
              timeframe={timeframe}
              allowFlatChart={true}
              assetIds={allAssetIds}
              strategies={selectedStrategies}
            >
              <Stack
                pt={0}
                pb={4}
                width={'full'}
                alignItems={'flex-start'}
                direction={['column', 'row']}
                justifyContent={['center', 'space-between']}
              >
                {
                  isPortfolioAccountReady && (
                    <VStack
                      width={'full'}
                      spacing={[5, 1]}
                      alignItems={['center', 'flex-start']}
                    >
                      <SkeletonText width={'full'} noOfLines={2} isLoaded={!!accountAndPortfolioLoaded}>
                        <Translation display={['none', 'block']} translation={'dashboard.portfolio.totalChart'} component={Text} textStyle={'tableCell'} fontWeight={400} color={'cta'} />
                        <VStack
                          spacing={[1, 3]}
                          alignItems={'baseline'}
                        >
                          <Amount.Usd value={totalFunds} textStyle={'heading'} fontSize={'3xl'} />
                          {
                            totalFunds.gt(0) && (
                              <HStack
                                spacing={2}
                              >
                                <BalanceChartProvider.BalanceChangeUsd textStyle={'captionSmall'} />
                                <BalanceChartProvider.BalanceChangePercentage textStyle={'captionSmall'} />
                              </HStack>
                            )
                          }
                        </VStack>
                      </SkeletonText>
                    </VStack>
                  )
                }
                <HStack
                  pt={[4, 9]}
                  width={'full'}
                  justifyContent={'flex-end'}
                >
                  <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} width={['100%', 'auto']} justifyContent={['center', 'initial']} />
                </HStack>
              </Stack>
              <BalanceChart
                height={'300px'}
                percentChange={0}
                color={chartColor}
                maxMinEnabled={false}
                loadingEnabled={false}
                isRainbowChart={false}
                gradientEnabled={false}
                setPercentChange={setPercentChange}
                margins={{ top: 10, right: 0, bottom: 65, left: 0 }}
              />
            </BalanceChartProvider>
          </Flex>
          <Flex
            px={[0, 10]}
            width={'full'}
          >
            {fundsOverview}
          </Flex>
        </VStack>
        <VStack
          spacing={6}
          width={['100%', '500px']}
          alignItems={'flex-start'}
        >
          {productsOverview}
        </VStack>
      </Stack>
      <DepositedAssetsTable />
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
          <Card
          >
            <VStack
              flex={1}
              spacing={0}
              height={'100%'}
              alignItems={'flex-start'}
              ref={ref as typeof useRef}
              justifyContent={'flex-start'}
            >
              <Translation display={['none', 'block']} component={Card.Heading} fontSize={'lg'} translation={'dashboard.partnerPrograms'} />
              <PartnersPrograms />
            </VStack>
          </Card>
        </VStack>
      </Stack>

      <JoinCommunity />
    </Box>
  )
}
