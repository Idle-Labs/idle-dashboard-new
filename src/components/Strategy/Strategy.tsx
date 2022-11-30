import { strategies } from 'constants/'
import { Column, Row } from 'react-table'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import type { BigNumber } from 'bignumber.js'
import { useNavigate } from 'react-router-dom'
import { BNify, getObjectPath } from 'helpers/'
import { Amount } from 'components/Amount/Amount'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { ReactTable, } from 'components/ReactTable/ReactTable'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Asset, AssetId, VaultPosition } from 'constants/types'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ContainerProps, Flex, VStack, Heading, Image, SimpleGrid, Stack, Skeleton, SkeletonText, Stat, StatNumber, StatArrow } from '@chakra-ui/react'

const sortNumeric = (a: any, b: any, field: any, c: any): number => {
  const n1 = BNify(getObjectPath(a.original, field)).isNaN() ? BNify(-1) : BNify(getObjectPath(a.original, field))
  const n2 = BNify(getObjectPath(b.original, field)).isNaN() ? BNify(-1) : BNify(getObjectPath(b.original, field))

  return n1.gt(n2) ? -1 : 1
}

const sortAlpha = (a: any, b: any, field: any): number => {
  return getObjectPath(a.original, field).localeCompare(getObjectPath(b.original, field))
}

type RowProps = Row<Asset>

type VaultCardProps = {
  assetId: AssetId
}

const VaultCard: React.FC<VaultCardProps> = ({ assetId }) => {
  const navigate = useNavigate()
  const { location } = useBrowserRouter()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    if (!selectAssetById) return
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const depositedOrRewards = useMemo(() => {
    return asset?.vaultPosition?.usd.deposited ? (
      <VStack
        spacing={1}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.deposited'} textStyle={'captionSmall'} />
        <AssetProvider.DepositedUsd textStyle={'tableCell'} />
      </VStack>
    ) : (
      <VStack
        spacing={1}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.rewards'} textStyle={'captionSmall'} />
        <AssetProvider.Rewards iconMargin={-3} size={'sm'} />
      </VStack>
    )
  }, [asset])

  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <Card
        p={4}
        onClick={() => navigate(`${location?.pathname}/${assetId}`)}
      >
        <VStack
          spacing={3}
          alignItems={'flex-start'}
        >
          <AssetLabel assetId={assetId} />
          <SimpleGrid
            pt={3}
            pl={4}
            columns={3}
            width={'100%'}
            borderTop={'1px solid'}
            borderTopColor={'divider'}
          >
            <VStack
              spacing={1}
              alignItems={'flex-start'}
            >
              <Translation translation={'defi.pool'} textStyle={'captionSmall'} />
              <AssetProvider.PoolUsd textStyle={'tableCell'} />
            </VStack>

            <VStack
              spacing={1}
              alignItems={'flex-start'}
            >
              <Translation translation={'defi.apy'} textStyle={'captionSmall'} />
              <AssetProvider.Apy textStyle={'tableCell'} />
            </VStack>

            {depositedOrRewards}
          </SimpleGrid>
        </VStack>
      </Card>
    </AssetProvider>
  )
}

export const Strategy: React.FC<ContainerProps> = ({ children, ...rest }) => {

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
  // const [ depositedAssetsData, setDepositedAssetsData ] = useState([])
  // const [ availableAssetsData, setAvailableAssetsData ] = useState([])

  const isMobile = useMemo(() => screenSize==='sm', [screenSize])

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
                      {/*<Amount prefix={'$ '} value={value.usd.earnings} textStyle={'tableCell'} />*/}
                      <Amount.Percentage value={value.earningsPercentage.times(100)} textStyle={'tableCell'} />
                    </Flex>
                  </StatNumber>
                  {/*<Amount.Percentage value={value.earningsPercentage.times(100)} textStyle={'captionSmall'} />*/}
                  <Amount prefix={'$ '} value={value.usd.earnings} textStyle={'captionSmall'} />
                </Stat>
              )
            }
          </SkeletonText>
        )
      },
      sortType: (a: any, b: any, field: any, c: any): number => sortNumeric(a, b, 'vaultPosition.earningsPercentage', c)
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
    /*
    {
      accessor: 'id',
      canSort: false,
      disableSortBy: true,
      id: 'allocationChart',
      defaultCanSort: false,
      display: strategy === 'BY' ? 'table-cell' : 'none',
      Header: translate('assets.assetDetails.generalData.allocation'),
      Cell: ({ value, row }: { value: AssetId | undefined; row: RowProps }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetProvider assetId={value}>
              <AssetProvider.Allocation />
            </AssetProvider>
          </SkeletonText>
        )
      }
    },
    */
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
    /*
    {
      accessor: 'id',
      canSort: false,
      id: 'apyRatioChart',
      disableSortBy: true,
      defaultCanSort: false,
      display: strategy !== 'BY' ? 'table-cell' : 'none',
      Header: translate('assets.assetDetails.generalData.apyRatio'),
      Cell: ({ value, row }: { value: AssetId | undefined; row: RowProps }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <AssetProvider assetId={value}>
              <AssetProvider.ApyRatioChart />
            </AssetProvider>
          </SkeletonText>
        )
      }
    },
    */
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

  const depositedAssetsData = useMemo(() => {
    if (!selectVaultsWithBalance || !isPortfolioLoaded) return []
    return selectVaultsAssetsWithBalance(strategy)
  }, [isPortfolioLoaded, selectVaultsWithBalance, selectVaultsAssetsWithBalance, strategy])

  const availableAssetsData = useMemo(() => {
    if (!selectVaultsByType || !isPortfolioLoaded) return []
    const vaultsAssets = selectVaultsAssetsByType(strategy)
    return vaultsAssets.filter( (vaultAsset: Asset) => !depositedAssetsData.map( (asset: Asset) => asset.id ).includes(vaultAsset.id) )
  }, [isPortfolioLoaded, selectVaultsByType, selectVaultsAssetsByType, depositedAssetsData, strategy])

  // useEffect(() => {
  //   if (!selectVaultsByType || !isPortfolioLoaded) return;
  //   const vaultsAssets = selectVaultsAssetsByType(strategy)
  //   const availableAssetsData = vaultsAssets.filter( (vaultAsset: Asset) => !depositedAssetsData.map( (asset: Asset) => asset.id ).includes(vaultAsset.id) )
  //   setAvailableAssetsData(availableAssetsData)
  // }, [isPortfolioLoaded, selectVaultsByType, selectVaultsAssetsByType, depositedAssetsData, strategy])

  // useEffect(() => {
  //   if (!selectVaultsWithBalance || !isPortfolioLoaded) return;
  //   const vaultsAssetsWithBalance = selectVaultsAssetsWithBalance(strategy)
  //   setDepositedAssetsData(vaultsAssetsWithBalance)
  // }, [isPortfolioLoaded, selectVaultsWithBalance, selectVaultsAssetsWithBalance, strategy])

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
            depositedAssetsData.map( (asset: Asset) => asset.id && <VaultCard assetId={asset.id} />)
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
          id: 'tvlUsd',
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
            availableAssetsData.map( (asset: Asset) => asset.id && <VaultCard assetId={asset.id} />)
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
          direction={'column'}
          width={['100%', '65%']}
          alignItems={['center', 'flex-start']}
        >
          <Translation translation={strategies[strategy].label} component={Heading} as={'h2'} size={'3xl'} />
          {
            !isMobile && (
              <Translation mt={10} translation={strategies[strategy].description} textAlign={['center', 'left']} />
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
