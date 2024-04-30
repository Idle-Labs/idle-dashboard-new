import { Earn } from './Earn'
import { GaugeStaking } from './GaugeStaking'
import { useNavigate } from 'react-router-dom'
import useLocalForge from 'hooks/useLocalForge'
import { TrancheVault } from 'vaults/TrancheVault'
import { IconTab } from 'components/IconTab/IconTab'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Stake } from 'components/OperativeComponent/Stake'
import { DatePicker } from 'components/DatePicker/DatePicker'
import { AssetStats } from 'components/AssetStats/AssetStats'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { ProductTag } from 'components/ProductTag/ProductTag'
import { Deposit } from 'components/OperativeComponent/Deposit'
import { Approve } from 'components/OperativeComponent/Approve'
import { Translation } from 'components/Translation/Translation'
import { Withdraw } from 'components/OperativeComponent/Withdraw'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { AnnouncementBanner } from 'components/AnnouncementBanner/AnnouncementBanner'
import { InteractiveComponent } from 'components/InteractiveComponent/InteractiveComponent'
import type { OperativeComponentAction } from 'components/OperativeComponent/OperativeComponent'
import { bnOrZero, BNify, sendViewItem, checkSectionEnabled, checkAddress, cmpAddrs, getObjectPath } from 'helpers/'
import { Box, Flex, Stack, SimpleGrid, HStack, Tabs, TabList, Image, VStack, Heading, ImageProps, Spinner } from '@chakra-ui/react'
import { operators, AssetId, imageFolder, DateRange, HistoryTimeframe, GaugeRewardData, BigNumber, STAKING_CHAINID, ZERO_ADDRESS } from 'constants/'

type TabType = {
  id:string
  label:string
  icon?: null | {
    src: string
    props?: ImageProps,
    tooltip?: string
  }
  componentProps?: any
  component: React.FunctionComponent<any>
  actions?: OperativeComponentAction[]
}

type ContextProps = {
  stakingEnabled: boolean
  isNetworkCorrect: boolean
  setStakingEnabled: Function
  toggleStakingEnabled: Function
  referral: string | null | undefined
}

const initialState: ContextProps = {
  referral: null,
  stakingEnabled: false,
  isNetworkCorrect: false,
  setStakingEnabled: () => {},
  toggleStakingEnabled: () => {}
}

const StakeIDLE: React.FC = () => {
  const { selectors: { selectVaultsByType, selectAssetById } } = usePortfolioProvider()

  const stakedIdleVault = useMemo(() => {
    return selectVaultsByType && selectVaultsByType('STK')?.[0]
  }, [selectVaultsByType])

  const stakedIdleAsset = useMemo(() => {
    return selectAssetById && stakedIdleVault && selectAssetById(stakedIdleVault.id)
  }, [selectAssetById, stakedIdleVault])

  return (
    <AssetProvider
      wrapFlex={false}
      assetId={stakedIdleAsset.id}
    >
      <Stake itemIndex={0} chainIds={[STAKING_CHAINID]} />
    </AssetProvider>
  )
}

const AssetPageProviderContext = React.createContext<ContextProps>(initialState)
export const useAssetPageProvider = () => React.useContext(AssetPageProviderContext)

