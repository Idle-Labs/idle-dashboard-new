import type { AssetId } from 'constants/types'
import { HStack, TextProps } from '@chakra-ui/react'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'

type AssetLabelProps = {
  size?: string
  assetId: AssetId | undefined
} & TextProps

export const AssetLabel: React.FC<AssetLabelProps> = ({ assetId, size = 'sm', ...textProps }) => {
  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <HStack
        alignItems={'center'}
        justifyContent={'flex-start'}
      >
        <AssetProvider.Icon size={size} />
        <AssetProvider.Name textStyle={'heading'} fontSize={'h3'} whiteSpace={'nowrap'} {...textProps} />
      </HStack>
    </AssetProvider>
  )
}