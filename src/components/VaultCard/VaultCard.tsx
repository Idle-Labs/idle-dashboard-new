import React, { useMemo } from 'react'
import { strategies } from 'constants/'
import { getVaultPath } from 'helpers/'
import { useTranslate } from 'react-polyglot'
import { CgArrowRight } from 'react-icons/cg'
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
import { TooltipContent } from 'components/TooltipContent/TooltipContent'
import { useTheme, IconButton, TextProps, Flex, AvatarProps, BoxProps, ThemingProps, VStack, SimpleGrid, HStack, Box, Text, Tooltip } from '@chakra-ui/react'

export type VaultCardProps = {
  assetId: AssetId
  onClick?: Function
}

type VaultCardField = {
  field: string
  label?: string
  labelPos?: 'left' | 'right'
  props?: TextProps & AvatarProps & BoxProps & ThemingProps
  parentProps?: TextProps & AvatarProps & BoxProps & ThemingProps
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
                    {...fieldInfo.parentProps}
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

const Tranche = ({ assetId, onClick }: VaultCardProps) => {
  const navigate = useNavigate()
  const { location } = useBrowserRouter()
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const vault = useMemo(() => {
    if (!selectVaultById) return
    return selectVaultById(assetId)
  }, [assetId, selectVaultById])

  const asset = useMemo(() => {
    if (!selectAssetById) return
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const aaTrancheAsset = useMemo(() => selectAssetById(vault?.vaultConfig.Tranches.AA.address), [vault, selectAssetById])
  const bbTrancheAsset = useMemo(() => selectAssetById(vault?.vaultConfig.Tranches.BB.address), [vault, selectAssetById])
  
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
              <AssetLabel assetId={asset.id} size={'sm'} extraFields={['statusBadge']} />
              {
                strategies[asset.type].strategy === 'tranches' && (
                  <AssetProvider.GeneralData size={'xs'} field={'protocolWithVariant'} />
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
                <AssetProvider.TrancheTotalPoolUsd textStyle={'tableCell'} />
              </VStack>
              <VStack
                spacing={1}
                alignItems={'flex-end'}
              >
                <Translation translation={'defi.apy'} textStyle={'captionSmall'} />
                <HStack
                  spacing={1}
                >
                  <Amount.Percentage value={aaTrancheAsset?.apy || null} textStyle={'tableCell'} />
                  <Text>-</Text>
                  <Amount.Percentage value={bbTrancheAsset?.apy || null} textStyle={'tableCell'} />
                </HStack>
              </VStack>
            </HStack>
          </VStack>
        </Card>
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
              justifyContent={'flex-end'}
            >
              <AssetProvider.Protocols size={'xs'}>
                {/*<AssetProvider.ProtocolIcon size={'xs'} />*/}
                <AssetProvider.GeneralData field={'protocol'} size={'xs'} fontSize={'sm'} />
              </AssetProvider.Protocols>
            </VStack>
          </SimpleGrid>
        </VStack>
      </Card>
    </AssetProvider>
  )
}

export const New = ({ assetId, onClick }: VaultCardProps) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const translate = useTranslate()
  const { location } = useBrowserRouter()
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
      <Card.Flex
        py={3}
        px={4}
        layerStyle={['card', 'cardHover']}
        onClick={() => onClick ? onClick() : navigate(getVaultPath(asset?.type, asset?.id))}
      >
        <VStack
          spacing={2}
          width={'full'}
          alignItems={'flex-start'}
          justifyContent={'space-between'}
        >
          <HStack
            width={'full'}
            alignItems={'flex-start'}
            justifyContent={'space-between'}
          >
            <AssetProvider.GeneralData field={'protocolWithVariant'} />
            <AssetProvider.StrategyBadge />
          </HStack>
          <HStack
            spacing={1}
          >
            <HStack
              spacing={1}
            >
              <AssetProvider.Apy fontSize={32} textStyle={'bodyTitle'} showTooltip={false} />
              <Translation translation={'defi.apy'} fontSize={32} textStyle={'bodyTitle'} color={'ctaDisabled'} />
            </HStack>
          </HStack>
          <HStack
            width={'full'}
            justifyContent={'space-between'}
          >
            <HStack
              spacing={2}
            >
              <Card.Light
                py={0}
                px={2}
                height={8}
                width={'auto'}
                display={'flex'}
                borderRadius={24}
                border={'1px solid'}
                alignItems={'center'}
                borderColor={'card.bg'}
              >
                <HStack
                  spacing={1}
                >
                  <AssetProvider.Icon size={'2xs'} mr={'2px'} />
                  <AssetProvider.PoolUsd abbreviate={false} decimals={0} fontSize={'sm'} textStyle={'bodyTitle'} />
                  <Translation translation={'defi.tvl'} fontSize={'sm'} textStyle={'bodyTitle'} />
                </HStack>
              </Card.Light>
            </HStack>
            <Flex
              width={'auto'}
            >
              <AssetProvider.RewardsEmissions flexProps={{borderRadius:24, height: 8, alignItems: 'center'}}>
                <Tooltip
                  hasArrow
                  placement={'top'}
                  label={translate('defi.additionalRewardsApy')}
                >
                  <TooltipContent>
                    <Card.Light
                      py={0}
                      px={2}
                      height={8}
                      width={'auto'}
                      display={'flex'}
                      borderRadius={24}
                      border={'1px solid'}
                      alignItems={'center'}
                      borderColor={'card.bg'}
                    >
                      <HStack
                        spacing={1}
                        alignItems={'center'}
                      >
                        <AssetProvider.Autocompounding size={'2xs'} />
                        <AssetProvider.RewardsApy fontSize={'xs'} />
                      </HStack>
                    </Card.Light>
                  </TooltipContent>
                </Tooltip>
              </AssetProvider.RewardsEmissions>
            </Flex>
            {
              /*
              <IconButton
                size={'sm'}
                borderRadius={'50%'}
                aria-label={'explore'}
                colorScheme={'whiteAlpha'}
                icon={
                  <CgArrowRight
                    size={20}
                    color={theme.colors.card.bg}
                  />
                }
              />
              */
            }
          </HStack>
        </VStack>
      </Card.Flex>
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
            <AssetLabel assetId={assetId} size={'sm'} extraFields={strategies[asset.type].strategy === 'tranches' ? ['strategyBadge'] : []} />
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

VaultCard.New = New
VaultCard.Stats = Stats
VaultCard.Inline = Inline
VaultCard.Minimal = Minimal
VaultCard.Tranche = Tranche