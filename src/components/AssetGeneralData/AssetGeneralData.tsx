import React, { useMemo } from 'react'
import { strategies } from 'constants/'
import { Card } from 'components/Card/Card'
import type { AssetId } from 'constants/types'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { HStack, VStack, SimpleGrid, Text } from '@chakra-ui/react'
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
          columns={[2, 5]}
        >
          {
            strategy?.generalDataFields && strategy?.generalDataFields.slice(0, 5).map( (field: string) => {
              return (
                <VStack
                  spacing={2}
                  key={`field_${field}`}
                  alignItems={'flex-start'}
                  justifyContent={'flex-start'}
                >
                  <Translation component={Text} translation={`assets.assetDetails.generalData.${field}`} textStyle={'captionSmall'} />
                  <AssetProvider.GeneralData field={field} />
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
              columns={[2, 5]}
              borderTop={'1px solid'}
              borderTopColor={'divider'}
            >
              {
                strategy?.generalDataFields.slice(5).map( (field: string) => {
                  return (
                    <VStack
                      spacing={2}
                      key={`field_${field}`}
                      alignItems={'flex-start'}
                      justifyContent={'flex-start'}
                    >
                      <Translation component={Text} translation={`assets.assetDetails.generalData.${field}`} textStyle={'captionSmall'} />
                      <AssetProvider.GeneralData field={field} />
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