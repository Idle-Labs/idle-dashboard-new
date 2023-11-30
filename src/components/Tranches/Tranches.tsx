import { Vault } from 'vaults/'
import { Column, Row } from 'react-table'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import type { BigNumber } from 'bignumber.js'
import { products } from 'constants/products'
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
import { strategies, StrategyColumn } from 'constants/strategies'
// import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import type { Asset, VaultPosition, ModalProps } from 'constants/types'
import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { StrategyOverview } from 'components/StrategyOverview/StrategyOverview'
import { AnnouncementBanner } from 'components/AnnouncementBanner/AnnouncementBanner'
import { sortNumeric, sortAlpha, sendViewItemList, getAssetListItem, sendSelectItem, hexToRgb, BNify, bnOrZero } from 'helpers/'
import { Box, Flex, HStack, VStack, Heading, Image, SimpleGrid, Stack, Skeleton, SkeletonText, Stat, StatNumber, StatArrow, Button } from '@chakra-ui/react'

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

export const Tranches: React.FC = () => {
  const navigate = useNavigate()
  const translate = useTranslate()
  const { account } = useWalletProvider()
  const { isMobile } = useThemeProvider()
  // const { params } = useBrowserRouter()
  const { openModal, closeModal } = useModalProvider()
  const [ availableAssetsFilter, setAvailableAssetsFilter ] = useState<string | null>(null)
  const [ depositedAssetsFilter, setDepositedAssetsFilter ] = useState<string | null>(null)
  const [ availableListEventSent, setAvailableListEventSent ] = useState<string | null>(null)
  const [ depositedListEventSent, setDepositedListEventSent ] = useState<string | null>(null)

  const {
    vaults,
    isPortfolioLoaded,
    selectors: {
      selectVaultById,
      selectAssetById,
      selectVaultsWithBalance,
      selectVaultsAssetsByType,
      selectVaultsAssetsWithBalance
    }
  } = usePortfolioProvider()

  const product = useMemo(() => products.find( product => product.route === 'yield-tranches' ), [])

  const productStrategies = useMemo(() => (product?.strategies || []), [product])
  const strategy = useMemo(() => productStrategies?.[0], [productStrategies])

  const onRowClickDeposited = useCallback((row: RowProps, item_list_id: string, item_list_name: string) => {
    sendSelectItem(item_list_id, item_list_name, row.original)
    const strategyConfig = strategies[row.original.type as string]
    return navigate(`/earn/${strategyConfig.route}/${row.original.id}`)
  }, [navigate])

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
                        spacing={0}
                        width={'full'}
                        alignItems={'flex-start'}
                      >
                        <HStack
                          spacing={1}
                          width={'full'}
                          alignItems={'baseline'}
                        >
                          <AssetProvider.Apy showTooltip={false} color={strategies[strategy].color} textStyle={'heading'} fontSize={'h3'} />
                          <Translation translation={'defi.apy'} color={strategies[strategy].color} textStyle={'ctaStatic'} fontSize={'sm'} />
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
                        <Translation translation={`trade.vaults.${strategy}.cta`} mt={4} component={Button} width={'full'} variant={'ctaPrimary'} onClick={() => { navigate(`/earn/${route}/${assetId}`); closeModal() }} />
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
      default:
        return undefined
    }
  }, [sortTrancheApy])

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
    return vaultsAssets.filter( (vaultAsset: Asset) => !depositedAssetsData.map( (asset: Asset) => asset.id ).includes(vaultAsset.id) && vaultAsset.status === 'deprecated' && bnOrZero(vaultAsset.tvlUsd).gt(500) )
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
      return !depositedAssetsFilter || !depositedAssetsFilter.length || new RegExp(depositedAssetsFilter, 'i').exec(vaultAsset.name) !== null || new RegExp(depositedAssetsFilter, 'i').exec(vaultAsset.protocol as string) !== null
    })

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
          <Translation translation={'defi.depositedAssets'} component={Card.Heading} fontSize={'lg'} />
          <SearchBar placeholder={'defi.searchToken'} handleSearchChange={setDepositedAssetsFilter} />
        </HStack>
        <ReactTable columns={depositedAssetsColumns} data={depositedAssetsDataFiltered} initialState={initialState} onRowClick={ (row) => onRowClickDeposited(row, depositedListId, depositedListName) } />
      </Card>
    )
  }, [isMobile, depositedAssetsColumns, depositedAssetsFilter, setDepositedAssetsFilter, depositedListId, depositedListName, depositedAssetsData, onRowClickDeposited])

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
      return !availableAssetsFilter || !availableAssetsFilter.length || new RegExp(availableAssetsFilter, 'i').exec(vaultAsset.name) !== null || new RegExp(availableAssetsFilter, 'i').exec(vaultAsset.protocol as string) !== null
    })

    return isMobile ? (
      <VStack
        mt={20}
        spacing={6}
        width={'100%'}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.availableAssets'} component={Heading} as={'h3'} fontSize={'lg'} />
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
          <Translation translation={'defi.availableAssets'} component={Card.Heading} fontSize={'lg'} />
          <SearchBar placeholder={'defi.searchToken'} handleSearchChange={setAvailableAssetsFilter} />
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
  }, [isMobile, isPortfolioLoaded, availableAssetsFilter, setAvailableAssetsFilter, availableAssetsColumns, availableListId, availableListName, availableAssetsData, onRowClickAvailable])

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
        <Translation translation={'defi.deprecatedAssets'} component={Heading} as={'h3'} fontSize={'lg'} />
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
        <Translation translation={'defi.deprecatedAssets'} component={Card.Heading} fontSize={'lg'} />
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
        width={'full'}
        spacing={10}
      >
        <AnnouncementBanner text={'feeDiscount.announcement'} image={'images/vaults/discount.png'} />
        <Stack
          spacing={[8, 0]}
          direction={['column', 'row']}
          alignItems={['center', 'flex-start']}
          width={['100%', '100%', '100%', '100%', '80%']}
        >
          <VStack
            pr={[0, 0]}
            spacing={10}
            direction={'column'}
            width={['100%', '50%']}
            alignItems={['center', 'flex-start']}
          >
            <Translation isHtml={true} translation={'strategies.tranches.title'} component={Heading} fontFamily={'body'} as={'h2'} size={'3xl'} fontWeight={'bold'} lineHeight={'normal'} />
            {
              !isMobile && (
                <VStack
                  spacing={1}
                  width={['100%', '90%']}
                  alignItems={'flex-start'}
                >
                  <Translation isHtml={true} translation={'strategies.tranches.description'} textAlign={['center', 'left']} />
                  {
                    modalProps && (
                      <HStack
                        spacing={2}
                      >
                        <Translation translation={'defi.modals.learnMore.cta.learnMore'} textStyle={'cta'} onClick={() => openModal(modalProps as ModalProps)} />
                        <MdArrowForwardIos />
                      </HStack>
                    )
                  }
                </VStack>
              )
            }
            {
              !isMobile && (
                <StrategyOverview showLoading={false} strategies={productStrategies} />
              )
            }
          </VStack>
          <Image width={['100%', '50%']} src={product?.image} />
          {
            isMobile && (
              <Translation isHtml={true} translation={'strategies.tranches.description'} textAlign={['center', 'left']} />
            )
          }
          {
            isMobile && (
              <StrategyOverview showLoading={false} strategies={productStrategies} />
            )
          }
        </Stack>
      </VStack>
    )
  }, [strategy, product, productStrategies, isMobile, openModal])

  return (
    <Flex
      mt={10}
      width={'100%'}
      direction={'column'}
      alignItems={'center'}
    >
      {heading}
      {depositedAssets}
      {availableAssets}
      {deprecatedAssets}
    </Flex>
  )
}
