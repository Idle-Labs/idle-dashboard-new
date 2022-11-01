import React, { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import { HistoryTimeframe } from 'constants/types'
import { AssetCell } from 'components/AssetCell/AssetCell'
// import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { BalanceChart } from 'components/BalanceChart/BalanceChart'
import { ContainerProps, Heading, Box, Flex, Stack, Text, Tabs, Tab, TabList, SimpleGrid, HStack, VStack, Stat, StatArrow } from '@chakra-ui/react'

export const AssetPage: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const { params } = useBrowserRouter()
  // const { account } = useWalletProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    if (!selectAssetById) return
    return selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  // console.log('locaton', location, 'params', params, account)

  // const onTabClick = useCallback((row: RowProps) => {
  //   return navigate(`${location?.pathname}/${row.original.id}`)
  // }, [navigate, location])

  return (
    <AssetCell
      assetId={params.asset}
    >
      <Box
        width={'100%'}
      >
        <Flex
          my={14}
          width={'100%'}
          id={'asset-top-header'}
          direction={['column', 'row']}
          justifyContent={['center', 'space-between']}
        >
          <Stack
            spacing={10}
            alignItems={'center'}
            justifyContent={'center'}
            direction={['column', 'row']}
          >
            <Stack
              direction={'row'}
              alignItems={'center'}
            >
              <AssetCell.Icon size={'sm'} />
              <AssetCell.Name textStyle={'h2'} />
            </Stack>
            <Tabs
              defaultIndex={0}
              variant={'unstyled'}
            >
              <TabList>
                <Translation component={Tab} translation={'navBar.earn'} />
                <Translation component={Tab} translation={'navBar.stats'} />
              </TabList>
            </Tabs>
          </Stack>
        </Flex>
        <Box>
          <Stack
            spacing={10}
            width={['100%', 2/3]}
          >
            <Box>
              <Translation component={Heading} as={'h3'} size={'md'} mb={6} translation={'defi.fundsOverview'} />
              <Card.Dark p={0}>
                <VStack
                  ml={8}
                  mt={8}
                  spacing={1}
                  alignItems={'flex-start'}
                >
                  <Translation translation={'dashboard.portfolio.totalChart'} component={Text} textStyle={'tableCell'} fontWeight={400} color={'cta'} />
                  <HStack
                    spacing={4}
                  >
                    <AssetCell.BalanceUsd textStyle={['heading', 'h2']} />
                    <Stat>
                      <HStack spacing={2}>
                        <AssetCell.EarningsPerc textStyle={'captionSmall'} />
                        <StatArrow type={asset?.vaultPosition?.earningsPercentage.gt(0) ? 'increase' : 'decrease'} />
                      </HStack>
                    </Stat>
                  </HStack>
                </VStack>
                <BalanceChart
                  percentChange={0}
                  isRainbowChart={false}
                  assetIds={[params.asset]}
                  setPercentChange={() => {}}
                  timeframe={HistoryTimeframe.MONTH}
                  margins={{ top: 10, right: 0, bottom: 45, left: 0 }}
                />
              </Card.Dark>
            </Box>

            <SimpleGrid
              spacing={14}
              columns={[2, 4]}
              alignItems={'flex-start'}
            >
              <VStack
                spacing={2}
                justifyContent={'center'}
              >
                <Translation component={Text} translation={'defi.deposited'} textStyle={'titleSmall'} />
                <AssetCell.DepositedUsd textStyle={['heading', 'h3']} />
                <HStack spacing={1}>
                  <AssetCell.Deposited textStyle={'captionSmaller'} />
                  <AssetCell.Name textStyle={'captionSmaller'} />
                </HStack>
              </VStack>

              <VStack
                spacing={2}
                justifyContent={'center'}
              >
                <Translation component={Text} translation={'defi.earnings'} textStyle={'titleSmall'} />
                <AssetCell.EarningsUsd textStyle={['heading', 'h3']} />
                <HStack spacing={1}>
                  <AssetCell.Earnings textStyle={'captionSmaller'} />
                  <AssetCell.Name textStyle={'captionSmaller'} />
                </HStack>
              </VStack>

              <VStack
                spacing={2}
                justifyContent={'center'}
              >
                <Translation component={Text} translation={'defi.fees'} textStyle={'titleSmall'} />
                <AssetCell.FeesUsd textStyle={['heading', 'h3']} />
                <HStack spacing={1}>
                  <AssetCell.Fees textStyle={'captionSmaller'} />
                  <AssetCell.Name textStyle={'captionSmaller'} />
                </HStack>
              </VStack>

              <VStack
                spacing={2}
                justifyContent={'center'}
              >
                <Translation component={Text} translation={'defi.realizedApy'} textStyle={'titleSmall'} />
                <AssetCell.RealizedApy textStyle={['heading', 'h3']} />
                <Text textStyle={'captionSmaller'}></Text>
              </VStack>
            </SimpleGrid>

            <Card.Dark>
              <SimpleGrid
                columns={[2, 4]}
              >
                <VStack
                  spacing={2}
                  alignItems={'flex-start'}
                  justifyContent={'flex-start'}
                >
                  <Translation component={Text} translation={'defi.pool'} textStyle={'captionSmall'} />
                  <AssetCell.PoolUsd textStyle={'tableCell'} />
                </VStack>

                <VStack
                  spacing={2}
                  alignItems={'flex-start'}
                  justifyContent={'flex-start'}
                >
                  <Translation component={Text} translation={'defi.apy'} textStyle={'captionSmall'} />
                  <AssetCell.Apy textStyle={'tableCell'} />
                </VStack>

                <VStack
                  spacing={2}
                  alignItems={'flex-start'}
                  justifyContent={'flex-start'}
                >
                  <Translation component={Text} translation={'defi.rewards'} textStyle={'captionSmall'} />
                  <AssetCell.Rewards size={'xs'}>
                    <Text textStyle={'tableCell'}>-</Text>
                  </AssetCell.Rewards>
                </VStack>
              </SimpleGrid>
            </Card.Dark>
          </Stack>
        </Box>
      </Box>
    </AssetCell>
  )
}