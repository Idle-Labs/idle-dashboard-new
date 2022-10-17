import { strategies } from 'constants/'
import { Column, Row } from 'react-table'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import type { BigNumber } from 'bignumber.js'
import { BNify, getObjectPath } from 'helpers/'
import { Amount } from 'components/Amount/Amount'
import { AssetCell } from 'components/AssetCell/AssetCell'
import type { Asset, VaultPosition } from 'constants/types'
import React, { useState, useEffect, useMemo } from 'react'
import { ReactTable, } from 'components/ReactTable/ReactTable'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { ContainerProps, Flex, Heading, Image, Stack, Skeleton, SkeletonText, Stat, StatNumber, StatArrow } from '@chakra-ui/react'

const sortNumeric = (a: any, b: any, field: any, c: any): number => {
  const n1 = BNify(getObjectPath(a.original, field)).isNaN() ? BNify(-1) : BNify(getObjectPath(a.original, field))
  const n2 = BNify(getObjectPath(b.original, field)).isNaN() ? BNify(-1) : BNify(getObjectPath(b.original, field))

  return n1.gt(n2) ? -1 : 1
}

const sortAlpha = (a: any, b: any, field: any): number => {
  return getObjectPath(a.original, field).localeCompare(getObjectPath(b.original, field))
}

