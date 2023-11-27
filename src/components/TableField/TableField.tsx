import { AssetId } from 'constants/types'
import { SkeletonText } from '@chakra-ui/react'
import { AssetProvider, AssetProviderPropsType } from 'components/AssetProvider/AssetProvider'

export type TableFieldProps = {
  assetId?: AssetId
  field: string
  value: any
  section?: string
  props?: AssetProviderPropsType
}

export const TableField: React.FC<TableFieldProps> = ({ assetId, field, value, section, props }) => {
  return (
    <SkeletonText noOfLines={2} isLoaded={!!value}>
      <AssetProvider assetId={assetId}>
        <AssetProvider.GeneralData section={section} field={field} {...props} />
      </AssetProvider>
    </SkeletonText>
  )
}