import { Column, Row } from 'react-table'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import type { BigNumber } from 'bignumber.js'
import { useNavigate } from 'react-router-dom'
import { Amount } from 'components/Amount/Amount'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { VaultCard } from 'components/VaultCard/VaultCard'
import { useWalletProvider } from 'contexts/WalletProvider'
import { products, ProductProps } from 'constants/products'
import type { Asset, VaultPosition } from 'constants/types'
import { Pagination } from 'components/Pagination/Pagination'
import { ReactTable, } from 'components/ReactTable/ReactTable'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { strategies, StrategyColumn } from 'constants/strategies'
import { sortNumeric, sortAlpha, sendSelectItem, BNify } from 'helpers/'
import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { MdStarBorder, MdOutlineAccountBalanceWallet } from 'react-icons/md'
import { AssetProvider, AssetProviderPropsType } from 'components/AssetProvider/AssetProvider'
import { Flex, HStack, VStack, Button, ButtonProps, Stack, SkeletonText, Stat, StatNumber, StatArrow } from '@chakra-ui/react'

type RowProps = Row<Asset>

type TableFieldProps = {
  row: RowProps
  field: string
  value: any
  props?: AssetProviderPropsType
}

export const TableField: React.FC<TableFieldProps> = ({ field, row, value, props }) => {
  const assetId = row.original.id
  return (
    <SkeletonText noOfLines={2} isLoaded={!!value}>
      <AssetProvider assetId={assetId}>
        <AssetProvider.GeneralData section={'strategy'} field={field} {...props} />
      </AssetProvider>
    </SkeletonText>
  )
}

