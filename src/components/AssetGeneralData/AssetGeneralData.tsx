import React, { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import type { AssetId } from 'constants/types'
import { VStack, SimpleGrid, Text } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { strategies, GeneralDataField } from 'constants/strategies'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'

type AssetGeneralDataArgs = {
  assetId?: AssetId
}

export const AssetGeneralData: React.FC<AssetGeneralDataArgs> = ({ assetId }) => {
  const { params } = useBrowserRouter()

  const strategy = useMemo(() => {
    const foundStrategy = Object.keys(strategies).find( strategy => strategies[strategy].route === params.strategy )
    return foundStrategy ? strategies[foundStrategy] : null
  }, [params])

  return (
    <AssetProvider
      assetId={assetId}
    >
      <Card.Dark>
        <SimpleGrid
          spacing={[6, 0]}
          columns={[2, 5]}
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
                  <Translation component={Text} translation={generalData.label} textStyle={'captionSmall'} />
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
              columns={[2, 5]}
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
                      <Translation component={Text} translation={generalData.label} textStyle={'captionSmall'} />
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