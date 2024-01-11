import React from 'react'
import { BNify } from 'helpers/'
import type { AssetId } from 'constants/types'
import { ResponsiveValue, HStack } from '@chakra-ui/react'
import { Amount, AmountProps } from 'components/Amount/Amount'
import { AssetFieldProps, AssetProvider } from 'components/AssetProvider/AssetProvider'

export type TokenAmountProps = {
  assetId?: AssetId
  spacing?: number
  showIcon?: boolean
  showName?: boolean
  amount: AmountProps["value"]
  size?: ResponsiveValue<string> | undefined
  amountComponent?: React.FC | React.ElementType | null
} & AmountProps & AssetFieldProps

export const TokenAmount: React.FC<TokenAmountProps> = ({
  assetId,
  amount,
  size = 'sm',
  spacing = 2,
  amountComponent,
  showIcon = true,
  showName = true,
  ...props
}) => {
  const AmountComponent = amountComponent || Amount
  const { ...amountProps } = props as Omit<AmountProps, keyof TokenAmountProps>
  const { ...assetFieldProps } = props as Omit<AssetFieldProps, keyof TokenAmountProps>
  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <HStack
        spacing={spacing}
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
          <AmountComponent value={amount} decimals={BNify(amount).lt(1) && BNify(amount).gt(0) ? 4 : 2} {...amountProps} />
          {
            showName && (
              <AssetProvider.Name {...assetFieldProps} fontSize={'85%'} fontWeight={400} />
            )
          }
        </HStack>
      </HStack>
    </AssetProvider>
  )
}