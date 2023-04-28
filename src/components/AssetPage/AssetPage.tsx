import { Earn } from './Earn'
import { GaugeStaking } from './GaugeStaking'
import { useNavigate } from 'react-router-dom'
import { IconTab } from 'components/IconTab/IconTab'
import { useThemeProvider } from 'contexts/ThemeProvider'
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
import { bnOrZero, BNify, sendViewItem, checkSectionEnabled } from 'helpers/'
import { TimeframeSelector } from 'components/TimeframeSelector/TimeframeSelector'
import { Box, Flex, Stack, HStack, Tabs, TabList, ImageProps } from '@chakra-ui/react'
import { InteractiveComponent } from 'components/InteractiveComponent/InteractiveComponent'
import type { OperativeComponentAction } from 'components/OperativeComponent/OperativeComponent'
import { /*strategies,*/ AssetId, imageFolder, DateRange, HistoryTimeframe, GaugeRewardData, BigNumber } from 'constants/'

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

export const AssetPage: React.FC = () => {
  const navigate = useNavigate()
  const { isMobile, environment } = useThemeProvider()
  const { params, location, searchParams } = useBrowserRouter()
  const [ selectedTabIndex, setSelectedTabIndex ] = useState<number>(0)
  const [ latestAssetUpdate, setLatestAssetUpdate ] = useState<number>(0)
  const [ viewItemEventSent, setViewItemEventSent ] = useState<AssetId | undefined>()
  const [ getSearchParams, setSearchParams ] = useMemo(() => searchParams, [searchParams]) 
  const [ dateRange, setDateRange ] = useState<DateRange>({ startDate: null, endDate: null })
  const [ timeframe, setTimeframe ] = useState<HistoryTimeframe | undefined>(HistoryTimeframe["6MONTHS"])

  const useDateRange = useMemo(() => {
    return !!dateRange.startDate && !!dateRange.endDate
  }, [dateRange])

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

  // const strategy = useMemo(() => {
  //   return Object.keys(strategies).find( strategy => strategies[strategy].route === params.strategy )
  // }, [params])

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(params.asset)
  }, [selectVaultById, params.asset])

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

  // console.log('assetBalance', assetBalance)

  // const asset = useMemo(() => {
  //   console.log('asset', selectAssetById && selectAssetById(params.asset))
  //   return selectAssetById && selectAssetById(params.asset)
  // }, [selectAssetById, params.asset])

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
    // console.log(isPortfolioLoaded, selectAssetById, location, asset)
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
    const tabs: TabType[] = [
      {
        id:'earn',
        label:'navBar.earn',
        component: Earn,
        actions: [
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
  }, [vault, vaultGauge, assetGauge, timeframe, dateRange, environment, claimableRewards])

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
          !isMobile && vaultDetails
        }
      </Stack>
    )
  }, [selectedTab, isMobile, timeframe, setTimeframe, useDateRange, setDateRange, vaultDetails])

  return (
    <AssetProvider
      wrapFlex={true}
      assetId={params.asset}
    >
      <Box
        width={'100%'}
      >
        <Flex
          my={[10, 14]}
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
            <AssetLabel assetId={params.asset} fontSize={'h2'} extraFields={['statusBadge']} />
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
        <HStack
          width={'100%'}
          spacing={[0, 10]}
          alignItems={'space-between'}
        >
          <Stack
            flex={1}
            mb={[20, 0]}
            spacing={10}
            width={['100%', 14/20]}
          >
            <TabComponent {...tabs[selectedTabIndex].componentProps} />
          </Stack>
          {interactiveComponent}
        </HStack>
      </Box>
    </AssetProvider>
  )
}