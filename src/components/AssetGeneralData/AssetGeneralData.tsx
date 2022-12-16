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

const Label: React.FC<LabelProps> = ({generalData}) => {
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
          <MdInfo color={theme.colors.cta} size={18} />
        </TooltipContent>
      </Tooltip>
    </HStack>
  ) : (
    <Translation component={Text} translation={generalData.label} textStyle={'captionSmall'} />
  )
}

export const AssetGeneralData: React.FC<AssetGeneralDataArgs> = ({ assetId }) => {
  // const { params } = useBrowserRouter()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const strategy = useMemo(() => {
    return asset?.type && strategies[asset.type]
  }, [asset])

  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <Card.Dark>
        <SimpleGrid
          spacing={[6, 0]}
          columns={[2, Math.min(strategy?.generalDataFields.length, 5)]}
        >
          {
            strategy?.generalDataFields && strategy?.generalDataFields.slice(0, 5).map( (generalData: GeneralDataField) => {
              return (
                <VStack
                  spacing={2}
                  alignItems={'flex-start'}
                  justifyContent={'flex-start'}
                  key={`field_${generalData.field}`}
                >
                  <Label generalData={generalData} />
                  <AssetProvider.GeneralData field={generalData.field} />
                </VStack>
              )
            })
          }
        </SimpleGrid>
        {
          strategy?.generalDataFields && strategy?.generalDataFields.length>5 && (
            <SimpleGrid
              pt={6}
              mt={6}
              spacing={[6, 0]}
              columns={[2, Math.min(strategy?.generalDataFields.length, 5)]}
              borderTop={'1px solid'}
              borderTopColor={'divider'}
            >
              {
                strategy?.generalDataFields.slice(5).map( (generalData: GeneralDataField) => {
                  return (
                    <VStack
                      spacing={2}
                      alignItems={'flex-start'}
                      justifyContent={'flex-start'}
                      key={`field_${generalData.field}`}
                    >
                      <Label generalData={generalData} />
                      <AssetProvider.GeneralData field={generalData.field} />
                    </VStack>
                  )
                })
              }
            </SimpleGrid>
          )
        }
      </Card.Dark>
    </AssetProvider>
  )
}