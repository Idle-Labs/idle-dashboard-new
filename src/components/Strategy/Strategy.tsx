import { strategies } from 'constants/'
import { Column, Row } from 'react-table'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import type { BigNumber } from 'bignumber.js'
import { useNavigate } from 'react-router-dom'
import { BNify, getObjectPath } from 'helpers/'
import { Amount } from 'components/Amount/Amount'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { ReactTable, } from 'components/ReactTable/ReactTable'
import { Asset, AssetId, VaultPosition } from 'constants/types'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ContainerProps, Flex, Heading, Image, Stack, Skeleton, SkeletonText, Stat, StatNumber, StatArrow } from '@chakra-ui/react'

const sortNumeric = (a: any, b: any, field: any, c: any): number => {
  const n1 = BNify(getObjectPath(a.original, field)).isNaN() ? BNify(-1) : BNify(getObjectPath(a.original, field))
  const n2 = BNify(getObjectPath(b.original, field)).isNaN() ? BNify(-1) : BNify(getObjectPath(b.original, field))

  return n1.gt(n2) ? -1 : 1
}

const sortAlpha = (a: any, b: any, field: any): number => {
  return getObjectPath(a.original, field).localeCompare(getObjectPath(b.original, field))
}

type RowProps = Row<Asset>

export const Strategy: React.FC<ContainerProps> = ({ children, ...rest }) => {

  const navigate = useNavigate()
  const translate = useTranslate()
  const { location, params } = useBrowserRouter()
  const { isPortfolioLoaded, selectors: {
    selectVaultsByType,
    selectVaultsWithBalance,
    selectVaultsAssetsByType,
    selectVaultsAssetsWithBalance
  } } = usePortfolioProvider()
  const [ depositedAssetsData, setDepositedAssetsData ] = useState([])
  const [ availableAssetsData, setAvailableAssetsData ] = useState([])

  const strategy = useMemo(() => (
    Object.keys(strategies).find( strategy => strategies[strategy].route === params.strategy )
  ), [params])

  const onRowClick = useCallback((row: RowProps) => {
    return navigate(`${location?.pathname}/${row.original.id}`)
  }, [navigate, location])

  const depositedAssetsColumns: Column<Asset>[] = useMemo(() => ([
    {
      Header: '#',
      accessor: 'id',
      display: 'none'
    },
    {
      id: 'protocol',
      accessor: 'id',
      title: 'Protocol',
      Header: translate('defi.protocol'),
      display: strategy && strategies[strategy].showProtocol ? 'table-cell' : 'none',
      Cell: ({ value }: { value: string | undefined }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetProvider assetId={value}>
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
      },
    },
    {
      id:'name',
      accessor:'id',
      Header:translate('defi.asset'),
      Cell: ({ value }: { value: string | undefined }) => {
        return (
          <AssetProvider assetId={value}>
            <Flex
              width={'100%'}
              alignItems={'center'}
            >
              <AssetProvider.Icon size={'sm'} mr={2} />
              <AssetProvider.Name textStyle={'tableCell'} />
            </Flex>
          </AssetProvider>
        )
      },
      sortType: sortAlpha
    },
    {
      id:'tvlUsd',
      accessor:'tvlUsd',
      Header:translate('defi.pool'),
      Cell: ({ value, row }: { value: BigNumber | undefined; row: RowProps }) => {
        return (
          <Skeleton isLoaded={!!value}>
            <Amount prefix={'$ '} value={value} textStyle={'tableCell'} />
          </Skeleton>
        )
      },
      sortType: sortNumeric
    },
    {
      // id:'apy',
      accessor:'apr',
      Header:translate('defi.apy'),
      Cell: ({ value, row }: { value: BigNumber | undefined; row: RowProps }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <Amount.Percentage value={value} textStyle={'tableCell'} />
          </SkeletonText>
        )
      },
      sortType: sortNumeric
    },
    {
      id:'rewards',
      accessor:'id',
      Header:translate('defi.rewards'),
      Cell: ({ value, row }: { value: string | undefined; row: RowProps }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetProvider assetId={value}>
              <AssetProvider.Rewards size={'sm'} />
            </AssetProvider>
          </SkeletonText>
        )
      }
    },
    {
      // id:'deposited',
      accessor:'balanceUsd',
      Header:translate('defi.balance'),
      Cell: ({ value, row }: { value: BigNumber | undefined; row: RowProps }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <Amount prefix={'$ '} value={value} textStyle={'tableCell'} />
          </SkeletonText>
        )
      },
      sortType: sortNumeric
    },
    {
      // id:'earnings',
      accessor:'vaultPosition',
      Header:translate('defi.earnings'),
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
                      <StatArrow type={value.earningsPercentage.gt(0) ? 'increase' : 'decrease'} />
                      <Amount prefix={'$ '} value={value.usd.earnings} textStyle={'tableCell'} />
                    </Flex>
                  </StatNumber>
                  <Amount.Percentage value={value.earningsPercentage.times(100)} textStyle={'captionSmall'} />
                </Stat>
              )
            }
          </SkeletonText>
        )
      },
      sortType: (a: any, b: any, field: any, c: any): number => sortNumeric(a, b, 'vaultPosition.usd.earnings', c)
    },
  ]), [translate, strategy])

  const availableAssetsColumns: Column<Asset>[] = useMemo(() => ([
    {
      Header: '#',
      accessor: 'id',
      display: 'none'
    },
    {
      id: 'protocol',
      accessor: 'id',
      title: 'Protocol',
      Header: translate('defi.protocol'),
      display: strategy && strategies[strategy].showProtocol ? 'table-cell' : 'none',
      Cell: ({ value }: { value: string | undefined }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetProvider assetId={value}>
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
      },
    },
    {
      id:'name',
      accessor:'id',
      Header: translate('defi.asset'),
      Cell: ({ value }: { value: string | undefined }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetProvider assetId={value}>
              <Flex
                width={'100%'}
                alignItems={'center'}
              >
                <AssetProvider.Icon size={'sm'} mr={2} />
                <AssetProvider.Name textStyle={'tableCell'} />
              </Flex>
            </AssetProvider>
          </SkeletonText>
        )
      },
      sortType: sortAlpha
    },
    {
      id:'tvlUsd',
      accessor:'tvlUsd',
      Header: translate('defi.pool'),
      Cell: ({ value, row }: { value: BigNumber | undefined; row: RowProps }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <Amount prefix={'$ '} value={value} textStyle={'tableCell'} />
          </SkeletonText>
        )
      },
      sortType: sortNumeric
    },
    {
      accessor:'apr',
      Header:translate('defi.apy'),
      Cell: ({ value, row }: { value: BigNumber | undefined; row: RowProps }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <Amount.Percentage value={value} textStyle={'tableCell'} />
          </SkeletonText>
        )
      },
      sortType: sortNumeric
    },
    {
      id:'rewards',
      accessor:'id',
      Header:translate('defi.rewards'),
      Cell: ({ value, row }: { value: string | undefined; row: RowProps }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetProvider assetId={value}>
              <AssetProvider.Rewards size={'sm'} />
            </AssetProvider>
          </SkeletonText>
        )
      }
    },
    {
      accessor: 'id',
      canSort: false,
      id: 'aprLastWeek',
      disableSortBy: true,
      defaultCanSort: false,
      Header: translate('defi.aprLastWeek'),
      Cell: ({ value, row }: { value: AssetId | undefined; row: RowProps }) => {
        // console.log('aprLastWeek', value)
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetProvider assetId={value}>
              <AssetProvider.HistoricalRates height={'50px'} />
            </AssetProvider>
          </SkeletonText>
        )
      }
    },
  ]), [translate, strategy])

  useEffect(() => {
    if (!selectVaultsByType || !isPortfolioLoaded) return;
    // const vaults = selectVaultsByType(params.strategy)
    // console.log('vaults', vaults)

    const vaultsAssets = selectVaultsAssetsByType(strategy)
    // console.log('vaultsAssets', vaultsAssets)

    const availableAssetsData = vaultsAssets.filter( (vaultAsset: Asset) => !depositedAssetsData.map( (asset: Asset) => asset.id ).includes(vaultAsset.id) )
    setAvailableAssetsData(availableAssetsData)

  }, [isPortfolioLoaded, selectVaultsByType, selectVaultsAssetsByType, depositedAssetsData, strategy])

  useEffect(() => {
    if (!selectVaultsWithBalance || !isPortfolioLoaded) return;

    const vaultsAssetsWithBalance = selectVaultsAssetsWithBalance(strategy)
    // console.log('vaultsAssetsWithBalance', vaultsAssetsWithBalance)
    setDepositedAssetsData(vaultsAssetsWithBalance)

  }, [isPortfolioLoaded, selectVaultsWithBalance, selectVaultsAssetsWithBalance, strategy])

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

    return (
      <Card mt={10}>
        <Card.Heading>Deposited assets</Card.Heading>
        <ReactTable columns={depositedAssetsColumns} data={depositedAssetsData} initialState={initialState} onRowClick={onRowClick} />
      </Card>
    )
  }, [depositedAssetsColumns, depositedAssetsData, onRowClick])

  const availableAssets = useMemo(() => {

    const initialState = {
      sortBy: [
        {
          id: 'tvlUsd',
          desc: false
        }
      ]
    }

    return (
      <Card mt={10}>
        <Card.Heading>Available assets</Card.Heading>
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
  }, [availableAssetsColumns, availableAssetsData, onRowClick])

  const heading = useMemo(() => {
    if (!strategy) return null
    return (
      <Flex
        direction={'row'}
        width={['100%', '100%', '100%', '80%', '55%']}
      >
        <Flex
          pr={14}
          pt={20}
          width={['100%', '65%']}
          direction={'column'}
        >
          <Translation translation={strategies[strategy].label} component={Heading} as={'h2'} size={'3xl'} />
          <Translation mt={10} translation={strategies[strategy].description} />
        </Flex>
        <Image width={'35%'} src={strategies[strategy].image} />
      </Flex>
    )
  }, [strategy])

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
