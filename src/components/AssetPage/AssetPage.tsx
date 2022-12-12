import { Earn } from './Earn'
import { strategies } from 'constants/'
import { GaugeStaking } from './GaugeStaking'
import React, { useMemo, useState } from 'react'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { InteractiveComponent } from './InteractiveComponent'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { StrategyLabel } from 'components/StrategyLabel/StrategyLabel'
import { ContainerProps, Box, Flex, Stack, HStack, VStack, Tabs, Tab, TabList } from '@chakra-ui/react'

export const AssetPage: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const { params } = useBrowserRouter()
  const { isMobile } = useThemeProvider()
  const [ selectedTabIndex, setSelectedTabIndex ] = useState<number>(0)
  const { selectors: { selectAssetById, selectVaultGauge } } = usePortfolioProvider()

  const strategy = useMemo(() => {
    return Object.keys(strategies).find( strategy => strategies[strategy].route === params.strategy )
  }, [params])

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const vaultGauge = useMemo(() => {
    return selectVaultGauge && selectVaultGauge(params.asset)
  }, [selectVaultGauge, params.asset])

  const tabs = useMemo(() => {
    const tabs = [
      {
        id:'earn',
        label:'navBar.earn',
        component: Earn
      },
    ]
    if (vaultGauge){
      tabs.push(
        {
          id:'stake',
          label:'navBar.gauge',
          component: GaugeStaking
        }
      )
    }

    return tabs
  }, [vaultGauge])

  const vaultId = useMemo(() => {
    return tabs[selectedTabIndex].id === 'stake' && vaultGauge ? vaultGauge.id : asset?.id
  }, [tabs, selectedTabIndex, asset, vaultGauge])

  const TabComponent = useMemo(() => {
    return tabs[selectedTabIndex].component
  }, [tabs, selectedTabIndex])

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
              <Tabs
                defaultIndex={0}
                variant={'unstyled'}
                width={['100%', 'auto']}
              >
                <TabList>
                  {
                    tabs.map( (tab, index) => (
                      <Translation key={`tab_${index}`} component={Tab} width={[`${100/tabs.length}%`, 'auto']} translation={tab.label} onClick={() => setSelectedTabIndex(index)} aria-selected={selectedTabIndex === index} />
                    ))
                  }
                </TabList>
              </Tabs>
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
          <InteractiveComponent vaultId={asset?.id} assetId={vaultId} />
        </HStack>
      </Box>
    </AssetProvider>
  )
}