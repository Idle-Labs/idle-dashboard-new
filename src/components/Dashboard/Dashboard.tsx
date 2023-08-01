import BigNumber from 'bignumber.js'
import { Card } from 'components/Card/Card'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import { MdKeyboardArrowRight } from 'react-icons/md'
import React, { useRef, useState, useMemo } from 'react'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { VaultCard } from 'components/VaultCard/VaultCard'
import { products, ProductProps } from 'constants/products'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Scrollable } from 'components/Scrollable/Scrollable'
import { Link, LinkProps, useNavigate } from 'react-router-dom'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { AssetsIcons } from 'components/AssetsIcons/AssetsIcons'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { BalanceChart } from 'components/BalanceChart/BalanceChart'
import useBoundingRect from "hooks/useBoundingRect/useBoundingRect"
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { JoinCommunity } from 'components/JoinCommunity/JoinCommunity'
import { StrategyLabel } from 'components/StrategyLabel/StrategyLabel'
import { VaultsCarousel } from 'components/VaultsCarousel/VaultsCarousel'
import { selectVisibleStrategies } from 'selectors/selectVisibleStrategies'
import { TransactionList } from 'components/TransactionList/TransactionList'
import { StrategyOverview } from 'components/StrategyOverview/StrategyOverview'
import { CompositionChart } from 'components/CompositionChart/CompositionChart'
import { AssetId, Asset, HistoryTimeframe, VaultPosition } from 'constants/types'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { TransactionButton } from 'components/TransactionButton/TransactionButton'
import { SwitchNetworkButton } from 'components/SwitchNetworkButton/SwitchNetworkButton'
import { VaultRewardOverview } from 'components/VaultRewardOverview/VaultRewardOverview'
import { PausableChakraCarouselProvider } from 'components/PausableChakraCarousel/PausableChakraCarousel'
import { bnOrZero, BNify, getRoutePath, getLegacyDashboardUrl, checkSectionEnabled, openWindow, isEmpty, formatDate, getAssetPath } from 'helpers/'
import { Box, Text, Skeleton, SkeletonText, SimpleGrid, Stack, VStack, HStack, Stat, StatArrow, Heading, Button, Image, Flex } from '@chakra-ui/react'

