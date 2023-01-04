import React from 'react'
import type { AssetId } from 'constants/types'
import { TextProps, HStack } from '@chakra-ui/react'
import { Amount, AmountProps } from 'components/Amount/Amount'
import { AssetFieldProps, AssetProvider } from 'components/AssetProvider/AssetProvider'

type TokenAmountProps = {
  assetId: AssetId
  amount: AmountProps["value"]
  size?: string
} & AmountProps & AssetFieldProps

export const TokenAmount: React.FC<TokenAmountProps> = ({
  assetId,
  amount,
  size,
  ...props
}) => {
  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <HStack
        spacing={2}
        alignItems={'center'}
      >
        <AssetProvider.Icon size={size || 'xs'} />
        <HStack
          spacing={1}
          alignItems={'center'}
        >
          <Amount value={amount} decimals={4} {...props} />
          <AssetProvider.Name {...props} />
        </HStack>
      </HStack>
    </AssetProvider>
  )
}