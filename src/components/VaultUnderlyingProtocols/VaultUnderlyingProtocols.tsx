import { BNify } from 'helpers/'
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
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(assetId)
  }, [selectVaultById, assetId])

  if (!vault || !(vault instanceof BestYieldVault)) return null
  if (!("tokenConfig" in vault) || !vault.tokenConfig?.protocols.length) return null

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
          // const protocolConfig = selectProtocol(protocol.name)
          const allocationPercentage = BNify(asset.allocations?.[protocol.name]).div(100)
          const allocationUsd = BNify(asset?.tvlUsd).times(allocationPercentage)
          const protocolApr = asset?.protocolsAprs?.[protocol.address.toLowerCase()]
            
          /*
          const assetIds = protocolConfig?.govTokens?.reduce( (assetIds: string[], tokenName: string) => {
            const underlyingToken = selectUnderlyingToken(chainId, tokenName)
            if (underlyingToken?.address){
              assetIds.push(underlyingToken.address)
            }
            return assetIds
          }, [])
          */
          // console.log('protocolApr', asset, asset?.protocolsAprs, protocolApr)

          return (
            <AssetProvider
              wrapFlex={false}
              assetId={protocol.address}
              key={`protocol_${protocol.name}`}
            >
              <Card
                p={6}
              >
                <VStack
                  spacing={6}
                  width={'100%'}
                  alignItems={'flex-start'}
                >
                  <HStack
                    spacing={2}
                    width={'full'}
                    justifyContent={'space-between'}
                  >
                    <HStack
                      spacing={2}
                    >
                      <ProtocolLabel protocolId={protocol.name} size={'xs'} />
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
                      <AddressLink address={protocol.address} />{/*text={protocol.token} />*/}
                    </VStack>
                    <VStack
                      spacing={1}
                      alignItems={'flex-start'}
                    >
                      <Translation component={Text} translation={'defi.apy'} textStyle={'captionSmall'} />
                      <Amount.Percentage value={protocolApr} textStyle={'tableCell'} />
                      {
                        /*
                        !assetIds ? (
                          <Text textStyle={'captionSmall'}>-</Text>
                        ) : (
                          <AssetsIcons assetIds={assetIds} showTooltip={true} size={'xs'} />
                        )
                        */
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