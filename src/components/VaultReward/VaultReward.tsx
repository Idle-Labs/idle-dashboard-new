import React from 'react'
import { Card } from 'components/Card/Card'
import { Amount } from 'components/Amount/Amount'
import type { BigNumber, AssetId } from 'constants/types'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Translation } from 'components/Translation/Translation'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { VStack, Button, HStack, Text, SimpleGrid } from '@chakra-ui/react'

type RewardProps = {
  assetId: AssetId
  amount: BigNumber
}

export const VaultReward: React.FC<RewardProps> = ({
  assetId,
  amount
}) => {
  // console.log('VaultReward', assetId, amount.toString()))
  if (amount.lte(0)) return null
  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <Card
        p={6}
      >
        <HStack
          width={'100%'}
          justifyContent={'space-between'}
        >
          <AssetLabel assetId={assetId} />
          <VStack
            spacing={1}
            alignItems={'flex-end'}
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
      </Card>
    </AssetProvider>
  )
}