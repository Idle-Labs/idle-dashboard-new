import { useMemo } from 'react'
import type { Asset } from 'constants/types'
import { VaultCard } from 'components/VaultCard/VaultCard'
import { products, ProductProps } from 'constants/products'
import { isEmpty, divideArray, sortArrayByKey } from 'helpers/'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { strategies, StrategyColumn } from 'constants/strategies'
import { HStack, VStack, Heading, SimpleGrid } from '@chakra-ui/react'
import { PausableChakraCarouselProvider } from 'components/PausableChakraCarousel/PausableChakraCarousel'

type BoostedVaultsProps = {
}

export const BoostedVaults: React.FC<BoostedVaultsProps> = ({}) => {

  const {
    isPortfolioLoaded,
    selectors: {
      selectVaultById,
      selectVaultsAssetsByType
    }
  } = usePortfolioProvider()

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
      const vault = selectVaultById(asset.id)
      return !isEmpty(asset.rewardsEmissions) || !isEmpty(asset.distributedRewards)// || (vault && "rewardTokens" in vault && !isEmpty(vault.rewardTokens))
    })
  }, [allVaultsAssets, selectVaultById])

  const boostedVaultsGroupped = divideArray(sortArrayByKey(boostedVaults, 'tvlUsd', 'desc').slice(0, 12), 6)

  if (!isPortfolioLoaded) return null

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
            boostedVaultsGroupped.map( (grouppedVaults: Asset[], index: number) => (
              <SimpleGrid
                key={index}
                columns={6}
                spacing={4}
                width={'full'}
              >
                {
                  grouppedVaults.map( (asset: Asset, index1: number) => <VaultCard.New key={index1} assetId={asset.id as string} /> )
                }
              </SimpleGrid>
            ))
          }
        </PausableChakraCarouselProvider.Carousel>
      </PausableChakraCarouselProvider>
    </VStack>
  )
}