import { Card } from 'components/Card/Card'
import { BNify, getRoutePath } from 'helpers/'
import { useNavigate } from 'react-router-dom'
import { Amount } from 'components/Amount/Amount'
import React, { useState, useMemo } from 'react'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { BalanceChart } from 'components/BalanceChart/BalanceChart'
import type { DonutChartData } from 'components/DonutChart/DonutChart'
import { BigNumber, HistoryTimeframe, VaultPosition } from 'constants/types'
import { CompositionChart } from 'components/CompositionChart/CompositionChart'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { useCompositionChartData, UseCompositionChartDataReturn } from 'hooks/useCompositionChartData/useCompositionChartData'
import { ContainerProps, Box, Flex, Text, SkeletonText, SimpleGrid, Stack, VStack, HStack, Stat, StatArrow, Heading, Button, Divider } from '@chakra-ui/react'

export const Dashboard: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const [percentChange, setPercentChange] = useState(0)
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.YEAR)

  const navigate = useNavigate()
  const { account } = useWalletProvider()
  const { isVaultsPositionsLoaded, vaultsPositions, selectors: { selectAssetsByIds } } = usePortfolioProvider()

  const assetIds = useMemo(() => {
    return Object.keys(vaultsPositions)
  }, [vaultsPositions])

  const totalDeposited = useMemo(() => {
    return Object.values(vaultsPositions).reduce( (amount: BigNumber, vaultPosition: VaultPosition) => {
      return amount.plus(vaultPosition.usd.deposited)
    }, BNify(0))
  }, [vaultsPositions])

  const totalFunds = useMemo(() => {
    return Object.values(vaultsPositions).reduce( (amount: BigNumber, vaultPosition: VaultPosition) => {
      return amount.plus(vaultPosition.usd.redeemable)
    }, BNify(0))
  }, [vaultsPositions])

  const earningsPercentage = useMemo(() => {
    return totalFunds.div(totalDeposited).minus(1).times(100)
  }, [totalDeposited, totalFunds])

  const {
    compositions,
    colors,
  }: UseCompositionChartDataReturn = useCompositionChartData({ assetIds })

  const strategiesOverview = useMemo(() => {
    if (!account) return null
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
                    spacing={2}
                    alignItems={'center'}
                  >
                    <Text textStyle={'ctaStatic'}>{strategyComposition.label}</Text>
                    <Box
                      width={2}
                      height={2}
                      bg={strategy.color}
                      borderRadius={'50%'}
                    >
                    </Box>
                  </HStack>
                  <Divider orientation={'vertical'} height={4} />
                  <SkeletonText noOfLines={2} isLoaded={!!isVaultsPositionsLoaded}>
                    <Amount.Usd value={strategyComposition.value} textStyle={['ctaStatic', 'h3']} />
                  </SkeletonText>
                  <HStack
                    spacing={2}
                    alignItems={'center'}
                  >
                    <Translation translation={'defi.apr'} component={Text} textStyle={'captionSmall'} />
                    <SkeletonText noOfLines={2} isLoaded={!!isVaultsPositionsLoaded}>
                      <Amount.Percentage value={0} textStyle={['ctaStatic', 'h3']} />
                    </SkeletonText>
                  </HStack>
                  <Translation component={Button} translation={`common.enter`} onClick={() => navigate(strategyPath as string)} variant={'ctaPrimary'} py={2} height={'auto'} />
                </HStack>
              </Card.Dark>
            )
          })
        }
      </SimpleGrid>
    )
  }, [account, navigate, compositions, isVaultsPositionsLoaded])

  return (
    <Box
      mt={14}
      width={'100%'}
    >
      <Translation mb={10} translation={'navBar.dashboard'} component={Heading} as={'h2'} size={'3xl'} />
      <Stack
        flex={1}
        spacing={10}
        width={'100%'}
        direction={['column', 'row']}
      >
        <VStack
          flex={1}
          spacing={6}
          alignItems={'flex-start'}
        >
          <Translation translation={'dashboard.portfolio.performance'} component={Text} textStyle={['heading', 'h3']} />
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
              <VStack
                spacing={1}
                alignItems={'flex-start'}
              >
                <SkeletonText noOfLines={2} isLoaded={!!isVaultsPositionsLoaded}>
                  <Translation translation={'dashboard.portfolio.totalChart'} component={Text} textStyle={'tableCell'} fontWeight={400} color={'cta'} />
                  <HStack
                    spacing={4}
                  >
                    <Amount.Usd value={totalFunds} textStyle={['heading', 'h2']} />
                    <Stat>
                      <HStack spacing={2}>
                        <Amount.Percentage value={earningsPercentage} textStyle={'captionSmall'} />
                        <StatArrow type={earningsPercentage.gt(0) ? 'increase' : 'decrease'} />
                      </HStack>
                    </Stat>
                  </HStack>
                </SkeletonText>
              </VStack>
              <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
            </Stack>
            <BalanceChart
              percentChange={0}
              assetIds={assetIds}
              timeframe={timeframe}
              isRainbowChart={false}
              setPercentChange={() => {}}
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
            display={'flex'}
            alignItems={'center'}
          >
            <CompositionChart assetIds={assetIds} type={'assets'} />
          </Card.Dark>
        </VStack>
      </Stack>

      {strategiesOverview}
    </Box>
  )
}
