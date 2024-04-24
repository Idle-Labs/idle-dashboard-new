import { Vault } from 'vaults/'
import { Column, Row } from 'react-table'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import type { BigNumber } from 'bignumber.js'
import { useNavigate } from 'react-router-dom'
import { Amount } from 'components/Amount/Amount'
import { MdArrowForwardIos } from 'react-icons/md'
import { strategiesFolder } from 'constants/folders'
import { useModalProvider } from 'contexts/ModalProvider'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { SearchBar } from 'components/SearchBar/SearchBar'
import { VaultCard } from 'components/VaultCard/VaultCard'
import { useWalletProvider } from 'contexts/WalletProvider'
import { ReactTable } from 'components/ReactTable/ReactTable'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
// import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import type { Asset, VaultPosition, ModalProps } from 'constants/types'
import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { StrategyOverview } from 'components/StrategyOverview/StrategyOverview'
import { ProtocolOverview } from 'components/ProtocolOverview/ProtocolOverview'
import { AnnouncementBanner } from 'components/AnnouncementBanner/AnnouncementBanner'
import { products, chains, networks, MIN_TVL_USD_DEPRECATED_VAULTS, strategies, StrategyColumn, aggregatedVaults, AggregatedVault } from 'constants/'
import { sortNumeric, sortAlpha, sendViewItemList, getAssetListItem, sendSelectItem, hexToRgb, BNify, bnOrZero, removeItemFromArray, abbreviateNumber } from 'helpers/'
import { Box, Flex, HStack, VStack, Heading, Image, SimpleGrid, Stack, Skeleton, SkeletonText, Stat, StatNumber, StatArrow, Button, Tooltip } from '@chakra-ui/react'

type RowProps = Row<Asset>

type TableFieldProps = {
  row: RowProps
  field: string
  value: any
  showLoader?: boolean
}

export const TableField: React.FC<TableFieldProps> = ({ field, row, value, showLoader = true }) => {
  const assetId = row.original.id

  if (!showLoader) {
    return (
      <AssetProvider
        assetId={assetId}
      >
        <AssetProvider.GeneralData section={'strategy'} field={field} />
      </AssetProvider>
    )
  }

  return (
    <SkeletonText noOfLines={2} isLoaded={!!value}>
      <AssetProvider assetId={assetId}>
        <AssetProvider.GeneralData section={'strategy'} field={field} />
      </AssetProvider>
    </SkeletonText>
  )
}

type ChainsFiltersArgs = {
  enabledChains: number[]
  setEnabledChains: Function
}

const ChainsFilters: React.FC<ChainsFiltersArgs> = ({enabledChains, setEnabledChains}) => {
  const translate = useTranslate()
  return (
    <HStack
      pr={4}
      spacing={2}
      borderRight={'1px solid'}
      borderColor={'divider'}
    >
      {
        Object.keys(chains).map( (chainId: string) => (
          <Tooltip
            hasArrow
            placement={'top'}
            label={translate(`networks.${chainId}`)}
          >
            <Box
              key={`index_${chainId}`}
              layerStyle={'tableFilter'}
              aria-selected={enabledChains.includes(+chainId)}
              onClick={ () => setEnabledChains( () => enabledChains.includes(+chainId) ? removeItemFromArray([...enabledChains], +chainId) : [...enabledChains, +chainId] ) }
            >
              <Image src={networks[+chainId].icon as string} />
            </Box>
          </Tooltip>
        ))
      }
    </HStack>
  )
}

