import BigNumber from 'bignumber.js'
import type { Vault } from 'vaults/'
import { BNify, bnOrZero } from 'helpers/'
import { Card } from 'components/Card/Card'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import type { ProviderProps } from 'contexts/common/types'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Scrollable } from 'components/Scrollable/Scrollable'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import type { ReducerActionTypes, AssetId } from 'constants/types'
import useBoundingRect from "hooks/useBoundingRect/useBoundingRect"
import { ProtocolLabel } from 'components/ProtocolLabel/ProtocolLabel'
import { StrategyLabel } from 'components/StrategyLabel/StrategyLabel'
import { MdKeyboardArrowUp, MdKeyboardArrowDown } from 'react-icons/md'
import { useTheme, Checkbox, Button, Box, VStack, HStack, SimpleGrid, Text } from '@chakra-ui/react'
import { useState, useRef, useMemo, useCallback, useContext, useReducer, useEffect, createContext } from 'react'

import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react'

import {
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb
} from '@chakra-ui/react'

type FiltersProps = {
  type?: string
  filterValues?: any
  dispatch: Function
}

type RangeType = {
  minValue?: BigNumber | null
  maxValue?: BigNumber | null
}

const StrategyFilter = ({ filterValues, dispatch }: FiltersProps) => {
  const { vaults } = usePortfolioProvider()
  const availableStrategies = useMemo(() => {
    return vaults.reduce( (availableStrategies: string[], v: Vault) => {
      if (availableStrategies.includes(v.type) || !strategies[v.type]?.visible) return availableStrategies
      return [
        ...availableStrategies,
        v.type
      ]
    }, [])
  }, [vaults])

  const toggleStrategy = useCallback((strategy: string) => {
    // Add strategy
    if (!filterValues.includes(strategy)){
      dispatch({type:'SET_STRATEGIES', payload: [
        ...filterValues,
        strategy
      ]})
    // Remove strategy
    } else {
      dispatch({type:'SET_STRATEGIES', payload: filterValues.filter( (s: string) => s !== strategy )})
    }
  }, [filterValues, dispatch])

  const renderedStrategies = useMemo(() => availableStrategies.map( (strategy: string) => (
    <HStack
      py={2}
      spacing={10}
      width={'full'}
      key={`strategy_${strategy}`}
      justifyContent={'space-between'}
    >
      <StrategyLabel textStyle={'captionSmall'} strategy={strategy} />
      <Checkbox isChecked={filterValues.includes(strategy)} onChange={() => toggleStrategy(strategy)} defaultChecked />
    </HStack>
  )), [availableStrategies, filterValues, toggleStrategy])

  return (
    <VStack
      spacing={1}
      width={'full'}
    >
      {renderedStrategies}
    </VStack>
  )
}

const AssetFilter = ({ filterValues, dispatch }: FiltersProps) => {
  const { vaults, selectors: { selectAssetById } } = usePortfolioProvider()
  
  const availableAssets = useMemo(() => {
    return vaults.reduce( (availableAssets: string[], vault: Vault) => {
      const asset = selectAssetById(vault.id)
      if (!asset || availableAssets.includes(asset.underlyingId) || !strategies[vault.type]?.visible) return availableAssets
      return [
        ...availableAssets,
        asset.underlyingId
      ]
    }, [])
  }, [vaults, selectAssetById])

  const toggleAsset = useCallback((asset: string) => {
    // Add asset
    if (!filterValues.includes(asset)){
      dispatch({type:'SET_ASSETS', payload: [
        ...filterValues,
        asset
      ]})
    // Remove asset
    } else {
      dispatch({type:'SET_ASSETS', payload: filterValues.filter( (s: string) => s !== asset )})
    }
  }, [filterValues, dispatch])

  const renderedAssets = useMemo(() => availableAssets.map( (assetId: AssetId) => (
    <HStack
      py={2}
      spacing={10}
      width={'full'}
      key={`asset_${assetId}`}
      justifyContent={'space-between'}
    >
      <AssetLabel size={'xs'} textStyle={'captionSmall'} fontSize={'sm'} assetId={assetId} />
      <Checkbox isChecked={filterValues.includes(assetId)} onChange={() => toggleAsset(assetId)} defaultChecked />
    </HStack>
  )), [availableAssets, filterValues, toggleAsset])

  return (
    <VStack
      spacing={1}
      width={'full'}
    >
      {renderedAssets}
    </VStack>
  )
}

