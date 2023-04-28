import type { AssetId } from 'constants/types'
import { ResponsiveValue, HStack, TextProps } from '@chakra-ui/react'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'

type AssetLabelProps = {
  size?: string
  extraFields?: string[]
  assetId: AssetId | undefined
  spacing?: ResponsiveValue<string | number> | undefined
} & TextProps

export const AssetLabel: React.FC<AssetLabelProps> = ({ assetId, size = 'sm', spacing, extraFields, ...textProps }) => {
  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <HStack
        spacing={spacing}
        alignItems={'center'}
        justifyContent={'flex-start'}
      >
        <AssetProvider.Icon size={size} />
        <AssetProvider.Name textStyle={'heading'} fontSize={['15px','h3']} whiteSpace={'nowrap'} {...textProps} />
        {
          extraFields?.map( (extraField: string) => (
            <AssetProvider.GeneralData key={`extraField_${extraField}`} field={extraField} />
          ))
        }
      </HStack>
    </AssetProvider>
  )
}