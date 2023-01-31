import { Column, Row } from 'react-table'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import type { BigNumber } from 'bignumber.js'
import { useNavigate } from 'react-router-dom'
import { Amount } from 'components/Amount/Amount'
import { MdArrowForwardIos } from 'react-icons/md'
import { useModalProvider } from 'contexts/ModalProvider'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { VaultCard } from 'components/VaultCard/VaultCard'
import { useWalletProvider } from 'contexts/WalletProvider'
import type { Asset, VaultPosition } from 'constants/types'
import { ReactTable, } from 'components/ReactTable/ReactTable'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { strategies, StrategyColumn } from 'constants/strategies'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { sortNumeric, sortAlpha, sendViewItemList, getAssetListItem, sendSelectItem } from 'helpers/'
import { Box, Link, Flex, HStack, VStack, Heading, Image, Stack, Skeleton, SkeletonText, Stat, StatNumber, StatArrow } from '@chakra-ui/react'

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
}

export const Strategy: React.FC = () => {

  const navigate = useNavigate()
  const translate = useTranslate()
  const { account } = useWalletProvider()
  const { isMobile } = useThemeProvider()
  const { location, params } = useBrowserRouter()
  const [ availableListEventSent, setAvailableListEventSent ] = useState<string | null>(null)
  const [ depositedListEventSent, setDepositedListEventSent ] = useState<string | null>(null)

  const {
    isPortfolioLoaded,
    selectors: {
      selectVaultsWithBalance,
      selectVaultsAssetsByType,
      selectVaultsAssetsWithBalance
    }
  } = usePortfolioProvider()

  const strategy = useMemo(() => (
    Object.keys(strategies).find( strategy => strategies[strategy].route === params.strategy )
  ), [params])

  const onRowClick = useCallback((row: RowProps, item_list_id: string, item_list_name: string) => {
    // console.log('row', row, item_list_id, item_list_name)
    sendSelectItem(item_list_id, item_list_name, row.original)
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
              width={'full'}
              {...column.stackProps}
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
              width={'full'}
              {...column.stackProps}
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
                  {/*<Amount.Usd value={value.usd.earnings} textStyle={'captionSmall'} />*/}
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
    if (!selectVaultsAssetsByType || !isPortfolioLoaded) return []
    const vaultsAssets = selectVaultsAssetsByType(strategy)
    return vaultsAssets.filter( (vaultAsset: Asset) => !depositedAssetsData.map( (asset: Asset) => asset.id ).includes(vaultAsset.id) )
  }, [isPortfolioLoaded, selectVaultsAssetsByType, depositedAssetsData, strategy])

  const depositedListId = useMemo(() => {
    if (!strategy) return ''
    return `${strategy}_deposited`
  }, [strategy])

  const depositedListName = useMemo(() => {
    if (!strategy) return ''
    const strategyName = translate(strategies[strategy].label)
    return `${strategyName} - ${translate('defi.deposited')}`
  }, [strategy, translate])

  const availableListId = useMemo(() => {
    if (!strategy) return ''
    return `${strategy}_available`
  }, [strategy])

  const availableListName = useMemo(() => {
    if (!strategy) return ''
    const strategyName = translate(strategies[strategy].label)
    return `${strategyName} - ${translate('common.available')}`
  }, [strategy, translate])

  // Send Deposited list
  useEffect(() => {
    if (!strategy || depositedListEventSent === strategy || !depositedAssetsData.length) return
    const items = depositedAssetsData.map( (asset: Asset) => getAssetListItem(asset, depositedListId, depositedListName))
    
    // Send gtag.js event and set state
    sendViewItemList(depositedListId, depositedListName, items)
    setDepositedListEventSent(strategy)
  }, [account, strategy, translate, depositedListId, depositedListName, depositedAssetsData, depositedListEventSent, setDepositedListEventSent])

  useEffect(() => {
    if (!strategy || availableListEventSent === strategy || !availableAssetsData.length) return

    const items = availableAssetsData.map( (asset: Asset) => getAssetListItem(asset, availableListId, availableListName))

    // Send gtag.js event and set state
    sendViewItemList(availableListId, availableListName, items)
    setAvailableListEventSent(strategy)
  }, [account, translate, availableListId, availableListName, availableListEventSent, setAvailableListEventSent, strategy, availableAssetsData])

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
        <Translation translation={'defi.depositedAssets'} component={Heading} as={'h3'} fontSize={'lg'} />
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
        <ReactTable columns={depositedAssetsColumns} data={depositedAssetsData} initialState={initialState} onRowClick={ (row) => onRowClick(row, depositedListId, depositedListName) } />
      </Card>
    )
  }, [isMobile, depositedAssetsColumns, depositedListId, depositedListName, depositedAssetsData, onRowClick])

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
            <ReactTable columns={availableAssetsColumns} data={availableAssetsData} initialState={initialState} onRowClick={ (row) => onRowClick(row, availableListId, availableListName) } />
          )
        }
      </Card>
    )
  }, [isMobile, isPortfolioLoaded, availableAssetsColumns, availableListId, availableListName, availableAssetsData, onRowClick])

  const banner = useMemo(() => {
    if (!strategy || !strategies[strategy].banner) return null

    const modalProps = strategies[strategy].banner?.modal
    return (
      <Card.Dark
        p={[4, 5]}
        border={0}
        position={'relative'}
      >
        <Stack
          width={'full'}
          spacing={[2, 3]}
          alignItems={'center'}
          justifyContent={'center'}
          direction={['column', 'row']}
        >
          <Translation component={Box} width={'auto'} textAlign={'center'} translation={'common.new'} layerStyle={'gradientBadge'} />
          <Translation textAlign={'center'} translation={strategies[strategy].banner?.text} isHtml={true} textStyle={'caption'} />
          {
            strategy === 'BY' && (
              <HStack
                spacing={2}
              >
                <Image src={`images/strategies/AA.svg`} width={6} />
                <Image src={`images/strategies/BB.svg`} width={6} />
              </HStack>
            )
          }
          {
            strategies[strategy].banner?.cta && (
              <HStack
                spacing={2}
                right={[0, 6]}
                alignItems={'center'}
                justifyContent={'center'}
                position={['relative','absolute']}
              >
                <Translation translation={strategies[strategy].banner?.cta} component={Link} textAlign={'center'} textStyle={'cta'} onClick={() => openModal(modalProps as ModalProps)} />
                <MdArrowForwardIos />
              </HStack>
            )
          }
        </Stack>
      </Card.Dark>
    )
  }, [strategy, openModal])

  const heading = useMemo(() => {
    if (!strategy) return null
    return (
      <VStack
        width={'full'}
        spacing={10}
      >
        {banner}
        <Stack
          spacing={[10, 0]}
          direction={['column', 'row']}
          alignItems={['center', 'flex-start']}
          width={['100%', '100%', '100%', '100%', '70%']}
        >
          <VStack
            pr={[0, 14]}
            pt={[0, 20]}
            spacing={10}
            direction={'column'}
            width={['100%', '65%']}
            alignItems={['center', 'flex-start']}
          >
            <Translation isHtml={true} translation={strategies[strategy].title || strategies[strategy].label} component={Heading} as={'h2'} size={'3xl'} />
            {
              !isMobile && (
                <Flex
                  width={['100%', '80%']}
                >
                  <Translation translation={strategies[strategy].description} textAlign={['center', 'left']} />
                </Flex>
              )
            }
          </VStack>
          <Image width={['70%', '33%']} src={strategies[strategy].image} />
          {
            isMobile && (
              <Translation translation={strategies[strategy].description} textAlign={['center', 'left']} />
            )
          }
        </Stack>
      </VStack>
    )
  }, [strategy, banner, isMobile])

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
