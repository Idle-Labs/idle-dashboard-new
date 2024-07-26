import { AssetId, networks } from "constants/"
import { Box, Flex, HStack, Image, SimpleGrid, Text, VStack, Wrap, WrapItem } from "@chakra-ui/react"
import { CompositionChart } from "components/CompositionChart/CompositionChart"
import { CompositionType, UseCompositionChartDataReturn, useCompositionChartData } from "hooks/useCompositionChartData/useCompositionChartData"
import { AssetProvider } from "components/AssetProvider/AssetProvider"
import { DonutChartData } from "components/DonutChart/DonutChart"
import { Amount } from "components/Amount/Amount"
import { sortArrayByKey } from "helpers"
import { useMemo, useState } from "react"
import { useThemeProvider } from "contexts/ThemeProvider"
import { Icon } from "components/Icon/Icon"

type PortfolioAllocationArgs = {
  type: CompositionType,
  assetIds: AssetId[],
  strategies?: string[]
}

export const PortfolioAllocation: React.FC<PortfolioAllocationArgs> = ({
  type='assets',
  assetIds,
  strategies
}) => {

  const { theme } = useThemeProvider()
  const [selectedPage, setSelectedPage] = useState<number>(0)
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>(undefined)
  const { colors, compositions }: UseCompositionChartDataReturn = useCompositionChartData({ assetIds, strategies })

  const colorsOverride = useMemo(() => {
    return Object.keys(colors[type]).reduce( (acc: Record<string, string>, asset: string) => {
      const color = selectedLabel === asset ? colors[type][asset] : theme.colors.card.bgLight
      return {
        ...acc,
        [asset]: color
      }
    }, {})
  }, [selectedLabel, type, colors, theme])

  const selectedSlice: DonutChartData | undefined = useMemo(() => {
    if (!selectedLabel) return
    return compositions[type].find( slice => slice.label === selectedLabel )
  }, [compositions, selectedLabel, type])

  const pages = useMemo(() => {
    return Math.ceil(Object.keys(compositions[type]).length/6)
  }, [compositions, type])

  return (
    <HStack
      spacing={10}
      width={'full'}
      alignItems={'stretch'}
    >
      <Box
        width={180}
      >
        <CompositionChart
          height={180}
          type={type}
          assetIds={assetIds}
          donutThickness={15}
          strategies={strategies}
          colors={colorsOverride}
          selectedSlice={selectedSlice}
        />
      </Box>
      <VStack
        flex={1}
        spacing={4}
        alignItems={'flex-start'}
      >
        <SimpleGrid
          columns={2}
          spacingX={12}
          spacingY={5}
          flex={1}
          alignItems={'flex-start'}
          justifyContent={'space-between'}
        >
          {
            sortArrayByKey(compositions[type], 'value', 'desc').slice(selectedPage*6, selectedPage*6+6).map( (composition: DonutChartData, index: number) => {
              switch (type){
                case 'assets':
                  return (
                    <HStack
                      spacing={4}
                      cursor={'pointer'}
                      key={`index_${index}`}
                      justifyContent={'space-between'}
                      sx={{
                        filter: `grayscale(${composition.label === selectedLabel ? 0 : 1})`
                      }}
                      onMouseOut={() => setSelectedLabel(undefined)}
                      onMouseOver={() => setSelectedLabel(composition.label)}
                      opacity={ composition.label === selectedLabel ? 1 : 0.7 }
                    >
                      <AssetProvider
                        assetId={composition.extraData.asset.id}
                      >
                        <AssetProvider.GeneralData field={'asset'} />
                      </AssetProvider>
                      <Amount.Usd value={composition.value} />
                    </HStack>
                  )
                  case 'chains':
                    return (
                      <HStack
                        spacing={4}
                        cursor={'pointer'}
                        key={`index_${index}`}
                        justifyContent={'space-between'}
                        sx={{
                          filter: `grayscale(${composition.label === selectedLabel ? 0 : 1})`
                        }}
                        onMouseOut={() => setSelectedLabel(undefined)}
                        onMouseOver={() => setSelectedLabel(composition.label)}
                        opacity={ composition.label === selectedLabel ? 1 : 0.7 }
                      >
                        <HStack
                          spacing={2}
                        >
                          <Icon IconComponent={composition.extraData.network.icon} w={8} h={8} />
                          <Text textStyle={'tableCell'}>{composition.label}</Text>
                        </HStack>
                        <Amount.Usd value={composition.value} />
                      </HStack>
                    )
                case 'strategies':
                  return null
                default:
                  return null
              }
            })
          }
        </SimpleGrid>
        <Flex
          width={'full'}
          justifyContent={'center'}
        >
          {
            pages>1 && (
              <HStack
                spacing={3}
              >
                {
                  Array.from(Array(pages).keys()).map((page: number) => (
                    <Box
                      layerStyle={'carouselDot'}
                      aria-selected={page === selectedPage}
                      onClick={() => setSelectedPage(page)}
                    ></Box>
                  ))
                }
              </HStack>
            )
          }
        </Flex>
      </VStack>
    </HStack>
  )
}