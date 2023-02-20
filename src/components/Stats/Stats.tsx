import { Vault } from 'vaults/'
import { BigNumber } from 'bignumber.js'
import { Column, Row } from 'react-table'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import { useNavigate } from 'react-router-dom'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import React, { useMemo, useCallback } from 'react'
import type { AssetId, Asset } from 'constants/types'
import { bnOrZero, BNify, sortNumeric } from 'helpers/'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { ReactTable } from 'components/ReactTable/ReactTable'
import { Translation } from 'components/Translation/Translation'
import { StrategyTag } from 'components/StrategyTag/StrategyTag'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/md'
import { useTheme, SkeletonText, SimpleGrid, VStack, HStack, Flex, Tag, TagLabel, Text, Heading } from '@chakra-ui/react'

type ApyRange = {
  minApy: BigNumber | null
  maxApy: BigNumber | null
}

type AggregatedAsset = Asset & {
  apyRange: ApyRange
  strategy: string
  subRows: Asset[]
}

type RowProps = Row<AggregatedAsset>

export const Stats: React.FC = () => {

  const theme = useTheme()
  const navigate = useNavigate()
  const { location } = useBrowserRouter()

  const {
    vaults,
    assetsData,
    isPortfolioLoaded,
    selectors: {
      selectAssetById,
      selectVaultById
    }
  } = usePortfolioProvider()
  const translate = useTranslate()

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
    return Object.keys(assetsByStrategy).reduce( (aggregatedUnderlyings: Record<AssetId, AggregatedAsset>, strategy: string) => {
      assetsByStrategy[strategy].forEach( (asset: Asset) => {
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
  }, [assetsByStrategy, selectAssetById, selectVaultById])

  // console.log('aggregatedUnderlyings', aggregatedUnderlyings)

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
          <AssetProvider assetId={value}>
            <AssetProvider.GeneralData field={'protocolWithVariant'} size={'xs'} />
          </AssetProvider>
        ) : row.original.type === 'BY' ? (
          <AssetProvider assetId={value}>
            <Flex
              width={['auto','40%']}
            >
              <AssetProvider.GeneralData field={'protocols'} size={'xs'} />
            </Flex>
            <AssetProvider.GeneralData field={'strategies'} />
          </AssetProvider>
        ) : (
          <HStack
            spacing={[10, 0]}
          >
            <Flex
              width={['auto','40%']}
            >
              <AssetLabel assetId={value} textStyle={'tableCell'} fontSize={'md'} />
            </Flex>
            <StrategyTag strategy={row.original.strategy} />
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
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <Amount.Usd value={value} textStyle={'tableCell'} />
          </SkeletonText>
        )
      },
      sortType: sortNumeric
    },
    {
      accessor:'apyRange',
      Header:translate('defi.apy'),
      Cell: ({ value, row }: { value: ApyRange | undefined; row: RowProps }) => {
        return (row.original.type === 'AA' || row.original.type === 'BB') ? (
          <AssetProvider assetId={row.original.id}>
            <HStack
              spacing={1}
            >
              <AssetProvider.SeniorApy color={strategies.AA.color} textStyle={'tableCell'} />
              <Text>-</Text>
              <AssetProvider.JuniorApy color={strategies.BB.color} textStyle={'tableCell'} />
            </HStack>
          </AssetProvider>
        ) : row.original.type === 'BY' ? (
          <AssetProvider assetId={row.original.id}>
            <AssetProvider.Apy textStyle={'tableCell'} />
          </AssetProvider>
        ) : (
          <HStack
            justifyContent={'space-between'}
          >
            <HStack
              spacing={1}
            >
              <Amount.Percentage value={value?.minApy || null} textStyle={'tableCell'} />
              <Text>-</Text>
              <Amount.Percentage value={value?.maxApy || null} textStyle={'tableCell'} />
            </HStack>
            <MdKeyboardArrowDown
              size={24}
              color={theme.colors.primary}
            />
          </HStack>
        )
      },
      // sortType: sortNumeric
    },
  ]), [translate, theme])

  const statsData = useMemo(() => {
    return Object.values(aggregatedUnderlyings)
  }, [aggregatedUnderlyings])

  const initialState = {
    sortBy: [
      {
        id: 'tvlUsd',
        desc: false
      }
    ]
  }

  const onRowClick = useCallback((vaultId: AssetId | undefined) => {
    if (!vaultId) return null
    // sendSelectItem(item_list_id, item_list_name, row.original)
    return navigate(`${location?.pathname.replace(/\/$/, '')}/${vaultId}`)
  }, [navigate, location])

  return (
    <VStack
      mt={14}
      spacing={10}
      width={'full'}
      alignItems={'flex-start'}
    >
      <Translation translation={'defi.chooseAsset'} component={Text} textStyle={'heading'} fontSize={'xl'} />
      <Card>
        <ReactTable<AggregatedAsset>
          data={statsData}
          columns={statsColumns}
          initialState={initialState}
          onRowClick={ (row) => onRowClick(row.original.id) }
        />
      </Card>
    </VStack>
  )
}