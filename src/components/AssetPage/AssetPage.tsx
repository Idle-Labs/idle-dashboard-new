import { Earn } from './Earn'
import { strategies } from 'constants/'
import { GaugeStaking } from './GaugeStaking'
import { useNavigate } from 'react-router-dom'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Deposit } from 'components/OperativeComponent/Deposit'
import { Approve } from 'components/OperativeComponent/Approve'
import { Translation } from 'components/Translation/Translation'
import { Withdraw } from 'components/OperativeComponent/Withdraw'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { StrategyLabel } from 'components/StrategyLabel/StrategyLabel'
import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { Box, Flex, Stack, HStack, Tabs, Tab, TabList } from '@chakra-ui/react'
import { InteractiveComponent } from 'components/InteractiveComponent/InteractiveComponent'

export const AssetPage: React.FC = () => {
  const navigate = useNavigate()
  const { isMobile } = useThemeProvider()
  const { params, location, searchParams } = useBrowserRouter()
  const [ selectedTabIndex, setSelectedTabIndex ] = useState<number>(0)
  const [ getSearchParams, setSearchParams ] = useMemo(() => searchParams, [searchParams]) 
  const { isPortfolioLoaded, selectors: { selectAssetById, selectVaultGauge } } = usePortfolioProvider()

  const strategy = useMemo(() => {
    return Object.keys(strategies).find( strategy => strategies[strategy].route === params.strategy )
  }, [params])

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const vaultGauge = useMemo(() => {
    return selectVaultGauge && selectVaultGauge(params.asset)
  }, [selectVaultGauge, params.asset])

  // Check asset exists
  useEffect(() => {
    if (!isPortfolioLoaded || !selectAssetById || !location) return
    if (!asset){
      return navigate(location.pathname.replace(`/${params.asset}`, ''))
    }
  }, [isPortfolioLoaded, selectAssetById, asset, params.asset, location, navigate])

  const tabs = useMemo(() => {
    const tabs = [
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
      },
    ]
    if (vaultGauge){
      tabs.push(
        {
          id:'gauge',
          label:'navBar.gauge',
          component: GaugeStaking,
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

    return tabs
  }, [vaultGauge])

  const vaultId = useMemo(() => {
    return tabs[selectedTabIndex].id === 'gauge' && vaultGauge ? vaultGauge.id : asset?.id
  }, [tabs, selectedTabIndex, asset, vaultGauge])

  const TabComponent = useMemo(() => {
    return tabs[selectedTabIndex].component
  }, [tabs, selectedTabIndex])

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
      }
    } else {
      setSelectedTabIndex(0)
    }
  }, [tabs, selectedTabId, setSelectedTabIndex])

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
        index={selectedTabIndex}
        variant={'unstyled'}
        width={['100%', 'auto']}
      >
        <TabList>
          {
            tabs.map( (tab, index) => (
              <Translation key={`tab_${index}`} component={Tab} width={[`${100/tabs.length}%`, 'auto']} translation={tab.label} onClick={() => selectTab(index)} />
            ))
          }
        </TabList>
      </Tabs>
    )
  }, [tabs, selectTab, selectedTabIndex])

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
            spacing={[7, 10]}
            alignItems={'center'}
            justifyContent={'center'}
            direction={['column', 'row']}
          >
            <AssetLabel assetId={params.asset} fontSize={'h2'} />
            <Stack
              flex={1}
              direction={'row'}
              width={['100%', 'auto']}
              borderBottom={'1px solid'}
              borderColor={'divider'}
              justifyContent={'space-between'}
            >
              {renderedTabs}
              {
                !isMobile && (
                  <StrategyLabel strategy={strategy} color={'cta'} textStyle={'italic'} />
                )
              }
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
            <TabComponent />
          </Stack>
          <InteractiveComponent vaultId={asset?.id} assetId={vaultId} actions={tabs[selectedTabIndex].actions} />
        </HStack>
      </Box>
    </AssetProvider>
  )
}