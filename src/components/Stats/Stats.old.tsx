import type { Vault } from 'vaults/'
import { Card } from 'components/Card/Card'
import { useNavigate } from 'react-router-dom'
import type { AssetId } from 'constants/types'
import { TrancheVault } from 'vaults/TrancheVault'
import React, { useMemo, useCallback } from 'react'
// import { strategies } from 'constants/strategies'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
// import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { StrategyLabel } from 'components/StrategyLabel/StrategyLabel'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { SimpleGrid, VStack, HStack, Flex, Tag, TagLabel, Heading } from '@chakra-ui/react'
import { VaultsFiltersProvider, useVaultsFiltersProvider } from 'components/VaultsFiltersProvider/VaultsFiltersProvider'

type VaultCardStatsProps = {
  vault: Vault
}

export const VaultCardStats: React.FC<VaultCardStatsProps> = ({ vault }) => {
  const navigate = useNavigate()
  const { location } = useBrowserRouter()

  const onClick = useCallback((vaultId: AssetId) => {
    // sendSelectItem(item_list_id, item_list_name, row.original)
    return navigate(`${location?.pathname.replace(/\/$/, '')}/${vaultId}`)
  }, [navigate, location])

  const vaultStrategies = useMemo(() => {
    const vaultTypes = (vault instanceof TrancheVault) ? ['AA', 'BB'] : [vault.type]
    return (
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
          justifyContent={'flex-end'}
        >
        {
          vaultTypes.map( vaultType => <StrategyLabel key={`strategy_${vaultType}`} strategy={vaultType} showLabel={false} /> )
        }
        </HStack>
      </HStack>
    )
  }, [vault])

  const vaultUnderlyingId = useMemo(() => {
    if (!vault || !("underlyingToken" in vault) || !vault.underlyingToken) return
    return vault.underlyingToken.address?.toLowerCase()
  }, [vault])

  return (
    <AssetProvider
      assetId={vault.id}
      wrapFlex={false}
    >
      <Card
        p={4}
        onClick={() => onClick(vault.id)}
        layerStyle={['card', 'cardHover']}
      >
        <VStack
          spacing={5}
        >
          {vaultStrategies}
          <Flex
            width={'full'}
            alignItems={'center'}
            justifyContent={'center'}
          >
            <AssetLabel assetId={vaultUnderlyingId} size={'md'} fontSize={'2xl'} spacing={4} />
          </Flex>
          <HStack
            width={'full'}
            justifyContent={'flex-end'}
          >
            {/*<HStack>
              <AssetProvider.ProtocolIcon size={'xs'} />
              <AssetProvider.ProtocolName textStyle={'ctaStatic'} fontSize={'md'} textTransform={'capitalize'} fontWeight={600} />
            </HStack>*/}
            <HStack
              spacing={2}
            >
              <Translation translation={'defi.tvl'} textStyle={'captionSmall'} />
              <AssetProvider.TotalPoolUsd textStyle={'tableCell'} />
            </HStack>
          </HStack>
        </VStack>
      </Card>
    </AssetProvider>
  )
}

export const FilteredVaultsGrid: React.FC = () => {
  const { vaults } = useVaultsFiltersProvider()
  
  const filteredVaults = useMemo(() => {
    return Object.values(vaults).reduce( (visibleVaults: Vault[], vault: Vault) => {
      const statsEnabled = !("flags" in vault) || !vault?.flags || vault.flags?.statsEnabled === undefined || vault.flags.statsEnabled
      const vaultAlreadyPresent = vault instanceof TrancheVault && (visibleVaults.filter( (v: Vault) => v instanceof TrancheVault) as Array<TrancheVault>).find( (v: TrancheVault) => v.cdoConfig.address === vault.cdoConfig.address )
      if (statsEnabled && !vaultAlreadyPresent){
        visibleVaults.push(vault)
      }
      return visibleVaults
    }, [])
  }, [vaults])

  return (
    <SimpleGrid
      pt={6}
      spacing={6}
      width={'full'}
      columns={[1, 4]}
    >
      {filteredVaults.map( (vault: Vault) => <VaultCardStats key={`card_${vault.id}`} vault={vault} /> )}
    </SimpleGrid>
  )
}

export const Stats: React.FC = () => {
  return (
    <VStack
      mt={14}
      spacing={14}
      width={'full'}
    >
      <Translation translation={'defi.chooseAsset'} component={Heading} as={'h2'} size={'3xl'} />
      <VaultsFiltersProvider types={['strategies', 'assets', 'protocols', 'apy', 'tvl']}>
        <FilteredVaultsGrid />
      </VaultsFiltersProvider>
    </VStack>
  )
}