export const DepositedAssetsTable: React.FC = () => {

  const navigate = useNavigate()
  const {
    isPortfolioLoaded,
    isPortfolioAccountReady,
    selectors: {
      selectVaultsWithBalance,
      selectVaultsAssetsByType,
      selectVaultsAssetsWithBalance
    }
  } = usePortfolioProvider()
  const translate = useTranslate()
  const [ page, setPage ] = useState<number>(1)
  const { theme, isMobile } = useThemeProvider()
  const { account, prevAccount } = useWalletProvider()
  const [ mode, setMode ] = useState<'Deposited'|'Available'>('Deposited')

  const columns: StrategyColumn[] = useMemo(() => {
    return [
      {
        accessor:'name',
        sortType:'alpha',
        id:'asset',
        stackProps:{
          justifyContent:'space-between'
        },
        extraFields:['productTagWithRisk']
      },
      {
        accessor:'id',
        id:'protocols',
        sortType:'alpha',
        fieldProps: {
          size: 'xs'
        }
      },
      {
        id:'tvl',
        accessor:'tvlUsd',
        sortType: 'numeric',
      },
      {
        id:'apy',
        accessor:'apy',
        sortType: 'numeric',
      },
      {
        id:'apy7',
        accessor:'apy7',
        sortType: 'numeric',
        tables: ['Available']
      },
      {
        id:'apy30',
        accessor:'apy30',
        sortType: 'numeric',
        tables: ['Available']
      }
    ]
  }, [])

  const strategyColumnsDeposit: Column<Asset>[] = useMemo(() => {
    return columns.filter( (col: StrategyColumn) => !col.tables || col.tables.includes(mode) ).map( (column: StrategyColumn) => {
      const { id, accessor, sortType } = column
      const sortTypeFn = sortType==='alpha' ? sortAlpha : sortType==='numeric' ? sortNumeric : undefined
      return {
        id,
        accessor,
        disableSortBy: !sortTypeFn,
        defaultCanSort: !!sortTypeFn,
        Header: translate(column.title || `defi.${id}`),
        sortType: sortTypeFn ? (a: any, b: any) => sortTypeFn(a, b, accessor) : undefined,
        Cell: ({ value, row }: { value: any; row: RowProps }) => {
          return column.extraFields && column.extraFields.length>0 ? (
            <Stack
              spacing={2}
              width={'full'}
              direction={'row'}
              alignItems={'center'}
              {...column.stackProps}
            >
              <TableField field={id} value={value} row={row} props={column.fieldProps} />
              {
                column.extraFields.map( (extraField: string) => (
                  <TableField key={`extraField_${extraField}`} field={extraField} value={value} row={row} />
                ))
              }
            </Stack>
          ) : (
            <TableField field={id} value={value} row={row} props={column.fieldProps} />
          )
        }
      }
    })
  }, [columns, mode, translate])

  const featuredAssetsColumns: Column<Asset>[] = useMemo(() => [
    {
      Header: '#',
      accessor: 'id',
      display: 'none'
    },
    ...strategyColumnsDeposit,
  ], [strategyColumnsDeposit])

  const depositedAssetsColumns: Column<Asset>[] = useMemo(() => [
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
            <Amount.Usd value={value} textStyle={'tableCell'} />
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
                      {
                        !value.realizedApy.isNaN() && (
                          <StatArrow type={'increase'} />
                        )
                      }
                      <Amount.Percentage value={value.realizedApy} textStyle={'tableCell'} />
                    </Flex>
                  </StatNumber>
                  <Amount.Usd prefix={'+'} value={value.usd.earnings} textStyle={'captionSmall'} />
                </Stat>
              )
            }
          </SkeletonText>
        )
      },
      sortType: (a: any, b: any): number => sortNumeric(a, b, 'vaultPosition.earningsPercentage')
    },
  ], [translate, strategyColumnsDeposit])

  const allStrategies = useMemo(() => {
    return products.reduce( (allStrategies: (keyof typeof strategies)[], product: ProductProps) => {
      return [...allStrategies, ...product.strategies]
    }, [])
  }, [])

  const featuredAssetsData = useMemo(() => {
    if (!selectVaultsAssetsByType) return []
    const allVaultsAssets = allStrategies.reduce( (allVaults: Asset[], strategy: string) => {
      return [
        ...allVaults,
        ...selectVaultsAssetsByType(strategy)
      ]
    }, [])
    return allVaultsAssets
            .filter( (asset: Asset) => asset.status !== 'deprecated' )
            .sort( (a1: Asset, a2: Asset) => BNify(a1.tvlUsd).lt(BNify(a2.tvlUsd)) ? 1 : -1 )
            .slice(0, 15)
            .sort( (a1: Asset, a2: Asset) => BNify(a1.apy).lt(BNify(a2.apy)) ? 1 : -1 )
            .slice(0, 10)
  }, [selectVaultsAssetsByType, allStrategies])

  const depositedAssetsData = useMemo(() => {
    if (!selectVaultsWithBalance || !isPortfolioLoaded) return []
    return allStrategies.reduce( (vaultsAssetsWithBalance: Asset[], strategy) => {
      const strategyVaultsAssetsWithBalance = selectVaultsAssetsWithBalance(strategy)
      if (strategyVaultsAssetsWithBalance){
        return [...vaultsAssetsWithBalance, ...strategyVaultsAssetsWithBalance]
      }
      return vaultsAssetsWithBalance
    }, [])
  }, [isPortfolioLoaded, selectVaultsWithBalance, selectVaultsAssetsWithBalance, allStrategies])

  // Disabled Deposited
  useEffect(() => {
    if (!account && mode === 'Deposited')
      return setMode('Available')
    else if (!prevAccount && account && mode === 'Available')
      return setMode('Deposited')
    else if (mode === 'Deposited' && isPortfolioAccountReady && !depositedAssetsData.length)
      return setMode('Available')
  }, [mode, account, prevAccount, isPortfolioAccountReady, depositedAssetsData])

  const onRowClick = useCallback((row: RowProps, item_list_id: string, item_list_name: string) => {
    sendSelectItem(item_list_id, item_list_name, row.original)
    const strategyRoute = strategies[row.original.type as string].route
    return navigate(`/earn/${strategyRoute}/${row.original.id}`)
  }, [navigate])

  const rowsPerPage = useMemo(() => 5, [])
  const totalPages = useMemo(() => {
    return mode === 'Deposited' ? Math.ceil(depositedAssetsData.length/rowsPerPage) : Math.ceil(featuredAssetsData.length/rowsPerPage)
  }, [mode, featuredAssetsData, depositedAssetsData, rowsPerPage])

  const goBack = useCallback(() => {
    if (!page) return false
    setPage( (prevPage: number) => {
      return Math.max(1, prevPage-1)
    })
    return true
  }, [setPage, page])

  const goNext = useCallback(() => {
    if (page===totalPages) return false
    setPage( (prevPage: number) => {
      return Math.min(totalPages, prevPage+1)
    })
  }, [setPage, page, totalPages])

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
      <VStack
        spacing={6}
        width={'full'}
      >
        <Card>
          <HStack
            width={'full'}
            alignItems={'flex-start'}
            justifyContent={'space-between'}
          >
            {/*<SearchBar placeholder={'defi.searchToken'} handleSearchChange={setDepositedAssetsFilter} />*/}
          </HStack>
          <ReactTable columns={depositedAssetsColumns} data={depositedAssetsData} initialState={initialState} rowsPerPage={rowsPerPage} page={page} onRowClick={ (row) => onRowClick(row, 'dashboard_deposited', 'Dashboard deposited') } />
        </Card>
        {
          totalPages>1 && (
            <Pagination
              activePage={page}
              pages={totalPages}
              justifyContent={'center'}
              onPrevArrowClick={() => { if (page) goBack() }}
              onNextArrowClick={() => { if (page<totalPages) goNext()}}
              prevArrowColor={page === 1 ? theme.colors.ctaDisabled : theme.colors.primary}
              nextArrowColor={page === totalPages ? theme.colors.ctaDisabled : theme.colors.primary}
            />
          )
        }
      </VStack>
    )
  }, [isMobile, depositedAssetsColumns, depositedAssetsData, page, totalPages, theme, rowsPerPage, onRowClick, goBack, goNext])

  const featuredAssets = useMemo(() => {
    if (!featuredAssetsData.length) return null

    const initialState = {
      sortBy: [
        {
          id: 'apy',
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
        <VStack
          spacing={2}
          width={'100%'}
          alignItems={'flex-start'}
        >
          {
            featuredAssetsData.map( (asset: Asset) => asset.id && <VaultCard key={`vault_${asset.id}`} assetId={asset.id} />)
          }
        </VStack>
      </VStack>
    ) : (
      <VStack
        spacing={6}
        width={'full'}
      >
        <Card>
          <HStack
            width={'full'}
            alignItems={'flex-start'}
            justifyContent={'space-between'}
          >
            {/*<SearchBar placeholder={'defi.searchToken'} handleSearchChange={setDepositedAssetsFilter} />*/}
          </HStack>
          <ReactTable columns={featuredAssetsColumns} data={featuredAssetsData} initialState={initialState} rowsPerPage={rowsPerPage} page={page} onRowClick={ (row) => onRowClick(row, 'dashboard_deposited', 'Dashboard deposited') } />
        </Card>
        {
          totalPages>1 && (
            <Pagination
              activePage={page}
              pages={totalPages}
              justifyContent={'center'}
              onPrevArrowClick={() => { if (page) goBack() }}
              onNextArrowClick={() => { if (page<totalPages) goNext()}}
              prevArrowColor={page === 1 ? theme.colors.ctaDisabled : theme.colors.primary}
              nextArrowColor={page === totalPages ? theme.colors.ctaDisabled : theme.colors.primary}
            />
          )
        }
      </VStack>
    )
  }, [isMobile, featuredAssetsColumns, featuredAssetsData, page, totalPages, theme, rowsPerPage, onRowClick, goBack, goNext])

  if (!isPortfolioLoaded) return null

  return (
    <VStack
      mt={[10, 20]}
      spacing={6}
      width={'full'}
      alignItems={'flex-start'}
    >
      <HStack
        spacing={3}
      >
        <Translation<ButtonProps> disabled={!account || !depositedAssetsData.length} component={Button} leftIcon={<MdOutlineAccountBalanceWallet size={24} />} translation={`common.wallet`} variant={'filter'} aria-selected={mode==='Deposited'} fontSize={'sm'} borderRadius={'80px'} px={4} onClick={() => setMode('Deposited') } />
        <Translation<ButtonProps> component={Button} leftIcon={<MdStarBorder size={24} />} translation={`common.featured`} variant={'filter'} aria-selected={mode==='Available'} fontSize={'sm'} borderRadius={'80px'} px={4} onClick={() => setMode('Available') } />
      </HStack>
      {mode === 'Deposited' ? depositedAssets : featuredAssets}
    </VStack>
  )
}