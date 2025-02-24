import { Asset, AssetId, strategies } from 'constants/'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import useLocalForge from 'hooks/useLocalForge'
import { Amount } from 'components/Amount/Amount'
import { TrancheVault } from 'vaults/TrancheVault'
import { useI18nProvider } from 'contexts/I18nProvider'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { MaticNFTs } from 'components/MaticNFTs/MaticNFTs'
import { useWalletProvider } from 'contexts/WalletProvider'
import React, { useMemo, useState, useEffect } from 'react'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { VaultRewards } from 'components/VaultRewards/VaultRewards'
import { GenericChart } from 'components/GenericChart/GenericChart'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { EpochsHistory } from 'components/EpochsHistory/EpochsHistory'
import { HistoryTimeframe, BigNumber, Paragraph } from 'constants/types'
import { EthenaCooldowns } from 'components/EthenaCooldowns/EthenaCooldowns'
import { AssetGeneralData } from 'components/AssetGeneralData/AssetGeneralData'
import { useEpochsChartData } from 'hooks/useEpochsChartData/useEpochsChartData'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { useBalanceChartData } from 'hooks/useBalanceChartData/useBalanceChartData'
import { AssetDiscountedFees } from 'components/AssetDiscountedFees/AssetDiscountedFees'
import { EpochThresholdsTable } from 'components/EpochThresholdsTable/EpochThresholdsTable'
import { EpochWithdrawRequest } from 'components/EpochWithdrawRequest/EpochWithdrawRequest'
import { VaultOperatorOverview } from 'components/VaultOperatorOverview/VaultOperatorOverview'
import { usePerformanceChartData } from 'hooks/usePerformanceChartData/usePerformanceChartData'
import { AssetDistributedRewards } from 'components/AssetDistributedRewards/AssetDistributedRewards'
import { VaultUnderlyingProtocols } from 'components/VaultUnderlyingProtocols/VaultUnderlyingProtocols'
import { StrategyDescriptionCarousel } from 'components/StrategyDescriptionCarousel/StrategyDescriptionCarousel'
import { bnOrZero, BNify, formatMoney, isEmpty, replaceTokens, dateToLocale, numberToPercentage } from 'helpers/'
import { Heading, Center, Box, Stack, Text, SimpleGrid, HStack, Switch, VStack, SkeletonText, Button } from '@chakra-ui/react'
import { CreditVault } from 'vaults/CreditVault'
import { CreditVaultPerformance } from 'components/CreditVaultPerformance/CreditVaultPerformance'
import { EpochWithdrawInterestButton } from 'components/OperativeComponent/EpochVaultMessage'
import { MdLock } from 'react-icons/md'
import { VaultKycVerifyButton } from 'components/OperativeComponent/VaultKycCheck'

type AssetPerformanceChartArgs = {
  assetId: AssetId
}

