import type { Vault } from 'vaults/'
import React, { useMemo } from 'react'
import type { Asset } from 'constants/types'
import { Card } from 'components/Card/Card'
import { strategies } from 'constants/strategies'
import { TrancheVault } from 'vaults/TrancheVault'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { StrategyLabel } from 'components/StrategyLabel/StrategyLabel'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { SimpleGrid, VStack, HStack, Flex, Tag, TagLabel } from '@chakra-ui/react'

type VaultCardStatsProps = {
  vault: Vault
}

export const VaultCardStats: React.FC<VaultCardStatsProps> = ({ vault }) => {

  const vaultStrategies = useMemo(() => {
    const vaultTypes = (vault instanceof TrancheVault) ? ['AA', 'BB'] : [vault.type]
    return (
      <AssetProvider
        assetId={vault.id}
        wrapFlex={false}
      >
        <HStack
          width={'full'}
          justifyContent={'space-between'}
        >
          <Tag bg={'brand.blue'} size={'md'}>
            <TagLabel>
              <AssetProvider.ProtocolName textStyle={'ctaStatic'} fontSize={'sm'} textTransform={'capitalize'} fontWeight={600} />
            </TagLabel>
          </Tag>
          <HStack
            spacing={2}
            width={'full'}
            justifyContent={'flex-end'}
          >
          {
            vaultTypes.map( vaultType => <StrategyLabel strategy={vaultType} showLabel={false} /> )
          }
          </HStack>
        </HStack>
      </AssetProvider>
    )
  }, [vault])

  const vaultUnderlyingId = useMemo(() => {
    if (!vault || !("underlyingToken" in vault) || !vault.underlyingToken) return
    return vault.underlyingToken.address?.toLowerCase()
  }, [vault])

  return (
    <Card
      p={4}
    >
      <VStack
        spacing={4}
      >
        {vaultStrategies}
        <Flex
          width={'full'}
          alignItems={'center'}
          justifyContent={'center'}
        >
          <AssetLabel assetId={vaultUnderlyingId} size={'md'} fontSize={'xl'} spacing={4} />
        </Flex>
        <HStack
          justifyContent={'space-between'}
        >

        </HStack>
      </VStack>
    </Card>
  )
}

export const Stats: React.FC = () => {
  const {
    vaults,
    assetsData: assets,
    isPortfolioLoaded
  } = usePortfolioProvider()

  const enabledStrategies = useMemo(() => Object.keys(strategies).filter( strategy => strategies[strategy].visible ), [])

  const visibleVaults = useMemo(() => {
    return Object.values(vaults).reduce( (visibleVaults: Vault[], vault: Vault) => {
      const vaultAlreadyPresent = vault instanceof TrancheVault && (visibleVaults.filter( (v: Vault) => v instanceof TrancheVault) as Array<TrancheVault>).find( (v: TrancheVault) => v.cdoConfig.address === vault.cdoConfig.address )
      if (enabledStrategies.includes(vault.type as string) && !vaultAlreadyPresent){
        visibleVaults.push(vault)
      }
      return visibleVaults
    }, [])
  }, [vaults, enabledStrategies])

  console.log('visibleVaults', visibleVaults)

  return (
    <SimpleGrid
      spacing={6}
      columns={[1, 4]}
    >
      {
        visibleVaults.map( (vault: Vault) => <VaultCardStats vault={vault} /> )
      }
    </SimpleGrid>
  )
}