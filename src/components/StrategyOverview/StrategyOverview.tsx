import { BNify } from 'helpers/'
import { useMemo, useState } from 'react'
import type { Balances } from 'constants/types'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import { Translation } from 'components/Translation/Translation'
import { DonutChartData } from 'components/DonutChart/DonutChart'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { SimpleGrid, VStack, HStack, SkeletonText, Button, TextProps } from '@chakra-ui/react'
import { useCompositionChartData, UseCompositionChartDataReturn } from 'hooks/useCompositionChartData/useCompositionChartData'

type StrategyOverviewProps = {
  showHeader?: boolean
  showLoading?: boolean
  textProps?: TextProps
  strategies: (keyof typeof strategies)[]
}

export const StrategyOverview: React.FC<StrategyOverviewProps> = ({
  textProps,
  showHeader = true,
  showLoading = true,
  strategies: enabledStrategies
}) => {
  const [ walletVisible, setWalletVisible ] = useState<boolean>(true)
  const { isVaultsPositionsLoaded, vaultsPositions } = usePortfolioProvider()
  const { compositions }: UseCompositionChartDataReturn = useCompositionChartData({ assetIds: Object.keys(vaultsPositions), strategies: enabledStrategies })

  const aggregatedData = useMemo(() => {
    return compositions.strategies
      .filter( (chartData: DonutChartData) => enabledStrategies.includes(chartData.extraData.strategy.type) )
      .reduce( (aggregatedData: Balances, chartData: DonutChartData) => {
        aggregatedData.redeemable = aggregatedData.redeemable.plus(chartData.value)
        aggregatedData.earnings = aggregatedData.earnings.plus(chartData.extraData.earnings)
        aggregatedData.deposited = aggregatedData.deposited.plus(chartData.extraData.deposited)
        aggregatedData.realizedApy = aggregatedData.realizedApy.plus(BNify(chartData.extraData.avgRealizedApy).times(chartData.value))
        return aggregatedData
      }, {
        earnings: BNify(0),
        deposited: BNify(0),
        redeemable: BNify(0),
        realizedApy: BNify(0)
      })
  }, [compositions, enabledStrategies])

  aggregatedData.realizedApy = aggregatedData.redeemable.gt(0) ? aggregatedData.realizedApy.div(aggregatedData.redeemable) : BNify(0)

  if (!showLoading && (!isVaultsPositionsLoaded || aggregatedData.deposited.lte(0))) return null

  return (
    <VStack
      spacing={4}
      alignItems={'flex-start'}
    >
      {
        showHeader && (
          <HStack
            height={10}
            spacing={2}
          >
            <Translation translation={'defi.yourWallet'} textStyle={'heading'} color={'primary'} fontSize={'lg'} />
            <Button variant={'unstyled'} onClick={ () => setWalletVisible( prevVisible => !prevVisible ) }>
              {
                walletVisible ? (
                  <AiOutlineEye size={24} color={'white'} />
                ) : (
                  <AiOutlineEyeInvisible size={24} color={'white'} />
                )
              }
            </Button>
          </HStack>
        )
      }
      <SimpleGrid
        columns={3}
        spacing={[2, 10]}
      >
        <VStack
          spacing={2}
          alignItems={'flex-start'}
        >
          <Translation translation={'defi.deposited'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
          <SkeletonText noOfLines={2} isLoaded={!!isVaultsPositionsLoaded} minW={'100%'}>
            <Amount.Usd value={aggregatedData.deposited} textStyle={'ctaStatic'} fontSize={'xl'} lineHeight={'initial'} sx={!walletVisible ? {filter:'blur(7px)'} : {}} {...textProps} />
          </SkeletonText>
        </VStack>
        <VStack
          spacing={2}
          alignItems={'flex-start'}
        >
          <Translation translation={'defi.earnings'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
          <SkeletonText noOfLines={2} isLoaded={!!isVaultsPositionsLoaded} minW={'100%'}>
            <Amount.Usd value={aggregatedData.earnings} textStyle={'ctaStatic'} fontSize={'xl'} lineHeight={'initial'} sx={!walletVisible ? {filter:'blur(7px)'} : {}} {...textProps} />
          </SkeletonText>
        </VStack>
        <VStack
          spacing={2}
          alignItems={'flex-start'}
        >
          <Translation translation={'defi.realizedApy'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
          <SkeletonText noOfLines={2} isLoaded={!!isVaultsPositionsLoaded} minW={'100%'}>
            <Amount.Percentage value={aggregatedData.realizedApy} textStyle={'ctaStatic'} fontSize={'xl'} lineHeight={'initial'} sx={!walletVisible ? {filter:'blur(7px)'} : {}} {...textProps} />
          </SkeletonText>
        </VStack>
      </SimpleGrid>
    </VStack>
  )
}