export const Strategy: React.FC<ContainerProps> = ({ children, ...rest }) => {

  const translate = useTranslate()
  const { params } = useBrowserRouter()
  const { isPortfolioLoaded, selectors: {
    getVaultsByType,
    getVaultsWithBalance,
    getVaultsAssetsByType,
    getVaultsAssetsWithBalance
  } } = usePortfolioProvider()
  const [ depositedAssetsData, setDepositedAssetsData ] = useState([])
  const [ availableAssetsData, setAvailableAssetsData ] = useState([])

  const strategy = useMemo(() => (
    Object.values(strategies).find( strategy => strategy.route === params.strategy )
  ), [params])

  const depositedAssetsColumns: Column[] = useMemo(() => ([
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
      display: strategy?.showProtocol ? 'table-cell' : 'none',
      Cell: ({ value }: { value: string }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetCell assetId={value}>
              <Flex
                width={'100%'}
                alignItems={'center'}
              >
                <AssetCell.ProtocolIcon size={'sm'} mr={2} />
                <AssetCell.ProtocolName textStyle={'tableCell'} />
              </Flex>
            </AssetCell>
          </SkeletonText>
        )
      },
    },
    {
      id:'name',
      accessor:'id',
      Header:translate('defi.asset'),
      Cell: ({ value }: { value: string }) => {
        return (
          <AssetCell assetId={value}>
            <Flex
              width={'100%'}
              alignItems={'center'}
            >
              <AssetCell.Icon size={'sm'} mr={2} />
              <AssetCell.Name textStyle={'tableCell'} />
            </Flex>
          </AssetCell>
        )
      },
      sortType: sortAlpha
    },
    {
      id:'tvlUsd',
      accessor:'tvlUsd',
      Header:translate('defi.pool'),
      Cell: ({ value, row }: { value: BigNumber; row: Row }) => {
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
      Cell: ({ value, row }: { value: BigNumber; row: Row }) => {
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
      Cell: ({ value, row }: { value: string; row: Row }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetCell assetId={value}>
              <AssetCell.Rewards size={'sm'} />
            </AssetCell>
          </SkeletonText>
        )
      }
    },
    {
      // id:'deposited',
      accessor:'balanceUsd',
      Header:translate('defi.balance'),
      Cell: ({ value, row }: { value: BigNumber; row: Row }) => {
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
      Cell: ({ value, row }: { value: VaultPosition; row: Row }) => {
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
                      <Amount.Percentage value={value.earningsPercentage.times(100)} textStyle={'tableCell'} />
                    </Flex>
                  </StatNumber>
                  <Amount prefix={'$ '} value={value.earningsAmount} textStyle={'earnings'} />
                </Stat>
              )
            }
          </SkeletonText>
        )
      },
      sortType: (a: any, b: any, field: any, c: any): number => sortNumeric(a, b, 'vaultPosition.earningsPercentage', c)
    },
  ]), [translate, strategy])

  const availableAssetsColumns: Column[] = useMemo(() => ([
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
      display: strategy?.showProtocol ? 'table-cell' : 'none',
      Cell: ({ value }: { value: string }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetCell assetId={value}>
              <Flex
                width={'100%'}
                alignItems={'center'}
              >
                <AssetCell.ProtocolIcon size={'sm'} mr={2} />
                <AssetCell.ProtocolName textStyle={'tableCell'} />
              </Flex>
            </AssetCell>
          </SkeletonText>
        )
      },
    },
    {
      id:'name',
      accessor:'id',
      Header: translate('defi.asset'),
      Cell: ({ value }: { value: string }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetCell assetId={value}>
              <Flex
                width={'100%'}
                alignItems={'center'}
              >
                <AssetCell.Icon size={'sm'} mr={2} />
                <AssetCell.Name textStyle={'tableCell'} />
              </Flex>
            </AssetCell>
          </SkeletonText>
        )
      },
      sortType: sortAlpha
    },
    {
      id:'tvlUsd',
      accessor:'tvlUsd',
      Header: translate('defi.pool'),
      Cell: ({ value, row }: { value: BigNumber; row: Row }) => {
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
      Cell: ({ value, row }: { value: BigNumber; row: Row }) => {
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
      Cell: ({ value, row }: { value: string; row: Row }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetCell assetId={value}>
              <AssetCell.Rewards size={'sm'} />
            </AssetCell>
          </SkeletonText>
        )
      }
    },
    {
      accessor:'id',
      id:'aprLastWeek',
      canSort: false, // does nothing
      disableSortBy: true, // disables sorting
      defaultCanSort: false, // I think it disabled it? Not sure
      Header:translate('defi.aprLastWeek'),
    },
  ]), [translate, strategy])

  useEffect(() => {
    if (!getVaultsByType || !isPortfolioLoaded) return;
    // const vaults = getVaultsByType(params.strategy)
    // console.log('vaults', vaults)

    const vaultsAssets = getVaultsAssetsByType(params.strategy)
    // console.log('vaultsAssets', vaultsAssets)

    const availableAssetsData = vaultsAssets.filter( (vaultAsset: Asset) => !depositedAssetsData.map( (asset: Asset) => asset.id ).includes(vaultAsset.id) )

    setAvailableAssetsData(availableAssetsData)

  }, [isPortfolioLoaded, getVaultsByType, getVaultsAssetsByType, depositedAssetsData, params])

  useEffect(() => {
    if (!getVaultsWithBalance || !isPortfolioLoaded) return;

    const vaultsAssetsWithBalance = getVaultsAssetsWithBalance(params.strategy)

    setDepositedAssetsData(vaultsAssetsWithBalance)

  }, [isPortfolioLoaded, getVaultsWithBalance, getVaultsAssetsWithBalance, params])

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
        <ReactTable columns={depositedAssetsColumns} data={depositedAssetsData} initialState={initialState} onRowClick={() => {}} />
      </Card>
    )
  }, [depositedAssetsColumns, depositedAssetsData])

  const availableAssets = useMemo(() => {
    if (!availableAssetsData.length) return null

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
            <Stack>
              <Skeleton />
              <Skeleton />
              <Skeleton />
              <Skeleton />
            </Stack>
          ) : (
            <ReactTable columns={availableAssetsColumns} data={availableAssetsData} initialState={initialState} onRowClick={() => {}} />
          )
        }
      </Card>
    )
  }, [availableAssetsColumns, availableAssetsData])

  return (
    <Flex
      mt={14}
      width={'100%'}
      direction={'column'}
      alignItems={'center'}
    >
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
          <Translation translation={strategy?.label} component={Heading} as={'h2'} size={'3xl'} />
          <Translation mt={10} translation={strategy?.description} />
        </Flex>
        <Image width={'35%'} src={strategy?.image} />
      </Flex>
      {depositedAssets}
      {availableAssets}
    </Flex>
  )
}
