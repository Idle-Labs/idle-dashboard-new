import { Column, Row } from 'react-table'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import type { BigNumber } from 'bignumber.js'
import { useNavigate } from 'react-router-dom'
import { Amount } from 'components/Amount/Amount'
import { IoPricetagsOutline } from 'react-icons/io5'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { VaultCard } from 'components/VaultCard/VaultCard'
import { useWalletProvider } from 'contexts/WalletProvider'
import { products, ProductProps } from 'constants/products'
import type { Asset, VaultPosition } from 'constants/types'
import { usePrevious } from 'hooks/usePrevious/usePrevious'
import { Pagination } from 'components/Pagination/Pagination'
import { TableField } from 'components/TableField/TableField'
import { ReactTable } from 'components/ReactTable/ReactTable'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { strategies, StrategyColumn, Tables } from 'constants/strategies'
import { MdStarBorder, MdOutlineAccountBalanceWallet } from 'react-icons/md'
import { sortNumeric, sortAlpha, sendSelectItem, bnOrZero, BNify, isEmpty, getRoutePath } from 'helpers/'
import { Flex, HStack, VStack, Button, ButtonProps, Stack, SkeletonText, Stat, StatNumber, StatArrow, Image } from '@chakra-ui/react'

type RowProps = Row<Asset>
type ColumnProps = Column<Asset> & {cellSx?: any}

