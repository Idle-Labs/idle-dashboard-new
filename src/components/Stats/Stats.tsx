import type { Vault } from 'vaults/'
import React, { useMemo } from 'react'
import type { Asset } from 'constants/types'
import { Card } from 'components/Card/Card'
import { strategies } from 'constants/strategies'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { SimpleGrid, VStack, HStack, Flex } from '@chakra-ui/react'
import { StrategyLabel } from 'components/StrategyLabel/StrategyLabel'

type VaultCardStatsProps = {
  asset: Asset
}

export const VaultCardStats: React.FC<VaultCardStatsProps> = ({ asset }) => {
  return (
    <Card
      p={4}
    >
      <VStack
        spacing={4}
      >
        <HStack
          spacing={2}
          width={'full'}
          justifyContent={'flex-end'}
        >
          <StrategyLabel strategy={asset.type} showLabel={false} />
        </HStack>
        <Flex
          width={'full'}
          alignItems={'center'}
          justifyContent={'center'}
        >
          <AssetLabel assetId={asset.underlyingId} size={'md'} fontSize={'xl'} spacing={4} />
        </Flex>
      </VStack>
    </Card>
  )
}

export const Stats: React.FC = () => {
  const {
    assetsData: assets,
    isPortfolioLoaded
  } = usePortfolioProvider()

  const enabledStrategies = useMemo(() => Object.keys(strategies).filter( strategy => strategies[strategy].visible ), [])

  const visibleAssets = useMemo(() => {
    return Object.values(assets).filter( (asset: Asset) => enabledStrategies.includes(asset.type as string) )
  }, [assets, enabledStrategies])

  console.log('visibleAssets', visibleAssets)

  return (
    <SimpleGrid
      spacing={6}
      columns={[1, 4]}
    >
      {
        visibleAssets.map( (asset: Asset) => <VaultCardStats asset={asset} /> )
      }
    </SimpleGrid>
  )
}