import { Box, Button, ButtonProps, HStack, Heading, Image, SimpleGrid, SkeletonText, VStack } from "@chakra-ui/react"
import { Amount } from "components/Amount/Amount"
import { Card } from "components/Card/Card"
import { DepositedAssetsTable } from "components/DepositedAssetsTable/DepositedAssetsTable"
import { Translation } from "components/Translation/Translation"
import { strategies } from "constants/strategies"
import { VaultPosition, Asset, HistoryTimeframe, BigNumber } from "constants/types"
import { usePortfolioProvider } from "contexts/PortfolioProvider"
import { useThemeProvider } from "contexts/ThemeProvider"
import { useWalletProvider } from "contexts/WalletProvider"
import { BNify, bnOrZero, shortenHash } from "helpers/"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { selectVisibleStrategies } from "selectors/"
import { PortfolioAllocation } from "./PortfolioAllocation"
import { BiSolidCoinStack } from "react-icons/bi";
import { CompositionType } from "hooks/useCompositionChartData/useCompositionChartData"
import { SiBnbchain } from "react-icons/si";
import { EarningsChart } from "components/EarningsChart/EarningsChart"

export const Portfolio: React.FC = () => {
  const { theme } = useThemeProvider()
  const [, setPercentChange] = useState(0)
  const selectedStrategies = useMemo(() => Object.keys(strategies), [])
  const [allocationType, setAllocationType] = useState<CompositionType>('assets')
  const [timeframe, setTimeframe] = useState<HistoryTimeframe>(HistoryTimeframe.YEAR)

  const navigate = useNavigate()
  const { account } = useWalletProvider()
  const {
    isPortfolioAccountReady,
    vaultsPositions,
    selectors: {
      selectAssetsByIds,
    }
  } = usePortfolioProvider()

  const enabledStrategies = useMemo(() => selectVisibleStrategies(), [])

  const assetIds = useMemo(() => {
    if (!selectAssetsByIds) return []
    const assetIds = Object.keys(vaultsPositions)
    const assets = selectAssetsByIds(assetIds)
    return assets.filter((asset: Asset) => !selectedStrategies || !asset.type || (selectedStrategies.includes(asset.type) && enabledStrategies.includes(asset.type))).map((asset: Asset) => asset.id)
  }, [vaultsPositions, selectedStrategies, enabledStrategies, selectAssetsByIds])

  const aggregatedUsdPosition: VaultPosition["usd"] = useMemo(() => {
    return Object.keys(vaultsPositions).filter(assetId => assetIds.includes(assetId)).map(assetId => vaultsPositions[assetId]).reduce((aggregatedUsdPosition: VaultPosition["usd"], vaultPosition: VaultPosition) => {
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

  const totalVaults = useMemo(() => {
    return Object.keys(vaultsPositions).length
  }, [vaultsPositions])

  const totalFunds = useMemo(() => {
    return aggregatedUsdPosition.deposited.plus(aggregatedUsdPosition.earnings)
  }, [aggregatedUsdPosition])

  // console.log('enabledStrategies', enabledStrategies)
  // console.log('vaultsPositions', vaultsPositions)
  // console.log('aggregatedUsdPosition', aggregatedUsdPosition)

  const totalROI = useMemo(() => {
    return Object.keys(vaultsPositions).filter(assetId => assetIds.includes(assetId)).map(assetId => vaultsPositions[assetId]).reduce((totalROI: BigNumber, vaultPosition: VaultPosition) => {
      return totalROI.plus(vaultPosition.earningsPercentage)
    }, BNify(0))
  }, [assetIds, vaultsPositions])

  const avgRealizedApy = useMemo(() => {
    const realizedApyData = Object.keys(vaultsPositions).filter(assetId => assetIds.includes(assetId)).map(assetId => vaultsPositions[assetId]).reduce((realizedApyData: Record<string, BigNumber>, vaultPosition: VaultPosition) => {
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

  if (!account){
    return null
  }

  return (
    <Box
      mt={5}
      width={'full'}
    >
      <VStack
        pt={12}
        spacing={10}
        width={'full'}
      >
        <SimpleGrid
          spacing={6}
          width={'full'}
          columns={[1, 2]}
          justifyContent={'space-between'}
        >
          <VStack
            spacing={4}
          >
            <HStack
              height={10}
              spacing={3}
              width={'full'}
            >
              <Translation translation={'defi.portfolio'} component={Heading} as={'h3'} fontSize={'xl'} />
              <Heading as={'h3'} fontSize={'xl'} color={'ctaDisabled'}>({shortenHash(account?.address as string)})</Heading>
            </HStack>
            <Card.Flex
              p={0}
              flex={1}
              width={'full'}
              bg={'card.bgLight'}
              flexDirection={'column'}
            >
              <Card.Flex
                py={4}
                px={5}
                pb={0}
                flex={1}
              >
                <VStack
                  flex={1}
                  spacing={4}
                  align={'flex-start'}
                >
                  <Translation translation={'defi.totalFunds'} component={Heading} as={'h3'} fontSize={'md'} />
                  <SkeletonText flex={1} noOfLines={2} isLoaded={!!isPortfolioAccountReady}>
                    <VStack
                      spacing={[1, 3]}
                      alignItems={'baseline'}
                    >
                      <Amount.Usd abbreviate={false} value={totalFunds} textStyle={'heading'} fontSize={'6xl'} />
                    </VStack>
                  </SkeletonText>
                  <Box
                    height={75}
                    width={'full'}
                  >
                    <EarningsChart timeframe={HistoryTimeframe.ALL} assetIds={[]} margin={{ top: 0, left: 0, right: 0, bottom: -85 }} />
                  </Box>
                </VStack>
              </Card.Flex>
              <SimpleGrid
                px={5}
                py={1}
                columns={3}
                width={'full'}
                spacing={5}
              >
                <HStack
                  pr={5}
                  borderRight={'1px solid'}
                  borderColor={'divider'}
                  justifyContent={'space-between'}
                >
                  <Translation translation={'defi.lastDay'} />
                  <Amount.Percentage prefix={'+'} value={15} textStyle={'ctaStatic'} color={'brightGreen'} />
                </HStack>
                <HStack
                  pr={5}
                  borderRight={'1px solid'}
                  borderColor={'divider'}
                  justifyContent={'space-between'}
                >
                  <Translation translation={'defi.lastWeek'} />
                  <Amount.Percentage prefix={'+'} value={15} textStyle={'ctaStatic'} color={'brightGreen'} />
                </HStack>
                <HStack
                  justifyContent={'space-between'}
                >
                  <Translation translation={'defi.lastYear'} />
                  <Amount.Percentage prefix={'+'} value={15} textStyle={'ctaStatic'} color={'brightGreen'} />
                </HStack>
              </SimpleGrid>
            </Card.Flex>
          </VStack>

          <VStack
            spacing={4}
          >
            <HStack
              height={10}
              spacing={3}
              width={'full'}
              justifyContent={'flex-end'}
            >
              <Translation<ButtonProps> component={Button} leftIcon={<BiSolidCoinStack size={24} />} translation={`navBar.assets`} variant={'filter'} aria-selected={allocationType === 'assets'} fontSize={'sm'} borderRadius={'80px'} px={4} onClick={() => setAllocationType('assets')} />
              <Translation<ButtonProps> component={Button} leftIcon={<SiBnbchain size={24} />} translation={`defi.chains`} variant={'filter'} aria-selected={allocationType === 'chains'} fontSize={'sm'} borderRadius={'80px'} px={4} onClick={() => setAllocationType('chains')} />
            </HStack>
            <Card
              py={4}
              px={5}
            >
              <VStack
                width={'full'}
                spacing={6}
                alignItems={'flex-start'}
              >
                <Translation translation={'dashboard.portfolio.allocation'} component={Heading} as={'h3'} fontSize={'md'} />
                <PortfolioAllocation type={allocationType} assetIds={assetIds} strategies={enabledStrategies} />
              </VStack>
            </Card>
          </VStack>
        </SimpleGrid>
        <SimpleGrid
          width={'full'}
          columns={[1, 4]}
          spacing={6}
        >
          <Card
            p={4}
          >
            <HStack
              spacing={5}
            >
              <Image src={'images/portfolio/earnings.svg'} height={74} width={74} />
              <VStack
                alignItems={'space-between'}
              >
                <Translation translation={'defi.earnings'} component={Heading} color={'primary'} as={'h3'} fontSize={'md'} />
                <SkeletonText noOfLines={2} isLoaded={!!isPortfolioAccountReady}>
                  <Amount.Usd abbreviate={true} fontSize={'3xl'} fontWeight={600} value={aggregatedUsdPosition.earnings} />
                </SkeletonText>
              </VStack>
            </HStack>
          </Card>

          <Card
            p={4}
          >
            <HStack
              spacing={5}
            >
              <Image src={'images/portfolio/roi.svg'} height={74} width={74} />
              <VStack
                alignItems={'space-between'}
              >
                <Translation translation={'defi.roi'} component={Heading} color={'primary'} as={'h3'} fontSize={'md'} />
                <SkeletonText noOfLines={2} isLoaded={!!isPortfolioAccountReady}>
                  <Amount.Percentage minValue={0.01} fontSize={'3xl'} fontWeight={600} value={totalROI} />
                </SkeletonText>
              </VStack>
            </HStack>
          </Card>

          <Card
            p={4}
          >
            <HStack
              spacing={5}
            >
              <Image src={'images/portfolio/apy.svg'} height={74} width={74} />
              <VStack
                alignItems={'space-between'}
              >
                <Translation translation={'defi.avgRealizedApy'} component={Heading} color={'primary'} as={'h3'} fontSize={'md'} />
                <SkeletonText noOfLines={2} isLoaded={!!isPortfolioAccountReady}>
                  <Amount.Percentage fontSize={'3xl'} fontWeight={600} value={avgRealizedApy} />
                </SkeletonText>
              </VStack>
            </HStack>
          </Card>

          <Card
            p={4}
          >
            <HStack
              spacing={5}
            >
              <Image src={'images/portfolio/vaults.svg'} height={74} width={74} />
              <VStack
                alignItems={'space-between'}
              >
                <Translation translation={'defi.vaults'} component={Heading} color={'primary'} as={'h3'} fontSize={'md'} />
                <SkeletonText noOfLines={2} isLoaded={!!isPortfolioAccountReady}>
                  <Amount.Int fontSize={'3xl'} fontWeight={600} value={totalVaults} />
                </SkeletonText>
              </VStack>
            </HStack>
          </Card>
        </SimpleGrid>
        <DepositedAssetsTable />
      </VStack>
    </Box>
  )
}