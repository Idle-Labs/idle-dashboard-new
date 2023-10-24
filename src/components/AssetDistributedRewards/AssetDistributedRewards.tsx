import React, { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import { DATETIME_FORMAT } from 'constants/vars'
import { Amount } from 'components/Amount/Amount'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { BNify, sortArrayByKey, toDayjs, isEmpty } from 'helpers/'
import { VStack, Heading, SimpleGrid, Text } from '@chakra-ui/react'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { AssetId, BigNumber, DistributedReward } from 'constants/types'
import { selectUnderlyingTokenByAddress } from 'selectors/selectUnderlyingToken'

type AssetDistributedRewardsProps = {
  assetId?: AssetId
}

export const AssetDistributedRewards: React.FC<AssetDistributedRewardsProps> = ({assetId}) => {
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()
  
  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(assetId)
  }, [selectVaultById, assetId])

  if (!asset || !("distributedTokens" in vault) || !vault.distributedTokens.length) return null

  // !asset.distributedRewards || !Object.keys(asset.distributedRewards).length

  return (
    <VStack
      spacing={6}
      width={'full'}
      alignItems={'flex-start'}
    >
      <Translation component={Heading} as={'h3'} fontSize={'h3'} translation={'staking.receivedRewards'} />
      {
        isEmpty(asset.distributedRewards) ? (
          <Card.Dark>
            <Translation translation={'assets.assetCards.rewards.distributedRewards'} />
          </Card.Dark>
        ) : (
          <VStack
            spacing={4}
            width={'full'}
            alignItems={'flex-start'}
          >
            {
              Object.keys(asset.distributedRewards).map( (rewardId: AssetId) => {
                const underlyingToken = selectUnderlyingTokenByAddress(+asset.chainId, rewardId)
                if (!underlyingToken) return null
                
                const totalAmount = asset.distributedRewards[rewardId].reduce( (totalAmount: BigNumber, reward: DistributedReward) => {
                  return totalAmount.plus(reward.value)
                }, BNify(0))

                const latestDistribution = sortArrayByKey(asset.distributedRewards[rewardId], 'timeStamp', 'desc')[0]

                return (
                  <Card
                    py={6}
                    px={8}
                    width={'full'}
                  >
                    <AssetProvider assetId={rewardId}>
                      <SimpleGrid
                        columns={4}
                        width={'full'}
                        justifyContent={'center'}
                        alignItems={'space-between'}
                      >
                        <TokenAmount assetId={rewardId} size={'md'} amount={totalAmount} showIcon={true} textStyle={'heading'} fontSize={'h3'} />
                        <VStack
                          spacing={1}
                          alignItems={'flex-start'}
                          justifyContent={'flex-start'}
                        >
                          <Translation component={Text} translation={'defi.apy'} textStyle={'titleSmall'} />
                          <Amount.Percentage value={latestDistribution.apr} textStyle={'tableCell'} />
                        </VStack>
                        <VStack
                          spacing={1}
                          alignItems={'flex-start'}
                          justifyContent={'flex-start'}
                        >
                          <Translation component={Text} translation={'common.lastUpdate'} textStyle={'titleSmall'} />
                          <Text textStyle={'tableCell'}>{toDayjs(latestDistribution.timeStamp).format(DATETIME_FORMAT)}</Text>
                        </VStack>
                        <VStack
                          justifyContent={'center'}
                          alignItems={'flex-end'}
                        >
                          <Translation translation={`assets.assetDetails.assetHistory.rewardsHistory`} textStyle={'linkBlue'} fontSize={'md'} fontWeight={700} />
                        </VStack>
                      </SimpleGrid>
                    </AssetProvider>
                  </Card>
                )}
              )
            }
          </VStack>
        )
      }
    </VStack>
  )
}