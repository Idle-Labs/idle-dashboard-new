import { BigNumber } from 'bignumber.js'
import { Column, Row } from 'react-table'
import { MdSearch } from 'react-icons/md'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import { useNavigate } from 'react-router-dom'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import type { AssetId, Asset } from 'constants/types'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { VaultCard } from 'components/VaultCard/VaultCard'
import React, { useState, useMemo, useCallback } from 'react'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { ReactTable } from 'components/ReactTable/ReactTable'
import { ProductTag } from 'components/ProductTag/ProductTag'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { bnOrZero, BNify, sortNumeric, getObjectPath } from 'helpers/'
import { useTheme, SkeletonText, Stack, VStack, HStack, Flex, Text, Button, Input, InputGroup, InputRightElement } from '@chakra-ui/react'

type ApyRange = {
  minApy: BigNumber | null
  maxApy: BigNumber | null
}

export type AggregatedAsset = Asset & {
  apyRange: ApyRange
  strategy: string
  subRows: Asset[]
}

type RowProps = Row<AggregatedAsset>

export const Stats: React.FC = () => {
  const navigate = useNavigate()
  const { location } = useBrowserRouter()

  const {
    assetsData,
    isPortfolioLoaded,
    selectors: {
      selectAssetById,
      selectVaultById
    }
  } = usePortfolioProvider()
  const theme = useTheme()
  const translate = useTranslate()
  const { isMobile } = useThemeProvider()
  const [ searchQuery, setSearchQuery ] = useState<string>('')
  const [ selectedStrategy, setSelectedStrategy ] = useState<string | null>(null)
  const [ selectedAsset, setSelectedAsset ] = useState<AggregatedAsset | null>(null)

  const onRowClick = useCallback((vaultId: AssetId | undefined) => {
    if (!vaultId) return null
    // sendSelectItem(item_list_id, item_list_name, row.original)
    return navigate(`${location?.pathname.replace(/\/$/, '')}/${vaultId}`)
  }, [navigate, location])

  const assetsByStrategy = useMemo(() => {
    if (!isPortfolioLoaded) return {}
    return Object.values(assetsData).reduce( (assetsByStrategy: Record<string, Asset[]>, asset: Asset) => {
      if (!("type" in asset)) return assetsByStrategy
      const strategyConfig = strategies[asset.type as string]
      if (!strategyConfig || !("strategy" in strategyConfig)) return assetsByStrategy

      if (!assetsByStrategy[strategyConfig.strategy as string]){
        assetsByStrategy[strategyConfig.strategy as string] = []
      }
      return {
        ...assetsByStrategy,
        [strategyConfig.strategy as string]:[
          ...assetsByStrategy[strategyConfig.strategy as string],
          asset
        ]
      }
    }, {})
  }, [assetsData, isPortfolioLoaded])

  const aggregatedUnderlyings = useMemo(() => {
    return Object.keys(assetsByStrategy).filter( (strategy: string) => (!selectedStrategy || selectedStrategy === strategy) ).reduce( (aggregatedUnderlyings: Record<AssetId, AggregatedAsset>, strategy: string) => {
      assetsByStrategy[strategy].filter( (asset: Asset) => (!searchQuery.trim().length || asset.name.toLowerCase().includes(searchQuery.toLowerCase())) ).forEach( (asset: Asset) => {
        const underlyingAsset = selectAssetById(asset.underlyingId)
        if (underlyingAsset){
          const strategyKey = `${underlyingAsset.id}_${strategy}`
          if (!aggregatedUnderlyings[strategyKey]){
            aggregatedUnderlyings[strategyKey] = {...underlyingAsset}
            aggregatedUnderlyings[strategyKey].strategy = strategy
            aggregatedUnderlyings[strategyKey].subRows = []
            aggregatedUnderlyings[strategyKey].apyRange = {
              minApy: asset.apy || null,
              maxApy: asset.apy || null
            }
          } else {
            if (asset.apy){
              if (!aggregatedUnderlyings[strategyKey].apyRange.minApy){
                aggregatedUnderlyings[strategyKey].apyRange.minApy = BNify(asset.apy)
              } else {
                aggregatedUnderlyings[strategyKey].apyRange.minApy = BigNumber.minimum(aggregatedUnderlyings[strategyKey].apyRange.minApy as BigNumber, asset.apy)
              }
              if (!aggregatedUnderlyings[strategyKey].apyRange.maxApy){
                aggregatedUnderlyings[strategyKey].apyRange.maxApy = BNify(asset.apy)
              } else {
                aggregatedUnderlyings[strategyKey].apyRange.maxApy = BigNumber.maximum(aggregatedUnderlyings[strategyKey].apyRange.maxApy as BigNumber, asset.apy)
              }
            }
          }

          // console.log(strategy, underlyingAsset.name, asset.type, bnOrZero(aggregatedUnderlyings[strategyKey].tvlUsd).toString(), bnOrZero(asset.tvl).toString(), bnOrZero(asset.tvlUsd).toString(), bnOrZero(aggregatedUnderlyings[strategyKey].tvlUsd).plus(bnOrZero(asset.tvlUsd)).toString())
          
          aggregatedUnderlyings[strategyKey].tvlUsd = bnOrZero(aggregatedUnderlyings[strategyKey].tvlUsd).plus(bnOrZero(asset.tvlUsd))

          const vault = selectVaultById(asset.id)

          switch (strategy){
            case 'tranches':
              // console.log(asset, vault)
              // Lookup for same tranches
              const cdoConfig = vault.cdoConfig
              const foundAsset = aggregatedUnderlyings[strategyKey].subRows.find( (foundAsset: Asset) => {
                const vault = selectVaultById(foundAsset.id)
                return ("cdoConfig" in vault) && vault.cdoConfig.address === cdoConfig.address && foundAsset.id !== asset.id
              })
              // Add Tvl to found asset
              if (foundAsset){
                foundAsset.tvlUsd = bnOrZero(foundAsset.tvlUsd).plus(bnOrZero(asset.tvlUsd))
              // Add asset
              } else {
                aggregatedUnderlyings[strategyKey].subRows.push({...asset})
              }
            break;
            default:
              aggregatedUnderlyings[strategyKey].subRows.push({...asset})
            break;
          }

          // console.log(underlyingAsset, asset.name, bnOrZero(asset.tvlUsd).toString(), bnOrZero(aggregatedUnderlyings[underlyingAsset.id].tvl).toString(), aggregatedUnderlyings[underlyingAsset.id].tvlUsd?.toString())
          // aggregatedUnderlyings[underlyingAsset.id].tvl = bnOrZero(aggregatedUnderlyings[underlyingAsset.id].tvl).plus(asset.tvlUsd)
        }
      })
      return aggregatedUnderlyings
    }, {})
  }, [assetsByStrategy, selectAssetById, selectVaultById, selectedStrategy, searchQuery])

  const totalTvlUsd = useMemo(() => Object.values(assetsData).reduce( (totalTvlUsd: BigNumber, asset: Asset) => totalTvlUsd.plus(bnOrZero(asset?.tvlUsd)), BNify(0) ) , [assetsData])

  const statsColumns: Column<AggregatedAsset>[] = useMemo(() => ([
    {
      Header: '#',
      accessor: 'id',
      display: 'none'
    },
    {
      id:'asset',
      accessor:'id',
      Header:translate('defi.asset'),
      Cell: ({ value, row }: { value: AssetId | undefined; row: RowProps }) => {
        return (row.original.type === 'AA' || row.original.type === 'BB') ? (
          <Flex
            pl={4}
          >
            <AssetProvider assetId={value}>
              <AssetProvider.GeneralData field={'protocolWithVariant'} size={'xs'} />
            </AssetProvider>
          </Flex>
        ) : row.original.type === 'BY' ? (
          <AssetProvider assetId={value}>
            <Flex
              pl={4}
              width={['auto','40%']}
            >
              <AssetProvider.GeneralData field={'protocols'} size={'xs'} />
            </Flex>
            <AssetProvider.GeneralData field={'strategies'} />
          </AssetProvider>
        ) : (
          <HStack
            width={'full'}
            spacing={[10, 0]}
          >
            <Flex
              width={['auto','40%']}
            >
              <AssetLabel assetId={value} textStyle={'tableCell'} fontSize={'md'} />
            </Flex>
            <ProductTag type={row.original.strategy} />
          </HStack>
        )
      },
      // sortType: sortNumeric
    },
    {
      accessor:'tvlUsd',
      Header:translate('defi.tvl'),
      Cell: ({ value/*, row*/ }: { value: BigNumber | undefined/*; row: RowProps*/ }) => {
        return (
          <SkeletonText noOfLines={1} isLoaded={!!value}>
            <Amount.Usd value={value} textStyle={'tableCell'} />
          </SkeletonText>
        )
      },
      sortType: sortNumeric
    },
    {
      accessor:'apyRange',
      Header:translate('stats.apyRange'),
      Cell: ({ value, row }: { value: ApyRange | undefined; row: RowProps }) => {
        return (row.original.type === 'AA' || row.original.type === 'BB') ? (
          <AssetProvider assetId={row.original.id}>
            <HStack
              spacing={6}
            >
              <AssetProvider.SeniorApy color={strategies.AA.color} textStyle={'tableCell'} />
              <AssetProvider.JuniorApy color={strategies.BB.color} textStyle={'tableCell'} />
            </HStack>
          </AssetProvider>
        ) : row.original.type === 'BY' ? (
          <AssetProvider assetId={row.original.id}>
            <AssetProvider.Apy showTooltip={false} textStyle={'tableCell'} />
          </AssetProvider>
        ) : (
          <HStack
            spacing={1}
          >
            {
              row.original.subRows.length === 1 && row.original.strategy === 'best' ? (
                <Amount.Percentage value={value?.maxApy || null} textStyle={'tableCell'} />
              ) : (
                <>
                  <Amount.Percentage value={value?.minApy || null} textStyle={'tableCell'} />
                  <Text>-</Text>
                  <Amount.Percentage value={value?.maxApy || null} textStyle={'tableCell'} />
                </>
              )
            }
          </HStack>
        )
      },
      sortType: (a: any, b: any, field: any): number => {
        const apyRange_a = getObjectPath(a.original, field)
        const apyRange_b = getObjectPath(b.original, field)

        if (!apyRange_a || !apyRange_b) return 1

        const n1 = BNify(apyRange_a.maxApy).isNaN() ? BNify(-1) : BNify(apyRange_a.maxApy)
        const n2 = BNify(apyRange_b.maxApy).isNaN() ? BNify(-1) : BNify(apyRange_b.maxApy)
        return n1.gt(n2) ? -1 : 1
      }
      // sortType: sortNumeric
    },
  ]), [translate])

  const statsData = useMemo(() => {
    return Object.values(aggregatedUnderlyings)
  }, [aggregatedUnderlyings])

  const initialState = useMemo(() => ({
    sortBy: [
      {
        id: 'tvlUsd',
        desc: false
      }
    ]
  }), [])

  const handleSearchChange = useCallback(({target: { value }}: { target: {value: string} }) => {
    setSearchQuery(value)
  }, [setSearchQuery])

  // console.log('statsData', statsData)

  const strategiesFilters = useMemo(() => {
    const searchText = translate('common.search')
    return (
      <HStack
        spacing={2}
        width={'full'}
        justifyContent={'space-between'}
      >
        <HStack>
          <Translation component={Button} variant={'tab'} translation={'common.all'} aria-selected={!selectedStrategy} onClick={() => setSelectedStrategy(null)} />
          {
            Object.keys(assetsByStrategy).map( (strategy: string) => (
              <Translation key={strategy} component={Button} variant={'tab'} translation={`strategies.${strategy}.label`} aria-selected={selectedStrategy === strategy} onClick={() => setSelectedStrategy(strategy)} />
            ))
          }
        </HStack>
        {
          !isMobile && (
            <HStack>
              <InputGroup>
                <Input type={'text'} placeholder={searchText} variant={'search'} onChange={handleSearchChange} />
                <InputRightElement children={<MdSearch size={24} color={theme.colors.cta} />} />
              </InputGroup>
            </HStack>
          )
        }
      </HStack>
    )
  }, [selectedStrategy, isMobile, translate, assetsByStrategy, setSelectedStrategy, theme, handleSearchChange])

  const vaultsList = useMemo(() => {
    return !isMobile ? (
      <Card>
        <VStack
          spacing={6}
          width={'full'}
          alignItems={'flex-start'}
        >
          {strategiesFilters}
          <ReactTable<AggregatedAsset>
            data={statsData}
            columns={statsColumns}
            initialState={initialState}
            onRowClick={ (row) => onRowClick(row.original.id) }
          />
        </VStack>
      </Card>
    ) : (
      <VStack
        spacing={4}
        width={'100%'}
        alignItems={'flex-start'}
      >
        {strategiesFilters}
        {
          statsData.map( (asset: AggregatedAsset, vaultIndex: number) => <VaultCard.Stats key={vaultIndex} asset={asset} onRowClick={(asset: Asset) => onRowClick(asset.id)} handleClick={(asset: AggregatedAsset) => setSelectedAsset(asset)} isOpen={selectedAsset===asset} /> )
        }
      </VStack>
    )
  }, [isMobile, strategiesFilters, statsData, statsColumns, initialState, onRowClick, selectedAsset, setSelectedAsset])

  return (
    <VStack
      mt={14}
      width={'full'}
      spacing={[4, 10]}
      alignItems={'flex-start'}
    >
      <Stack
        width={'full'}
        spacing={[4, 0]}
        justifyContent={'space-between'}
        alignItems={['flex-start', 'flex-end']}
        direction={['column-reverse', 'row']}
      >
        <Translation translation={'defi.chooseAsset'} textStyle={'heading'} fontSize={'xl'} />
        <VStack
          pr={[0, 8]}
          spacing={1}
          alignItems={'flex-start'}
        >
          <Translation translation={'stats.totalTVL'} textStyle={'captionSmall'} />
          <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded}>
            <Amount.Usd value={totalTvlUsd} textStyle={'h2'} lineHeight={'normal'} />
          </SkeletonText>
        </VStack>
      </Stack>
      {vaultsList}
    </VStack>
  )
}