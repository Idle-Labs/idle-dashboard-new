import BigNumber from 'bignumber.js'
import { BsStars } from "react-icons/bs"
import { Card } from 'components/Card/Card'
import { useNavigate } from 'react-router-dom'
import React, { useState, useMemo } from 'react'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import { MdKeyboardArrowRight } from 'react-icons/md'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { TwitterTimelineEmbed } from 'react-twitter-embed'
import { products, ProductProps } from 'constants/products'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { bnOrZero, BNify, getRoutePath, formatMoney } from 'helpers/'
import { BoostedVaults } from 'components/BoostedVaults/BoostedVaults'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { VaultsCarousel } from 'components/VaultsCarousel/VaultsCarousel'
import { selectVisibleStrategies } from 'selectors/selectVisibleStrategies'
import { PartnersPrograms } from 'components/PartnersPrograms/PartnersPrograms'
import { StrategyOverview } from 'components/StrategyOverview/StrategyOverview'
import { AssetId, Asset, HistoryTimeframe, VaultPosition } from 'constants/types'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
// import { AnnouncementBanner } from 'components/AnnouncementBanner/AnnouncementBanner'
// import { DonutChart, DonutChartInitialData } from 'components/DonutChart/DonutChart'
import { SwitchNetworkButton } from 'components/SwitchNetworkButton/SwitchNetworkButton'
import { DashboardNewsBanner } from 'components/DashboardNewsBanner/DashboardNewsBanner'
import { BalanceChartProvider, BalanceChart } from 'components/BalanceChart/BalanceChart'
import { DepositedAssetsTable } from 'components/DepositedAssetsTable/DepositedAssetsTable'
import { Box, Text, SkeletonText, SimpleGrid, Stack, VStack, HStack, Heading, Flex, Spinner } from '@chakra-ui/react'

