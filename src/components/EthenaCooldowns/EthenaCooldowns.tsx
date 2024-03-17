import React, { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import { formatDate, isEmpty } from 'helpers/'
import { DATETIME_FORMAT } from 'constants/vars'
import { Amount } from 'components/Amount/Amount'
import { useWeb3Provider } from 'contexts/Web3Provider'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { AssetId, EthenaCooldown, Abi } from 'constants/types'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { HStack, VStack, SimpleGrid, Text } from '@chakra-ui/react'
import { useAssetPageProvider } from 'components/AssetPage/AssetPage'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import EthenaCooldownRequest from 'abis/ethena/EthenaCooldownRequest.json'
import { TransactionButton } from 'components/TransactionButton/TransactionButton'
import { SwitchNetworkButton } from 'components/SwitchNetworkButton/SwitchNetworkButton'

type EthenaCooldownsProps = {
  assetId: AssetId
}
export const EthenaCooldowns: React.FC<EthenaCooldownsProps> = ({ assetId }) => {
  const { web3 } = useWeb3Provider()
  const { isNetworkCorrect } = useAssetPageProvider()
  const { ethenaCooldowns, selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(assetId)
  }, [selectVaultById, assetId])

  const showEthenenaCooldowns = useMemo(() => {
    return vault && ("flags" in vault) && vault.flags?.showEthenenaCooldowns
  }, [vault])
  
  if (!showEthenenaCooldowns || isEmpty(ethenaCooldowns) || !web3) return null

  return (
    <VStack
      spacing={6}
      width={'100%'}
      id={'vault-rewards'}
      alignItems={'flex-start'}
    >
      <Translation translation={'defi.pendingWithdrawals'} component={Text} textStyle={'heading'} fontSize={'h3'} />
      <SimpleGrid
        spacing={6}
        width={'100%'}
        columns={[1, 3]}
      >
        {
          ethenaCooldowns && ethenaCooldowns.map( (ethenaCooldown: EthenaCooldown) => {
            const ethenaCooldownRequestContract = new web3.eth.Contract(EthenaCooldownRequest as Abi, ethenaCooldown.contractAddress)
            const contractSendMethod = ethenaCooldownRequestContract.methods.unstake()
            return (
              <Card
                p={6}
                key={`cooldown_${ethenaCooldown.underlyingId}`}
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
                    {/*<Text textStyle={'heading'} fontSize={'h3'} whiteSpace={'nowrap'}>#{ethenaCooldown.underlyingId}</Text>*/}
                  </HStack>
                  <HStack
                    spacing={4}
                    width={'100%'}
                    justifyContent={'space-between'}
                  >
                    {
                      ethenaCooldown.status === 'available' ? (
                        isNetworkCorrect ? (
                          <TransactionButton text={'defi.claim'} vaultId={vault?.id} assetId={asset?.underlyingId} contractSendMethod={contractSendMethod} actionType={'claim'} amount={ethenaCooldown.amount.toString()} disabled={ethenaCooldown.amount.lte(0)} />
                        ) : (
                          <SwitchNetworkButton chainId={asset.chainId} size={'sm'} />
                        )
                      ) : (
                        <VStack
                          spacing={1}
                          alignItems={'flex-start'}
                        >
                          <Translation component={Text} translation={'defi.estUnlockDate'} textStyle={'captionSmall'} />
                          <HStack
                            spacing={1}
                          >
                            <Text textStyle={'tableCell'}>{formatDate(ethenaCooldown.cooldownEnd, DATETIME_FORMAT)}</Text>
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
                        <Amount value={ethenaCooldown.amount} decimals={6} textStyle={'tableCell'} />
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