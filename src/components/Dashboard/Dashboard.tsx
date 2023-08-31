import BigNumber from 'bignumber.js'
import { bnOrZero, BNify } from 'helpers/'
import { Card } from 'components/Card/Card'
import React, { useState, useMemo } from 'react'
import { Footer } from 'components/Footer/Footer'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import { MdKeyboardArrowRight } from 'react-icons/md'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { TwitterTimelineEmbed } from 'react-twitter-embed'
import { products, ProductProps } from 'constants/products'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { VaultsCarousel } from 'components/VaultsCarousel/VaultsCarousel'
import { selectVisibleStrategies } from 'selectors/selectVisibleStrategies'
import { PartnersPrograms } from 'components/PartnersPrograms/PartnersPrograms'
import { StrategyOverview } from 'components/StrategyOverview/StrategyOverview'
import { AssetId, Asset, HistoryTimeframe, VaultPosition } from 'constants/types'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { DonutChart, DonutChartInitialData } from 'components/DonutChart/DonutChart'
import { DashboardNewsBanner } from 'components/DashboardNewsBanner/DashboardNewsBanner'
import { BalanceChartProvider, BalanceChart } from 'components/BalanceChart/BalanceChart'
import { DepositedAssetsTable } from 'components/DepositedAssetsTable/DepositedAssetsTable'
import { Box, Text, SkeletonText, SimpleGrid, Stack, VStack, HStack, Heading, Image, Flex } from '@chakra-ui/react'

export const Dashboard: React.FC = () => {
  const { theme } = useThemeProvider()
  const [ , setPercentChange ] = useState(0)
  const selectedStrategies = useMemo(() => Object.keys(strategies), [])
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.YEAR)

  const { account, walletInitialized, setChainId } = useWalletProvider()
  const {
    assetsData,
    isPortfolioAccountReady,
    isVaultsPositionsLoaded,
    isPortfolioLoaded,
    vaultsPositions,
    selectors: {
      selectAssetsByIds,
      selectAssetStrategies,
      selectVaultsAssetsByType,
    }
  } = usePortfolioProvider()

  const enabledStrategies = useMemo(() => selectVisibleStrategies(), [])

  const accountAndPortfolioLoaded = useMemo(() => {
    return walletInitialized && isPortfolioLoaded && (!account || isVaultsPositionsLoaded)
  }, [walletInitialized, account, isPortfolioLoaded, isVaultsPositionsLoaded])

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
      </VStack>
    )
  }, [isPortfolioLoaded, selectVaultsAssetsByType, vaultsPositions, riskExposures, riskExposureDonutChart, theme])

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
          spacing={[6, 14]}
          alignItems={'flex-start'}
        >
          <DashboardNewsBanner announcement={'zkEVM'} onClick={() => setChainId(1101)} />
          <PartnersPrograms />
        </VStack>
        <VStack
          pl={4}
          pt={4}
          spacing={4}
          borderRadius={8}
          overflow={'hidden'}
          alignItems={'flex-start'}
          width={['100%', '500px']}
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
                  height={'100%'}
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

      <Footer />
    </Box>
  )
}