export const AssetPage: React.FC = () => {
  const navigate = useNavigate()
  const { chainId } = useWalletProvider()
  const { isMobile, theme, environment } = useThemeProvider()
  const { params, location, searchParams } = useBrowserRouter()
  const [ selectedTabIndex, setSelectedTabIndex ] = useState<number>(0)
  const [ stakingEnabled, setStakingEnabled ] = useState<boolean>(false)
  const [ latestAssetUpdate, setLatestAssetUpdate ] = useState<number>(0)
  const [ viewItemEventSent, setViewItemEventSent ] = useState<AssetId | undefined>()
  const [ getSearchParams, setSearchParams ] = useMemo(() => searchParams, [searchParams]) 
  const [ dateRange, setDateRange ] = useState<DateRange>({ startDate: null, endDate: null })
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe | undefined>(HistoryTimeframe["WEEK"])
  const [ storedReferrals, setStoredReferrals, , storedReferralsLoaded ] = useLocalForge('storedReferrals', {})
  const {
    isPortfolioLoaded,
    portfolioTimestamp,
    assetsDataTimestamp,
    isPortfolioAccountReady,
    selectors: {
      selectAssetById,
      selectVaultById,
      selectVaultGauge,
      selectAssetBalance,
      selectAssetPriceUsd
    }
  } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(params.asset)
  }, [selectVaultById, params.asset])

  const isNetworkCorrect = useMemo(() => !!chainId && !!asset?.chainId && +asset.chainId === +chainId, [chainId, asset])

  const useDateRange = useMemo(() => {
    return !!dateRange.startDate && !!dateRange.endDate
  }, [dateRange])

  const referralEnabled = useMemo(() => (vault && ("flags" in vault) && vault.flags?.referralEnabled), [vault])

  // Get selected tab id from search params
  const referral = useMemo((): string | undefined => {
    if (!referralEnabled || !vault) return
    let referral = getSearchParams.get('_referral')

    // if no referral get stored one
    if (!referral && storedReferralsLoaded && checkAddress(storedReferrals[vault.id])){
      referral = storedReferrals[vault.id]
    }

    if (!referral || !checkAddress(referral) || referral === ZERO_ADDRESS) return

    // Check allowed referrals
    if ("checkReferralAllowed" in vault){
      const referralAllowed = vault.checkReferralAllowed(referral)
      if (!referralAllowed) return
    }

    return referral
  }, [referralEnabled, getSearchParams, vault, storedReferrals, storedReferralsLoaded])

  // Save referral
  useEffect(() => {
    if (!referral || !storedReferralsLoaded || !vault) return
    const storedReferral = storedReferrals[vault.id]
    if (cmpAddrs(storedReferral, referral)) return
    setStoredReferrals({
      ...storedReferrals,
      [vault.id]: referral
    })
  }, [vault, referral, storedReferrals, setStoredReferrals, storedReferralsLoaded])

  useEffect(() => {
    if (useDateRange){
      setTimeframe(undefined)
    }
  }, [useDateRange, setTimeframe])

  useEffect(() => {
    if (timeframe){
      setDateRange({
        endDate: null,
        startDate: null
      })
    }
  }, [timeframe, setDateRange])

  const toggleStakingEnabled = useCallback(() => {
    return setStakingEnabled( prevState => !prevState )
  }, [setStakingEnabled])

  // Update asset
  useEffect(() => {
    if (!asset) return
    setLatestAssetUpdate(Date.now())
  }, [asset])

  const assetBalanceUsd = useMemo(() => {
    if (!asset || !selectAssetBalance || !asset?.underlyingId || !selectAssetPriceUsd) return BNify(0)
    const assetBalance = selectAssetBalance(asset.underlyingId)
    const assetPriceUsd = selectAssetPriceUsd(asset.underlyingId)
    return bnOrZero(assetBalance).times(bnOrZero(assetPriceUsd))
  }, [asset, selectAssetBalance, selectAssetPriceUsd])

  const vaultGauge = useMemo(() => {
    return selectVaultGauge && selectVaultGauge(params.asset)
  }, [selectVaultGauge, params.asset])

  const assetGauge = useMemo(() => {
    return vaultGauge && selectAssetById && selectAssetById(vaultGauge.id)
  }, [selectAssetById, vaultGauge])

  const claimableRewards = useMemo(() => {
    if (!assetGauge || !("gaugeData" in assetGauge) || !assetGauge.gaugeData?.rewards) return BNify(0)
    return (Object.values(assetGauge.gaugeData.rewards) as Array<GaugeRewardData>).reduce( (claimableRewards: BigNumber, gaugeRewardData: GaugeRewardData) => {
      return claimableRewards.plus(bnOrZero(gaugeRewardData.balance))
    }, BNify(0))
  }, [assetGauge])

  // Check asset exists
  useEffect(() => {
    if (!isPortfolioLoaded || !selectAssetById || !location || !latestAssetUpdate) return
    if (!asset){
      return navigate(location.pathname.replace(`/${params.asset}`, ''))
    }
  }, [isPortfolioLoaded, selectAssetById, latestAssetUpdate, asset, params.asset, location, navigate])

  // Send viewItem event
  useEffect(() => {
    if (!isPortfolioAccountReady || !asset || viewItemEventSent === asset?.id || !portfolioTimestamp || !assetsDataTimestamp || portfolioTimestamp>assetsDataTimestamp || assetsDataTimestamp>latestAssetUpdate) return
    // console.log(asset, portfolioTimestamp, assetsDataTimestamp, latestAssetUpdate, BNify(asset?.priceUsd).toString(), assetBalance.toString())
    sendViewItem(asset, assetBalanceUsd)
    setViewItemEventSent(asset.id)
  }, [asset, portfolioTimestamp, assetBalanceUsd, assetsDataTimestamp, isPortfolioAccountReady, latestAssetUpdate, viewItemEventSent, setViewItemEventSent])

  const tabs = useMemo(() => {

    const actions: TabType["actions"] = [
      {
        type: 'deposit',
        component: Deposit,
        label: 'common.deposit',
        steps: [
          {
            type: 'approve',
            component: Approve,
            label:'modals.approve.header',
          }
        ]
      },
      {
        type: 'withdraw',
        label: 'common.withdraw',
        component: Withdraw,
        steps: []
      }
    ]

    if (stakingEnabled){
      actions.push({
        type: 'stake',
        component: StakeIDLE,
        label: 'common.stake',
        chainIds: [STAKING_CHAINID],
        steps: [
          {
            type: 'approve',
            component: Approve,
            props: {
              amountUsd: null
            },
            label:'modals.approve.header',
          }
        ]
      })
    }

    const tabs: TabType[] = [
      {
        id:'earn',
        label:'navBar.earn',
        component: Earn,
        actions
      }
    ]
    
    const vaultDisabled = vaultGauge && ("enabled" in vaultGauge) && !vaultGauge.enabled
    
    if (vaultGauge && (!vaultDisabled || bnOrZero(assetGauge?.balance).gt(0) || bnOrZero(claimableRewards).gt(0))){
      tabs.push(
        {
          id:'gauge',
          label:'navBar.gauge',
          component: GaugeStaking,
          icon: vaultDisabled && (BNify(assetGauge?.balance).gt(0) || bnOrZero(claimableRewards).gt(0)) ? {src:`${imageFolder}vaults/deprecated.png`, tooltip: 'trade.vaults.GG.disabled', props:{width:5, height:5}} : null,
          actions: [
            {
              type: 'stake',
              component: Deposit,
              label: 'common.stake',
              steps: [
                {
                  type: 'approve',
                  component: Approve,
                  label:'modals.approve.header',
                }
              ]
            },
            {
              type: 'unstake',
              label: 'common.unstake',
              component: Withdraw,
              steps: []
            }
          ]
        }
      )
    }

    const statsEnabled = (!vault?.flags || vault.flags.statsEnabled === undefined || vault.flags.statsEnabled)

    // Add stats tab
    if (checkSectionEnabled('stats', environment) && statsEnabled){
      tabs.push({
        id:'stats',
        label:'navBar.stats',
        component: AssetStats,
        componentProps: {
          timeframe,
          dateRange,
          assetOnly: true,
          showHeader: false,
          showAssetStrategy: true
        }
      })
    }

    return tabs
  }, [vault, vaultGauge, assetGauge, timeframe, dateRange, environment, claimableRewards, stakingEnabled])

  // Get selected tab id from search params
  const selectedTabId = useMemo(() => {
    return getSearchParams.get('tab')
  }, [getSearchParams])

  // Set tab index every time the tab search param changes
  useEffect(() => {
    if (selectedTabId) {
      // console.log('selectedTabId', selectedTabId)
      const foundTab = tabs.find( tab => tab.id.toString() === selectedTabId.toString() )
      if (foundTab){
        const tabIndex = tabs.indexOf(foundTab)
        // console.log('setSelectedTabIndex', selectedTabId, foundTab, tabIndex)
        setSelectedTabIndex(tabIndex)
      } else {
        setSelectedTabIndex(0)
      }
    } else {
      setSelectedTabIndex(0)
    }
  }, [tabs, selectedTabId, setSelectedTabIndex])

  const vaultId = useMemo(() => {
    if (!tabs[selectedTabIndex]) return asset?.id
    return tabs[selectedTabIndex].id === 'gauge' && vaultGauge ? vaultGauge.id : asset?.id
  }, [tabs, selectedTabIndex, asset, vaultGauge])

  const selectedTab = useMemo(() => {
    return tabs[selectedTabIndex]
  }, [tabs, selectedTabIndex])

  const TabComponent = useMemo(() => {
    return selectedTab.component
  }, [selectedTab])

  // Change url and select tab
  const selectTab = useCallback((tabIndex: number) => {
    const selectedTab = tabs[tabIndex]
    if (selectedTab) {
      setSearchParams(`?tab=${selectedTab.id}`)
    }
  }, [tabs, setSearchParams])

  const renderedTabs = useMemo(() => {
    return (
      <Tabs
        variant={'unstyled'}
        index={selectedTabIndex}
        width={['100%', 'auto']}
      >
        <TabList>
          {
            tabs.map( (tab, index) => (
              <IconTab key={`tab_${index}`} width={[`${100/tabs.length}%`, 'auto']} icon={tab.icon} onClick={() => selectTab(index)}>
                <Translation translation={tab.label} />
              </IconTab>
            ))
          }
        </TabList>
      </Tabs>
    )
  }, [tabs, selectTab, selectedTabIndex])

  const interactiveComponent = useMemo(() => {
    if (!selectedTab.actions) return null
    return (
      <InteractiveComponent vaultId={asset?.id} assetId={vaultId} actions={selectedTab.actions!} />
    )
  }, [selectedTab, asset, vaultId])

  const vaultDetails = useMemo(() => {
    return (
      <HStack
        mb={[0, '3 !important']}
        spacing={4}
        pl={[0, selectedTab.id === 'stats' ? 5 : 0]}
        justifyContent={['center', 'flex-end']}
        borderLeft={!isMobile && selectedTab.id === 'stats' ? '1px solid' : 'none'}
        borderLeftColor={'divider'}
      >
        <HStack
          spacing={1}
        >
          <ProductTag type={asset?.type} fontSize={'md'} h={8} />
          <AssetProvider.Strategies h={8} w={8} />
        </HStack>
        <HStack
          pl={4}
          borderLeft={'1px solid'}
          borderLeftColor={'divider'}
        >
          <AssetProvider.Protocols tooltipDisabled={true} size={'sm'}>
            <AssetProvider.ProtocolIcon size={'sm'} />
          </AssetProvider.Protocols>
        </HStack>
        {
          /*
          <HStack
            pl={4}
            borderLeft={'1px solid'}
            borderLeftColor={'divider'}
          >
            <AssetProvider.ChainIcon width={8} height={8} />
          </HStack>
          */
        }
      </HStack>
    )
  }, [selectedTab, asset, isMobile])

  const headerRightSide = useMemo(() => {
    return (
      <Stack
        spacing={[0, 5]}
        direction={['column', 'row']}
      >
        {
          selectedTab.id === 'stats' && (
            <Stack
              spacing={2}
              mt={[3, '-15px']}
              width={['full', 'auto']}
              direction={['column', 'row']}
              alignItems={['auto', 'center']}
              justifyContent={['flex-start','center']}
            >
              <TimeframeSelector variant={'button'} timeframe={timeframe} setTimeframe={setTimeframe} width={['100%', 'auto']} justifyContent={['center', 'initial']} />
              <DatePicker selected={useDateRange} setDateRange={setDateRange} />
            </Stack>
          )
        }
        {
          // !isMobile && vaultDetails
        }
      </Stack>
    )
  }, [selectedTab, timeframe, setTimeframe, useDateRange, setDateRange])

  const vaultColor = useMemo(() => {
    if (!vault) return theme.colors.banner.bg
    if (("aggregatedVault" in vault) && vault.aggregatedVault) return vault.aggregatedVault.color
    return theme.colors.banner.bg
  }, [vault, theme])

  const operatorInfo = useMemo(() => {
    const operatorName = getObjectPath(vault, 'vaultConfig.operators.0.name')
    return operatorName ? operators[operatorName] : null
  }, [vault])

  const vaultHeader = useMemo(() => {
    return vault && ("aggregatedVault" in vault) && vault.aggregatedVault ? (
      <HStack
        spacing={3}
        width={'full'}
        alignItems={'center'}
      >
        <Image src={vault.aggregatedVault.icon} w={[12, 14]} h={[12, 14]} />
        <VStack
          spacing={[1, 2]}
          alignItems={'space-between'}
        >
          <Translation translation={vault.aggregatedVault.name} isHtml={true} component={Heading} color={'primary'} as={'h3'} fontSize={['h3', 'xl']} />
          <Translation translation={vault.aggregatedVault.type} component={Heading} color={'primary'} as={'h4'} fontWeight={500} fontSize={['md', 'h4']} />
        </VStack>
      </HStack>
    ) : operatorInfo ? (
      <HStack
        spacing={3}
        width={'full'}
        alignItems={'center'}
      >
        <Image src={operatorInfo.image} w={[12, 14]} h={[12, 14]} />
        <VStack
          spacing={[1, 2]}
          alignItems={'space-between'}
        >
          <Translation translation={operatorInfo.nameShort || operatorInfo.name} isHtml={true} component={Heading} color={'primary'} as={'h3'} fontSize={['h3', 'xl']} />
          <AssetProvider.VaultVariant color={'primary'} as={'h4'} fontWeight={500} fontSize={['md', 'h4']} />
        </VStack>
      </HStack>
    ) : (
      <HStack
        spacing={3}
        width={'full'}
        alignItems={'center'}
      >
        <AssetProvider.ProtocolIcon w={[12, 14]} h={[12, 14]} />
        <VStack
          spacing={[1, 2]}
          alignItems={'space-between'}
        >
          <AssetProvider.ProtocolName color={'primary'} as={'h3'} fontSize={['h3', 'xl']} />
          <AssetProvider.VaultVariant color={'primary'} as={'h4'} fontWeight={500} fontSize={['md', 'h4']} />
        </VStack>
      </HStack>
    )
  }, [vault, operatorInfo])

  return (
    <AssetPageProviderContext.Provider value={{stakingEnabled, setStakingEnabled, toggleStakingEnabled, isNetworkCorrect, referral}}>
      <AssetProvider
        wrapFlex={true}
        assetId={params.asset}
      >
        <Box
          mt={7}
          width={'100%'}
        >
          {
            vault && ("messages" in vault) && vault.messages?.defaulted && (
              <AnnouncementBanner mode={'alert'} text={vault.messages.defaulted} image={'images/vaults/warning.png'} imageRight={isMobile ? undefined : 'images/vaults/warning.png'} />
            )
          }
          <Flex
            left={0}
            py={[4, 8]}
            px={[4, 20]}
            width={'full'}
            alignItems={'flex-start'}
            justifyContent={'flex-start'}
            position={'absolute'}
            background={`radial-gradient(circle, ${vaultColor}00 40%, ${vaultColor}CC 100%)`}
            backgroundPosition={'top left'}
            backgroundSize={'300%'}
          >
            <VStack
              spacing={6}
              width={'full'}
              alignItems={'flex-start'}
              id={'asset-top-header'}
              justifyContent={'flex-start'}
            >
              {vaultHeader}
              <SimpleGrid
                columns={4}
                spacing={[4, 6]}
                alignItems={'flex-start'}
              >
                <VStack
                  pr={[4, 6]}
                  spacing={2}
                  height={'100%'}
                  borderRight={'1px solid'}
                  borderColor={'dividerLight'}
                  alignItems={'flex-start'}
                >
                  <Translation translation={'defi.apy'} fontSize={['sm','md']} color={'primary'} />
                  <HStack
                    flex={1}
                    spacing={0}
                    alignItems={'flex-end'}
                  >
                    {
                      !isPortfolioLoaded ? (
                        <Spinner size={'md'} />
                      ) : (
                        <AssetProvider.Apy showTooltip={false} fontSize={['h4','2xl']} textStyle={'bodyTitle'} lineHeight={1} />
                      )
                    }
                  </HStack>
                </VStack>
                <VStack
                  pr={[4, 6]}
                  spacing={2}
                  height={'100%'}
                  borderRight={'1px solid'}
                  borderColor={'dividerLight'}
                  alignItems={'flex-start'}
                >
                  <Translation translation={'defi.tvl'} fontSize={['sm','md']} color={'primary'} />
                  <HStack
                    flex={1}
                    spacing={0}
                    alignItems={'flex-end'}
                  >
                    {
                      !isPortfolioLoaded ? (
                        <Spinner size={'md'} />
                      ) : (
                        <AssetProvider.PoolUsd fontSize={['h4','2xl']} textStyle={'bodyTitle'} lineHeight={1} />
                      )
                    }
                  </HStack>
                </VStack>
                {
                  !(vault instanceof TrancheVault) ? (
                    <VStack
                      pr={[4, 6]}
                      spacing={2}
                      height={'100%'}
                      borderRight={'1px solid'}
                      borderColor={'dividerLight'}
                      alignItems={'flex-start'}
                    >
                      <Translation translation={'defi.composition'} fontSize={['sm','md']} color={'primary'} />
                      <Flex
                        flex={1}
                        alignItems={'flex-end'}
                      >
                        <AssetProvider.Protocols width={[6, 8]} height={[6, 8]}>
                          <AssetProvider.ProtocolIcon showTooltip={true} width={[6, 8]} height={[6, 8]} />
                        </AssetProvider.Protocols>
                      </Flex>
                    </VStack>
                  ) : (
                    <VStack
                      pr={[4, 6]}
                      spacing={2}
                      height={'100%'}
                      borderRight={'1px solid'}
                      borderColor={'dividerLight'}
                      alignItems={'flex-start'}
                    >
                      <Translation translation={'defi.riskProfile'} fontSize={['sm','md']} color={'primary'} />
                      <Flex
                        flex={1}
                        alignItems={'flex-end'}
                      >
                        <AssetProvider.Strategies showLabel={!isMobile} iconMargin={0} w={[6, 8]} />
                      </Flex>
                    </VStack>
                  )
                }
                <VStack
                  spacing={2}
                  height={'100%'}
                  alignItems={'flex-start'}
                >
                  <Translation translation={'defi.chain'} fontSize={['sm','md']} color={'primary'} />
                  <Flex
                    flex={1}
                    alignItems={'flex-end'}
                  >
                    <AssetProvider.ChainIcon width={[6, 8]} height={[6, 8]} />
                  </Flex>
                </VStack>
              </SimpleGrid>
            </VStack>
          </Flex>
          {
            /*
            <Flex
              my={[10, 7]}
              width={'100%'}
              id={'asset-top-header'}
              direction={['column', 'row']}
              justifyContent={['center', 'space-between']}
            >
              <Stack
                width={'100%'}
                spacing={[4, 8]}
                alignItems={'center'}
                justifyContent={'center'}
                direction={['column', 'row']}
              >
                {
                  vault && ("aggregatedVault" in vault) && vault.aggregatedVault && (
                    <HStack
                      spacing={2}
                      alignItems={'center'}
                    >
                      <Image src={vault.aggregatedVault.icon} w={[10, 14]} h={[10, 14]} />
                      <VStack
                        spacing={[1, 2]}
                        alignItems={'space-between'}
                      >
                        <Translation translation={vault.aggregatedVault.name} isHtml={true} component={Heading} color={'primary'} as={'h3'} fontSize={['h3', 'xl']} />
                        <Translation translation={vault.aggregatedVault.type} component={Heading} color={'primary'} as={'h4'} fontWeight={500} fontSize={['md', 'h4']} />
                      </VStack>
                    </HStack>
                  )
                }
                {
                  isMobile && vaultDetails
                }
                <Stack
                  flex={1}
                  spacing={0}
                  width={['100%', 'auto']}
                  justifyContent={'space-between'}
                  borderBottom={[0, '1px solid']}
                  direction={['column', 'row']}
                  borderColor={['divider', 'divider']}
                >
                  <HStack
                    width={['full', 'auto']}
                    borderBottom={['1px solid', 0]}
                    borderColor={'divider'}
                  >
                    {renderedTabs}
                  </HStack>
                  {headerRightSide}
                </Stack>
              </Stack>
            </Flex>
            */
          }
          <HStack
            mt={['4em','7em']}
            width={'100%'}
            spacing={[0, 10]}
            alignItems={'space-between'}
          >
            <Stack
              flex={1}
              mt={'7.5em'}
              mb={[20, 0]}
              spacing={10}
              width={['100%', 14/20]}
            >
              <Stack
                flex={1}
                spacing={0}
                width={['100%', 'auto']}
                justifyContent={'space-between'}
                borderBottom={[0, '1px solid']}
                direction={['column', 'row']}
                borderColor={['divider', 'divider']}
              >
                <HStack
                  width={['full', 'auto']}
                  borderBottom={['1px solid', 0]}
                  borderColor={'divider'}
                >
                  {renderedTabs}
                </HStack>
                {headerRightSide}
              </Stack>
              <TabComponent {...tabs[selectedTabIndex].componentProps} />
            </Stack>
            {interactiveComponent}
          </HStack>
        </Box>
      </AssetProvider>
    </AssetPageProviderContext.Provider>
  )
}