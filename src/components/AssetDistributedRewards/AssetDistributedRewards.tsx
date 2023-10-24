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
import { selectUnderlyingTokenByAddress } from 'selectors/selectUnderlyingToken'
import { AssetId, BigNumber, DistributedReward, UnderlyingTokenProps } from 'constants/'

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
      <Translation component={Heading} as={'h3'} fontSize={'h3'} translation={'staking.distributedRewards'} />
      <VStack
        spacing={4}
        width={'full'}
        alignItems={'flex-start'}
      >
        {
          vault.distributedTokens.map( (underlyingToken: UnderlyingTokenProps) => {
            if (!underlyingToken.address) return null

            const totalAmount = asset.distributedRewards?.[underlyingToken.address] ? asset.distributedRewards[underlyingToken.address].reduce( (totalAmount: BigNumber, reward: DistributedReward) => {
              return totalAmount.plus(reward.value)
            }, BNify(0)) : BNify(0)

            const latestDistribution = asset.distributedRewards?.[underlyingToken.address] ? sortArrayByKey(asset.distributedRewards[underlyingToken.address], 'timeStamp', 'desc')[0] : null

            const apr = latestDistribution?.apr || asset.apyBreakdown.rewards || BNify(0)
            return (
              <Card
                py={6}
                px={8}
                width={'full'}
              >
                <AssetProvider assetId={underlyingToken.address}>
                  <SimpleGrid
                    columns={4}
                    width={'full'}
                    justifyContent={'center'}
                    alignItems={'space-between'}
                  >
                    <TokenAmount assetId={underlyingToken.address} size={'md'} spacing={3} amount={totalAmount} showIcon={true} textStyle={'heading'} fontSize={'h3'} />
                    <VStack
                      spacing={1}
                      alignItems={'flex-start'}
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
                      <Translation component={Text} translation={'common.lastUpdate'} textStyle={'titleSmall'} />
                      <Text textStyle={'tableCell'}>{latestDistribution ? toDayjs(latestDistribution.timeStamp).format(DATETIME_FORMAT) : '-'}</Text>
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
    </VStack>
  )
}