export const Tranches: React.FC = () => {
  const navigate = useNavigate()
  const translate = useTranslate()
  const { account } = useWalletProvider()
  const { theme, isMobile } = useThemeProvider()
  // const { params } = useBrowserRouter()
  const { openModal, closeModal } = useModalProvider()
  const [ availableAssetsFilter, setAvailableAssetsFilter ] = useState<string | null>(null)
  const [ depositedAssetsFilter, setDepositedAssetsFilter ] = useState<string | null>(null)
  const [ availableListEventSent, setAvailableListEventSent ] = useState<string | null>(null)
  const [ depositedListEventSent, setDepositedListEventSent ] = useState<string | null>(null)
  const [ availableAssetsChains, setAvailableAssetsChains ] = useState<number[]>(Object.keys(chains).map( chainId => +chainId ))
  const [ depositedAssetsChains, setDepositedAssetsChains ] = useState<number[]>(Object.keys(chains).map( chainId => +chainId ))

  const {
    vaults,
    protocolData,
    isPortfolioLoaded,
    selectors: {
      selectVaultById,
      selectAssetById,
      selectAssetsByIds,
      selectVaultPosition,
      selectVaultsWithBalance,
      selectVaultsAssetsByType,
      selectVaultsAssetsWithBalance
    }
  } = usePortfolioProvider()

  const product = useMemo(() => products.find( product => product.route === 'yield-tranches' ), [])

  const visibleStrategies = useMemo(() => Object.keys(strategies).filter( (strategy: string) => !!strategies[strategy].visible ), [])
  const productStrategies = useMemo(() => (product?.strategies || []), [product])
  const strategy = useMemo(() => productStrategies?.[0], [productStrategies])

  const onRowClickDeposited = useCallback((row: RowProps, item_list_id: string, item_list_name: string) => {
    sendSelectItem(item_list_id, item_list_name, row.original)
    const strategyConfig = strategies[row.original.type as string]
    return navigate(`/earn/${row.original.id}`)
  }, [navigate])

  const getAggregatedVaultModal = useCallback((aggregatedVault: AggregatedVault) => {
    const assets = selectAssetsByIds(aggregatedVault.vaults)
    return (
      <VStack
        pb={4}
        spacing={3}
      >
        <HStack
          px={4}
          width={'full'}
          alignItems={'center'}
          justifyContent={'flex-start'}
        >
          <HStack width={['33%', '27%']}>
            <Translation translation={'defi.asset'} textStyle={'captionSmaller'} />
          </HStack>
          <HStack width={['33%', '28%']}>
            <Translation translation={'defi.tvl'} textStyle={'captionSmaller'} />
          </HStack>
          <HStack width={['33%', '27%']}>
            <Translation translation={'defi.apy'} textStyle={'captionSmaller'} />
          </HStack>
        </HStack>
        {
          assets.map( (asset: Asset) => {
            const vaultPosition = selectVaultPosition(asset.id)
            return (
              <AssetProvider
                wrapFlex={false}
                assetId={asset.id}
                key={`index_${asset}`}
              >
                <Card.Flex
                  px={4}
                  py={3}
                  cursor={'pointer'}
                  layerStyle={'cardLight'}
                   onClick={() => { navigate(`/earn/${asset.id}`); closeModal() }}
                >
                  <HStack
                    width={'full'}
                    alignItems={'center'}
                    justifyContent={'space-between'}
                  >
                    <HStack width={'25%'}>
                      <AssetProvider.GeneralData field={'asset'} />
                    </HStack>
                    <HStack width={'25%'}>
                      <AssetProvider.PoolUsd fontWeight={600} />
                    </HStack>
                    <HStack width={'25%'}>
                      <AssetProvider.Apy addRewards={true} fontWeight={600} />
                    </HStack>
                    {
                      !isMobile && (
                        <HStack
                          height={'100%'}
                          alignItems={'stretch'}
                          justifyContent={'flex-end'}
                        >
                          <Translation translation={bnOrZero(vaultPosition?.usd.deposited).gt(0) ? 'common.manage' : `common.deposit`} component={Button} width={'full'} height={'auto'} variant={'ctaPrimary'} size={'sm'} onClick={() => { navigate(`/earn/${asset.id}`); closeModal() }} />
                        </HStack>
                      )
                    }
                  </HStack>
                </Card.Flex>
              </AssetProvider>
            )
          })
        }
      </VStack>
    )
  }, [selectAssetsByIds, isMobile, selectVaultPosition, navigate, closeModal])

  const getModalCards = useCallback((assetId: string) => {

    const trancheVault = selectVaultById(assetId)
    const tranchesAssets: Record<string, Asset | undefined> = {
      AA: selectAssetById(trancheVault?.vaultConfig.Tranches.AA.address),
      BB: selectAssetById(trancheVault?.vaultConfig.Tranches.BB.address)
    }

    return (
      <SimpleGrid
        mb={6}
        spacing={6}
        width={'full'}
        columns={[1, 2]}
      >
        {
          productStrategies.map( (strategy: string) => {
            const route = strategies[strategy].route
            const assetId = tranchesAssets[strategy]?.id
            return (
              <AssetProvider
                wrapFlex={false}
                assetId={assetId}
                key={`vault_${assetId}`}
              >
                <Card
                  p={4}
                  borderRadius={24}
                  overflow={'hidden'}
                  position={'relative'}
                  layerStyle={'cardLight'}
                >
                  <Box
                    sx={{
                      zIndex: 0,
                      top: "30%",
                      width: "205%",
                      right: "-115%",
                      position: "absolute",
                      height: isMobile ? "145%" : "125%",
                      background: `radial-gradient(circle, rgba(${hexToRgb(strategies[strategy]?.color as string).join(',')},0.8) 0%, rgba(50,61,83,0) 70%)`
                    }}
                  >
                  </Box>
                  <Box
                    zIndex={1}
                    width={'full'}
                    position={'relative'}
                  >
                    <HStack
                      width={'full'}
                      justifyContent={'flex-end'}
                    >
                      <Image w={6} h={6} src={`${strategiesFolder}${strategy}.svg`} />
                    </HStack>
                    <VStack
                      px={2}
                      width={'full'}
                      spacing={4}
                    >
                      <HStack
                        width={'full'}
                        justifyContent={'flex-start'}
                      >
                        <Translation translation={strategies[strategy].label} textStyle={'ctaStatic'} fontSize={'cardTitle'} lineHeight={'initial'} />
                      </HStack>
                      <VStack
                        spacing={2}
                      >
                        {
                          strategies[strategy].features?.map( (feature: string) => (
                            <HStack
                              spacing={1}
                              alignItems={'flex-start'}
                              key={`feature_${feature}`}
                            >
                              <Box
                                pt={1}
                              >
                                <MdArrowForwardIos color={'white'} size={12} />
                              </Box>
                              <Translation translation={feature} textStyle={'captionSmall'} />
                            </HStack>
                          ))
                        }
                      </VStack>
                      <VStack
                        spacing={1}
                        width={'full'}
                        alignItems={'flex-start'}
                      >
                        <HStack
                          spacing={1}
                          width={'full'}
                          alignItems={'baseline'}
                        >
                          <AssetProvider.Apy showTooltip={false} addRewards={true} color={strategies[strategy].color} textStyle={'heading'} fontSize={'h3'} suffix={<Translation translation={'defi.apy'} color={strategies[strategy].color} textStyle={'ctaStatic'} fontSize={'sm'} />} />
                        </HStack>
                        <HStack
                          spacing={2}
                          width={'full'}
                        >
                          <Translation translation={'defi.currentTVL'} textStyle={'captionSmall'} />
                          <AssetProvider.PoolUsd textStyle={'captionSmall'} color={'primary'} fontSize={'md'} fontWeight={'700'} />
                        </HStack>
                      </VStack>
                      {
                        strategy === 'AA' ? (
                          <VStack
                            spacing={1}
                            width={'full'}
                            alignItems={'flex-start'}
                          >
                            <Translation translation={'defi.seniorCoverage'} textStyle={'ctaStatic'} />
                            <AssetProvider.Coverage textStyle={'captionSmall'} color={'primary'} />
                          </VStack>
                        ) : (
                          <VStack
                            spacing={1}
                            width={'full'}
                            alignItems={'flex-start'}
                          >
                            <Translation translation={'defi.apyBoost'} textStyle={'ctaStatic'} />
                            <HStack
                              spacing={1}
                            >
                              <AssetProvider.ApyBoost textStyle={'captionSmall'} color={'primary'} />
                              <Translation translation={'defi.moreThanUnderlying'} textStyle={'captionSmall'} color={'primary'} />
                            </HStack>
                          </VStack>
                        )
                      }
                      <Box
                        width={'full'}
                      >
                        <Translation translation={`trade.vaults.${strategy}.cta`} mt={4} component={Button} width={'full'} variant={'ctaPrimary'} onClick={() => { navigate(`/earn/${assetId}`); closeModal() }} />
                      </Box>
                    </VStack>
                  </Box>
                </Card>
              </AssetProvider>
            )
          })
        }
      </SimpleGrid>
    )
  }, [navigate, closeModal, productStrategies, isMobile, selectVaultById, selectAssetById])

  const onRowClickAvailable = useCallback((asset: Asset, item_list_id: string, item_list_name: string) => {
    sendSelectItem(item_list_id, item_list_name, asset)
    const modalProps = {
      subtitle:'defi.chooseTranche',
      body: getModalCards(asset.id as string)
    }
    return openModal(modalProps as ModalProps, '2xl')
  }, [openModal, getModalCards])

  const columns = useMemo(() => {
    return product?.columns || (strategy && strategies[strategy].columns)
  }, [product, strategy])

  const sortTotalTvlUsd = useCallback((a: any, b: any): number => {

    const asset1 = selectAssetById(a.original.id)
    const asset2 = selectAssetById(b.original.id)

    return bnOrZero(asset1.totalTvlUsd).gt(bnOrZero(asset2.totalTvlUsd)) ? -1 : 1
  }, [selectAssetById])

  const sortTrancheApy = useCallback((a: any, b: any, field: any, id?: any): number => {

    // console.log('sortTrancheApy', a, b, field, id);
    const vault1 = selectVaultById(a.original.id)
    const vault2 = selectVaultById(b.original.id)

    switch (id){
      case 'juniorApy':
        const juniorAsset1 = selectAssetById(vault1?.vaultConfig.Tranches.BB.address)
        const juniorAsset2 = selectAssetById(vault2?.vaultConfig.Tranches.BB.address)
        const juniorApy1 = BNify(juniorAsset1.apy)
        const juniorApy2 = BNify(juniorAsset2.apy)
        return juniorApy1.gt(juniorApy2) ? -1 : 1
      case 'seniorApy':
        const seniorAsset1 = selectAssetById(vault1?.vaultConfig.Tranches.AA.address)
        const seniorAsset2 = selectAssetById(vault2?.vaultConfig.Tranches.AA.address)
        const seniorApy1 = BNify(seniorAsset1.apy)
        const seniorApy2 = BNify(seniorAsset2.apy)
        return seniorApy1.gt(seniorApy2) ? -1 : 1
      default:
        return 1
    }
  }, [selectVaultById, selectAssetById])

  const getCellSorting = useCallback((sortType?: string): Function | undefined => {
    switch (sortType){
      case 'alpha':
        return sortAlpha
      case 'numeric':
        return sortNumeric
      case 'trancheApy':
        return sortTrancheApy
      case 'totalTvlUsd':
        return sortTotalTvlUsd
      default:
        return undefined
    }
  }, [sortTrancheApy, sortTotalTvlUsd])

  const allColumnsById: Record<string, Column<Asset>> = useMemo(() => {
    if (!columns) return {}
    return columns.reduce( (allColumns: Record<string, Column<Asset>>, column: StrategyColumn) => {
      const { id, accessor, sortType } = column
      const sortTypeFn = getCellSorting(sortType)
      allColumns[id] = {
        id,
        accessor,
        width: column.width,
        disableSortBy: !sortTypeFn,
        defaultCanSort: !!sortTypeFn,
        Header: translate(column.title || `defi.${id}`),
        sortType: sortTypeFn ? (a: any, b: any) => sortTypeFn(a, b, accessor, id) : undefined,
        Cell: ({ value, row }: { value: any; row: RowProps }) => {
          return column.extraFields && column.extraFields.length>0 ? (
            <Stack
              spacing={2}
              width={'full'}
              direction={'row'}
              alignItems={'center'}
              {...column.stackProps}
            >
              <TableField field={id} value={value} row={row} />
              <Flex
                flex={1}
                {...column.stackProps}
              >
                {
                  column.extraFields.map( (extraField: string) => (
                    <TableField key={`extraField_${extraField}`} field={extraField} value={value} row={row} showLoader={false} />
                  ))
                }
              </Flex>
            </Stack>
          ) : (
            <TableField field={id} value={value} row={row} />
          )
        }
      }
      return allColumns
    }, {})
  }, [columns, translate, getCellSorting])

  const strategyColumns: Column<Asset>[] = useMemo(() => {
    if (!strategy || !columns) return []
    return columns.filter( (column: StrategyColumn) => !column.tables || column.tables.includes('Available') ).map( (column: StrategyColumn) => {
      const { id, accessor, sortType } = column
      const sortTypeFn = getCellSorting(sortType)
      return {
        id,
        accessor,
        width: column.width,
        disableSortBy: !sortTypeFn,
        defaultCanSort: !!sortTypeFn,
        Header: translate(column.title || `defi.${id}`),
        sortType: sortTypeFn ? (a: any, b: any) => sortTypeFn(a, b, accessor, id) : undefined,
        Cell: ({ value, row }: { value: any; row: RowProps }) => {
          return column.extraFields && column.extraFields.length>0 ? (
            <Stack
              spacing={2}
              width={'full'}
              direction={'row'}
              alignItems={'center'}
              {...column.stackProps}
            >
              <TableField field={id} value={value} row={row} />
              <Flex
                flex={1}
                {...column.stackProps}
              >
                {
                  column.extraFields.map( (extraField: string) => (
                    <TableField key={`extraField_${extraField}`} field={extraField} value={value} row={row} showLoader={false} />
                  ))
                }
              </Flex>
            </Stack>
          ) : (
            <TableField field={id} value={value} row={row} />
          )
        }
      }
    })
  }, [strategy, columns, translate, getCellSorting])

  const strategyColumnsDeposit: Column<Asset>[] = useMemo(() => {
    if (!strategy || !columns) return []
    return columns.filter( (column: StrategyColumn) => !column.tables || column.tables.includes('Deposited') ).map( (column: StrategyColumn) => {
      const { id, accessor, sortType } = column
      // const sortTypeFn = sortType==='alpha' ? sortAlpha : sortType==='numeric' ? sortNumeric : undefined
      const sortTypeFn = getCellSorting(sortType)
      return {
        id,
        accessor,
        width: column.width,
        disableSortBy: !sortTypeFn,
        defaultCanSort: !!sortTypeFn,
        Header: translate(column.title || `defi.${id}`),
        sortType: sortTypeFn ? (a: any, b: any) => sortTypeFn(a, b, accessor, id) : undefined,
        Cell: ({ value, row }: { value: any; row: RowProps }) => {
          return column.extraFields && column.extraFields.length>0 ? (
            <Stack
              spacing={2}
              width={'full'}
              direction={'row'}
              alignItems={'center'}
              {...column.stackProps}
            >
              <TableField field={id} value={value} row={row} />
              <Flex
                flex={1}
                {...column.stackProps}
              >
                {
                  column.extraFields.map( (extraField: string) => (
                    <TableField key={`extraField_${extraField}`} field={extraField} value={value} row={row} showLoader={false} />
                  ))
                }
              </Flex>
            </Stack>
          ) : (
            <TableField field={id} value={value} row={row} />
          )
        }
      }
    })
  }, [strategy, columns, translate, getCellSorting])

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
                      {/*<Amount.Percentage value={value.realizedApy} textStyle={'tableCell'} />*/}
                      <TableField field={'realizedApy'} value={value} row={row} />
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
  ]), [translate, allColumnsById, strategyColumnsDeposit])

  const availableAssetsColumns: Column<Asset>[] = useMemo(() => ([
    {
      Header: '#',
      accessor: 'id',
      display: 'none'
    },
    ...strategyColumns
  ]), [strategyColumns])

  const depositedAssetsData = useMemo(() => {
    if (!selectVaultsWithBalance || !isPortfolioLoaded || !productStrategies || !account?.address) return []
    return productStrategies?.reduce( (depositedAssetsData: Asset[], strategy: string) => {
      const strategyDepositedAssets = selectVaultsAssetsWithBalance(strategy)
      return [
        ...depositedAssetsData,
        ...(strategyDepositedAssets || [])
      ]
    }, [])
  }, [isPortfolioLoaded, account, selectVaultsWithBalance, selectVaultsAssetsWithBalance, productStrategies])

  const availableAssetsData = useMemo(() => {
    if (!selectVaultsAssetsByType || !isPortfolioLoaded) return []
    // const vaultsAssets = productStrategies.reduce( (vaultsAssets: Asset[], strategy: string) => {
    //   const strategyAssets = selectVaultsAssetsByType(strategy)
    //   return [
    //     ...vaultsAssets,
    //     ...strategyAssets
    //   ]
    // }, [])

    const checkDepositedAsset = (vaultAsset: Asset) => depositedAssetsData.map( (asset: Asset) => asset.id ).includes(vaultAsset.id)

    const vaultsAssets = selectVaultsAssetsByType(strategy)
    // console.log('vaultsAssets', vaultsAssets)
    // return vaultsAssets.filter( (vaultAsset: Asset) => !depositedAssetsData.map( (asset: Asset) => asset.id ).includes(vaultAsset.id) && vaultAsset.status !== 'deprecated' )

    return vaultsAssets.reduce( (vaultsAssets: Asset[], vaultAsset: Asset) => {
      if (vaultAsset.status === 'deprecated'){
        return vaultsAssets
      }
      // Add other vault
      if (checkDepositedAsset(vaultAsset)){
        const vault = selectVaultById(vaultAsset.id)
        if (vault){
          const otherVaultType = vaultAsset.type === 'AA' ? 'BB' : 'AA'
          const otherVault = vaults.find( (otherVault: Vault) => ("cdoConfig" in otherVault) && ("cdoConfig" in vault) && otherVault.type === otherVaultType && otherVault.cdoConfig.address === vault.cdoConfig.address)
          if (otherVault){
            const otherVaultAsset = selectAssetById(otherVault.id)
            if (otherVaultAsset?.status !== 'deprecated' && !checkDepositedAsset(otherVaultAsset)){
              vaultsAssets.push(otherVaultAsset)
            }
          }
        }
      } else {
        vaultsAssets.push(vaultAsset)
      }
      return vaultsAssets
    }, [])

  }, [isPortfolioLoaded, vaults, selectAssetById, selectVaultById, selectVaultsAssetsByType, depositedAssetsData, strategy])

  const deprecatedAssetsData = useMemo(() => {
    if (!selectVaultsAssetsByType || !isPortfolioLoaded) return []
    const vaultsAssets = selectVaultsAssetsByType(strategy)
    return vaultsAssets.filter( (vaultAsset: Asset) => !depositedAssetsData.map( (asset: Asset) => asset.id ).includes(vaultAsset.id) && vaultAsset.status === 'deprecated' && bnOrZero(vaultAsset.tvlUsd).gt(MIN_TVL_USD_DEPRECATED_VAULTS) )
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

  const deprecatedListId = useMemo(() => {
    if (!strategy) return ''
    return `${strategy}_deprecated`
  }, [strategy])

  const deprecatedListName = useMemo(() => {
    if (!strategy) return ''
    const strategyName = translate(strategies[strategy].label)
    return `${strategyName} - ${translate('common.deprecated')}`
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

    const depositedAssetsDataFiltered = depositedAssetsData.filter( (vaultAsset: Asset) => {
      const searchCheck = !depositedAssetsFilter || !depositedAssetsFilter.length || new RegExp(depositedAssetsFilter, 'i').exec(vaultAsset.name) !== null || new RegExp(depositedAssetsFilter, 'i').exec(vaultAsset.protocol as string) !== null
      const chainCheck = vaultAsset?.chainId && depositedAssetsChains.includes(+vaultAsset.chainId)
      return searchCheck && chainCheck
    })

    return isMobile ? (
      <VStack
        mt={20}
        spacing={6}
        width={'100%'}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.deposited'} component={Heading} as={'h3'} fontSize={'lg'} />
        <VStack
          spacing={2}
          width={'100%'}
          alignItems={'flex-start'}
        >
          {
            depositedAssetsDataFiltered.map( (asset: Asset) => asset.id && <VaultCard key={`vault_${asset.id}`} assetId={asset.id} />)
          }
        </VStack>
      </VStack>
    ) : (
      <Card mt={10}>
        <HStack
          width={'full'}
          alignItems={'flex-start'}
          justifyContent={'space-between'}
        >
          <Translation translation={'defi.deposited'} component={Card.Heading} fontSize={'lg'} />
          <HStack
            spacing={4}
          >
            {/*<ChainsFilters enabledChains={depositedAssetsChains} setEnabledChains={setDepositedAssetsChains} />*/}
            <SearchBar placeholder={'defi.searchToken'} handleSearchChange={setDepositedAssetsFilter} />
          </HStack>
        </HStack>
        <ReactTable columns={depositedAssetsColumns} data={depositedAssetsDataFiltered} initialState={initialState} onRowClick={ (row) => onRowClickDeposited(row, depositedListId, depositedListName) } />
      </Card>
    )
  }, [isMobile, depositedAssetsColumns, depositedAssetsFilter, setDepositedAssetsFilter, depositedAssetsChains, /*setDepositedAssetsChains,*/ depositedListId, depositedListName, depositedAssetsData, onRowClickDeposited])

  const availableAssets = useMemo(() => {
    if (isPortfolioLoaded && !availableAssetsData.length) return null

    const initialState = {
      sortBy: [
        {
          id: 'trancheTotalTvl',
          desc: false
        }
      ]
    }

    const availableAssetsDataFiltered = availableAssetsData.filter( (vaultAsset: Asset) => {
      const searchCheck = !availableAssetsFilter || !availableAssetsFilter.length || new RegExp(availableAssetsFilter, 'i').exec(vaultAsset.name) !== null || new RegExp(availableAssetsFilter, 'i').exec(vaultAsset.protocol as string) !== null
      const chainCheck = vaultAsset?.chainId && availableAssetsChains.includes(+vaultAsset.chainId)
      return searchCheck && chainCheck
    })

    return isMobile ? (
      <VStack
        mt={20}
        spacing={6}
        width={'100%'}
        alignItems={'flex-start'}
      >
        <Translation translation={'common.available'} component={Heading} as={'h3'} fontSize={'lg'} />
        <VStack
          spacing={2}
          width={'100%'}
          alignItems={'flex-start'}
        >
          {
            availableAssetsDataFiltered.map( (asset: Asset) => asset.id && <VaultCard.Tranche key={`vault_${asset.id}`} assetId={asset.id} onClick={ () => onRowClickAvailable(asset, availableListId, availableListName) } />)
          }
        </VStack>
      </VStack>
    ) : (
      <Card mt={10}>
        <HStack
          width={'full'}
          alignItems={'flex-start'}
          justifyContent={'space-between'}
        >
          <Translation translation={'common.available'} component={Card.Heading} fontSize={'lg'} />
          <HStack
            spacing={4}
          >
            {/*<ChainsFilters enabledChains={availableAssetsChains} setEnabledChains={setAvailableAssetsChains} />*/}
            <SearchBar placeholder={'defi.searchToken'} handleSearchChange={setAvailableAssetsFilter} />
          </HStack>
        </HStack>
        {
          !isPortfolioLoaded ? (
            <Stack
            >
              <Skeleton />
              <Skeleton />
            </Stack>
          ) : (
            <ReactTable columns={availableAssetsColumns} data={availableAssetsDataFiltered} initialState={initialState} onRowClick={ (row) => onRowClickAvailable(row.original, availableListId, availableListName) } />
          )
        }
      </Card>
    )
  }, [isMobile, isPortfolioLoaded, availableAssetsFilter, setAvailableAssetsFilter, availableAssetsChains/*, setAvailableAssetsChains*/, availableAssetsColumns, availableListId, availableListName, availableAssetsData, onRowClickAvailable])

  const deprecatedAssets = useMemo(() => {
    if (!isPortfolioLoaded || !deprecatedAssetsData.length) return null

    const initialState = {
      sortBy: [
        {
          id: 'trancheTotalTvl',
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
        <Translation translation={'common.deprecated'} component={Heading} as={'h3'} fontSize={'lg'} />
        <VStack
          spacing={2}
          width={'100%'}
          alignItems={'flex-start'}
        >
          {
            deprecatedAssetsData.map( (asset: Asset) => asset.id && <VaultCard.Tranche key={`vault_${asset.id}`} assetId={asset.id} onClick={ () => onRowClickAvailable(asset, deprecatedListId, deprecatedListName) } />)
          }
        </VStack>
      </VStack>
    ) : (
      <Card mt={10}>
        <Translation translation={'common.deprecated'} component={Card.Heading} fontSize={'lg'} />
        {
          !deprecatedAssetsData.length ? (
            <Stack
            >
              <Skeleton />
              <Skeleton />
            </Stack>
          ) : (
            <ReactTable columns={availableAssetsColumns} data={deprecatedAssetsData} initialState={initialState} onRowClick={ (row) => onRowClickAvailable(row.original, deprecatedListId, deprecatedListName) } />
          )
        }
      </Card>
    )
  }, [isMobile, isPortfolioLoaded, availableAssetsColumns, deprecatedListId, deprecatedListName, deprecatedAssetsData, onRowClickAvailable])

  const heading = useMemo(() => {
    if (!strategy) return null
    const modalProps = product?.modal
    return (
      <VStack
        mb={20}
        width={'full'}
        spacing={8}
      >
        {/*<AnnouncementBanner text={'feeDiscount.announcement'} image={'images/vaults/discount.png'} />*/}
        <Box
          left={0}
          zIndex={1}
          width={'full'}
          height={['20em','11.5em']}
          position={'absolute'}
          background={`radial-gradient(circle, ${theme.colors.card.bg}AA 40%, ${theme.colors.card.bg}50 100%)`}
          backgroundPosition={'top left'}
          backgroundSize={'300%'}
        />
        <Stack
          zIndex={2}
          width={'full'}
          spacing={[8, 0]}
          position={'relative'}
          direction={['column', 'row']}
          alignItems={['center', 'center']}
          justifyContent={'space-between'}
        >
          <VStack
            pr={[0, 0]}
            spacing={4}
            width={'full'}
            direction={'column'}
            alignItems={['center', 'flex-start']}
          >
            <Translation isHtml={true} translation={'strategies.general.title'} component={Heading} fontFamily={'body'} as={'h2'} size={'3xl'} fontWeight={'bold'} lineHeight={'normal'} />
            <SkeletonText noOfLines={2} isLoaded={bnOrZero(protocolData.totalTvlUsd).gt(0)}>
              <Translation translation={'stats.protocolOverview'} fontSize={['md','h4']} isHtml={true} params={{tvlUsd: abbreviateNumber(protocolData.totalTvlUsd, 2), avgApy: protocolData.totalAvgApy.toFixed(2), vaults: protocolData.uniqueVaults}} />
            </SkeletonText>
          </VStack>
          <Box
            minWidth={['full', '30em']}
          >
            <StrategyOverview showLoading={true} strategies={visibleStrategies} />
          </Box>
        </Stack>
      </VStack>
    )
  }, [theme, strategy, product, visibleStrategies, protocolData])

  const onClickAggregatedVaults = useCallback((aggregatedVault: AggregatedVault) => {
    // sendSelectItem(item_list_id, item_list_name, asset)
    
    // Show modal with choices
    if (aggregatedVault.vaults.length>1){
      const modalProps = {
        subtitle:'defi.chooseAsset',
        body: getAggregatedVaultModal(aggregatedVault)
      }
      return openModal(modalProps as ModalProps, '2xl')
    } else {
      const asset = selectAssetById(aggregatedVault.vaults[0])
      navigate(`/earn/${asset.id}`);
      return closeModal();
    }
  }, [openModal, selectAssetById, getAggregatedVaultModal, closeModal, navigate])

  const aggregatedVaultsCards = useMemo(() => {
    return (
      <VStack
        width={'full'}
        spacing={6}
        alignItems={'flex-start'}
      >
        <VStack
          spacing={4}
          width={['full', '50%']}
          alignItems={'flex-start'}
        >
          <Translation translation={'strategies.aggregated.title'} component={Heading} as={'h3'} fontSize={'3xl'} />
          <Translation translation={'strategies.aggregated.description'} />
        </VStack>
        <Stack
          spacing={10}
          width={'full'}
          direction={['column', 'row']}
        >
          {
            Object.values(aggregatedVaults).map( (aggregatedVault: AggregatedVault, index: number) => {
              return (<VaultCard.Aggregated key={`index_${index}`} aggregatedVault={aggregatedVault} onClick={() => onClickAggregatedVaults(aggregatedVault)} />)
            })
          }
        </Stack>
      </VStack>
    )
  }, [onClickAggregatedVaults])

  return (
    <Flex
      mt={10}
      width={'100%'}
      direction={'column'}
      alignItems={'center'}
    >
      {heading}
      {aggregatedVaultsCards}
      <VStack
        mt={10}
        width={'full'}
        spacing={6}
        alignItems={'flex-start'}
      >
        <VStack
          spacing={4}
          width={['full', '50%']}
          alignItems={'flex-start'}
        >
          <Translation translation={'strategies.isolated.title'} component={Heading} as={'h3'} fontSize={'3xl'} />
          <Translation translation={'strategies.isolated.description'} />
        </VStack>
        {depositedAssets}
        {availableAssets}
        {deprecatedAssets}
      </VStack>
    </Flex>
  )
}
