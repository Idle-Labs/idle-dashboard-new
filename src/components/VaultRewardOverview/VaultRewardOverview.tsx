import React from 'react'
import { Card } from 'components/Card/Card'
import { Amount } from 'components/Amount/Amount'
import type { VaultRewards, AssetId } from 'constants/types'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Translation } from 'components/Translation/Translation'
import { VStack, HStack, Text, SimpleGrid } from '@chakra-ui/react'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'

type RewardProps = {
  assetId: AssetId
} & VaultRewards

export const VaultRewardOverview: React.FC<RewardProps> = ({
  assetId,
  assets,
  amount
}) => {
  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <Card
        p={6}
      >
        <VStack
          spacing={5}
          alignItems={'flex-start'}
        >
          <AssetLabel assetId={assetId} />
          <HStack
            width={'100%'}
            justifyContent={'space-between'}
          >
            <VStack
              spacing={1}
              alignItems={'flex-start'}
            >
              <Translation component={Text} translation={'defi.vaults'} textStyle={'captionSmall'} />
              <HStack
                spacing={0}
              >
                {
                  assets.map( (assetId: AssetId, index: number) => (
                    <AssetProvider key={`asset_${assetId}`} assetId={assetId}>
                      <AssetProvider.Icon size={'xs'} ml={index ? -1 : 0} showTooltip={true} />
                    </AssetProvider>
                  ))
                }
              </HStack>
            </VStack>

            <VStack
              spacing={1}
              alignItems={'flex-start'}
            >
              <Translation component={Text} translation={'defi.claimable'} textStyle={'captionSmall'} />
              <HStack
                spacing={1}
              >
                <Amount value={amount} decimals={8} textStyle={'tableCell'} />
                <AssetProvider.Name textStyle={'tableCell'} />
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </Card>
    </AssetProvider>
  )
}