const ProtocolFilter = ({ filterValues, dispatch }: FiltersProps) => {
  const { vaults, selectors: { selectAssetById } } = usePortfolioProvider()
  
  const availableProtocols = useMemo(() => {
    return vaults.reduce( (availableProtocols: string[], vault: Vault) => {
      const asset = selectAssetById(vault.id)
      if (!asset || !asset.protocol || availableProtocols.includes(asset.protocol) || !strategies[vault.type]?.visible) return availableProtocols
      return [
        ...availableProtocols,
        asset.protocol
      ]
    }, [])
  }, [vaults, selectAssetById])

  const toggleProtocol = useCallback((protocol: string) => {
    // Add protocol
    if (!filterValues.includes(protocol)){
      dispatch({type:'SET_PROTOCOLS', payload: [
        ...filterValues,
        protocol
      ]})
    // Remove protocol
    } else {
      dispatch({type:'SET_PROTOCOLS', payload: filterValues.filter( (s: string) => s !== protocol )})
    }
  }, [filterValues, dispatch])

  const renderedProtocols = useMemo(() => availableProtocols.map( (protocol: string) => (
    <HStack
      py={2}
      spacing={10}
      width={'full'}
      key={`protocol_${protocol}`}
      justifyContent={'space-between'}
    >
      <ProtocolLabel size={'xs'} textStyle={'captionSmall'} fontSize={'sm'} protocolId={protocol} />
      <Checkbox isChecked={filterValues.includes(protocol)} onChange={() => toggleProtocol(protocol)} defaultChecked />
    </HStack>
  )), [availableProtocols, filterValues, toggleProtocol])

  return (
    <VStack
      spacing={1}
      width={'full'}
    >
      {renderedProtocols}
    </VStack>
  )
}

const ApyFilter = ({ filterValues, dispatch }: FiltersProps) => {
  const { isPortfolioLoaded, vaults, selectors: { selectAssetById } } = usePortfolioProvider()
  
  const availableRange: RangeType = useMemo(() => {
    return vaults.reduce( (availableRange: RangeType, vault: Vault) => {
      const asset = selectAssetById(vault.id)
      if (!asset || !strategies[vault.type]?.visible) return availableRange
      availableRange.minValue = !availableRange.minValue ? BNify(asset.apy) : BigNumber.minimum(BNify(asset.apy), availableRange.minValue)
      availableRange.maxValue = !availableRange.maxValue ? BNify(asset.apy) : BigNumber.maximum(BNify(asset.apy), availableRange.maxValue)
      return availableRange
    }, {
      minValue: null,
      maxValue: null
    })
  }, [vaults, selectAssetById])

  const updateRange = useCallback((range: number[]) => {
    dispatch({type:'SET_APY', payload: {minValue: BNify(range[0]), maxValue: BNify(range[1])}})
  }, [dispatch])

  const reset = useCallback(() => {
    dispatch({type:'SET_APY', payload: availableRange})
  }, [dispatch, availableRange])

  return availableRange.minValue && availableRange.maxValue ? (
    <VStack
      spacing={6}
      width={'full'}
    >
      <VStack
        spacing={1}
        width={'full'}
        alignItems={'flex-start'}
      >
        <Translation translation={'stats.filters.rangeSelected'} textStyle={'captionSmall'} />
        <HStack
          width={'full'}
          justifyContent={'space-between'}
        >
          <HStack
            spacing={1}
          >
            <Amount.Percentage value={filterValues.minValue || availableRange.minValue} textStyle={'ctaStatic'} />
            <Text textStyle={'ctaStatic'}>-</Text>
            <Amount.Percentage value={filterValues.maxValue || availableRange.maxValue} textStyle={'ctaStatic'} />
          </HStack>
          <Translation translation={'common.reset'} textStyle={'linkBlue'} onClick={() => reset()} />
        </HStack>
      </VStack>
      <Box
        px={1}
        width={'full'}
      >
        <RangeSlider
          step={0.1}
          onChange={(range) => updateRange(range)}
          min={bnOrZero(availableRange.minValue).toNumber()}
          max={bnOrZero(availableRange.maxValue).toNumber()}
          value={[bnOrZero(filterValues.minValue).toNumber(), bnOrZero(filterValues.maxValue).toNumber()]}
          defaultValue={[bnOrZero(availableRange.minValue).toNumber(), bnOrZero(availableRange.maxValue).toNumber()]}
        >
          <RangeSliderTrack>
            <RangeSliderFilledTrack />
          </RangeSliderTrack>
          <RangeSliderThumb index={0} />
          <RangeSliderThumb index={1} />
        </RangeSlider>
      </Box>
    </VStack>
  ) : null
}

