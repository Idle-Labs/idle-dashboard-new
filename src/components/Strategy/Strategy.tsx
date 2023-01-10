import { Column, Row } from 'react-table'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import type { BigNumber } from 'bignumber.js'
import { useNavigate } from 'react-router-dom'
import { sortNumeric, sortAlpha } from 'helpers/'
import { Amount } from 'components/Amount/Amount'
import React, { useMemo, useCallback } from 'react'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { VaultCard } from 'components/VaultCard/VaultCard'
import { ReactTable, } from 'components/ReactTable/ReactTable'
import { Asset, VaultPosition } from 'constants/types'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { strategies, StrategyColumn } from 'constants/strategies'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { Flex, HStack, VStack, Heading, Image, Stack, Skeleton, SkeletonText, Stat, StatNumber, StatArrow } from '@chakra-ui/react'

type RowProps = Row<Asset>

type TableFieldProps = {
  row: RowProps
  field: string
  value: any
}

export const TableField: React.FC<TableFieldProps> = ({ field, row, value }) => {
  const assetId = row.original.id
  return (
    <SkeletonText noOfLines={2} isLoaded={!!value}>
      <AssetProvider assetId={assetId}>
        <AssetProvider.GeneralData section={'strategy'} field={field} size={'sm'} />
      </AssetProvider>
    </SkeletonText>
  )

  /*
  switch (field) {
    case 'protocol':
      return (
        <SkeletonText noOfLines={2} isLoaded={!!value}>
          <AssetProvider assetId={assetId}>
            <Flex
              width={'100%'}
              alignItems={'center'}
            >
              <AssetProvider.ProtocolIcon size={'sm'} mr={2} />
              <AssetProvider.ProtocolName textStyle={'tableCell'} />
            </Flex>
          </AssetProvider>
        </SkeletonText>
      )
    case 'asset':
      return (
        <AssetProvider assetId={assetId}>
          <Flex
            width={'100%'}
            alignItems={'center'}
          >
            <AssetProvider.Icon size={'sm'} mr={2} />
            <AssetProvider.Name textStyle={'tableCell'} />
          </Flex>
        </AssetProvider>
      )
    case 'tvl':
      return (
        <Skeleton isLoaded={!!value}>
          <Amount prefix={'$ '} value={value} textStyle={'tableCell'} />
        </Skeleton>
      )
    case 'apy':
      return (
        <SkeletonText noOfLines={2} isLoaded={!!value}>
          <Amount.Percentage value={value} textStyle={'tableCell'} />
        </SkeletonText>
      )
    case 'rewards':
      return (
        <SkeletonText noOfLines={2} isLoaded={!!value}>
          <AssetProvider assetId={assetId}>
            <AssetProvider.Rewards size={'sm'} />
          </AssetProvider>
        </SkeletonText>
      )
    case 'protocols':
      return (
        <SkeletonText noOfLines={2} isLoaded={!!value}>
          <AssetProvider assetId={assetId}>
            <AssetProvider.Protocols size={'sm'} />
          </AssetProvider>
        </SkeletonText>
      )
    default:
      return null
  }
  */
}

