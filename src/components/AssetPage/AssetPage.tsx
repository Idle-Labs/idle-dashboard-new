import { Earn } from './Earn'
import { strategies } from 'constants/'
import React, { useMemo, useState } from 'react'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { StrategyLabel } from 'components/StrategyLabel/StrategyLabel'
import { Translation } from 'components/Translation/Translation'
import { ContainerProps, Box, Flex, Stack, Tabs, Tab, TabList } from '@chakra-ui/react'

export const AssetPage: React.FC<ContainerProps> = ({ children, ...rest }) => {
  const { params } = useBrowserRouter()
  const { screenSize } = useThemeProvider()
  const [ selectedTabIndex, setSelectedTabIndex ] = useState<number>(0)
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  const isMobile = useMemo(() => screenSize==='sm', [screenSize])

  const strategy = useMemo(() => {
    return Object.keys(strategies).find( strategy => strategies[strategy].route === params.strategy )
  }, [params])

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const tabs = useMemo(() => [
    {
      label:'navBar.earn',
      component: Earn
    },
    {
      label:'navBar.stake',
      component: Earn
    }
  ], [])

  const TabComponent = useMemo(() => {
    return tabs[selectedTabIndex].component
  }, [tabs, selectedTabIndex])

  return (
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
          <AssetLabel assetId={asset?.id} fontSize={'h2'} />
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
                    <Translation key={`tab_${index}`} component={Tab} width={[1/tabs.length, 'auto']} translation={tab.label} onClick={() => setSelectedTabIndex(0)} aria-selected={selectedTabIndex === index} />
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
      <TabComponent />
    </Box>
  )
}