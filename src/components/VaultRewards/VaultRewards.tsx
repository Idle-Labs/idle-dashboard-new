import { BNify } from 'helpers/'
import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import type { Balances, AssetId } from 'constants/types'
import { VStack, SimpleGrid, Text } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'
import { VaultReward } from 'components/VaultReward/VaultReward'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { TransactionButton } from 'components/TransactionButton/TransactionButton'

type RewardProps = {
  assetId?: AssetId
}

export const VaultRewards: React.FC<RewardProps> = ({ assetId }) => {
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(assetId)
  }, [selectVaultById, assetId])
  
  const rewards = useMemo((): Balances | undefined => {
    if (!selectAssetById || !assetId) return
    const asset = selectAssetById(assetId)
    return asset?.rewards
  }, [selectAssetById, assetId])

  const totalRewardsAmount: BigNumber = useMemo(() => {
    return rewards ? (Object.values(rewards) as BigNumber[]).reduce( (total: BigNumber, amount: BigNumber) => total.plus(amount), BNify(0)) : BNify(0)
  }, [rewards])

  // console.log('totalRewardsAmount', vault, totalRewardsAmount)

  const contractSendMethod = vault.getClaimRewardsContractSendMethod()

  return (
    <VStack
      spacing={6}
      width={'100%'}
      id={'vault-rewards'}
      alignItems={'flex-start'}
    >
      <Translation translation={'assets.assetDetails.generalData.claimableRewards'} component={Text} textStyle={'heading'} fontSize={'h3'} />
      <SimpleGrid
        spacing={6}
        width={'100%'}
        columns={[1, 3]}
      >
        {
          rewards && Object.keys(rewards).map( (rewardId: AssetId) =>
            <VaultReward
              assetId={rewardId}
              amount={rewards[rewardId]}
              key={`reward_${rewardId}`}
            />
          )
        }
      </SimpleGrid>
      {
        assetId && vault && totalRewardsAmount.gt(0) && (
          <TransactionButton text={'assets.assetCards.rewards.claimRewards'} vaultId={assetId} assetId={assetId} contractSendMethod={contractSendMethod} actionType={'claim'} amount={totalRewardsAmount.toString()} width={['100%', '150px']} disabled={totalRewardsAmount.lte(0)} />
        )
      }
    </VStack>
  )
}