const TvlFilter = ({ filterValues, dispatch }: FiltersProps) => {
  const { isPortfolioLoaded, vaults, selectors: { selectAssetById } } = usePortfolioProvider()
  
  const availableRange: RangeType = useMemo(() => {
    return vaults.reduce( (availableRange: RangeType, vault: Vault) => {
      const asset = selectAssetById(vault.id)
      if (!asset || !strategies[vault.type]?.visible) return availableRange
      availableRange.minValue = !availableRange.minValue ? BNify(asset.tvlUsd) : BigNumber.minimum(BNify(asset.tvlUsd), availableRange.minValue)
      availableRange.maxValue = !availableRange.maxValue ? BNify(asset.tvlUsd) : BigNumber.maximum(BNify(asset.tvlUsd), availableRange.maxValue)
      return availableRange
    }, {
      minValue: null,
      maxValue: null
    })
  }, [vaults, selectAssetById])

  const updateRange = useCallback((range: number[]) => {
    dispatch({type:'SET_TVL', payload: {minValue: BNify(range[0]), maxValue: BNify(range[1])}})
  }, [dispatch])

  const reset = useCallback(() => {
    dispatch({type:'SET_TVL', payload: availableRange})
  }, [dispatch, availableRange])

  return availableRange.minValue && availableRange.maxValue ? (
    <VStack
      spacing={6}
      width={'full'}
    >
      <VStack
        spacing={1}
        width={'full'}
        alignItems={'flex-start'}
      >
        <Translation translation={'stats.filters.rangeSelected'} textStyle={'captionSmall'} />
        <HStack
          width={'full'}
          justifyContent={'space-between'}
        >
          <HStack
            spacing={1}
          >
            <Amount.Usd value={filterValues.minValue || availableRange.minValue} textStyle={'ctaStatic'} />
            <Text textStyle={'ctaStatic'}>-</Text>
            <Amount.Usd value={filterValues.maxValue || availableRange.maxValue} textStyle={'ctaStatic'} />
          </HStack>
          <Translation translation={'common.reset'} textStyle={'linkBlue'} onClick={() => reset()} />
        </HStack>
      </VStack>
      <Box
        px={1}
        width={'full'}
      >
        <RangeSlider
          step={100}
          onChange={(range) => updateRange(range)}
          min={bnOrZero(availableRange.minValue).toNumber()}
          max={bnOrZero(availableRange.maxValue).toNumber()}
          value={[bnOrZero(filterValues.minValue).toNumber(), bnOrZero(filterValues.maxValue).toNumber()]}
          defaultValue={[bnOrZero(availableRange.minValue).toNumber(), bnOrZero(availableRange.maxValue).toNumber()]}
        >
          <RangeSliderTrack>
            <RangeSliderFilledTrack />
          </RangeSliderTrack>
          <RangeSliderThumb index={0} />
          <RangeSliderThumb index={1} />
        </RangeSlider>
      </Box>
    </VStack>
  ) : null
}

const Filters = ({type, filterValues, dispatch}: FiltersProps) => {
  switch (type){
    case 'strategies':
      return (<StrategyFilter filterValues={filterValues} dispatch={dispatch} />)
    case 'assets':
      return (<AssetFilter filterValues={filterValues} dispatch={dispatch} />)
    case 'protocols':
      return (<ProtocolFilter filterValues={filterValues} dispatch={dispatch} />)
    case 'apy':
      return (<ApyFilter filterValues={filterValues} dispatch={dispatch} />)
    case 'tvl':
      return (<TvlFilter filterValues={filterValues} dispatch={dispatch} />)
    default:
      return null
  }
}

type ContextProps = {
  vaults: Vault[]
}

const initialState: ContextProps = {
  vaults: []
}

export const VaultsFiltersContext = createContext<ContextProps>(initialState)
export const useVaultsFiltersProvider = () => useContext(VaultsFiltersContext)

type VaultsFiltersProviderProps = {
  types: string[]
} & ProviderProps

type ReducerType = {
  apy: RangeType
  tvl: RangeType
  assets: AssetId[]
  protocols: string[]
  strategies: string[]
}

const reducerInitialState: ReducerType = {
  apy: {},
  tvl: {},
  assets: [],
  protocols: [],
  strategies: []
}