export const Dashboard: React.FC = () => {
  const [ , setPercentChange ] = useState(0)
  const { theme, isMobile } = useThemeProvider()
  const [ ref, dimensions ] = useBoundingRect()
  const selectedStrategies = useMemo(() => Object.keys(strategies), [])
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.YEAR)

  const navigate = useNavigate()
  const { account, network, walletInitialized } = useWalletProvider()
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
      selectAssetById,
      selectAssetsByIds,
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

  const productsOverview = useMemo(() => {
    if (!selectVaultsAssetsByType) return null
    return (
      <SimpleGrid
        mt={20}
        width={'full'}
        spacing={[7, 120]}
        columns={[1, products.length]}
      >
      {
        products.map( (productConfig: ProductProps) => {
          
          const strategyPath = getRoutePath('earn', [productConfig.route])
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
            <VStack
              spacing={6}
              width={'full'}
              alignItems={'flex-start'}
              key={`product_${productConfig.strategy}`}
            >
              <HStack
                width={'full'}
                alignItems={'flex-start'}
                justifyContent={'space-between'}
              >
                <VStack
                  mt={5}
                  width={'auto'}
                  spacing={[6, 10]}
                >
                  <HStack
                    spacing={4}
                    width={'full'}
                  >
                    <Translation translation={productConfig.label} component={Heading} as={'h3'} size={'md'} />
                  </HStack>
                  {
                    productPositions.length>0 ? (
                      <StrategyOverview showHeader={false} strategies={productConfig.strategies} />
                    ) : (
                      <HStack
                        spacing={10}
                        width={'full'}
                      >
                        <VStack
                          spacing={2}
                          alignItems={'flex-start'}
                        >
                          <Translation translation={'stats.totalTVL'} textStyle={'captionSmall'} />
                          <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'100%'}>
                            <Amount.Usd value={aggregatedData.totalTVL} textStyle={'ctaStatic'} fontSize={'xl'} lineHeight={'initial'} />
                          </SkeletonText>
                        </VStack>
                        <VStack
                          spacing={2}
                          alignItems={'flex-start'}
                        >
                          <Translation translation={'stats.minApy'} textStyle={'captionSmall'} />
                          <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'100%'}>
                            <Amount.Percentage value={aggregatedData.minApy} textStyle={'ctaStatic'} fontSize={'xl'} lineHeight={'initial'} />
                          </SkeletonText>
                        </VStack>
                        <VStack
                          spacing={2}
                          alignItems={'flex-start'}
                        >
                          <Translation translation={'stats.maxApy'} textStyle={'captionSmall'} />
                          <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'100%'}>
                            <Amount.Percentage value={aggregatedData.maxApy} textStyle={'ctaStatic'} fontSize={'xl'} lineHeight={'initial'} />
                          </SkeletonText>
                        </VStack>
                      </HStack>
                    )
                  }
                </VStack>
                {
                  !isMobile && (
                    <Image src={productConfig.image} height={'170px'} />
                  )
                }
              </HStack>
              <VStack
                spacing={4}
                width={'full'}
                alignItems={'flex-start'}
              >
                {
                  productPositions.length>0 ? (
                    <Card
                      px={[3, 6]}
                      py={[4, 7]}
                      minHeight={['auto', '274px']}
                    >
                      <VStack
                        spacing={2}
                        width={'full'}
                      >
                        <Card.Light
                          py={2}
                          px={[3, 6]}
                        >
                          <SimpleGrid
                            width={'full'}
                            columns={[3, 4]}
                          >
                            <Translation translation={'defi.asset'} textStyle={'captionSmall'} color={'primary'} />
                            {
                              !isMobile && (
                                <Translation pl={14} translation={'defi.protocols'} textStyle={'captionSmall'} color={'primary'} />
                              )
                            }
                            <Translation pl={[8, 4]} translation={'defi.totalFunds'} textStyle={'captionSmall'} color={'primary'} />
                            <Translation pl={[2, 4]} translation={'defi.realizedApy'} textStyle={'captionSmall'} color={'primary'} />
                          </SimpleGrid>
                        </Card.Light>
                        <Scrollable
                          maxH={200}
                        >
                          {
                            productPositions
                            .sort( (a1: AssetId, a2: AssetId) => {
                              const vaultPosition1 = vaultsPositions[a1]
                              const vaultPosition2 = vaultsPositions[a2]
                              return bnOrZero(vaultPosition1.usd.redeemable).lt(vaultPosition2.usd.redeemable) ? 1 : -1
                            })
                            .map( (assetId: AssetId) => {
                              const asset = selectAssetById(assetId)
                              return (
                                <AssetProvider
                                  wrapFlex={false}
                                  assetId={assetId}
                                  key={`asset_${assetId}`}
                                >
                                  <SimpleGrid
                                    pr={1}
                                    py={4}
                                    pl={[2, 6]}
                                    width={'full'}
                                    columns={[3, 4]}
                                    borderBottom={'1px solid'}
                                    borderColor={'divider'}
                                    sx={{
                                      cursor:'pointer',
                                      _hover:{
                                        bg:'card.bgLight'
                                      }
                                    }}
                                    onClick={() => navigate(getAssetPath(asset))}
                                  >
                                    <HStack
                                      width={'full'}
                                      justifyContent={'space-between'}
                                    >
                                      <AssetProvider.GeneralData field={'asset'} size={'xs'} textStyle={'tableCell'} fontSize={['xs', 'md']} />
                                      <AssetProvider.GeneralData field={'strategies'} width={6} height={6} maxW={'initial'} />
                                    </HStack>
                                    {
                                      !isMobile && (
                                        <Flex
                                          pl={14}
                                        >
                                          <AssetProvider.Protocols size={'xs'}>
                                            <AssetProvider.ProtocolIcon size={'xs'} showTooltip={true} />
                                          </AssetProvider.Protocols>
                                        </Flex>
                                      )
                                    }
                                    <AssetProvider.GeneralData field={'balanceUsd'} pl={[10, 2]} fontSize={['sm', 'md']} />
                                    <HStack
                                      pr={2}
                                      width={'full'}
                                      justifyContent={'space-between'}
                                    >
                                      <AssetProvider.GeneralData field={'realizedApy'} pl={[2, 1]} fontSize={['sm', 'md']} />
                                      <MdKeyboardArrowRight
                                        size={24}
                                        color={theme.colors.primary}
                                      />
                                    </HStack>
                                    {
                                      false && !isMobile && (
                                        <HStack
                                          justifyContent={'flex-end'}
                                        >
                                          <Translation<LinkProps> component={Link} translation={`common.manage`} style={{fontSize:'16px',fontWeight:700,color:'white',fontFamily: `'Open Sans', sans-serif`}} to={getAssetPath(asset)} />
                                          <MdKeyboardArrowRight
                                            size={24}
                                            color={theme.colors.primary}
                                          />
                                        </HStack>
                                      )
                                    }
                                  </SimpleGrid>
                                </AssetProvider>
                              )
                            })
                          }
                        </Scrollable>
                      </VStack>
                    </Card>
                  ) : (
                    <VStack
                      spacing={6}
                      width={'full'}
                      alignItems={'flex-start'}
                    >
                      <Translation translation={`strategies.${productConfig.strategy}.descriptionShort`} textStyle={'caption'} />
                      {
                        !productAssets.length ? (
                          <VStack
                            spacing={4}
                            width={'full'}
                            alignItems={'flex-start'}
                          >
                            <Translation translation={'defi.noVaultsAvailable'} textStyle={'ctaStatic'} />
                            <Translation translation={`strategies.${productConfig.strategy}.noVaultsAvailable`} params={{network: network?.chainName}} textStyle={'caption'} />
                          </VStack>
                        ) : (
                          <VStack
                            spacing={4}
                            width={'full'}
                            alignItems={'flex-start'}
                          >
                            <Translation translation={'dashboard.strategies.bestPerforming'} textStyle={'ctaStatic'} />
                            <PausableChakraCarouselProvider delay={10000}>
                              <PausableChakraCarouselProvider.Carousel
                                showProgress={false}
                                progressColor={'white'}
                              >
                                {
                                  productAssets
                                    .filter( (a: Asset) => a.status !== 'deprecated' )
                                    // .filter( (a: Asset) => BNify(a.apy).gt(0) )
                                    .sort( (a1: Asset, a2: Asset) => BNify(a1.apy).lt(BNify(a2.apy)) ? 1 : -1 )
                                    .slice(0, isMobile ? 8 : 9)
                                    .reduce( (assetsGroups: Asset[][], asset: Asset, index: number) => {
                                      const arrayKey: number = parseInt(''+(index/(isMobile ? 2 : 3)))
                                      if (!assetsGroups[arrayKey]){
                                        assetsGroups[arrayKey] = []
                                      }
                                      assetsGroups[arrayKey].push(asset)
                                      return assetsGroups
                                    }, []).map( (assets: Asset[], index: number) => {
                                      return (
                                        <SimpleGrid
                                          spacing={4}
                                          width={'full'}
                                          columns={[2, 3]}
                                          key={`container_${index}`}
                                        >
                                          {
                                            assets.map( (asset: Asset) => (
                                              <VaultCard.Minimal key={`asset_${asset.id}`} assetId={asset.id as string} />
                                            ))
                                          }
                                        </SimpleGrid>
                                      )
                                    })
                                }
                              </PausableChakraCarouselProvider.Carousel>
                              <PausableChakraCarouselProvider.DotNav />
                            </PausableChakraCarouselProvider>
                          </VStack>
                        )
                      }
                    </VStack>
                  )
                }
                {
                  !productAssets.length ? (
                    <SwitchNetworkButton chainId={1} />
                  ) : (
                    <Translation component={Button} translation={`common.deposit`} onClick={() => navigate(strategyPath)} variant={'ctaPrimary'} width={['full', 'auto']} px={10} py={2} />
                  )
                }
              </VStack>
            </VStack>
          )
        })
      }
      </SimpleGrid>
    )
  }, [isPortfolioLoaded, selectVaultsAssetsByType, vaultsPositions, selectAssetById, isMobile, network, theme, navigate])
  
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
            <Stack
              pt={[6, 8]}
              px={[6, 8]}
              pb={[4, 0]}
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
                      <Stack
                        spacing={[1, 4]}
                        alignItems={'baseline'}
                        direction={['column', 'row']}
                      >
                        <Amount.Usd value={totalFunds} textStyle={'heading'} fontSize={'3xl'} />
                        {
                          avgRealizedApy.gte(0.01) && (
                            <Stat>
                              <HStack spacing={2}>
                                <Amount.Percentage value={avgRealizedApy} suffix={' APY'} textStyle={'captionSmall'} />
                                <StatArrow type={avgRealizedApy.gt(0) ? 'increase' : 'decrease'} />
                              </HStack>
                            </Stat>
                          )
                        }
                      </Stack>
                    </SkeletonText>
                  </VStack>
                )
              }
              <HStack
                width={'full'}
                justifyContent={'flex-end'}
              >
                <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} width={['100%', 'auto']} justifyContent={['center', 'initial']} />
              </HStack>
            </Stack>
            <BalanceChart
              percentChange={0}
              color={chartColor}
              timeframe={timeframe}
              allowFlatChart={true}
              assetIds={allAssetIds}
              loadingEnabled={false}
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
            flex={1}
            py={[4, 0]}
            px={[6, 0]}
            display={'flex'}
            alignItems={'center'}
          >
            {
              /*
              totalFunds.lte(0) && (
                <Center
                  layerStyle={'overlay'}
                  bg={'rgba(0, 0, 0, 0.4)'}
                >
                  <Translation translation={account ? 'dashboard.compositionChart.empty' : 'dashboard.compositionChart.emptyNotConnected'} textAlign={'center'} component={Text} py={1} px={3} bg={'rgba(0, 0, 0, 0.2)'} borderRadius={8} />
                </Center>
              )
              */
            }
            <CompositionChart assetIds={assetIds} strategies={selectedStrategies} type={'assets'} />
          </Card.Dark>
        </VStack>
      </Stack>
      {productsOverview}
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

      <JoinCommunity />
    </Box>
  )
}
