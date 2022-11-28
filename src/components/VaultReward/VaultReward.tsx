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
              <Translation component={Button} translation={'common.claim'} textStyle={'cta'} />
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