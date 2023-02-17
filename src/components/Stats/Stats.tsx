import { Vault } from 'vaults/'
import React, { useMemo } from 'react'
import { BigNumber } from 'bignumber.js'
import { Column, Row } from 'react-table'
import { bnOrZero, BNify } from 'helpers/'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import type { AssetId, Asset } from 'constants/types'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { ReactTable } from 'components/ReactTable/ReactTable'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { SkeletonText, SimpleGrid, VStack, HStack, Flex, Tag, TagLabel, Text, Heading } from '@chakra-ui/react'

type ApyRange = {
  minApy: BigNumber | null
  maxApy: BigNumber | null
}

type AggregatedAsset = Asset & {
  apyRange: ApyRange
  strategy: string
}

export const Stats: React.FC = () => {

  const {
    vaults,
    assetsData,
    isPortfolioLoaded,
    selectors: {
      selectAssetById
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
          if (!aggregatedUnderlyings[underlyingAsset.id]){
            aggregatedUnderlyings[underlyingAsset.id] = underlyingAsset
            aggregatedUnderlyings[underlyingAsset.id].strategy = strategy
            aggregatedUnderlyings[underlyingAsset.id].apyRange = {
              minApy: asset.apy || null,
              maxApy: asset.apy || null
            }
          } else {
            if (asset.apy){
              if (!aggregatedUnderlyings[underlyingAsset.id].apyRange.minApy){
                aggregatedUnderlyings[underlyingAsset.id].apyRange.minApy = BNify(asset.apy)
              } else {
                aggregatedUnderlyings[underlyingAsset.id].apyRange.minApy = BigNumber.minimum(aggregatedUnderlyings[underlyingAsset.id].apyRange.minApy as BigNumber, asset.apy)
              }
              if (!aggregatedUnderlyings[underlyingAsset.id].apyRange.maxApy){
                aggregatedUnderlyings[underlyingAsset.id].apyRange.maxApy = BNify(asset.apy)
              } else {
                aggregatedUnderlyings[underlyingAsset.id].apyRange.maxApy = BigNumber.maximum(aggregatedUnderlyings[underlyingAsset.id].apyRange.maxApy as BigNumber, asset.apy)
              }
            }

          }
          aggregatedUnderlyings[underlyingAsset.id].tvlUsd = bnOrZero(aggregatedUnderlyings[underlyingAsset.id].tvl).plus(bnOrZero(asset.tvlUsd))
          // aggregatedUnderlyings[underlyingAsset.id].tvl = bnOrZero(aggregatedUnderlyings[underlyingAsset.id].tvl).plus(asset.tvlUsd)
        }
      })
      return aggregatedUnderlyings
    }, {})
  }, [assetsByStrategy, selectAssetById])

  console.log('aggregatedUnderlyings', aggregatedUnderlyings)

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
      Cell: ({ value/*, row*/ }: { value: AssetId | undefined/*; row: RowProps*/ }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetLabel assetId={value} textStyle={'tableCell'} fontSize={'md'} />
          </SkeletonText>
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
      // sortType: sortNumeric
    },
    {
      accessor:'apyRange',
      Header:translate('defi.apy'),
      Cell: ({ value/*, row*/ }: { value: ApyRange | undefined/*; row: RowProps*/ }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value && !!value.minApy && !!value.maxApy}>
            <HStack
              spacing={1}
            >
              <Amount.Percentage value={value?.minApy || null} textStyle={'tableCell'} />
              <Text>-</Text>
              <Amount.Percentage value={value?.maxApy || null} textStyle={'tableCell'} />
            </HStack>
          </SkeletonText>
        )
      },
      // sortType: sortNumeric
    },
  ]), [translate])

  const statsData = useMemo(() => {
    return Object.values(aggregatedUnderlyings)
  }, [aggregatedUnderlyings])

  const initialState = {
    sortBy: [
      {
        id: 'tvl',
        desc: false
      }
    ]
  }

  return (
    <VStack
      mt={14}
      spacing={10}
      width={'full'}
      alignItems={'flex-start'}
    >
      <Translation translation={'defi.chooseAsset'} component={Text} textStyle={'heading'} fontSize={'xl'} />
      <Card>
        <ReactTable
          data={statsData}
          columns={statsColumns}
          initialState={initialState}
          // onRowClick={ (row) => onRowClick(row, depositedListId, depositedListName) }
        />
      </Card>
    </VStack>
  )
}