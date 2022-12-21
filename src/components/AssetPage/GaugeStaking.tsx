import { strategies } from 'constants/'
import { BNify, isEmpty } from 'helpers/'
import { Card } from 'components/Card/Card'
import React, { useMemo } from 'react'
import { Amount } from 'components/Amount/Amount'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { AssetGeneralData } from 'components/AssetGeneralData/AssetGeneralData'
import { TransactionButton } from 'components/TransactionButton/TransactionButton'
import { VStack, Heading, Text, Stack, HStack, SimpleGrid } from '@chakra-ui/react'
import { StrategyDescriptionCarousel } from 'components/StrategyDescriptionCarousel/StrategyDescriptionCarousel'

export const GaugeStaking: React.FC = () => {
  const { params } = useBrowserRouter()
  const { assetsData, selectors: { selectAssetById, selectVaultGauge } } = usePortfolioProvider()

  const asset = useMemo(() => {
    const asset = selectAssetById && selectAssetById(params.asset)
    // console.log('GaugeStaking - useMemo - asset', asset)
    return asset
  }, [selectAssetById, params.asset])

  const vaultGauge = useMemo(() => {
    return asset && selectVaultGauge && selectVaultGauge(asset.id)
  }, [selectVaultGauge, asset])

  const assetGauge = useMemo(() => {
    const asset = selectAssetById && vaultGauge && selectAssetById(vaultGauge.id)
    // console.log('GaugeStaking - useMemo - assetGauge', asset)
    return asset
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

  const userShare = useMemo(() => {
    return assetGauge?.vaultPosition && BNify(assetGauge?.vaultPosition?.underlying.redeemable).div(assetGauge.totalSupply)
  }, [assetGauge])

  // console.log('vaultGauge', vaultGauge)
  // console.log('assetGauge', assetGauge)

  return (
    <VStack
      spacing={10}
      width={'100%'}
    >
      {
        assetGauge.vaultPosition && (
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
                <HStack
                  spacing={1}
                  alignItems={'baseline'}
                >
                  <AssetProvider.Deposited textStyle={'heading'} fontSize={'h3'} />
                  <AssetProvider.Name textStyle={'heading'} fontSize={'h3'} />
                </HStack>
              </VStack>

              <VStack
                spacing={2}
                justifyContent={'center'}
              >
                <Translation component={Text} translation={'defi.share'} textStyle={'titleSmall'} />
                <AssetProvider.GaugeShare textStyle={'heading'} fontSize={'h3'} />
              </VStack>

              <VStack
                spacing={2}
                justifyContent={'center'}
              >
                <Translation component={Text} translation={'defi.idleDistribution'} textStyle={'titleSmall'} />
                <HStack
                  spacing={1}
                  alignItems={'baseline'}
                >
                  <AssetProvider.GaugeUserDistribution suffix={` ${vaultGauge.rewardToken?.token}`} textStyle={'heading'} fontSize={'h3'} />
                  <Translation component={Text} translation={['/','common.day']} textStyle={'captionSmall'} textTransform={'lowercase'} />
                </HStack>
              </VStack>

              <VStack
                spacing={2}
                justifyContent={'center'}
              >
                <Translation component={Text} translation={'defi.additionalRewards'} textStyle={'titleSmall'} />
                <VStack
                  spacing={2}
                >
                  {
                    vaultGauge.multiRewardsTokens?.length>0 ? Object.keys(assetGauge.gaugeData?.rewards).map( rewardId => {
                      const rewardData = assetGauge.gaugeData.rewards[rewardId]
                      if (rewardId === vaultGauge.rewardToken.address) return null
                      const rewardAsset = selectAssetById(rewardId)
                      return (
                        <HStack
                          spacing={1}
                          alignItems={'baseline'}
                          key={`reward_${rewardId}`}
                        >
                          <Amount value={rewardData.rate.times(userShare)} suffix={` ${rewardAsset.token}`} textStyle={'heading'} fontSize={'h3'} />
                          <Translation component={Text} translation={['/','common.day']} textStyle={'captionSmall'} textTransform={'lowercase'} />
                        </HStack>
                      )
                    }) : (
                      <Text textStyle={'heading'} fontSize={'h3'}>-</Text>
                    )
                  }
                </VStack>
              </VStack>
            </SimpleGrid>
          </AssetProvider>
        )
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
            !isEmpty(assetGauge.gaugeData?.rewards) ? Object.keys(assetGauge.gaugeData?.rewards).map( rewardId => {
              const rewardData = assetGauge.gaugeData.rewards[rewardId]
              const contractSendMethod = vaultGauge.getClaimRewardsContractSendMethod(rewardId)
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
                      width={'100%'}
                      spacing={[4, 0]}
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
                      <TransactionButton text={'defi.claim'} vaultId={asset.id} assetId={rewardId} contractSendMethod={contractSendMethod} actionType={'claim'} amount={rewardData.balance.toString()} width={['100%', '150px']} disabled={rewardData.balance.lte(0)} />
                    </Stack>
                  </Card>
                </AssetProvider>
              )
            }) : null
          }
        </VStack>
      </VStack>
      <AssetGeneralData assetId={vaultGauge?.id} />
      {strategyDescriptionCarousel}
    </VStack>
  )
}