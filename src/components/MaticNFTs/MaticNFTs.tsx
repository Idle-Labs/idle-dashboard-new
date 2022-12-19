import { formatDate } from 'helpers/'
import React, { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import { DATETIME_FORMAT } from 'constants/vars'
import { Amount } from 'components/Amount/Amount'
import { selectUnderlyingToken } from 'selectors/'
import { AssetId, MaticNFT } from 'constants/types'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { HStack, VStack, SimpleGrid, Text } from '@chakra-ui/react'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { TransactionButton } from 'components/TransactionButton/TransactionButton'

type MaticNFTsProps = {
  assetId: AssetId
}
export const MaticNFTs: React.FC<MaticNFTsProps> = ({ assetId }) => {
  const { maticNFTs, selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(assetId)
  }, [selectVaultById, assetId])

  const showMaticNFTs = useMemo(() => {
    return vault && ("flags" in vault) && vault.flags?.showMaticNFTs
  }, [vault])
  
  if (!maticNFTs?.length) return null

  return (
    <VStack
      spacing={6}
      width={'100%'}
      id={'vault-rewards'}
      alignItems={'flex-start'}
    >
      <Translation translation={'defi.claimableNTFs'} component={Text} textStyle={'heading'} fontSize={'h3'} />
      <SimpleGrid
        spacing={6}
        width={'100%'}
        columns={[1, 3]}
      >
        {
          maticNFTs && maticNFTs.map( (maticNFT: MaticNFT) => {
            return (
              <Card
                p={6}
                key={`nft_${maticNFT.tokenId}`}
              >
                <VStack
                  spacing={6}
                  width={'100%'}
                  alignItems={'flex-start'}
                >
                  <HStack
                    width={'100%'}
                    justifyContent={'space-between'}
                  >
                    <AssetLabel assetId={assetId} />
                    <Text textStyle={'heading'} fontSize={'h3'} whiteSpace={'nowrap'}>#{maticNFT.tokenId}</Text>
                  </HStack>
                  <HStack
                    spacing={4}
                    width={'100%'}
                    justifyContent={'space-between'}
                  >
                    {
                      maticNFT.status === 'available' ? (
                        <TransactionButton text={'defi.claim'} vaultId={vault?.id} assetId={asset?.underlyingId} contractSendMethod={maticNFT.contractSendMethod} actionType={'claim'} amount={maticNFT.amount.toString()} disabled={maticNFT.amount.lte(0)} />
                      ) : (
                        <VStack
                          spacing={1}
                          alignItems={'flex-start'}
                        >
                          <Translation component={Text} translation={'defi.estUnlockDate'} textStyle={'captionSmall'} />
                          <HStack
                            spacing={1}
                          >
                            <Text textStyle={'tableCell'}>{formatDate(maticNFT.unlockTimestamp, DATETIME_FORMAT)}</Text>
                          </HStack>
                        </VStack>
                      )
                    }
                    <VStack
                      spacing={1}
                      alignItems={'flex-end'}
                    >
                      <Translation component={Text} translation={'defi.claimable'} textStyle={'captionSmall'} />
                      <HStack
                        spacing={1}
                        justifyContent={'flex-end'}
                      >
                        <Amount value={maticNFT.amount} decimals={8} textStyle={'tableCell'} />
                        <AssetProvider assetId={asset?.underlyingId}>
                          <AssetProvider.Name textStyle={'tableCell'} />
                        </AssetProvider>
                      </HStack>
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