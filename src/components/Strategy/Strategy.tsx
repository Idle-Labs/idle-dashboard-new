import { BNify } from 'helpers/'
import { Column, Row } from 'react-table'
import { Card } from 'components/Card/Card'
import type { Asset } from 'constants/types'
import { useTranslate } from 'react-polyglot'
import type { BigNumber } from 'bignumber.js'
import { Amount } from 'components/Amount/Amount'
import { AssetCell } from 'components/AssetCell/AssetCell'
import React, { useState, useEffect, useMemo } from 'react'
import { ReactTable, } from 'components/ReactTable/ReactTable'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { ContainerProps, Flex } from '@chakra-ui/react'

const sortNumeric = (a: any, b: any, field: any): number => {
  return BNify(a.original[field]).gt(BNify(b.original[field])) ? -1 : 1
}

const sortAlpha = (a: any, b: any, field: any): number => {
  return a.original[field].localeCompare(b.original[field])
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

  const depositedAssetsColumns: Column[] = useMemo(() => ([
    {
      Header: '#',
      accessor: 'id',
      display: 'none'
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
      // id:'pool',
      accessor:'tvlUsd',
      Header:translate('defi.pool'),
      Cell: ({ value, row }: { value: BigNumber; row: Row }) => {
        return (
          <Amount prefix={'$ '} value={value} textStyle={'tableCell'} />
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
          <Amount.Percentage value={value} textStyle={'tableCell'} />
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
          <AssetCell assetId={value}>
            <AssetCell.Rewards size={'sm'} />
          </AssetCell>
        )
      }
    },
    {
      // id:'deposited',
      accessor:'balanceUsd',
      Header:translate('defi.balance'),
      Cell: ({ value, row }: { value: BigNumber; row: Row }) => {
        return (
          <Amount prefix={'$ '} value={value} textStyle={'tableCell'} />
        )
      },
      sortType: sortNumeric
    },
    {
      // id:'earnings',
      accessor:'earnings',
      Header:translate('defi.earnings'),
      Cell: ({ value, row }: { value: BigNumber; row: Row }) => {
        return (
          <Amount value={0} textStyle={'tableCell'} />
        )
      },
      sortType: sortNumeric
    },
  ]), [translate])

  const availableAssetsColumns: Column[] = useMemo(() => ([
    {
      Header: '#',
      accessor: 'id',
      display: 'none'
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
      accessor:'tvlUsd',
      Header:translate('defi.pool'),
      Cell: ({ value, row }: { value: BigNumber; row: Row }) => {
        return (
          <Amount prefix={'$ '} value={value} textStyle={'tableCell'} />
        )
      },
      sortType: sortNumeric
    },
    {
      accessor:'apr',
      Header:translate('defi.apy'),
      Cell: ({ value, row }: { value: BigNumber; row: Row }) => {
        return (
          <Amount.Percentage value={value} textStyle={'tableCell'} />
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
          <AssetCell assetId={value}>
            <AssetCell.Rewards size={'sm'} />
          </AssetCell>
        )
      }
    },
    {
      accessor:'id',
      id:'aprLastWeek',
      Header:translate('defi.aprLastWeek'),
    },
  ]), [translate])

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
    // const vaultsWithBalance = getVaultsWithBalance(params.strategy)
    // console.log('vaultsWithBalance', vaultsWithBalance)

    const vaultsAssetsWithBalance = getVaultsAssetsWithBalance(params.strategy)
    // console.log('vaultsAssetsWithBalance', vaultsAssetsWithBalance)

    setDepositedAssetsData(vaultsAssetsWithBalance)

  }, [isPortfolioLoaded, getVaultsWithBalance, getVaultsAssetsWithBalance, params])

  const depositedAssets = useMemo(() => {
    if (!depositedAssetsData.length) return null
    return (
      <Card mt={10}>
        <Card.Heading>Deposited assets</Card.Heading>
        <ReactTable columns={depositedAssetsColumns} data={depositedAssetsData} onRowClick={() => {}} />
      </Card>
    )
  }, [depositedAssetsColumns, depositedAssetsData])

  const availableAssets = useMemo(() => {
    if (!availableAssetsData.length) return null
    return (
      <Card mt={10}>
        <Card.Heading>Available assets</Card.Heading>
        <ReactTable columns={availableAssetsColumns} data={availableAssetsData} onRowClick={() => {}} />
      </Card>
    )
  }, [availableAssetsColumns, availableAssetsData])

  return (
    <>
      {depositedAssets}
      {availableAssets}
    </>
  )
}
