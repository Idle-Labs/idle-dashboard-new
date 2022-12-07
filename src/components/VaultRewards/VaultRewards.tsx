import React, { useMemo } from 'react'
import { SimpleGrid } from '@chakra-ui/react'
import type { Balances, AssetId } from 'constants/types'
import { VaultReward } from 'components/VaultReward/VaultReward'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'

type RewardProps = {
  assetId?: AssetId
}

export const VaultRewards: React.FC<RewardProps> = ({ assetId }) => {
  const { selectors: { selectAssetById } } = usePortfolioProvider()
  
  const rewards = useMemo((): Balances | undefined => {
    if (!selectAssetById || !assetId) return
    const asset = selectAssetById(assetId)
    return asset?.rewards
  }, [selectAssetById, assetId])

  // console.log('VaultRewards', assetId, rewards)

  return (
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
  )
}