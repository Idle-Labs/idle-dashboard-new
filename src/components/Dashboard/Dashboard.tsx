import { BNify } from 'helpers/'
import { Card } from 'components/Card/Card'
import { Amount } from 'components/Amount/Amount'
import React, { useState, useMemo } from 'react'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { BalanceChart } from 'components/BalanceChart/BalanceChart'
import { BigNumber, HistoryTimeframe, VaultPosition } from 'constants/types'
import { CompositionChart } from 'components/CompositionChart/CompositionChart'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { ContainerProps, Box, Flex, Text, SkeletonText, Stack, VStack, HStack, Stat, StatArrow, Heading } from '@chakra-ui/react'

export const Dashboard: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const [percentChange, setPercentChange] = useState(0)
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.YEAR)

  const { isPortfolioLoaded, vaultsPositions, selectors: { selectAssetsByIds } } = usePortfolioProvider()

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
          spacing={6}
          width={['100%', 2/3]}
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
                <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded}>
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
          width={['100%', 1/3]}
          alignItems={'flex-start'}
        >
          <Translation translation={'dashboard.portfolio.performance'} component={Text} textStyle={['heading', 'h3']} />
          <Card.Dark
            p={0}
            flex={1}
            display={'flex'}
            alignItems={'center'}
          >
            <CompositionChart assetIds={assetIds} />
          </Card.Dark>
        </VStack>
      </Stack>
    </Box>
  )
}
