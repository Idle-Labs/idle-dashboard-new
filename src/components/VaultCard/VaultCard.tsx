import React, { useMemo } from 'react'
import { strategies } from 'constants/'
import { getVaultPath } from 'helpers/'
import { useNavigate } from 'react-router-dom'
import { Asset, AssetId } from 'constants/types'
import { Amount } from 'components/Amount/Amount'
import { MdKeyboardArrowRight } from 'react-icons/md'
import { CardProps, Card } from 'components/Card/Card'
import type { AggregatedAsset } from 'components/Stats/Stats'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { StrategyTag } from 'components/StrategyTag/StrategyTag'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { useTheme, TextProps, Flex, AvatarProps, BoxProps, ThemingProps, VStack, SimpleGrid, HStack, Box, Text } from '@chakra-ui/react'

export type VaultCardProps = {
  assetId: AssetId
  onClick?: Function
}

type VaultCardField = {
  field: string
  label?: string
  labelPos?: 'left' | 'right'
  props?: TextProps & AvatarProps & BoxProps & ThemingProps
}

export type VaultCardInlineProps = {
  fields: VaultCardField[]
  showDivider?: boolean
} & VaultCardProps & CardProps

const Inline = ({ assetId, fields, onClick, showDivider = true, ...cardProps }: VaultCardInlineProps) => {
  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <Card
        py={2}
        px={4}
        layerStyle={['card', 'cardHover']}
        onClick={onClick}
        {...cardProps}
      >
        <HStack
          width={'100%'}
          justifyContent={'space-between'}
        >
          <HStack
            spacing={3}
            width={'100%'}
            alignItems={'center'}
          >
            <AssetProvider.Icon size={'xs'} />
            {
              fields.map( (fieldInfo: VaultCardField, index: number) => (
                <React.Fragment key={`field_${index}`}>
                  {
                    showDivider && (
                      <Box
                        width={1}
                        height={1}
                        bg={'divider'}
                        borderRadius={'50%'}
                      />
                    )
                  }
                  <HStack
                    spacing={2}
                  >
                    {
                      fieldInfo.labelPos !== 'right' && fieldInfo.label && (
                        <Translation translation={fieldInfo.label} component={Text} textStyle={'captionSmall'} />
                      )
                    }
                    <AssetProvider.GeneralData field={fieldInfo.field} textStyle={'tableCell'} {...fieldInfo.props} />
                    {
                      fieldInfo.labelPos === 'right' && fieldInfo.label && (
                        <Translation translation={fieldInfo.label} component={Text} textStyle={'captionSmall'} />
                      )
                    }
                  </HStack>
                </React.Fragment>
              ))
            }
          </HStack>
        </HStack>
      </Card>
    </AssetProvider>
  )
}

export type VaultCardStatsProps = {
  asset: AggregatedAsset
  handleClick: Function
  onRowClick: Function
  isOpen: boolean
} & CardProps

const Stats = ({ asset, handleClick, onRowClick, isOpen, ...cardProps }: VaultCardStatsProps) => {
  const theme = useTheme()
  return (
    <AssetProvider
      wrapFlex={false}
      assetId={asset.id}
    >
      <VStack
        spacing={2}
        width={'full'}
      >
        <Card
          p={4}
          onClick={() => handleClick(asset)}
          backgroundColor={ isOpen ? 'card.bgLight' : 'card.bg'}
          {...cardProps}
        >
          <VStack
            spacing={3}
            alignItems={'flex-start'}
          >
            <HStack
              width={'full'}
              justifyContent={'space-between'}
            >
              <AssetLabel assetId={asset.id} size={'sm'} />
              {
                asset?.strategy && (
                  <StrategyTag strategy={asset.strategy as string} />
                )
              }
            </HStack>
            <HStack
              pt={3}
              px={4}
              width={'100%'}
              borderTop={'1px solid'}
              borderTopColor={'divider'}
              justifyContent={'space-between'}
            >
              <VStack
                spacing={1}
                alignItems={'flex-start'}
              >
                <Translation translation={'defi.pool'} textStyle={'captionSmall'} />
                <Amount.Usd value={asset.tvlUsd} textStyle={'tableCell'} />
              </VStack>
              <VStack
                spacing={1}
                alignItems={'flex-end'}
              >
                <Translation translation={'defi.apy'} textStyle={'captionSmall'} />
                <HStack
                  spacing={1}
                >
                  <Amount.Percentage value={asset.apyRange?.minApy || null} textStyle={'tableCell'} />
                  <Text>-</Text>
                  <Amount.Percentage value={asset.apyRange?.maxApy || null} textStyle={'tableCell'} />
                </HStack>
              </VStack>
            </HStack>
          </VStack>
        </Card>
        {
          isOpen && (
            <VStack
              spacing={2}
              width={'full'}
            >
              {
                asset.subRows.map( (asset: Asset) => (
                  <AssetProvider
                    wrapFlex={false}
                    assetId={asset.id as string}
                  >
                    <Card
                      py={2}
                      pr={1}
                      pl={[4, 6]}
                      layerStyle={['card']}
                      backgroundColor={'card.bgLight'}
                      onClick={() => onRowClick(asset)}
                    >
                      <HStack
                        width={'100%'}
                        justifyContent={'space-between'}
                      >
                      {
                        ['AA', 'BB'].includes(asset.type as string) ? (
                          <HStack
                            width={'100%'}
                            justifyContent={'space-between'}
                          >
                            <AssetProvider.GeneralData field={'protocolWithVariant'} size={'xs'} />
                            <HStack
                              spacing={1}
                            >
                              <AssetProvider.SeniorApy color={strategies.AA.color} textStyle={'tableCell'} />
                              <Text>-</Text>
                              <AssetProvider.JuniorApy color={strategies.BB.color} textStyle={'tableCell'} />
                            </HStack>
                          </HStack>
                        ) : asset.type === 'BY' && (
                          <HStack
                            width={'100%'}
                            justifyContent={'space-between'}
                          >
                            <HStack
                              flex={1}
                            >
                              <Flex
                                width={'40%'}
                              >
                                <AssetProvider.GeneralData field={'protocols'} size={'xs'} />
                              </Flex>
                              <AssetProvider.GeneralData field={'strategies'} />
                            </HStack>
                            <AssetProvider.Apy showTooltip={false} textStyle={'tableCell'} />
                          </HStack>
                        )
                      }
                      <MdKeyboardArrowRight
                        size={24}
                        color={theme.colors.primary}
                      />
                      </HStack>
                    </Card>
                  </AssetProvider>
                ))
              }
            </VStack>
          )
        }
      </VStack>
    </AssetProvider>
  )
}