export const DepositedAssetsTable: React.FC = () => {

  const navigate = useNavigate()
  const {
    // stakingData,
    isPortfolioLoaded,
    isPortfolioAccountReady,
    selectors: {
      selectVaultPosition,
      selectVaultsWithBalance,
      selectVaultsAssetsByType,
      selectVaultsAssetsWithBalance
    }
  } = usePortfolioProvider()
  const translate = useTranslate()
  const [ page, setPage ] = useState<number>(1)
  const { theme, isMobile } = useThemeProvider()
  const { account, prevAccount } = useWalletProvider()
  const [ mode, setMode ] = useState<Tables>('Available')
  const prevMode = usePrevious<Tables>(mode)

  useEffect(() => {
    if (mode !== prevMode){
      return setPage(1)
    }
  }, [mode, prevMode, setPage])

  const columns: StrategyColumn[] = useMemo(() => {
    return [
      {
        width: '25%',
        accessor:'name',
        sortType:'alpha',
        id:'assetWithStatus',
        stackProps:{
          justifyContent:'space-between'
        },
        extraFields:['productTagWithRisk']
      },
      {
        width: '18%',
        accessor:'id',
        id:'protocols',
        sortType:'alpha',
        fieldProps: {
          size: 'xs'
        }
      },
      {
        id:'tvl',
        width: '13%',
        accessor:'tvlUsd',
        sortType: 'numeric'
      },
      {
        id:'apy',
        width: '13%',
        accessor:'apy',
        sortType: 'numeric'
      },
      {
        id:'apy7',
        width: '13%',
        accessor:'apy7',
        sortType: 'numeric',
        tables: ['Available']
      },
      {
        id:'apy30',
        width: '13%',
        accessor:'apy30',
        sortType: 'numeric',
        tables: ['Available']
      },
      {
        width:'5%',
        accessor:'id',
        id:'chainId',
        cellSx: {p:'0!important',alignItems:'center'},
        stackProps:{
          justifyContent:'center'
        },
        tables: ['Available']
      }
    ]
  }, [])

  const allColumnsById: Record<string, ColumnProps> = useMemo(() => {
    return columns.reduce( (allColumns: Record<string, ColumnProps>, column: StrategyColumn) => {
      const { id, accessor, sortType } = column
      const sortTypeFn = sortType==='alpha' ? sortAlpha : sortType==='numeric' ? sortNumeric : undefined
      allColumns[id] = {
        id,
        accessor,
        width: column.width,
        cellSx: column.cellSx,
        disableSortBy: !sortTypeFn,
        defaultCanSort: !!sortTypeFn,
        Header: translate(column.title || `defi.${id}`),
        sortType: sortTypeFn ? (a: any, b: any) => sortTypeFn(a, b, accessor) : undefined,
        Cell: ({ value, row }: { value: any; row: RowProps }) => {
          return (
            <Stack
              spacing={2}
              width={'full'}
              direction={'row'}
              alignItems={'center'}
              {...column.stackProps}
            >
              <TableField field={id} assetId={row.original.id} value={value} props={column.fieldProps} />
              {
                column.extraFields?.map( (extraField: string) => (
                  <TableField key={`extraField_${extraField}`} assetId={row.original.id} field={extraField} value={value} />
                ))
              }
            </Stack>
          )
        }
      }
      return allColumns
    }, {})
  }, [columns, translate])

  const strategyColumnsDeposit: ColumnProps[] = useMemo(() => {
    return columns.filter( (col: StrategyColumn) => !col.tables || col.tables.includes(mode) ).map( (column: StrategyColumn) => {
      const { id, accessor, sortType } = column
      const sortTypeFn = sortType==='alpha' ? sortAlpha : sortType==='numeric' ? sortNumeric : undefined
      return {
        id,
        accessor,
        width: column.width,
        cellSx: column.cellSx,
        disableSortBy: !sortTypeFn,
        defaultCanSort: !!sortTypeFn,
        Header: translate(column.title || `defi.${id}`),
        sortType: sortTypeFn ? (a: any, b: any) => sortTypeFn(a, b, accessor) : undefined,
        Cell: ({ value, row }: { value: any; row: RowProps }) => {
          return (
            <Stack
              spacing={2}
              width={'full'}
              direction={'row'}
              alignItems={'center'}
              {...column.stackProps}
            >
              <TableField field={id} value={value} assetId={row.original.id} props={column.fieldProps} />
              {
                column.extraFields?.map( (extraField: string) => (
                  <TableField key={`extraField_${extraField}`} field={extraField} value={value} assetId={row.original.id} />
                ))
              }
            </Stack>
          )
        }
      }
    })
  }, [columns, mode, translate])

  const featuredAssetsColumns: ColumnProps[] = useMemo(() => [
    {
      Header: '#',
      accessor: 'id',
      display: 'none'
    },
    ...strategyColumnsDeposit
  ], [strategyColumnsDeposit])

  const depositedAssetsColumns: ColumnProps[] = useMemo(() => [
    {
      Header: '#',
      accessor: 'id',
      display: 'none'
    },
    ...strategyColumnsDeposit,
    {
      width: '13%',
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
      width: '13%',
      accessor:'vaultPosition',
      Header:translate('defi.realizedApy'),
      Cell: ({ value, row }: { value: VaultPosition | undefined; row: RowProps }) => {
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
                      <TableField field={'realizedApy'} value={value} assetId={row.original.id} />
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
    allColumnsById['chainId']
  ], [translate, strategyColumnsDeposit, allColumnsById])

  const discountedAssetsColumns: ColumnProps[] = useMemo(() => [
    {
      Header: '#',
      accessor: 'id',
      display: 'none'
    },
    ...strategyColumnsDeposit,
    {
      width: '13%',
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
      width: '13%',
      accessor:'vaultPosition',
      Header:translate('defi.discountedFees'),
      Cell: ({ value }: { value: VaultPosition | undefined }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            {value && <Amount.Usd value={value.usd.discountedFees} textStyle={'tableCell'} />}
          </SkeletonText>
        )
      },
      sortType: sortNumeric
    },
    allColumnsById['chainId']
  ], [allColumnsById, strategyColumnsDeposit, translate])

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

  const discountedAssetsData = useMemo(() => {
    if (!isPortfolioLoaded/* || bnOrZero(stakingData?.position.deposited).lte(0)*/) return []
    return depositedAssetsData.filter( (asset: Asset) => {
      const vaultPosition = selectVaultPosition(asset.id)
      return !!asset.flags?.feeDiscountEnabled && vaultPosition && bnOrZero(vaultPosition.usd.discountedFees).gt(0)
    })
  }, [depositedAssetsData, isPortfolioLoaded, selectVaultPosition])

  // Set deposited if connected
  useEffect(() => {
    if (account && mode === 'Available')
      return setMode('Deposited')
  // eslint-disable-next-line
  }, [])

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
    switch (mode){
      case 'Deposited':
        return Math.ceil(depositedAssetsData.length/rowsPerPage)
      case 'Discount':
        return Math.ceil(discountedAssetsData.length/rowsPerPage)
      default:
      case 'Available':
        return Math.ceil(featuredAssetsData.length/rowsPerPage)
    }
  }, [mode, featuredAssetsData, depositedAssetsData, discountedAssetsData, rowsPerPage])

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

  const discountedAssets = useMemo(() => {

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
        </VStack>
      </VStack>
    ) : (
      <VStack
        spacing={6}
        width={'full'}
      >
        <Card>
          {
            isEmpty(discountedAssetsData) ? (
              <VStack
                py={10}
                spacing={6}
                width={'full'}
                alignItems={'center'}
                justifyContent={'center'}
              >
                <VStack
                  spacing={2}
                  width={'full'}
                  alignItems={'center'}
                  justifyContent={'center'}
                >
                  <Image src={'images/vaults/discount.png'} width={8} />
                  <Translation textAlign={'center'} translation={'feeDiscount.table.empty'} color={'cta'} isHtml />
                </VStack>
                <Translation<ButtonProps> component={Button} translation={`common.stake`} variant={'ctaPrimary'} px={10} onClick={() => navigate(getRoutePath('stake'))} />
              </VStack>
            ) : (
              <ReactTable columns={discountedAssetsColumns} data={discountedAssetsData} initialState={initialState} rowsPerPage={rowsPerPage} page={page} onRowClick={ (row) => onRowClick(row, 'dashboard_discounted', 'Dashboard discounted') } />
            )
          }
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
  }, [isMobile, page, totalPages, theme, discountedAssetsColumns, discountedAssetsData, navigate, rowsPerPage, onRowClick, goBack, goNext])

  const selectedTable = useMemo(() => {
    switch (mode){
      case 'Deposited':
        return depositedAssets
      case 'Discount':
        return discountedAssets
      default:
      case 'Available':
        return featuredAssets
    }
  }, [mode, depositedAssets, discountedAssets, featuredAssets])

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
        <Translation<ButtonProps> component={Button} leftIcon={<MdOutlineAccountBalanceWallet size={24} />} translation={`common.wallet`} variant={'filter'} aria-selected={mode==='Deposited'} fontSize={'sm'} borderRadius={'80px'} px={4} onClick={() => setMode('Deposited') } />
        <Translation<ButtonProps> component={Button} leftIcon={<MdStarBorder size={24} />} translation={`common.featured`} variant={'filter'} aria-selected={mode==='Available'} fontSize={'sm'} borderRadius={'80px'} px={4} onClick={() => setMode('Available') } />
        <Translation<ButtonProps> component={Button} leftIcon={<IoPricetagsOutline size={24} />} translation={`common.discount`} variant={'filter'} aria-selected={mode==='Discount'} fontSize={'sm'} borderRadius={'80px'} px={4} onClick={() => setMode('Discount') } />
      </HStack>
      {selectedTable}
    </VStack>
  )
}