export const AssetPerformanceChart: React.FC<AssetPerformanceChartArgs> = ({
  assetId
}) => {
  const { isMobile } = useThemeProvider()
  const { isPortfolioLoaded, selectors: { selectAssetBalanceUsd, selectAssetById, selectVaultById } } = usePortfolioProvider()
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.MONTH)
  const [ useDollarConversion, setUseDollarConversion ] = useLocalForge('useDollarConversion', true)

  const { balanceChartData } = useBalanceChartData({ assetIds: [assetId], timeframe, useDollarConversion })
  const { performanceChartData } = usePerformanceChartData({ assetIds: [assetId], timeframe })
  const { epochsChartData } = useEpochsChartData({ assetIds: [assetId], timeframe })

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const vault = useMemo(() => {
    return asset && selectVaultById && selectVaultById(asset.id)
  }, [selectVaultById, asset])

  const strategy = useMemo(() => {
    return asset?.type
  }, [asset])

  const strategyColor = useMemo(() => {
    return strategy && strategies[strategy].color
  }, [strategy])

  const assetBalance = useMemo(() => {
    if (!asset?.id) return
    return selectAssetBalanceUsd && selectAssetBalanceUsd(asset.id)
  }, [asset, selectAssetBalanceUsd])

  const userHasBalance = useMemo(() => {
    return asset?.vaultPosition && assetBalance && assetBalance.gt(0)
  }, [asset, assetBalance])

  const chartData = useMemo(() => {
    if (!isPortfolioLoaded) return
    return asset?.epochData ? epochsChartData : (userHasBalance ? balanceChartData : performanceChartData)
  }, [asset, isPortfolioLoaded, userHasBalance, epochsChartData, balanceChartData, performanceChartData])

  const performanceEnabled = useMemo(() => vault && ("getFlag" in vault) ? vault.getFlag('performanceEnabled') ?? true : true, [vault])

  const performanceTable = useMemo(() => {
    if (!(vault instanceof CreditVault) || isEmpty(vault.getFlag("performance"))){
      return null
    }
    return (
      <VStack
        spacing={2}
        width={'full'}
        alignItems={'flex-start'}
      >
        <CreditVaultPerformance assetId={asset.id} />
        <Translation pl={1} textStyle={'captionSmaller'} translation={'dashboard.portfolio.performanceDescription'} />
      </VStack>
    )
  }, [vault, asset])

  const showChartData = useMemo(() => bnOrZero(chartData?.total?.length).gte(3), [chartData])

  if (!asset || ((!performanceEnabled || isEmpty(vault.getFlag("performance"))) && !showChartData)){
    return null
  }

  return (
    <VStack
      spacing={4}
      width={'full'}
      alignItems={'flex-start'}
    >
      <HStack
        mb={6}
        spacing={6}
        width={'full'}
        alignItems={'center'}
      >
        <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded}>
          <Translation component={Heading} as={'h3'} fontSize={'lg'} translation={userHasBalance && !asset?.epochData ? 'defi.fundsOverview' : 'dashboard.portfolio.performance'} />
        </SkeletonText>
        {
          userHasBalance && !asset?.epochData && (
            <HStack
              spacing={2}
            >
              <AssetProvider.Name fontWeight={600} />
              <Switch size={'md'} isChecked={useDollarConversion} onChange={ (e) => setUseDollarConversion(e.target.checked) } />
              <Text fontWeight={600}>USD</Text>
            </HStack>
          )
        }
      </HStack>
      {
        showChartData && (
          <Card.Flex
            p={0}
            border={0}
            width={'full'}
            overflow={'hidden'}
            direction={'column'}
            minH={['auto', 460]}
            position={'relative'}
            layerStyle={'cardDark'}
            justifyContent={'space-between'}
          >
            {
              chartData && !chartData.total?.length && (
                <Center
                  layerStyle={'overlay'}
                >
                  <Translation translation={'dashboard.assetChart.empty'} textAlign={'center'} component={Text} py={1} px={3} bg={'rgba(0, 0, 0, 0.2)'} borderRadius={8} />
                </Center>
              )
            }
            <Stack
              pt={0}
              px={0}
              pb={[4, 0]}
              zIndex={9}
              width={'full'}
              alignItems={'flex-start'}
              direction={['column', 'row']}
              justifyContent={['center', 'flex-end']}
            >
              {
                (!userHasBalance || (chartData && chartData.total?.length>0)) && (
                  <TimeframeSelector width={['full', 'auto']} justifyContent={['center', 'flex-end']} timeframe={timeframe} setTimeframe={setTimeframe} />
                )
              }
            </Stack>
            <GenericChart
              data={chartData}
              percentChange={0}
              color={strategyColor}
              timeframe={timeframe}
              isRainbowChart={false}
              assetIds={[asset.id]}
              setPercentChange={() => {}}
              height={isMobile ? '300px' : '350px'}
              margins={{ top: 10, right: 0, bottom: 65, left: 0 }}
              formatFn={ asset?.epochData ? (n: any) => `${numberToPercentage(n, 2, 9999, 0.01)}` : (!useDollarConversion ? (n: any) => `${formatMoney(n, 3)} ${asset?.name}` : undefined) }
            />
          </Card.Flex>
        )
      }
      {performanceTable}
    </VStack>
  )
}

