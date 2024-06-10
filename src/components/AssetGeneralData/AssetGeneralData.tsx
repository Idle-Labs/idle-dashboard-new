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
import { useTheme, HStack, VStack, SimpleGrid, Text, Tooltip, Stack, Wrap, WrapItem } from '@chakra-ui/react'
import { splitArrayIntoChunks } from 'helpers'

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

  const vaultType = useMemo(() => {
    if (!vault) return
    return ("trancheConfig" in vault) && vault.trancheConfig.strategy ? vault.trancheConfig.strategy : vault.type
  }, [vault])

  const strategyGeneralFields = useMemo(() => {
    return (vaultType && strategies[vaultType]?.generalDataFields) || (asset?.type && strategies[asset.type]?.generalDataFields)
  }, [asset, vaultType])

  const generalDataFields = useMemo(() => {
    if (!vault || !("getFlag" in vault)) return strategyGeneralFields || []
    const vaultGeneralDataFields = vault.getFlag("generalDataFields")
    if (vaultGeneralDataFields){
      return strategyGeneralFields ? strategyGeneralFields.filter( (generalDataField: GeneralDataField) => {
        return vaultGeneralDataFields[generalDataField.field] === undefined || vaultGeneralDataFields[generalDataField.field] === true
      }) : []
    }
    return strategyGeneralFields || []
  }, [strategyGeneralFields, vault])

  const chunkSize = useMemo(() => {
    return vaultType === 'REL' ? 4 : 5
  }, [vaultType])

  const generalDataFieldsChunks = useMemo(() => {
    return splitArrayIntoChunks(generalDataFields, chunkSize)
  }, [generalDataFields, chunkSize])

  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <Card.Dark>
        {
          generalDataFieldsChunks.map( (chunkFields, index: number) => (
            <SimpleGrid
              key={`row_${index}`}
              spacing={[6, 0]}
              pt={index ? 6 : 0}
              mt={index ? 6 : 0}
              borderTop={index ? '1px solid' : 'none'}
              borderTopColor={index ? 'divider' : 'none'}
              columns={[2, chunkSize]}
            >
              {
                chunkFields.map( (generalData: GeneralDataField) => (
                  <AssetGeneralDataField key={`field_${generalData.field}`} generalData={generalData} />
                ))
              }
            </SimpleGrid>
          ))
        }
      </Card.Dark>
    </AssetProvider>
  )
}