import React, { useMemo } from 'react'
import { strategies } from 'constants/'
import { Card } from 'components/Card/Card'
import { Amount } from 'components/Amount/Amount'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { AssetGeneralData } from 'components/AssetGeneralData/AssetGeneralData'
import { VStack, Heading, Text, Stack, HStack, Button, SimpleGrid } from '@chakra-ui/react'
import { StrategyDescriptionCarousel } from 'components/StrategyDescriptionCarousel/StrategyDescriptionCarousel'

export const GaugeStaking: React.FC = () => {
  const { params } = useBrowserRouter()
  const { selectors: { selectAssetById, selectVaultGauge } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const vaultGauge = useMemo(() => {
    return selectVaultGauge && selectVaultGauge(params.asset)
  }, [selectVaultGauge, params.asset])

  const assetGauge = useMemo(() => {
    return selectAssetById && vaultGauge && selectAssetById(vaultGauge.id)
  }, [vaultGauge, selectAssetById])

  const strategy = useMemo(() => {
    return Object.keys(strategies).find( strategy => strategies[strategy].route === params.strategy )
  }, [params])

  const strategyColor = useMemo(() => {
    return strategy && strategies[strategy].color
  }, [strategy])

  const strategyDescriptionCarousel = useMemo(() => {
    if (!vaultGauge) return null
    const strategyProps = strategies[vaultGauge.type]
    if (!strategyProps?.carouselItems) return null
    return (
      <StrategyDescriptionCarousel color={strategyColor} strategy={vaultGauge.type} delay={10000} />
    )
  }, [vaultGauge, strategyColor])

  // console.log('vaultGauge', vaultGauge)
  // console.log('assetGauge', assetGauge)

  return (
    <VStack
      spacing={10}
      width={'100%'}
    >
      <AssetGeneralData assetId={vaultGauge?.id} />
      {
        /*
        <AssetProvider
          wrapFlex={false}
          assetId={vaultGauge.id}
        >
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
              <AssetProvider.Deposited textStyle={'heading'} fontSize={'h3'} />
            </VStack>
          </SimpleGrid>
        </AssetProvider>
        */
      }
      <VStack
        spacing={6}
        width={'100%'}
        alignItems={'flex-start'}
      >
        <Translation component={Heading} as={'h3'} size={'md'} translation={'defi.rewards'} />
        <VStack
          spacing={4}
          width={'100%'}
        >
          {
            Object.keys(assetGauge.gaugeData?.rewards).map( rewardId => {
              const rewardData = assetGauge.gaugeData.rewards[rewardId]
              // console.log('rewardData', rewardId, rewardData)
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
                        spacing={[6, 0]}
                        columns={[2, 4]}
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
                          <Translation component={Text} translation={'defi.apr'} textStyle={'captionSmall'} />
                          <Amount.Percentage textStyle={'tableCell'} value={rewardData.apr} />
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
                            <Amount textStyle={'tableCell'} value={rewardData.rate} />
                            <AssetProvider.Name textStyle={'tableCell'} />
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
                            <Amount textStyle={'tableCell'} value={rewardData.balance} />
                            <AssetProvider.Name textStyle={'tableCell'} />
                          </HStack>
                        </VStack>
                      </SimpleGrid>
                      <Translation component={Button} translation={`defi.claim`} onClick={() => {}} variant={['ctaPrimaryOutline']} disabled={rewardData.balance.lte(0)} px={10} py={2} />
                    </Stack>
                  </Card>
                </AssetProvider>
              )
            })
          }
        </VStack>
      </VStack>
      {strategyDescriptionCarousel}
    </VStack>
  )
}