export const Earn: React.FC = () => {
  const translate = useTranslate()
  const { locale } = useI18nProvider()
  const { params } = useBrowserRouter()
  const { account } = useWalletProvider()
  const { isMobile } = useThemeProvider()
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe>(HistoryTimeframe.MONTH)
  const [ useDollarConversion, setUseDollarConversion ] = useLocalForge('useDollarConversion', true)
  const {
    stakingData,
    isPortfolioLoaded,
    isPortfolioAccountReady,
    isVaultsPositionsLoaded,
    selectors: {
      selectAssetById,
      selectVaultById,
      selectAssetBalance,
      selectAssetBalanceUsd
    }
  } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const strategy = useMemo(() => {
    return asset?.type
  }, [asset])

  const strategyColor = useMemo(() => {
    return strategy && strategies[strategy].color
  }, [strategy])

  const vault = useMemo(() => {
    return asset && selectVaultById && selectVaultById(asset.id)
  }, [selectVaultById, asset])

  const assetBalanceUnderlying = useMemo(() => {
    if (!asset?.id) return
    return selectAssetBalance && selectAssetBalance(asset.id)
  }, [asset, selectAssetBalance])

  const assetBalance = useMemo(() => {
    if (!asset?.id) return
    return selectAssetBalanceUsd && selectAssetBalanceUsd(asset.id)
  }, [asset, selectAssetBalanceUsd])

  const userHasBalance = useMemo(() => {
    return asset?.vaultPosition && assetBalance && assetBalance.gt(0)
  }, [asset, assetBalance])

  // console.log('asset', asset, assetBalance, userHasBalance)

  useEffect(() => {
    if (!isPortfolioLoaded) return
    if (useDollarConversion && (!userHasBalance || !!asset?.epochData)){
      setUseDollarConversion(false)
    }
  }, [isPortfolioLoaded, useDollarConversion, userHasBalance, setUseDollarConversion, asset?.epochData])

  const isEpochRunning = useMemo(() => {
    if (!asset || !asset.epochData || !("isEpochRunning" in asset.epochData)) return null
    return !!asset.epochData.isEpochRunning
  }, [asset])

  const fundsOverview = useMemo(() => {
    if (!asset || !userHasBalance) return null
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
          <Translation translation={'defi.deposited'} textStyle={'titleSmall'} />
          <AssetProvider.DepositedUsd abbreviate={false} textStyle={'heading'} fontSize={'h3'} />
          <HStack spacing={1}>
            <AssetProvider.Deposited decimals={4} textStyle={'captionSmaller'} />
            <AssetProvider.Name textStyle={'captionSmaller'} />
          </HStack>
          <AssetProvider.WalletRewardsEmissions />
        </VStack>

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation translation={'defi.earnings'} textStyle={'titleSmall'} />
          <AssetProvider.EarningsUsd abbreviate={false} textStyle={'heading'} fontSize={'h3'} />
          <HStack spacing={1}>
            <AssetProvider.Earnings decimals={4} textStyle={'captionSmaller'} />
            <AssetProvider.Name textStyle={'captionSmaller'} />
          </HStack>
        </VStack>

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation translation={'defi.realizedApy'} textStyle={'titleSmall'} />
          <AssetProvider.RealizedApy textStyle={'heading'} fontSize={'h3'} />
          <Text textStyle={'captionSmaller'}></Text>
        </VStack>

        <VStack
          spacing={2}
          justifyContent={'center'}
        >
          <Translation translation={'defi.expectedInterests'} textStyle={'titleSmall'} />
          <AssetProvider.EpochExpectedInterest textStyle={'heading'} fontSize={'h3'} />
          {
            vault.mode === 'CREDIT' && (
              isEpochRunning ? (
                <HStack
                  spacing={1}
                  width={'full'}
                  justifyContent={'center'}
                >
                  <Translation translation={'common.availableIn'} textStyle={'captionSmaller'} />
                  <AssetProvider.EpochCountdown showComplete={false} textStyle={'captionSmaller'} />
                </HStack>
              ) : (
                <EpochWithdrawInterestButton />
              )
            )
          }
        </VStack>
      </SimpleGrid>
    )
  }, [asset, vault, userHasBalance, isEpochRunning])

  const strategyDescriptionCarousel = useMemo(() => {
    if (!strategy || !isPortfolioLoaded) return null
    const strategyProps = strategies[strategy]
    if (!strategyProps?.carouselItems) return null
    if (("getFlag" in vault) && vault.getFlag('hideStrategyDescriptionCarousel') === true) return null
    return (
      <VStack
        spacing={4}
        width={'full'}
      >
        <StrategyDescriptionCarousel color={strategyColor} strategy={strategy} delay={10000} />
      </VStack>
    )
  }, [vault, strategy, strategyColor, isPortfolioLoaded])

  const vaultOperatorOverview = useMemo(() => {
    if (!vault || !("vaultConfig" in vault) || !("operators" in vault?.vaultConfig)) return null
    return (
      <VaultOperatorOverview vaultOperators={vault.vaultConfig.operators} />
    )
  }, [vault])

  const strategyDescription = useMemo(() => {
    if (!vault || !("description" in vault) || !vault.description) return null
    return (
      <VStack
        pb={6}
        spacing={4}
        width={'full'}
        borderBottom={'1px solid'}
        borderColor={'divider'}
        alignItems={'flex-start'}
      >
        <Translation component={Heading} as={'h3'} fontSize={'h3'} translation={asset.type === 'CR' ? 'defi.strategyObjective' : 'defi.strategyDescription'} />
        <Text dangerouslySetInnerHTML={{__html: replaceTokens(vault.description, {apy: bnOrZero(asset.apy).toFixed(2), totalApr: bnOrZero(asset.totalApr).toFixed(2), riskThreshold: bnOrZero(asset.epochData?.riskThreshold).toFixed(2), aboveBelow: asset.epochData?.bullish ? 'above' : 'below', aboveBelowInverse: asset.epochData?.bullish ? 'below' : 'above', epochEnd: dateToLocale(asset.epochData?.end, locale)})}} />
        {
          (vault instanceof TrancheVault) && (
            <VStack
              spacing={2}
              width={'full'}
              alignItems={'flex-start'}
            >
              <Translation component={Heading} as={'h4'} fontSize={'h4'} translation={`trade.vaults.${vault.type}.howItWorks`} />
              <Translation isHtml={true} translation={[strategies[vault.type].description as string, `trade.vaults.${vault.type}.ays`]} />
            </VStack>
          )
        }
        {
          (vault instanceof TrancheVault && vault.trancheConfig.description) && (
            <VStack
              spacing={2}
              width={'full'}
              alignItems={'flex-start'}
            >
              <Translation isHtml={true} translation={vault.trancheConfig.description} />
            </VStack>
          )
        }
        {vaultOperatorOverview}
      </VStack>
    )
  }, [vault, asset, locale, vaultOperatorOverview])

  const epochThresholds = useMemo(() => {
    if (!asset || !asset.epochData || !asset.epochData.weeklyThresholds) return null
    return (
      <VStack
        pt={4}
        spacing={6}
        width={'full'}
        alignItems={'flex-start'}
        justifyContent={'flex-start'}
      >
        <Translation component={Heading} as={'h3'} fontSize={'h3'} translation={'epochs.thresholds'} />
        <EpochThresholdsTable sortEnabled={false} assetId={asset.id} />
      </VStack>
    )
  }, [asset])

  const coveredRisks = useMemo(() => {
    if (!vault || !("risks" in vault) || !vault.risks) return null
    return (
      <VStack
        pt={4}
        spacing={6}
        alignItems={'flex-start'}
      >
        <Translation component={Heading} as={'h3'} fontSize={'h3'} translation={'defi.coveredRisks'} />
        <Card.Dark>
          <VStack
            spacing={4}
          >
            {
              vault.risks.map( (paragraph: Paragraph, index: number) => {
                return (
                  <VStack
                    spacing={2}
                    width={'full'}
                    alignItems={'flex-start'}
                    key={`paragraph_${index}`}
                  >
                    {
                      paragraph.title && (
                        <Heading as={'h4'} fontSize={'h4'} dangerouslySetInnerHTML={{__html: paragraph.title}} />
                      )
                    }
                    {
                      paragraph.description && (
                        <Text dangerouslySetInnerHTML={{__html: paragraph.description}} />
                      )
                    }
                  </VStack>
                )
              })
            }
          </VStack>
        </Card.Dark>
      </VStack>
    )
  }, [vault])

  const vaultRewards = useMemo(() => {
    // console.log('vaultRewards', asset)
    if (!asset || isEmpty(asset.rewards)) return null
    const totalRewards = (Object.values(asset.rewards) as BigNumber[]).reduce( (totalRewards: BigNumber, amount: BigNumber) => totalRewards.plus(amount), BNify(0) )
    return totalRewards.gt(0) ? (
      <VaultRewards assetId={asset?.id} />
    ) : null
  }, [asset])

  const maxItems = useMemo(() => {
    return vault ? vault.getFlag("generalDataFields.maxItems") || 6 : 6
  }, [vault])

  const isProtected = useMemo(() => vault && ("getFlag" in vault) && !!vault.getFlag('protectedByKyc'), [vault])
  const walletAllowedRequired = useMemo(() => vault && ("kycRequired" in vault) && !!vault.kycRequired, [vault])
  const walletAllowed = useMemo(() => asset && account?.address && !!asset.walletAllowed, [asset, account])
  const showProtectedData = useMemo(() => {
    return !isProtected || (isPortfolioAccountReady && (!walletAllowedRequired || walletAllowed))
  }, [isPortfolioAccountReady, isProtected, walletAllowedRequired, walletAllowed])

  return (
    <VStack
      spacing={10}
      width={'full'}
    >
      {strategyDescription}
      {
        showProtectedData ? (
          <VStack
            spacing={10}
            width={'full'}
          >
            {fundsOverview}
            <EpochWithdrawRequest assetId={asset?.id} />
            <AssetGeneralData title={'assets.assetDetails.generalData.keyInformation'} maxItems={maxItems} assetId={asset?.id} />
            <AssetDistributedRewards assetId={asset?.id} />
            <AssetPerformanceChart assetId={params.asset} />
            <EpochsHistory />
            <MaticNFTs assetId={asset?.id} />
            <EthenaCooldowns assetId={asset?.id} />
            <AssetDiscountedFees assetId={asset?.id} />
            {vaultRewards}
            {strategyDescriptionCarousel}
            {epochThresholds}
            {coveredRisks}
            <VaultUnderlyingProtocols assetId={asset?.id} />
          </VStack>
        ) : (
          <Center
            py={6}
            flex={1}
            px={[4, 10]}
            width={'full'}
          >
            <VStack
              spacing={6}
            >
              <MdLock size={64} />
              <VStack
                spacing={4}
              >
                <Translation component={Text} translation={"strategies.credit.kyc.required"} textStyle={'heading'} as={'h3'} fontSize={'h3'} textAlign={'center'} />
                <Translation component={Text} translation={`strategies.credit.kyc.unlock`} textStyle={'caption'} textAlign={'center'} />
                <VaultKycVerifyButton assetId={asset?.id} size={'lg'} fontSize={'md'} />
              </VStack>
            </VStack>
          </Center>
        )
      }
    </VStack>
  )
}