import { BNify } from 'helpers/'
import React, { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import type { AssetId } from 'constants/types'
import { Amount } from 'components/Amount/Amount'
import { BestYieldVault } from 'vaults/BestYieldVault'
import { useWalletProvider } from 'contexts/WalletProvider'
import type { IdleTokenProtocol } from 'constants/vaults'
import { AssetsIcons } from 'components/AssetsIcons/AssetsIcons'
import { AddressLink } from 'components/AddressLink/AddressLink'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { selectUnderlyingToken, selectProtocol } from 'selectors/'
import { ProtocolLabel } from 'components/ProtocolLabel/ProtocolLabel'
import { HStack, VStack, Heading, SimpleGrid, Text } from '@chakra-ui/react'

type VaultUnderlyingProtocols = {
  assetId: AssetId | undefined
}

export const VaultUnderlyingProtocols: React.FC<VaultUnderlyingProtocols> = ({ assetId }) => {
  const { chainId } = useWalletProvider()
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(assetId)
  }, [selectVaultById, assetId])

  if (!vault || !(vault instanceof BestYieldVault)) return null
  if (!("tokenConfig" in vault) || !vault.tokenConfig?.protocols) return null

  console.log('VaultUnderlyingProtocols', asset, vault)

  return (
    <VStack
      spacing={6}
      alignItems={'flex-start'}
    >
      <Translation component={Heading} as={'h3'} size={'md'} translation={'defi.underlyingProtocols'} />
      <SimpleGrid
        spacing={6}
        width={'100%'}
        columns={[1, 3]}
      >
      {
        vault.tokenConfig?.protocols.map( (protocol: IdleTokenProtocol) => {
          const protocolConfig = selectProtocol(protocol.name)
          const allocationPercentage = BNify(asset.allocations?.[protocol.name]).div(100)
          const allocationUsd = BNify(asset?.tvlUsd).times(allocationPercentage)
          const assetIds = protocolConfig?.govTokens?.reduce( (assetIds: string[], tokenName: string) => {
            const underlyingToken = selectUnderlyingToken(chainId, tokenName)
            if (underlyingToken?.address){
              assetIds.push(underlyingToken.address)
            }
            return assetIds
          }, [])

          console.log('assetIds', protocol.name, assetIds)
          return (
            <Card
              p={6}
              key={`protocol_${protocol.name}`}
            >
              <VStack
                spacing={6}
                width={'100%'}
                alignItems={'flex-start'}
              >
                <ProtocolLabel protocolId={protocol.name} size={'xs'} />
                <HStack
                  spacing={6}
                >
                  <VStack
                    spacing={1}
                    alignItems={'flex-start'}
                  >
                    <Translation component={Text} translation={'defi.poolAddress'} textStyle={'captionSmall'} />
                    <AddressLink address={protocol.address} />
                  </VStack>
                  <VStack
                    spacing={1}
                    alignItems={'flex-start'}
                  >
                    <Translation component={Text} translation={'defi.govToken'} textStyle={'captionSmall'} />
                    {
                      !assetIds ? (
                        <Text textStyle={'captionSmall'}>-</Text>
                      ) : (
                        <AssetsIcons assetIds={assetIds} showTooltip={true} size={'xs'} />
                      )
                    }
                  </VStack>
                  <VStack
                    spacing={1}
                    alignItems={'flex-start'}
                  >
                    <Translation component={Text} translation={'assets.assetDetails.generalData.allocation'} textStyle={'captionSmall'} />
                    <Amount.Usd value={allocationUsd} textStyle={'tableCell'} />
                  </VStack>
                </HStack>
              </VStack>
            </Card>
          )
        })
      }
      </SimpleGrid>
    </VStack>
  )
}