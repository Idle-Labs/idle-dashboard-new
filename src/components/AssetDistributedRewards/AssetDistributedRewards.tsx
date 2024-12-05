import { Card } from 'components/Card/Card'
import { DATETIME_FORMAT } from 'constants/vars'
import { Amount } from 'components/Amount/Amount'
import React, { useMemo, useCallback } from 'react'
import { useModalProvider } from 'contexts/ModalProvider'
import { Scrollable } from 'components/Scrollable/Scrollable'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { VStack, Heading, SimpleGrid, Text, HStack } from '@chakra-ui/react'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { TransactionItem } from 'components/TransactionItem/TransactionItem'
import { BNify, sortArrayByKey, isEmpty, toDayjs, getVaultFlag, bnOrZero, getObjectPath, openWindow } from 'helpers/'
import type { AssetId, BigNumber, DistributedReward, UnderlyingTokenProps, ModalProps, Transaction } from 'constants/'

type AssetDistributedRewardsProps = {
  assetId?: AssetId
}

export const AssetDistributedRewards: React.FC<AssetDistributedRewardsProps> = ({assetId}) => {
  const { openModal } = useModalProvider()
  const { selectors: { selectAssetById, selectVaultById, selectVaultPosition } } = usePortfolioProvider()
  
  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(assetId)
  }, [selectVaultById, assetId])

  const vaultPosition = useMemo(() => {
    return selectVaultPosition && selectVaultPosition(assetId)
  }, [assetId, selectVaultPosition])

  const openHowItWorksModal = useCallback(() => {
    const distributionLink = vault.getFlag("rewardsDistributionLink")
    if (distributionLink){
      return openWindow(distributionLink)
    }
    const modalProps = vault.translations.distributedTokens.modal
    return openModal(modalProps as ModalProps, '2xl')
  }, [openModal, vault])

  const distributedRewards: DistributedReward[] = useMemo(() => {
    if (isEmpty(asset?.distributedRewards)) return []
    const distributedRewards = Object.keys(asset.distributedRewards).reduce( (distributedRewards: DistributedReward[], assetId: AssetId) => {
      return [
        ...distributedRewards,
        ...asset.distributedRewards[assetId]
      ]
    }, [])

    return sortArrayByKey(distributedRewards, 'timeStamp', 'desc')
  }, [asset])

  const rewardsHistory = useMemo(() => {
    if (!distributedRewards?.length) return null
    return (
      <Scrollable maxH={400}>
        {
          distributedRewards.map( (distributedReward: DistributedReward) => {
            const transaction: Transaction = {
              ...distributedReward.tx,
              action: 'distributed',
              idlePrice: BNify(0),
              idleAmount: BNify(0),
              chainId: distributedReward.chainId,
              assetId: distributedReward.assetId,
              underlyingAmount: distributedReward.value,
              amountUsd: bnOrZero(distributedReward.valueUsd).gt(0) ? BNify(distributedReward.valueUsd) : distributedReward.value
            }
            return (
              <TransactionItem key={`tx_${transaction.hash}`} transaction={transaction} />
            )
          })
        }
      </Scrollable>
    )
  }, [distributedRewards])

  const openRewardsHistoryModal = useCallback(() => {
    const modalProps = {
      cta: 'common.close',
      body: rewardsHistory,
      subtitle: 'common.rewardsHistory'
    }
    return openModal(modalProps as ModalProps, '2xl')
  }, [openModal, rewardsHistory])

  const showDistributedRewardsForReferralOnly = useMemo(() => {
    return vault && getVaultFlag(vault, 'showDistributedRewardsForReferralOnly')
  }, [vault])

  if (!asset || !("distributedTokens" in vault) || isEmpty(vault?.distributedTokens)) return null

  // Check referrals
  if (showDistributedRewardsForReferralOnly && bnOrZero(vaultPosition?.underlying.depositedWithRef).lte(0) && isEmpty(distributedRewards)) return null

  return (
    <VStack
      spacing={6}
      width={'full'}
      alignItems={'flex-start'}
    >
      <Translation component={Heading} as={'h3'} fontSize={'h3'} translation={getObjectPath(vault, 'translations.distributedTokens.title') || 'staking.distributedRewards'} />
      <VStack
        spacing={4}
        width={'full'}
        alignItems={'flex-start'}
      >
        {
          vault.distributedTokens.map( (underlyingToken: UnderlyingTokenProps) => {
            if (!underlyingToken.address) return null
            const underlyingId = underlyingToken.address.toLowerCase()
            const totalAmount = asset.distributedRewards?.[underlyingId] ? asset.distributedRewards[underlyingId].reduce( (totalAmount: BigNumber, reward: DistributedReward) => {
              return totalAmount.plus(reward.value)
            }, BNify(0)) : BNify(0)
            
            const totalAmountUsd = asset.distributedRewards?.[underlyingId] ? asset.distributedRewards[underlyingId].reduce( (totalAmount: BigNumber, reward: DistributedReward) => {
              return totalAmount.plus(bnOrZero(reward.valueUsd))
            }, BNify(0)) : BNify(0)

            const latestDistribution = asset.distributedRewards?.[underlyingId] ? sortArrayByKey(asset.distributedRewards[underlyingId], 'timeStamp', 'desc')[0] : null
            const apr = bnOrZero(vaultPosition?.rewardsApysByToken?.[underlyingToken.address.toLowerCase()]) //latestDistribution?.apr || asset.apyBreakdown?.rewards || BNify(0)

            // console.log('RewardApr', underlyingToken.address, vaultPosition, apr.toString())
            return (
              <Card
                py={6}
                px={8}
                width={'full'}
                key={`row_${underlyingToken.address}`}
              >
                <AssetProvider assetId={underlyingToken.address}>
                  <SimpleGrid
                    width={'full'}
                    spacing={[4, 0]}
                    columns={[2, 4]}
                    justifyContent={'center'}
                    alignItems={'space-between'}
                  >
                    <HStack
                      spacing={1}
                      alignItems={'center'}
                    >
                      <TokenAmount assetId={underlyingToken.address} size={'sm'} spacing={3} amount={totalAmount} showIcon={true} textStyle={'heading'} fontSize={'h3'} />
                      <Amount.Usd prefix={'~'} value={totalAmountUsd} color={'cta'} fontSize={'xs'} />
                    </HStack>
                    <VStack
                      spacing={1}
                      alignItems={['flex-end', 'flex-start']}
                      justifyContent={'flex-start'}
                    >
                      <Translation component={Text} translation={'defi.apy'} textStyle={'titleSmall'} />
                      <Amount.Percentage value={apr} textStyle={'tableCell'} />
                    </VStack>
                    <VStack
                      spacing={1}
                      alignItems={'flex-start'}
                      justifyContent={'flex-start'}
                    >
                      <Translation component={Text} translation={'common.lastDistribution'} textStyle={'titleSmall'} />
                      {
                        latestDistribution ? (
                          <Text textStyle={'tableCell'}>{toDayjs(latestDistribution.timeStamp).format(DATETIME_FORMAT)}</Text>
                        ) : (
                          <Text textStyle={'tableCell'}>-</Text>
                        )
                      }
                    </VStack>
                    <VStack
                      justifyContent={'center'}
                      alignItems={'flex-end'}
                    >
                      {
                        latestDistribution ? (
                          <Translation translation={`assets.assetDetails.assetHistory.rewardsHistory`} textStyle={'linkBlue'} fontSize={'md'} fontWeight={700} onClick={() => openRewardsHistoryModal()} />
                        ) : (
                          <Translation translation={`common.howItWorks`} textStyle={'linkBlue'} fontSize={'md'} fontWeight={700} onClick={() => openHowItWorksModal()} />
                        )
                      }
                    </VStack>
                  </SimpleGrid>
                </AssetProvider>
              </Card>
            )}
          )
        }
      </VStack>
    </VStack>
  )
}