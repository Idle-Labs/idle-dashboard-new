import React from 'react'
import type { AssetId } from 'constants/types'
import { ResponsiveValue, HStack } from '@chakra-ui/react'
import { Amount, AmountProps } from 'components/Amount/Amount'
import { AssetFieldProps, AssetProvider } from 'components/AssetProvider/AssetProvider'

export type TokenAmountProps = {
  assetId?: AssetId
  amount: AmountProps["value"]
  size?: ResponsiveValue<string> | undefined
  showIcon?: boolean
} & AmountProps & AssetFieldProps

export const TokenAmount: React.FC<TokenAmountProps> = ({
  assetId,
  amount,
  size = 'sm',
  showIcon = true,
  ...props
}) => {
  const { ...amountProps } = props as Omit<AmountProps, keyof TokenAmountProps>
  const { ...assetFieldProps } = props as Omit<AssetFieldProps, keyof TokenAmountProps>
  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <HStack
        spacing={1}
        alignItems={'center'}
      >
        {
          showIcon && (
            <AssetProvider.Icon size={size} />
          )
        }
        <HStack
          spacing={1}
          alignItems={'baseline'}
        >
          <Amount value={amount} decimals={2} {...amountProps} />
          <AssetProvider.Name {...assetFieldProps} fontSize={'85%'} fontWeight={400} />
        </HStack>
      </HStack>
    </AssetProvider>
  )
}