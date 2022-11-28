import { HStack } from '@chakra-ui/react'
import type { AssetId } from 'constants/types'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'

type AssetLabelProps = {
  assetId: AssetId
}

export const AssetLabel: React.FC<AssetLabelProps> = ({ assetId }) => {
  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <HStack
        alignItems={'center'}
        justifyContent={'flex-start'}
      >
        <AssetProvider.Icon size={'sm'} />
        <AssetProvider.Name textStyle={['heading','h3']} />
      </HStack>
    </AssetProvider>
  )
}