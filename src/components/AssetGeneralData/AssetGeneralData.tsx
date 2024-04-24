import React, { useMemo } from 'react'
import { MdInfo } from 'react-icons/md'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import type { AssetId } from 'constants/types'
import { Translation } from 'components/Translation/Translation'
// import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { strategies, GeneralDataField } from 'constants/strategies'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { TooltipContent } from 'components/TooltipContent/TooltipContent'
import { useTheme, HStack, VStack, SimpleGrid, Text, Tooltip } from '@chakra-ui/react'

type AssetGeneralDataArgs = {
  assetId?: AssetId
}

type LabelProps = {
  generalData: GeneralDataField
}

const Label: React.FC<LabelProps> = ({ generalData }) => {
  const theme = useTheme()
  const translate = useTranslate()
  return generalData.tooltip ? (
    <HStack
      spacing={1}
      alignItems={'center'}
    >
      <Translation component={Text} translation={generalData.label} textStyle={'captionSmall'} />
      <Tooltip
        hasArrow
        placement={'top'}
        label={translate(generalData.tooltip)}
      >
        <TooltipContent>
          <MdInfo color={theme.colors.cta} size={16} />
        </TooltipContent>
      </Tooltip>
    </HStack>
  ) : (
    <Translation component={Text} translation={generalData.label} textStyle={'captionSmall'} />
  )
}

export const AssetGeneralDataField: React.FC<LabelProps> = ({ generalData }) => {
  return (
    <VStack
      spacing={2}
      width={'full'}
      alignItems={'flex-start'}
      justifyContent={'flex-start'}
    >
      <HStack
        width={'full'}
        alignItems={'center'}
        justifyContent={'space-between'}
      >
        <Label generalData={generalData} />
        {
          generalData.inlineField && (
            <AssetProvider.GeneralData section={'asset'} field={generalData.inlineField} />
          )
        }
      </HStack>
      <AssetProvider.GeneralData section={'asset'} field={generalData.field} {...generalData.props} />
    </VStack>
  )
}

export const AssetGeneralData: React.FC<AssetGeneralDataArgs> = ({ assetId }) => {
  // const { params } = useBrowserRouter()
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(assetId)
  }, [selectVaultById, assetId])

  const strategy = useMemo(() => {
    return asset?.type && strategies[asset.type]
  }, [asset])

  const generalDataFields = useMemo(() => {
    if (!vault || !("getFlag" in vault)) return strategy?.generalDataFields || []
    const vaultGeneralDataFields = vault.getFlag("generalDataFields")
    if (vaultGeneralDataFields){
      return strategy?.generalDataFields ? strategy?.generalDataFields.filter( (generalDataField: GeneralDataField) => {
        return vaultGeneralDataFields[generalDataField.field] === undefined || vaultGeneralDataFields[generalDataField.field] === true
      }) : []
    }
    return strategy?.generalDataFields || []
  }, [strategy, vault])

  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <Card.Dark>
        <SimpleGrid
          spacing={[6, 0]}
          columns={[2, Math.min(generalDataFields.length, 5)]}
        >
          {
            generalDataFields && generalDataFields.slice(0, 5).map( (generalData: GeneralDataField) => (
              <AssetGeneralDataField key={`field_${generalData.field}`} generalData={generalData} />
            ))
          }
        </SimpleGrid>
        {
          generalDataFields && generalDataFields.length>5 && (
            <SimpleGrid
              pt={6}
              mt={6}
              spacing={[6, 0]}
              columns={[2, Math.min(generalDataFields.length, 5)]}
              borderTop={'1px solid'}
              borderTopColor={'divider'}
            >
              {
                generalDataFields.slice(5).map( (generalData: GeneralDataField) => (
                  <AssetGeneralDataField key={`field_${generalData.field}`} generalData={generalData} />
                ))
              }
            </SimpleGrid>
          )
        }
      </Card.Dark>
    </AssetProvider>
  )
}