export const Strategy: React.FC = () => {

  const navigate = useNavigate()
  const translate = useTranslate()
  const { screenSize } = useThemeProvider()
  const { location, params } = useBrowserRouter()

  const { isPortfolioLoaded, selectors: {
    selectVaultsByType,
    selectVaultsWithBalance,
    selectVaultsAssetsByType,
    selectVaultsAssetsWithBalance
  } } = usePortfolioProvider()

  const isMobile = useMemo(() => screenSize==='sm', [screenSize])

  const strategy = useMemo(() => (
    Object.keys(strategies).find( strategy => strategies[strategy].route === params.strategy )
  ), [params])

  const onRowClick = useCallback((row: RowProps) => {
    return navigate(`${location?.pathname.replace(/\/$/, '')}/${row.original.id}`)
  }, [navigate, location])

  const columns = useMemo(() => {
    return strategy && strategies[strategy].columns
  }, [strategy])

  const strategyColumns: Column<Asset>[] = useMemo(() => {
    if (!strategy || !columns) return []
    return columns.map( (column: StrategyColumn) => {
      const { id, accessor, sortType } = column
      const sortTypeFn = sortType==='alpha' ? sortAlpha : sortType==='numeric' ? sortNumeric : undefined
      return {
        id,
        accessor,
        disableSortBy: !sortTypeFn,
        defaultCanSort: !!sortTypeFn,
        Header: translate(`defi.${id}`),
        sortType: sortTypeFn ? (a: any, b: any) => sortTypeFn(a, b, accessor) : undefined,
        Cell: ({ value, row }: { value: any; row: RowProps }) => {
          return column.extraFields && column.extraFields.length>0 ? (
            <HStack
              spacing={2}
            >
              <TableField field={id} value={value} row={row} />
              {
                column.extraFields.map( (extraField: string) => (
                  <TableField key={`extraField_${extraField}`} field={extraField} value={value} row={row} />
                ))
              }
            </HStack>
          ) : (
            <TableField field={id} value={value} row={row} />
          )
        }
      }
    })
  }, [strategy, columns, translate])

  const strategyColumnsDeposit: Column<Asset>[] = useMemo(() => {
    if (!strategy || !columns) return []
    return columns.filter( (column: StrategyColumn) => !column.tables || column.tables.includes('Deposited') ).map( (column: StrategyColumn) => {
      const { id, accessor, sortType } = column
      const sortTypeFn = sortType==='alpha' ? sortAlpha : sortType==='numeric' ? sortNumeric : undefined
      return {
        id,
        accessor,
        disableSortBy: !sortTypeFn,
        defaultCanSort: !!sortTypeFn,
        Header: translate(`defi.${id}`),
        sortType: sortTypeFn ? (a: any, b: any) => sortTypeFn(a, b, accessor) : undefined,
        Cell: ({ value, row }: { value: any; row: RowProps }) => {
          return column.extraFields && column.extraFields.length>0 ? (
            <HStack
              spacing={2}
            >
              <TableField field={id} value={value} row={row} />
              {
                column.extraFields.map( (extraField: string) => (
                  <TableField key={`extraField_${extraField}`} field={extraField} value={value} row={row} />
                ))
              }
            </HStack>
          ) : (
            <TableField field={id} value={value} row={row} />
          )
        }
      }
    })
  }, [strategy, columns, translate])

  const depositedAssetsColumns: Column<Asset>[] = useMemo(() => ([
    {
      Header: '#',
      accessor: 'id',
      display: 'none'
    },
    ...strategyColumnsDeposit,
    {
      accessor:'balanceUsd',
      Header:translate('defi.balance'),
      Cell: ({ value/*, row*/ }: { value: BigNumber | undefined/*; row: RowProps*/ }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <Amount prefix={'$ '} value={value} textStyle={'tableCell'} />
          </SkeletonText>
        )
      },
      sortType: sortNumeric
    },
    {
      accessor:'vaultPosition',
      Header:translate('defi.realizedApy'),
      Cell: ({ value/*, row*/ }: { value: VaultPosition | undefined/*; row: RowProps*/ }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            {
              value && (
                <Stat>
                  <StatNumber>
                    <Flex
                      direction={'row'}
                      alignItems={'center'}
                    >
                      <StatArrow type={'increase'} />
                      <Amount.Percentage value={value.realizedApy} textStyle={'tableCell'} />
                    </Flex>
                  </StatNumber>
                  {/*<Amount prefix={'$ '} value={value.usd.earnings} textStyle={'captionSmall'} />*/}
                </Stat>
              )
            }
          </SkeletonText>
        )
      },
      sortType: (a: any, b: any): number => sortNumeric(a, b, 'vaultPosition.earningsPercentage')
    },
  ]), [translate, strategyColumnsDeposit])

  const availableAssetsColumns: Column<Asset>[] = useMemo(() => ([
    {
      Header: '#',
      accessor: 'id',
      display: 'none'
    },
    ...strategyColumns
  ]), [strategyColumns])

  const depositedAssetsData = useMemo(() => {
    if (!selectVaultsWithBalance || !isPortfolioLoaded) return []
    return selectVaultsAssetsWithBalance(strategy)
  }, [isPortfolioLoaded, selectVaultsWithBalance, selectVaultsAssetsWithBalance, strategy])

  const availableAssetsData = useMemo(() => {
    if (!selectVaultsByType || !isPortfolioLoaded) return []
    const vaultsAssets = selectVaultsAssetsByType(strategy)
    return vaultsAssets.filter( (vaultAsset: Asset) => !depositedAssetsData.map( (asset: Asset) => asset.id ).includes(vaultAsset.id) )
  }, [isPortfolioLoaded, selectVaultsByType, selectVaultsAssetsByType, depositedAssetsData, strategy])

  const depositedAssets = useMemo(() => {
    if (!depositedAssetsData.length) return null

    const initialState = {
      sortBy: [
        {
          id: 'balanceUsd',
          desc: false
        }
      ]
    }

    return isMobile ? (
      <VStack
        mt={20}
        spacing={6}
        width={'100%'}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.depositedAssets'} component={Heading} as={'h2'} fontSize={'lg'} />
        <VStack
          spacing={2}
          width={'100%'}
          alignItems={'flex-start'}
        >
          {
            depositedAssetsData.map( (asset: Asset) => asset.id && <VaultCard key={`vault_${asset.id}`} assetId={asset.id} />)
          }
        </VStack>
      </VStack>
    ) : (
      <Card mt={10}>
        <Translation translation={'defi.depositedAssets'} component={Card.Heading} />
        <ReactTable columns={depositedAssetsColumns} data={depositedAssetsData} initialState={initialState} onRowClick={onRowClick} />
      </Card>
    )
  }, [isMobile, depositedAssetsColumns, depositedAssetsData, onRowClick])

  const availableAssets = useMemo(() => {
    if (isPortfolioLoaded && !availableAssetsData.length) return null

    const initialState = {
      sortBy: [
        {
          id: 'tvl',
          desc: false
        }
      ]
    }

    return isMobile ? (
      <VStack
        mt={20}
        spacing={6}
        width={'100%'}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.availableAssets'} component={Heading} as={'h2'} fontSize={'lg'} />
        <VStack
          spacing={2}
          width={'100%'}
          alignItems={'flex-start'}
        >
          {
            availableAssetsData.map( (asset: Asset) => asset.id && <VaultCard key={`vault_${asset.id}`} assetId={asset.id} />)
          }
        </VStack>
      </VStack>
    ) : (
      <Card mt={10}>
        <Translation translation={'defi.availableAssets'} component={Card.Heading} />
        {
          !availableAssetsData.length ? (
            <Stack
            >
              <Skeleton />
              <Skeleton />
            </Stack>
          ) : (
            <ReactTable columns={availableAssetsColumns} data={availableAssetsData} initialState={initialState} onRowClick={onRowClick} />
          )
        }
      </Card>
    )
  }, [isMobile, isPortfolioLoaded, availableAssetsColumns, availableAssetsData, onRowClick])

  const heading = useMemo(() => {
    if (!strategy) return null
    return (
      <Stack
        spacing={[10, 0]}
        direction={['column', 'row']}
        alignItems={['center', 'flex-start']}
        width={['100%', '100%', '100%', '80%', '55%']}
      >
        <VStack
          pr={[0, 14]}
          pt={[0, 20]}
          spacing={10}
          direction={'column'}
          width={['100%', '65%']}
          alignItems={['center', 'flex-start']}
        >
          <Translation translation={strategies[strategy].label} component={Heading} as={'h2'} size={'3xl'} />
          {
            !isMobile && (
              <Translation translation={strategies[strategy].description} textAlign={['center', 'left']} />
            )
          }
        </VStack>
        <Image width={['70%', '35%']} src={strategies[strategy].image} />
        {
          isMobile && (
            <Translation translation={strategies[strategy].description} textAlign={['center', 'left']} />
          )
        }
      </Stack>
    )
  }, [strategy, isMobile])

  return (
    <Flex
      mt={14}
      width={'100%'}
      direction={'column'}
      alignItems={'center'}
    >
      {heading}
      {depositedAssets}
      {availableAssets}
    </Flex>
  )
}