export const Minimal = ({assetId}: VaultCardProps) => {
  const navigate = useNavigate()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    if (!selectAssetById) return
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <Card
        p={4}
        layerStyle={['card','cardHover']}
        onClick={() => navigate(getVaultPath(asset?.type, asset?.id))}
      >
        <VStack
          spacing={3}
          alignItems={'flex-start'}
        >
          <HStack
            width={'full'}
            justifyContent={'space-between'}
          >
            <AssetLabel assetId={assetId} size={'sm'} />
            <AssetProvider.GeneralData size={'xs'} field={'strategies'} />
          </HStack>
          <SimpleGrid
            pt={3}
            columns={2}
            width={'100%'}
            borderTop={'1px solid'}
            borderTopColor={'divider'}
          >
            <VStack
              spacing={1}
              alignItems={'flex-start'}
            >
              <Translation translation={'defi.apy'} textStyle={'captionSmall'} />
              <AssetProvider.Apy showTooltip={false} textStyle={'tableCell'} />
            </VStack>

            <VStack
              spacing={1}
              alignItems={'flex-end'}
            >
              <Translation translation={'defi.pool'} textAlign={'right'} textStyle={'captionSmall'} />
              <AssetProvider.PoolUsd textStyle={'tableCell'} textAlign={'right'} />
            </VStack>
          </SimpleGrid>
        </VStack>
      </Card>
    </AssetProvider>
  )
}

export const VaultCard = ({ assetId, onClick }: VaultCardProps) => {
  const navigate = useNavigate()
  const { location } = useBrowserRouter()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    if (!selectAssetById) return
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const depositedOrRewards = useMemo(() => {
    return asset?.vaultPosition?.usd.deposited ? (
      <VStack
        spacing={1}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.deposited'} textStyle={'captionSmall'} />
        <AssetProvider.DepositedUsd textStyle={'tableCell'} />
      </VStack>
    ) : asset?.type === 'BY' ? (
      <VStack
        spacing={1}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.protocols'} textStyle={'captionSmall'} />
        <AssetProvider.Protocols iconMargin={-1} size={'xs'} />
      </VStack>
    ) : (
      <VStack
        spacing={1}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.rewards'} textStyle={'captionSmall'} />
        <AssetProvider.Rewards iconMargin={-1} size={'xs'} />
      </VStack>
    )
  }, [asset])

  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <Card
        p={4}
        onClick={() => onClick ? onClick() : navigate(`${location?.pathname}/${assetId}`)}
      >
        <VStack
          spacing={3}
          alignItems={'flex-start'}
        >
          <HStack
            width={'full'}
            justifyContent={'space-between'}
          >
            <AssetLabel assetId={assetId} size={'sm'} />
            {
              strategies[asset.type].strategy === 'tranches' && (
                <AssetProvider.GeneralData size={'xs'} field={'protocolWithVariant'} />
              )
            }
          </HStack>
          <SimpleGrid
            pt={3}
            pl={4}
            columns={3}
            width={'100%'}
            borderTop={'1px solid'}
            borderTopColor={'divider'}
          >
            <VStack
              spacing={1}
              alignItems={'flex-start'}
            >
              <Translation translation={'defi.pool'} textStyle={'captionSmall'} />
              <AssetProvider.PoolUsd textStyle={'tableCell'} />
            </VStack>

            <VStack
              spacing={1}
              alignItems={'flex-start'}
            >
              <Translation translation={'defi.apy'} textStyle={'captionSmall'} />
              <AssetProvider.Apy textStyle={'tableCell'} />
            </VStack>
            {depositedOrRewards}
          </SimpleGrid>
        </VStack>
      </Card>
    </AssetProvider>
  )
}

VaultCard.Stats = Stats
VaultCard.Inline = Inline
VaultCard.Minimal = Minimal