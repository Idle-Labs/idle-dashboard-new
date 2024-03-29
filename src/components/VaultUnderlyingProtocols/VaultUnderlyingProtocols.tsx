import { bnOrZero } from 'helpers/'
import React, { useMemo } from 'react'
import { Card } from 'components/Card/Card'
// import { selectProtocol } from 'selectors/'
import type { AssetId } from 'constants/types'
import { Amount } from 'components/Amount/Amount'
import { BestYieldVault } from 'vaults/BestYieldVault'
import type { IdleTokenProtocol } from 'constants/vaults'
// import { useWalletProvider } from 'contexts/WalletProvider'
// import { AssetsIcons } from 'components/AssetsIcons/AssetsIcons'
import { AddressLink } from 'components/AddressLink/AddressLink'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { ProtocolLabel } from 'components/ProtocolLabel/ProtocolLabel'
import { HStack, VStack, Heading, SimpleGrid, Text } from '@chakra-ui/react'

type VaultUnderlyingProtocolsProps = {
  assetId: AssetId | undefined
}

export const VaultUnderlyingProtocols: React.FC<VaultUnderlyingProtocolsProps> = ({ assetId }) => {
  // const { chainId } = useWalletProvider()
  const { selectors: { selectAssetById, selectVaultById, selectAssetPriceUsd, selectAssetInterestBearingTokens } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(assetId)
  }, [selectVaultById, assetId])

  const interestBearingTokens = useMemo(() => {
    return selectAssetInterestBearingTokens && selectAssetInterestBearingTokens(assetId)
  }, [selectAssetInterestBearingTokens, assetId])

  const underlyingPriceUsd = useMemo(() => {
    return asset && selectAssetPriceUsd && selectAssetPriceUsd(asset.underlyingId)
  }, [selectAssetPriceUsd, asset])

  if (!vault || !(vault instanceof BestYieldVault)) return null
  if (!("tokenConfig" in vault) || !vault.tokenConfig?.protocols.length) return null

  return (
    <VStack
      spacing={6}
      width={'full'}
      alignItems={'flex-start'}
    >
      <Translation component={Heading} as={'h3'} fontSize={'h3'} translation={'defi.underlyingProtocols'} />
      <SimpleGrid
        spacing={6}
        width={'100%'}
        columns={[1, 3]}
      >
      {
        vault.tokenConfig?.protocols.map( (protocol: IdleTokenProtocol) => {
          // const allocationPercentage = BNify(asset.allocations?.[protocol.address.toLowerCase()]).div(100)
          // const allocationUsd = BNify(asset?.tvlUsd).times(allocationPercentage)
          const allocationUsd = bnOrZero(interestBearingTokens?.[protocol.address.toLowerCase()]).times(underlyingPriceUsd)
          const protocolApr = asset?.protocolsAprs?.[protocol.address.toLowerCase()]
          const isIdleVault = selectVaultById(protocol.address) !== null

          return (
            <AssetProvider
              wrapFlex={false}
              assetId={protocol.address}
              key={`protocol_${protocol.address}`}
            >
              <Card
                p={6}
              >
                <VStack
                  spacing={5}
                  width={'100%'}
                  height={'100%'}
                  justifyContent={'space-between'}
                >
                  <HStack
                    spacing={2}
                    width={'full'}
                    alignItems={'flex-start'}
                    justifyContent={'space-between'}
                  >
                    <HStack
                      spacing={2}
                      alignItems={'flex-start'}
                    >
                      {
                        isIdleVault ? (
                          <AssetProvider.GeneralData field={'protocolWithVariant'} size={'sm'} />
                        ) : (
                          <ProtocolLabel protocolId={protocol.name} size={'sm'} />
                        )
                      }
                      <AssetProvider.Strategy prefix={'('} suffix={')'} color={'primary'} />
                    </HStack>
                    <AssetProvider.StrategyBadge width={6} height={6} />
                  </HStack>
                  <HStack
                    spacing={6}
                    width={'full'}
                    justifyContent={'space-between'}
                  >
                    <VStack
                      spacing={1}
                      alignItems={'flex-start'}
                    >
                      <Translation component={Text} translation={'defi.poolAddress'} textStyle={'captionSmall'} />
                      <AddressLink chainId={asset.chainId} address={protocol.address} />{/*text={protocol.token} />*/}
                    </VStack>
                    <VStack
                      spacing={1}
                      alignItems={'flex-start'}
                    >
                      <Translation component={Text} translation={'defi.apy'} textStyle={'captionSmall'} />
                      {
                        isIdleVault ? (
                          <AssetProvider.Apy textStyle={'tableCell'} />
                        ) : (
                          <Amount.Percentage value={protocolApr} textStyle={'tableCell'} />
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
            </AssetProvider>
          )
        })
      }
      </SimpleGrid>
    </VStack>
  )
}