const filtersReducer = (state: ReducerType, action: ReducerActionTypes) => {
  switch (action.type){
    case 'SET_ASSETS':
      return {...state, assets: action.payload}
    case 'SET_PROTOCOLS':
      return {...state, protocols: action.payload}
    case 'SET_STRATEGIES':
      return {...state, strategies: action.payload}
    case 'SET_APY':
      return {...state, apy: action.payload}
    case 'SET_TVL':
      return {...state, tvl: action.payload}
    default:
      return {...state}
  }
}

const Selector = ({type, filterValues, dispatch, isScrollable = true}: FiltersProps & {isScrollable?: boolean}) => {
  const theme = useTheme()
  const [ref, { width }] = useBoundingRect()
  return (
    <Menu
      key={`menu_${type}`}
    >
      {({ isOpen }) => (
        <>
          <MenuButton ref={ref as typeof useRef} as={Button} layerStyle={['card', 'cardHover']} sx={{ '&[data-active]':{ background: theme.colors.itemHover } }} py={2} style={{paddingLeft:16, paddingRight:4}}>
            <HStack
              width={'full'}
              justifyContent={'space-between'}
            >
              <Translation translation={`stats.filters.${type}`} textStyle={'cta'} />
              {
                isOpen ? (
                  <MdKeyboardArrowUp
                    size={24}
                    color={theme.colors.cta}
                  />
                ) : (
                  <MdKeyboardArrowDown
                    size={24}
                    color={theme.colors.cta}
                  />
                )
              }
            </HStack>
          </MenuButton>
          <MenuList
            pr={isScrollable ? 0 : 4}
            width={width}
          >
            {
              isScrollable ? (
                <Scrollable
                  pr={4}
                  maxH={'200px'}
                >
                  <Filters type={type} filterValues={filterValues} dispatch={dispatch} />
                </Scrollable>
              ) : (
                <Filters type={type} filterValues={filterValues} dispatch={dispatch} />
              )
            }
          </MenuList>
        </>
      )}
    </Menu>
  )
}

export const VaultsFiltersProvider = ({ children, types }: VaultsFiltersProviderProps) => {
  const { vaults, selectors: { selectAssetById } } = usePortfolioProvider()
  const [ selectedFilters, dispatch ] = useReducer(filtersReducer, reducerInitialState)

  const visibleStrategies = useMemo(() => Object.keys(strategies).filter( strategy => strategies[strategy].visible ), [])

  const checkVaultFilters = useCallback((vault: Vault) => {
    const asset = selectAssetById(vault.id)
    if (!asset) return false

    // Check strategy visibility
    if (visibleStrategies && !visibleStrategies.includes(vault.type)) return false
    
    // Check strategy
    if (selectedFilters.strategies.length && !selectedFilters.strategies.includes(vault.type)) return false
    
    // Check assets
    if (selectedFilters.assets.length && !selectedFilters.assets.includes(asset.underlyingId)) return false

    // Check protocols
    if (selectedFilters.protocols.length && !selectedFilters.protocols.includes(asset.protocol)) return false

    // Check min APY
    if (selectedFilters.apy.minValue && asset.apy.lt(selectedFilters.apy.minValue)) return false

    // Check max APY
    if (selectedFilters.apy.maxValue && asset.apy.gt(selectedFilters.apy.maxValue)) return false

    // Check min TVL
    if (selectedFilters.tvl.minValue && asset.tvl.lt(selectedFilters.tvl.minValue)) return false

    // Check max TVL
    if (selectedFilters.tvl.maxValue && asset.tvl.gt(selectedFilters.tvl.maxValue)) return false

    return true
  }, [selectedFilters, visibleStrategies, selectAssetById])

  const filteredVaults = useMemo(() => vaults.filter( (vault: Vault) => checkVaultFilters(vault) ), [checkVaultFilters, vaults])

  const selectorsProperties: Record<string, any> = {
    'apy':{
      isScrollable: false
    },
    'tvl':{
      isScrollable: false
    }
  }

  return (
    <VaultsFiltersContext.Provider value={{vaults: filteredVaults}}>
      <VStack
        spacing={0}
        width={'full'}
      >
        <SimpleGrid
          spacing={4}
          width={'full'}
          columns={[1, types.length]}
        >
          {
            types.map( (type: string) => (
              <Selector type={type} filterValues={selectedFilters[type as keyof ReducerType]} dispatch={dispatch} {...(selectorsProperties[type] ? selectorsProperties[type] : {})} />
            ))
          }
        </SimpleGrid>
        {children}
      </VStack>
    </VaultsFiltersContext.Provider>
  )
}