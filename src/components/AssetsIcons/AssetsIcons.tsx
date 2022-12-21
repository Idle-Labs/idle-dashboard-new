import type { AssetId } from 'constants/types'
import { HStack } from '@chakra-ui/react'
import { IconProps, AssetProvider } from 'components/AssetProvider/AssetProvider'

type AssetsIconsProps = {
  assetIds: AssetId[]
} & IconProps

export const AssetsIcons: React.FC<AssetsIconsProps> = ({ assetIds, showTooltip, ...props }) => {
  return (
    <HStack
      spacing={0}
    >
      {
        assetIds.map( (assetId: AssetId, index) => (
          <AssetProvider key={`asset_${index}`} assetId={assetId}>
            <AssetProvider.Icon {...props} ml={index ? -1 : 0} showTooltip={showTooltip} />
          </AssetProvider>
        ))
      }
    </HStack>
  )
}