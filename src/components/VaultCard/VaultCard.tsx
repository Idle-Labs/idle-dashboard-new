import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { CgArrowRight } from 'react-icons/cg'
import { useTranslate } from 'react-polyglot'
import { useNavigate } from 'react-router-dom'
import { Asset, AssetId } from 'constants/types'
import { Amount } from 'components/Amount/Amount'
import { MdKeyboardArrowRight } from 'react-icons/md'
import { CardProps, Card } from 'components/Card/Card'
import { BNify, getVaultPath, bnOrZero, openWindow } from 'helpers/'
import { useThemeProvider } from 'contexts/ThemeProvider'
import type { AggregatedAsset } from 'components/Stats/Stats'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { StrategyTag } from 'components/StrategyTag/StrategyTag'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { TooltipContent } from 'components/TooltipContent/TooltipContent'
import { strategies, AggregatedVault, networks, Network, operators } from 'constants/'
import { useTheme, TextProps, Flex, AvatarProps, BoxProps, ThemingProps, VStack, Spinner, SimpleGrid, HStack, Box, Text, Tooltip, Heading, IconButton, Image } from '@chakra-ui/react'

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
              fields.map((fieldInfo: VaultCardField, index: number) => (
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
          backgroundColor={isOpen ? 'card.bgLight' : 'card.bg'}
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
                asset.subRows.map((asset: Asset) => (
                  <AssetProvider
                    wrapFlex={false}
                    assetId={asset.id as string}
                    key={`index_${asset.id}`}
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
                              <AssetProvider.GeneralData field={'vaultOperatorOrProtocol'} size={'xs'} />
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
              {
                strategies[asset.type].strategy === 'tranches' && (
                  <AssetProvider.GeneralData size={'xs'} field={'vaultOperatorOrProtocol'} />
                )
              }
              <AssetLabel assetId={asset.id} size={'sm'} extraFields={['statusBadge']} />
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

export const Minimal = ({ assetId }: VaultCardProps) => {
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
        layerStyle={['card', 'cardHover']}
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

type AggregatedProps = {
  onClick: Function
  aggregatedVault: AggregatedVault
}

export const Aggregated = ({ aggregatedVault, onClick }: AggregatedProps) => {

  const theme = useTheme()
  const translate = useTranslate()
  const { isMobile } = useThemeProvider()

  const {
    isVaultsLoaded,
    selectors: {
      selectAssetById,
      selectAssetsByIds,
      selectVaultPosition
    }
  } = usePortfolioProvider()

  const assets = useMemo(() => {
    return selectAssetsByIds(aggregatedVault.vaults)
  }, [selectAssetsByIds, aggregatedVault.vaults])

  const isDeprecated = useMemo(() => {
    return assets.filter( (asset: Asset) => asset.status === 'deprecated' ).length > 0
  }, [assets])

  const isFullyDeprecated = useMemo(() => {
    return assets.filter( (asset: Asset) => asset.status === 'deprecated' ).length === assets.length
  }, [assets])

  const maxApy = useMemo((): BigNumber => {
    return assets.reduce((maxApy: BigNumber, asset: Asset) => BigNumber.maximum(maxApy, BNify(asset.apy)), BNify(0))
  }, [assets])

  const totalTvl = useMemo((): BigNumber => {
    return assets.reduce((totalTvl: BigNumber, asset: Asset) => totalTvl.plus(BNify(asset.tvlUsd)), BNify(0))
  }, [assets])

  const network = useMemo((): Network => {
    return networks[aggregatedVault.chainId]
  }, [aggregatedVault])

  const vaultsPosition = useMemo((): { assets: string[], balance: BigNumber, realizedApy: BigNumber } => {
    const vaultsPosition = aggregatedVault.vaults.reduce((vaultsPosition: { assets: string[], balance: BigNumber, realizedApy: BigNumber }, vaultId: AssetId) => {
      const vaultPosition = selectVaultPosition(vaultId)
      if (vaultPosition) {
        const asset = selectAssetById(vaultId)
        vaultsPosition.assets.push(asset.underlyingId)
        vaultsPosition.balance = vaultsPosition.balance.plus(bnOrZero(vaultPosition.usd.redeemable))
        vaultsPosition.realizedApy = vaultsPosition.realizedApy.plus(bnOrZero(vaultPosition.realizedApy).times(vaultPosition.usd.redeemable))
      }
      return vaultsPosition
    }, {
      assets: [],
      balance: BNify(0),
      realizedApy: BNify(0)
    })

    // Calculate weighted-realized APY
    if (vaultsPosition.realizedApy.gt(0)) {
      vaultsPosition.realizedApy = vaultsPosition.realizedApy.div(vaultsPosition.balance)
    }

    return vaultsPosition
  }, [aggregatedVault, selectAssetById, selectVaultPosition])

  // Don't show if deprecated and zero balance
  if (isFullyDeprecated && vaultsPosition.balance.lte(0)){
    return null
  }

  return (
    <Card.Flex
      p={0}
      pb={5}
      maxWidth={['full', '32em']}
      layerStyle={['card', 'cardHover']}
      onClick={() => onClick ? onClick() : null}
    >
      <VStack
        spacing={[4, 7]}
        width={'full'}
      >
        <HStack
          px={5}
          py={4}
          spacing={4}
          width={'full'}
          alignItems={['flex-start', 'center']}
          borderRadius={'8px 8px 0 0'}
          justifyContent={'space-between'}
          backgroundColor={'card.bgLight'}
          background={`radial-gradient(circle, ${aggregatedVault.color}50 40%, ${aggregatedVault.color}cc 100%)`}
          backgroundPosition={'top left'}
          backgroundSize={'300%'}
        >
          <HStack>
            <Image src={aggregatedVault.icon} w={[10, 14]} h={[10, 14]} />
            <VStack
              spacing={[1, 2]}
              alignItems={'space-between'}
            >
              <Translation translation={aggregatedVault.name} isHtml={true} component={Heading} color={'primary'} as={'h3'} fontSize={['h3', 'h3']} />
              <Translation translation={aggregatedVault.type} component={Heading} color={'primary'} as={'h4'} fontWeight={500} fontSize={['md', 'md']} />
            </VStack>
          </HStack>
          {
            isDeprecated && (
              <Tooltip
                hasArrow
                placement={'top'}
                label={translate(`assets.assetDetails.requiredActions.deprecated`)}
              >
                <Image src={`images/vaults/warning.png`} width={8} height={8} />
              </Tooltip>
            )
          }
        </HStack>
        <VStack
          px={5}
          spacing={[4, 7]}
          width={'full'}
          alignItems={'flex-start'}
        >
          <Text color={'primary'} textStyle={'caption'}>{aggregatedVault.description}</Text>
          {
            vaultsPosition.balance.gt(0) ? (
              <SimpleGrid
                columns={3}
                spacing={4}
                width={'full'}
                justifyContent={'space-between'}
              >
                <VStack
                  pr={4}
                  spacing={2}
                  borderRight={'1px solid'}
                  borderColor={'divider'}
                  alignItems={'flex-start'}
                >
                  <Translation translation={'defi.realizedApy'} textStyle={'captionSmall'} />
                  <HStack
                    spacing={2}
                    alignItems={'baseline'}
                  >
                    <Amount fontSize={['lg', '2xl']} suffix={(<small style={{ fontSize: 24 }}>%</small>)} textStyle={'bodyTitle'} value={vaultsPosition.realizedApy} lineHeight={1} />
                  </HStack>
                </VStack>
                <VStack
                  pr={4}
                  spacing={2}
                  borderRight={'1px solid'}
                  borderColor={'divider'}
                  alignItems={'flex-start'}
                >
                  <Translation translation={'defi.balance'} textStyle={'captionSmall'} />
                  <Amount.Usd fontSize={['lg', '2xl']} textStyle={'bodyTitle'} value={vaultsPosition.balance} lineHeight={1} />
                </VStack>
                <VStack
                  spacing={2}
                  alignItems={'flex-start'}
                >
                  <Translation translation={'defi.depositedAssets'} textStyle={'captionSmall'} />
                  <HStack
                    spacing={-2}
                  >
                    {
                      vaultsPosition.assets.map((assetId: string) => {
                        return (
                          <AssetProvider
                            wrapFlex={false}
                            assetId={assetId}
                            key={`index_${assetId}`}
                          >
                            <AssetProvider.Icon size={'xs'} />
                          </AssetProvider>
                        )
                      })
                    }
                  </HStack>
                </VStack>
              </SimpleGrid>
            ) : (
              <SimpleGrid
                columns={3}
                spacing={4}
                width={'full'}
                justifyContent={'space-between'}
              >
                <VStack
                  pr={4}
                  spacing={2}
                  borderRight={'1px solid'}
                  borderColor={'divider'}
                  alignItems={'flex-start'}
                >
                  <Translation translation={'stats.upTo'} textStyle={'captionSmall'} />
                  <HStack
                    spacing={2}
                    alignItems={'baseline'}
                  >
                    {
                      !isVaultsLoaded ? (
                        <Spinner size={'md'} />
                      ) : (
                        <Amount fontSize={['lg', '2xl']} suffix={(<small style={{ fontSize: isMobile ? 18 : 24 }}>%</small>)} textStyle={'bodyTitle'} value={maxApy} lineHeight={1} />
                      )
                    }
                    {
                      !isMobile && (
                        <Translation translation={'defi.apy'} textStyle={'caption'} />
                      )
                    }
                  </HStack>
                </VStack>
                <VStack
                  pr={4}
                  spacing={2}
                  borderRight={'1px solid'}
                  borderColor={'divider'}
                  alignItems={'flex-start'}
                >
                  <Translation translation={'defi.tvl'} textStyle={'captionSmall'} />
                  {
                    !isVaultsLoaded ? (
                      <Spinner size={'md'} />
                    ) : (
                      <Amount.Usd fontSize={['lg', '2xl']} textStyle={'bodyTitle'} value={totalTvl} lineHeight={1} />
                    )
                  }
                </VStack>
                <VStack
                  spacing={2}
                  alignItems={'flex-start'}
                >
                  <Translation translation={isMobile ? 'navBar.assets' : 'defi.availableAssets'} textStyle={'captionSmall'} />
                  <HStack
                    spacing={-2}
                  >
                    {
                      assets.map((asset: Asset) => {
                        return (
                          <AssetProvider
                            wrapFlex={false}
                            assetId={asset.id}
                            key={`index_${asset.id}`}
                          >
                            <AssetProvider.Icon size={'xs'} />
                          </AssetProvider>
                        )
                      })
                    }
                  </HStack>
                </VStack>
              </SimpleGrid>
            )
          }
          <HStack
            width={'full'}
            alignItems={'center'}
            justifyContent={'space-between'}
          >
            <HStack
              spacing={2}
            >
              <Translation translation={'common.availableOn'} textStyle={'captionSmall'} />
              <Card.Light
                py={0}
                px={1}
                pr={2}
                height={8}
                width={'auto'}
                display={'flex'}
                borderRadius={24}
                border={'1px solid'}
                alignItems={'center'}
                backgroundColor={'primary'}
              >
                <HStack
                  spacing={1}
                >
                  <Image src={network.icon as string} width={6} height={6} />
                  <Text fontSize={'sm'} fontWeight={600} color={'card.bg'}>{network.name}</Text>
                </HStack>
              </Card.Light>
            </HStack>
            <IconButton
              size={'sm'}
              borderRadius={'50%'}
              colorScheme={'mattWhite'}
              aria-label={'explore'}
              icon={
                <CgArrowRight
                  size={20}
                  color={theme.colors.card.bg}
                />
              }
            />
          </HStack>
        </VStack>
      </VStack>
    </Card.Flex>
  )
}
type CreditProps = {
  onClick: Function
  assetId: AssetId
}

export const Credit = ({ assetId, onClick }: CreditProps) => {

  const theme = useTheme()
  const { isMobile } = useThemeProvider()

  const {
    isVaultsLoaded,
    selectors: {
      selectAssetById,
      selectVaultById,
      selectVaultPosition
    }
  } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const vault = useMemo(() => {
    return selectVaultById(assetId)
  }, [selectVaultById, assetId])

  const maxApy = useMemo((): BigNumber => {
    return asset.apy
  }, [asset])

  const totalTvl = useMemo((): BigNumber => {
    return asset.tvlUsd
  }, [asset])

  const network = useMemo((): Network => {
    return networks[asset.chainId]
  }, [asset])

  const borrower = useMemo(() => operators[vault.vaultConfig.borrower], [vault]) 
  const vaultsPosition = useMemo(() => selectVaultPosition(asset.id), [asset, selectVaultPosition])

  return (
    <AssetProvider
      wrapFlex={false}
      assetId={asset.id}
    >
      <Card.Flex
        p={0}
        pb={5}
        maxWidth={['full', '32em']}
        layerStyle={['card', 'cardHover']}
        onClick={() => onClick ? onClick() : null}
      >
        <VStack
          spacing={[4, 7]}
          width={'full'}
        >
          <HStack
            px={5}
            py={4}
            width={'full'}
            alignItems={'center'}
            justifyContent={'space-between'}
            borderRadius={'8px 8px 0 0'}
            backgroundColor={'card.bgLight'}
            // background={`radial-gradient(circle, ${aggregatedVault.color}50 40%, ${aggregatedVault.color}cc 100%)`}
            backgroundPosition={'top left'}
            backgroundSize={'300%'}
          >
            <HStack
              spacing={4}
              width={'full'}
              alignItems={['flex-start', 'center']}
              justifyContent={'flex-start'}
            >
              <Image src={borrower.image} w={[10, 14]} h={[10, 14]} />
              <VStack
                spacing={[1, 2]}
                alignItems={'space-between'}
              >
                <Translation translation={borrower.nameShort} isHtml={true} component={Heading} color={'primary'} as={'h3'} fontSize={['h3', 'h3']} />
                <AssetProvider.VaultVariant color={'primary'} as={'h4'} fontWeight={500} fontSize={['md', 'md']} />
              </VStack>
            </HStack>
            <AssetProvider.KycVerificationBadge />
          </HStack>
          <VStack
            px={5}
            spacing={[4, 7]}
            width={'full'}
            alignItems={'flex-start'}
          >
            <Text color={'primary'} textStyle={'caption'} dangerouslySetInnerHTML={{__html: vault.vaultConfig.descriptionShort}} />
            {
              bnOrZero(vaultsPosition?.balance).gt(0) ? (
                <SimpleGrid
                  columns={3}
                  spacing={4}
                  width={'full'}
                  justifyContent={'space-between'}
                >
                  <VStack
                    pr={4}
                    spacing={2}
                    borderRight={'1px solid'}
                    borderColor={'divider'}
                    alignItems={'flex-start'}
                  >
                    <Translation translation={'defi.realizedApy'} textStyle={'captionSmall'} />
                    <HStack
                      spacing={2}
                      alignItems={'baseline'}
                    >
                      <Amount fontSize={['lg', '2xl']} suffix={(<small style={{ fontSize: 24 }}>%</small>)} textStyle={'bodyTitle'} value={vaultsPosition.realizedApy} lineHeight={1} />
                    </HStack>
                  </VStack>
                  <VStack
                    pr={4}
                    spacing={2}
                    borderRight={'1px solid'}
                    borderColor={'divider'}
                    alignItems={'flex-start'}
                  >
                    <Translation translation={'defi.balance'} textStyle={'captionSmall'} />
                    <Amount.Usd fontSize={['lg', '2xl']} textStyle={'bodyTitle'} value={vaultsPosition.balance} lineHeight={1} />
                  </VStack>
                  <VStack
                    spacing={2}
                    alignItems={'flex-start'}
                  >
                    <Translation translation={'defi.depositedAssets'} textStyle={'captionSmall'} />
                    <HStack
                      spacing={-2}
                    >
                      {
                        vaultsPosition.assets.map((assetId: string) => {
                          return (
                            <AssetProvider
                              wrapFlex={false}
                              assetId={assetId}
                              key={`index_${assetId}`}
                            >
                              <AssetProvider.Icon size={'xs'} />
                            </AssetProvider>
                          )
                        })
                      }
                    </HStack>
                  </VStack>
                </SimpleGrid>
              ) : (
                <SimpleGrid
                  columns={3}
                  spacing={4}
                  width={'full'}
                  justifyContent={'space-between'}
                >
                  <VStack
                    pr={4}
                    spacing={2}
                    borderRight={'1px solid'}
                    borderColor={'divider'}
                    alignItems={'flex-start'}
                  >
                    <Translation translation={'defi.apy'} textStyle={'captionSmall'} />
                    <HStack
                      spacing={2}
                      alignItems={'baseline'}
                    >
                      {
                        !isVaultsLoaded ? (
                          <Spinner size={'md'} />
                        ) : (
                          <Amount fontSize={['lg', '2xl']} suffix={(<small style={{ fontSize: isMobile ? 18 : 24 }}>%</small>)} textStyle={'bodyTitle'} value={maxApy} lineHeight={1} />
                        )
                      }
                    </HStack>
                  </VStack>
                  <VStack
                    pr={4}
                    spacing={2}
                    borderRight={'1px solid'}
                    borderColor={'divider'}
                    alignItems={'flex-start'}
                  >
                    <Translation translation={'defi.tvl'} textStyle={'captionSmall'} />
                    {
                      !isVaultsLoaded ? (
                        <Spinner size={'md'} />
                      ) : (
                        <Amount.Usd fontSize={['lg', '2xl']} textStyle={'bodyTitle'} value={totalTvl} lineHeight={1} />
                      )
                    }
                  </VStack>
                  <VStack
                    spacing={2}
                    alignItems={'flex-start'}
                  >
                    <Translation translation={'defi.status'} textStyle={'captionSmall'} />
                    <AssetProvider.EpochInfo field={'isEpochRunning'} textStyle={'bodytitle'} lineHeight={1} fontSize={['lg', '2xl']} />
                  </VStack>
                </SimpleGrid>
              )
            }
            <HStack
              width={'full'}
              alignItems={'center'}
              justifyContent={'space-between'}
            >
              <HStack
                spacing={2}
              >
                <Translation translation={'common.availableOn'} textStyle={'captionSmall'} />
                <Card.Light
                  py={0}
                  px={1}
                  pr={2}
                  height={8}
                  width={'auto'}
                  display={'flex'}
                  borderRadius={24}
                  border={'1px solid'}
                  alignItems={'center'}
                  backgroundColor={'primary'}
                >
                  <HStack
                    spacing={1}
                  >
                    <Image src={network.icon as string} width={6} height={6} />
                    <Text fontSize={'sm'} fontWeight={600} color={'card.bg'}>{network.name}</Text>
                  </HStack>
                </Card.Light>
              </HStack>
              <IconButton
                size={'sm'}
                borderRadius={'50%'}
                colorScheme={'mattWhite'}
                aria-label={'explore'}
                icon={
                  <CgArrowRight
                    size={20}
                    color={theme.colors.card.bg}
                  />
                }
              />
            </HStack>
          </VStack>
        </VStack>
      </Card.Flex>
    </AssetProvider>
  )
}

export const New = ({ assetId, onClick }: VaultCardProps) => {
  // const theme = useTheme()
  const navigate = useNavigate()
  const translate = useTranslate()
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
          spacing={3}
          width={'full'}
          alignItems={'flex-start'}
          justifyContent={'space-between'}
        >
          <HStack
            width={'full'}
            alignItems={'flex-start'}
            justifyContent={'space-between'}
          >
            <AssetProvider.GeneralData field={'vaultOperatorOrProtocol'} />
            <HStack
              spacing={1}
            >
              <AssetProvider.StrategyBadge />
            </HStack>
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
              <AssetProvider.RewardsEmissions flexProps={{ borderRadius: 24, height: 8, alignItems: 'center' }} fontWeight={600}>
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
                        spacing={2}
                        alignItems={'center'}
                      >
                        <AssetProvider.DistributedRewards size={'2xs'} />
                        <AssetProvider.RewardsApy fontSize={'xs'} fontWeight={600} />
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

export const Institutional = () => {
  const theme = useTheme()

  return (
    <Card.Flex
      p={0}
      pb={5}
      maxWidth={['full', '32em']}
      layerStyle={['card', 'cardHover']}
      onClick={() => openWindow('https://pareto.idle.finance')}
    >
      <VStack
        spacing={[4, 7]}
        width={'full'}
        >
        <HStack
          h={88}
          px={[3, 5]}
          spacing={4}
          width={'full'}
          alignItems={'center'}
          borderRadius={'8px 8px 0 0'}
          justifyContent={'space-between'}
          // borderBottom={'1px solid #fff'}
          background={`radial-gradient(circle, #334698 40%, #3e9cce 100%)`}
          backgroundPosition={'top left'}
          backgroundSize={'300%'}
        >
          <HStack
            spacing={4}
            width={'full'}
            alignItems={'center'}
          >
            <Image src={'images/partners/pareto.svg'} w={[14, 28]} />
            <Translation translation={'Credit vaults'} component={Heading} color={'primary'} as={'h4'} fontWeight={500} fontSize={['md', 'xl']} pl={4} borderLeft={'1px solid white'} />
          </HStack>
        </HStack>
        <VStack
          px={5}
          flex={1}
          spacing={[4, 0]}
          width={'full'}
          alignItems={'flex-start'}
          justifyContent={'space-between'}
        >
          <VStack
            spacing={4}
            width={'full'}
            alignItems={'flex-start'}
          >
            {/* <Translation translation={'Institutional credit on-chain'} isHtml={true} component={Heading} color={'primary'} as={'h3'} fontSize={['h3', 'xl']} /> */}
            <Text color={'primary'} textStyle={'caption'}>Modernizing credit markets to bring speed, programmability, and compliance advantages of blockchain tokenization.</Text>
          </VStack>
          <VStack
            spacing={0}
            width={'full'}
            alignItems={'flex-start'}
          >
            <Translation translation={'common.trustedBy'} color={'primary'} textStyle={'captionSmall'} />
            <HStack
              spacing={6}
              width={'full'}
            >
              <Image h={[5, 6]} src={'images/partners/rockaway.svg'} />
              <Image h={[5, 8]} src={'images/partners/fasanara-digital.svg'} />
              <Image h={[5, 6]} src={'images/partners/bastion-trading.svg'} />
              {/* <Image h={4} src={'images/partners/falconX.svg'} />
              <Image h={16} src={'images/partners/maven.svg'} /> */}
            </HStack>
          </VStack>
          <HStack
            width={'full'}
            alignItems={'end'}
            justifyContent={'space-between'}
          >
            <HStack
              spacing={2}
            >
              <Translation translation={'common.availableOn'} textStyle={'captionSmall'} />
              {
                [1].map( chainId => (
                  <Card.Light
                    py={0}
                    px={1}
                    pr={2}
                    height={8}
                    key={chainId}
                    width={'auto'}
                    display={'flex'}
                    borderRadius={24}
                    border={'1px solid'}
                    alignItems={'center'}
                    backgroundColor={'primary'}
                  >
                    <HStack
                      spacing={1}
                    >
                      <Image src={networks[chainId].icon as string} width={6} height={6} />
                      <Text fontSize={'sm'} fontWeight={600} color={'card.bg'}>{networks[chainId].name}</Text>
                    </HStack>
                  </Card.Light>
                ) )
              }
            </HStack>
            <IconButton
              size={'sm'}
              borderRadius={'50%'}
              colorScheme={'mattWhite'}
              aria-label={'explore'}
              icon={
                <CgArrowRight
                  size={20}
                  color={theme.colors.card.bg}
                />
              }
            />
          </HStack>
        </VStack>
      </VStack>
    </Card.Flex>
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
            {
              strategies[asset.type].strategy === 'tranches' && (
                <AssetProvider.GeneralData size={'xs'} field={'vaultOperatorOrProtocol'} />
              )
            }
            <AssetLabel assetId={assetId} size={'sm'} extraFields={strategies[asset.type].strategy === 'tranches' ? ['strategyBadge'] : []} />
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
VaultCard.Credit = Credit
VaultCard.Minimal = Minimal
VaultCard.Tranche = Tranche
VaultCard.Aggregated = Aggregated
VaultCard.Institutional = Institutional