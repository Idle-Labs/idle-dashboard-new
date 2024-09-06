import { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Asset, AssetId } from 'constants/types'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { VaultCard } from 'components/VaultCard/VaultCard'
import { VStack, Heading, SimpleGrid } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { VAULTS_MIN_TVL, products, ProductProps, strategies } from 'constants/'
import { isEmpty, divideArray, sortArrayByKey, sendSelectItem, getVaultPath, bnOrZero } from 'helpers/'
import { PausableChakraCarouselProvider } from 'components/PausableChakraCarousel/PausableChakraCarousel'

export const BoostedVaults: React.FC = () => {

  const {
    isPortfolioLoaded,
    selectors: {
      selectVaultsAssetsByType
    }
  } = usePortfolioProvider()

  const navigate = useNavigate()
  const { isMobile } = useThemeProvider()

  const allStrategies = useMemo(() => {
    return products.reduce( (allStrategies: (keyof typeof strategies)[], product: ProductProps) => {
      return [...allStrategies, ...product.strategies]
    }, [])
  }, [])

  const allVaultsAssets = useMemo(() => {
    return allStrategies.reduce( (allAssets: Asset[], strategy: string) => {
      return [
        ...allAssets,
        ...selectVaultsAssetsByType(strategy)
      ]
    }, [])
  }, [allStrategies, selectVaultsAssetsByType])

  const boostedVaults = useMemo(() => {
    return allVaultsAssets.filter( (asset: Asset) => {
      return asset.status !== 'deprecated' && bnOrZero(asset.tvlUsd).gte(VAULTS_MIN_TVL) && (!isEmpty(asset.rewardsEmissions) || !isEmpty(asset.distributedRewards))
    })
  }, [allVaultsAssets])

  const boostedVaultsSorted = useMemo(() => sortArrayByKey(boostedVaults, 'apy', 'desc').slice(0, 10), [boostedVaults]) 
  const boostedVaultsGroupped = useMemo(() => divideArray(boostedVaultsSorted, 5), [boostedVaultsSorted]) 

  const onVaultClick = useCallback((asset: Asset) => {
    sendSelectItem('dashboard_boosted', 'Dashboard boosted', asset)
    return navigate(getVaultPath(asset.type as string, asset.id as AssetId))
  }, [navigate])

  if (!isPortfolioLoaded || isEmpty(boostedVaultsSorted)) return null

  return (
    <VStack
      spacing={4}
      width={'full'}
      alignItems={'flex-start'}
    >
      <Translation component={Heading} as={'h3'} fontSize={'lg'} translation={'defi.boostedVaults'} />
      <PausableChakraCarouselProvider delay={10000}>
        <PausableChakraCarouselProvider.Carousel progressColor={'card.bgLight'}>
          {
            isMobile ?
              boostedVaultsSorted.map( (asset: Asset, index: number) => <VaultCard.New key={index} assetId={asset.id as string} onClick={() => onVaultClick(asset)} /> )
            : boostedVaultsGroupped.map( (grouppedVaults: Asset[], index: number) => (
              <SimpleGrid
                key={index}
                columns={[1, 5]}
                spacing={6}
                width={'full'}
              >
                {
                  grouppedVaults.map( (asset: Asset, index1: number) => <VaultCard.New key={index1} assetId={asset.id as string} onClick={() => onVaultClick(asset)} /> )
                }
              </SimpleGrid>
            ))
          }
        </PausableChakraCarouselProvider.Carousel>
        <PausableChakraCarouselProvider.ArrowNav />
      </PausableChakraCarouselProvider>
    </VStack>
  )
}