export const Dashboard: React.FC = () => {
  const { theme } = useThemeProvider()
  const [ , setPercentChange ] = useState(0)
  const selectedStrategies = useMemo(() => Object.keys(strategies), [])
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.YEAR)

  const navigate = useNavigate()
  const { network } = useWalletProvider()
  const {
    assetsData,
    stakingData,
    isPortfolioAccountReady,
    // isVaultsPositionsLoaded,
    isPortfolioLoaded,
    vaultsPositions,
    selectors: {
      selectAssetsByIds,
      // selectAssetStrategies,
      selectVaultsAssetsByType,
    }
  } = usePortfolioProvider()

  const enabledStrategies = useMemo(() => selectVisibleStrategies(), [])

  const assetIds = useMemo(() => {
    if (!selectAssetsByIds) return []
    const assetIds = Object.keys(vaultsPositions)
    const assets = selectAssetsByIds(assetIds)
    return assets.filter( (asset: Asset) => !selectedStrategies || !asset.type || (selectedStrategies.includes(asset.type) && enabledStrategies.includes(asset.type)) ).map( (asset: Asset) => asset.id )
  }, [vaultsPositions, selectedStrategies, enabledStrategies, selectAssetsByIds])

  const allAssetIds = useMemo(() => {
    return Object.values(assetsData).filter( (asset: Asset) => asset.id && (!asset.type || enabledStrategies.includes(asset.type)) ).map( (asset: Asset) => asset.id as string )
  }, [assetsData, enabledStrategies])

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

  const totalFunds = useMemo(() => {
    return aggregatedUsdPosition.deposited.plus(aggregatedUsdPosition.earnings)
  }, [aggregatedUsdPosition])

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

  const totalDiscountedFeesUsd = useMemo(() => {
    return Object.values(vaultsPositions).reduce( (totalDiscountedFees: BigNumber, vaultPosition: VaultPosition) => {
      return totalDiscountedFees.plus(bnOrZero(vaultPosition.usd.discountedFees))
    }, BNify(0))
  }, [vaultsPositions])

  /*
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
  */

  /*
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
  */

  const fundsOverview = useMemo(() => {
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
          {
            isPortfolioAccountReady ? (
              <Amount.Usd abbreviate={false} textStyle={'heading'} fontSize={'h3'} value={aggregatedUsdPosition.deposited} />
            ) : (
              <Spinner size={'sm'} /> 
            )
          }
        </VStack>
        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.earnings'} textStyle={'titleSmall'} />
          {
            isPortfolioAccountReady ? (
              <Amount.Usd abbreviate={false} textStyle={'heading'} fontSize={'h3'} value={aggregatedUsdPosition.earnings} />
            ) : (
              <Spinner size={'sm'} /> 
            )
          }
        </VStack>

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.avgRealizedApy'} textStyle={'titleSmall'} />
          {
            isPortfolioAccountReady ? (
              <Amount.Percentage textStyle={'heading'} fontSize={'h3'} value={avgRealizedApy} />
            ) : (
              <Spinner size={'sm'} /> 
            )
          }
        </VStack>

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'defi.discountedFees'} textStyle={'titleSmall'} />
          {
            isPortfolioAccountReady ? (
              <Amount.Usd abbreviate={false} textStyle={'heading'} fontSize={'h3'} value={totalDiscountedFeesUsd} />
            ) : (
              <Spinner size={'sm'} /> 
            )
          }
        </VStack>
      </SimpleGrid>
    )
  }, [aggregatedUsdPosition, avgRealizedApy, totalDiscountedFeesUsd, isPortfolioAccountReady])

  /*
  const riskExposure = useMemo(() => {
    return (
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
                      key={`profile_${strategy}`}
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
    )
  }, [riskExposures, riskExposureDonutChart])
  */

  const feeDiscountCard = useMemo(() => {

    const stakingShare = bnOrZero(stakingData?.position.share)

    return (
      <Card
        px={[5, 7]}
        py={[4, 6]}
        layerStyle={['card', 'cardHover']}
        onClick={() => navigate(getRoutePath('stake'))}
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
              <HStack
                spacing={2}
              >
                <Translation translation={'dashboard.portfolio.feeDiscount'} component={Heading} as={'h3'} fontSize={'h3'} />
                <BsStars size={20} color={'orange'} />
              </HStack>
              {
                (!isPortfolioLoaded || stakingShare.lte(0)) ? (
                  <VStack
                    spacing={2}
                    width={'full'}
                    alignItems={'flex-start'}
                  >
                    <Translation translation={`strategies.staking.dashboard.description`} isHtml />
                  </VStack>
                ) : (
                  <HStack
                    spacing={10}
                    width={'full'}
                    justifyContent={'flex-start'}
                  >
                    <VStack
                      spacing={2}
                      alignItems={'flex-start'}
                    >
                      <Translation translation={'staking.yourstkIDLE'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
                      <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'full'}>
                        <AssetProvider.GeneralData field={'stkIDLEBalance'} textStyle={'ctaStatic'} fontSize={'lg'} lineHeight={'initial'} />
                      </SkeletonText>
                    </VStack>
                    <VStack
                      spacing={2}
                      alignItems={'flex-start'}
                    >
                      <Translation translation={'staking.lockEnd'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
                      <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'full'}>
                        <AssetProvider.StakingEndDate showTime={false} textStyle={'ctaStatic'} fontSize={'lg'} lineHeight={'initial'} />
                      </SkeletonText>
                    </VStack>
                    <VStack
                      spacing={2}
                      alignItems={'flex-start'}
                    >
                      <Translation translation={'staking.feeDiscount'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
                      <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'full'}>
                        <AssetProvider.GeneralData field={'stakingFeeDiscount'} textStyle={'ctaStatic'} fontSize={'lg'} lineHeight={'initial'} />
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
  }, [stakingData, isPortfolioLoaded, navigate, theme])

  const productsOverview = useMemo(() => {
    if (!selectVaultsAssetsByType) return null

    return (
      <VStack
        width={'full'}
        spacing={[4, 6]}
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

            const aggregatedData = productAssets.filter( (asset: Asset) => asset.status !== 'deprecated' ).reduce( (aggregatedData: Record<string, BigNumber | null>, asset: Asset) => {
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
                cursor={'pointer'}
                bg={productConfig.color}
                sx={{
                  ':hover':{
                    backgroundColor:`${productConfig.color}CC`
                  }
                }}
                key={`product_${productConfig.strategy}`}
                onClick={() => productAssets.length ? navigate(strategyPath) : null}
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
                        isPortfolioLoaded && !productAssets.length ? (
                          <VStack
                            spacing={2}
                            width={'full'}
                            alignItems={'flex-start'}
                          >
                            <Translation translation={`strategies.${productConfig.strategy}.noVaultsAvailable`} params={{network: network?.chainName}} textStyle={'caption'} />
                            <SwitchNetworkButton chainId={1} size={'xs'} px={4} py={3} height={'auto'} />
                          </VStack>
                        ) : productPositions.length>0 ? (
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
                              <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'full'}>
                                <Amount.Usd value={aggregatedData.totalTVL} textStyle={'ctaStatic'} fontSize={'lg'} lineHeight={'initial'} />
                              </SkeletonText>
                            </VStack>
                            <VStack
                              spacing={2}
                              alignItems={'flex-start'}
                            >
                              <Translation translation={'stats.minApy'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
                              <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'full'}>
                                <Amount.Percentage value={aggregatedData.minApy} textStyle={'ctaStatic'} fontSize={'lg'} lineHeight={'initial'} />
                              </SkeletonText>
                            </VStack>
                            <VStack
                              spacing={2}
                              alignItems={'flex-start'}
                            >
                              <Translation translation={'stats.maxApy'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
                              <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'full'}>
                                <Amount.Percentage value={aggregatedData.maxApy} textStyle={'ctaStatic'} fontSize={'lg'} lineHeight={'initial'} />
                              </SkeletonText>
                            </VStack>
                          </HStack>
                        )
                      }
                    </VStack>
                    {
                      productAssets.length>0 && (
                        <MdKeyboardArrowRight
                          size={24}
                          color={theme.colors.primary}
                        />
                      )
                    }
                  </HStack>
                </VStack>
              </Card>
            )
          })
        }
        {feeDiscountCard}
      </VStack>
    )
  }, [isPortfolioLoaded, navigate, selectVaultsAssetsByType, network, vaultsPositions, feeDiscountCard, theme])

  const chartColor = useMemo(() => {
    if (selectedStrategies.length===1){
      return strategies[selectedStrategies[0]].color
    }
    return undefined
  }, [selectedStrategies])

  return (
    <Box
      mt={5}
      width={'full'}
    >
      <VaultsCarousel />
      <VStack
        spacing={10}
        pt={[16, 100]}
        width={'full'}
      >
        {/*<AnnouncementBanner text={'feeDiscount.announcement'} image={'images/vaults/discount.png'} />*/}
        <Stack
          mt={0}
          mb={10}
          flex={1}
          spacing={20}
          width={'full'}
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
                  <VStack
                    width={'full'}
                    spacing={[5, 1]}
                    alignItems={['center', 'flex-start']}
                  >
                    <Translation display={['none', 'block']} translation={'dashboard.portfolio.totalChart'} component={Text} textStyle={'tableCell'} fontWeight={400} color={'cta'} />
                    <SkeletonText noOfLines={2} isLoaded={!!isPortfolioAccountReady}>
                      <VStack
                        spacing={[1, 3]}
                        alignItems={'baseline'}
                      >
                        <Amount.Usd abbreviate={false} value={totalFunds} textStyle={'heading'} fontSize={'3xl'} />
                        {
                          /*
                          totalFunds.gt(0) && (
                            <HStack
                              spacing={2}
                            >
                              <BalanceChartProvider.BalanceChangeUsd textStyle={'captionSmall'} />
                              <BalanceChartProvider.BalanceChangePercentage textStyle={'captionSmall'} />
                            </HStack>
                          )
                          */
                        }
                      </VStack>
                    </SkeletonText>
                  </VStack>
                  <HStack
                    pt={[4, 9]}
                    width={'full'}
                    justifyContent={'flex-end'}
                  >
                    <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} width={['full', 'auto']} justifyContent={['center', 'initial']} />
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
                  formatFn={(n: any) => `$${formatMoney(n, 2)}`}
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
            width={['full', '500px']}
            alignItems={'flex-start'}
          >
            {productsOverview}
          </VStack>
        </Stack>
      </VStack>
      <VStack
        mt={4}
        spacing={16}
        width={'full'}
      >
        <BoostedVaults />
        <DepositedAssetsTable />
      </VStack>
      <Stack
        spacing={6}
        mt={[10, 20]}
        width={'full'}
        direction={['column', 'row']}
      >
        <VStack
          flex={1}
          spacing={[6, 14]}
          alignItems={'flex-start'}
          justifyContent={'space-between'}
        >
          <DashboardNewsBanner banner={'feeDiscount'} announcement={'feeDiscount'} onClick={() => navigate(getRoutePath('stake'))} />
          <PartnersPrograms />
        </VStack>
        <VStack
          pl={4}
          pt={4}
          spacing={4}
          borderRadius={8}
          overflow={'hidden'}
          alignItems={'flex-start'}
          width={['full', '500px']}
          backgroundColor={'black'}
        >
          <Translation mb={0} component={Card.Heading} fontSize={'lg'} translation={'social.title'} />
          <Box
            pb={4}
            flex={1}
            width={'full'}
            minH={['400px', 'auto']}
          >
            <TwitterTimelineEmbed
              theme={'dark'}
              noHeader={true}
              noBorders={true}
              autoHeight={true}
              sourceType={"profile"}
              screenName={"idlefinance"}
            />
            {
              /*
              <Card
              >
                <VStack
                  flex={1}
                  spacing={0}
                  height={'full'}
                  alignItems={'flex-start'}
                  ref={ref as typeof useRef}
                  justifyContent={'flex-start'}
                >
                  <Translation display={['none', 'block']} component={Card.Heading} fontSize={'lg'} translation={'partnerPrograms.title'} />
                  <PartnersPrograms />
                </VStack>
              </Card>
              */
            }
          </Box>
        </VStack>
      </Stack>
    </Box>
  )
}
