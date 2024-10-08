// import dayjs from 'dayjs'
import Countdown from "react-countdown"
import { BigNumber } from 'bignumber.js'
import { BsQuestion } from 'react-icons/bs'
import { useTranslate } from 'react-polyglot'
import { networks } from 'constants/networks'
import { strategies } from 'constants/strategies'
import { TrancheVault } from 'vaults/TrancheVault'
import { UnderlyingToken } from 'vaults/UnderlyingToken'
import type { IdleTokenProtocol } from 'constants/vaults'
// import { useI18nProvider } from 'contexts/I18nProvider'
import { RateChart } from 'components/RateChart/RateChart'
import { ProductTag } from 'components/ProductTag/ProductTag'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import React, { useMemo, createContext, useContext } from 'react'
import { selectProtocol, selectUnderlyingToken } from 'selectors/'
import { useAssetPageProvider } from 'components/AssetPage/AssetPage'
import { TooltipContent } from 'components/TooltipContent/TooltipContent'
import { AllocationChart } from 'components/AllocationChart/AllocationChart'
import { TransactionLink } from 'components/TransactionLink/TransactionLink'
import { Amount, AmountProps, PercentageProps } from 'components/Amount/Amount'
import { MAX_STAKING_DAYS, PROTOCOL_TOKEN, BLOCKS_PER_YEAR } from 'constants/vars'
import { TranslationProps, Translation } from 'components/Translation/Translation'
import type { FlexProps, BoxProps, ThemingProps, TextProps, AvatarProps, ImageProps } from '@chakra-ui/react'
import { BarChart, BarChartData, BarChartLabels, BarChartColors, BarChartKey } from 'components/BarChart/BarChart'
import { BNify, bnOrZero, abbreviateNumber, formatDate, isEmpty, getObjectPath, secondsToPeriod, fixTokenDecimals, toDayjs } from 'helpers/'
import { useTheme, SkeletonText, Text, Flex, Avatar, Tooltip, Spinner, SimpleGrid, VStack, HStack, Tag, Image, Box } from '@chakra-ui/react'
import { Asset, Vault, operators, UnderlyingTokenProps, protocols, HistoryTimeframe, vaultsStatusSchemes, GOVERNANCE_CHAINID, EpochData } from 'constants/'
import { MdError, MdVerified } from 'react-icons/md'
import { useWalletProvider } from 'contexts/WalletProvider'

type AssetCellProps = {
  wrapFlex?: boolean,
  assetId: string | undefined
} & FlexProps & ThemingProps

// type LogoProps = AssetProps & {
//   [x: string]: any
// }

type ContextProps = {
  theme: any
  asset: Asset | null
  vault: Vault | null
  translate: Function
  underlyingAsset: Asset | null
  assetId: string | null | undefined
  underlyingAssetVault: UnderlyingToken | null
}

const initialState = {
  asset: null,
  vault: null,
  theme: null,
  assetId: null,
  translate: () => { },
  underlyingAsset: null,
  underlyingAssetVault: null
}

export type AssetProviderPropsType = TextProps & AvatarProps & BoxProps & ThemingProps

const AssetContext = createContext<ContextProps>(initialState)

export const useAssetProvider = () => useContext(AssetContext)

export const AssetProvider = ({ assetId, wrapFlex = true, children, ...flexProps }: AssetCellProps) => {
  const theme = useTheme()
  const translate = useTranslate()
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    if (!selectAssetById || !assetId) return null
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const vault = useMemo(() => {
    if (!selectVaultById || !assetId) return null
    return selectVaultById(assetId)
  }, [assetId, selectVaultById])

  const underlyingAsset = useMemo(() => {
    if (!selectAssetById || !asset?.underlyingId) return null
    return selectAssetById(asset.underlyingId)
  }, [asset, selectAssetById])

  const underlyingAssetVault = useMemo(() => {
    if (!selectVaultById || !asset?.underlyingId) return null
    return selectVaultById(asset.underlyingId)
  }, [asset, selectVaultById])

  const wrappedChildren = useMemo(() => {
    return wrapFlex ? (
      <Flex {...flexProps}>
        {children}
      </Flex>
    ) : children
  }, [children, flexProps, wrapFlex])

  return (
    <AssetContext.Provider value={{ asset, vault, underlyingAsset, underlyingAssetVault, assetId, translate, theme }}>
      {wrappedChildren}
    </AssetContext.Provider>
  )
}

export type AssetFieldProps = {
  value?: string | number | BigNumber
} & TextProps

const Name: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  return (
    <SkeletonText minW={!asset ? '50px' : 'auto'} noOfLines={1} isLoaded={!!asset}>
      <Text {...props}>{asset?.name}</Text>
    </SkeletonText>
  )
}

const Symbol: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  return (
    <Text {...props}>{asset?.token}</Text>
  )
}

const ProtocolName: React.FC<TextProps> = (props) => {
  const { vault } = useAssetProvider()
  return (
    <Text textTransform={'capitalize'} {...props}>{vault && "protocol" in vault ? vault?.protocol : ''}</Text>
  )
}

const StrategyBadge: React.FC<ImageProps> = (props) => {
  const { asset, translate } = useAssetProvider()
  if (!asset || !("type" in asset) || !asset?.type) return null
  const strategy = strategies[asset.type]
  return (
    <Tooltip
      hasArrow
      placement={'top'}
      label={translate(strategy.label)}
    >
      <Image src={`images/strategies/${asset.type}.svg`} {...props} />
    </Tooltip>
  )
}

const Strategy: React.FC<Omit<TranslationProps, "translation">> = (props) => {
  const { vault } = useAssetProvider()
  if (!vault) return null
  return (
    <Translation translation={strategies[vault.type].label} {...props} />
  )
}

const VaultVariant: React.FC<TextProps> = (props) => {
  const { vault } = useAssetProvider()
  const vaultType = useMemo(() => {
    return vault && ("vaultType" in vault) && vault.vaultType ? vault.vaultType : vault?.type
  }, [vault])

  return (
    <Translation translation={`products.${vaultType}`} textStyle={'tableCell'} {...props} />
  )
}

const KycVerificationBadge: React.FC = () => {
  const { account } = useWalletProvider()
  const { asset, vault, translate, theme } = useAssetProvider()
  const { isPortfolioLoaded } = usePortfolioProvider()

  if (!asset || !isPortfolioLoaded) return null

    const checkWalletAllowed = vault && ("kycRequired" in vault) && !!vault.kycRequired
    if (!checkWalletAllowed) return null
    
    const walletAllowed = account?.address && !!asset.walletAllowed
    const statusColor = walletAllowed ? theme.colors.brightGreen : theme.colors.orange
    const statusColorBg = walletAllowed ? `${theme.colors.brightGreen}15` : `${theme.colors.orange}15`

  return (
    <Tooltip
      hasArrow
      placement={'top'}
      label={translate(`strategies.credit.kyc.tooltips.${walletAllowed ? 'completed' : 'required'}`)}
    >
      <TooltipContent>
        <HStack
          px={2}
          spacing={1}
          height={10}
          borderRadius={8}
          bg={statusColorBg}
          border={'1px solid'}
          borderColor={statusColor}
        >
          {
            walletAllowed ? (
              <MdVerified color={statusColor} size={18} />
            ) : (
              <MdError color={statusColor} size={18} />
            )
          }
          <Translation translation={walletAllowed ? 'common.verified' : `common.kyc`} textStyle={'base'} color={'primary'} />
        </HStack>
      </TooltipContent>
    </Tooltip>
  )
}

const StatusBadge: React.FC<ImageProps> = (props) => {
  const { asset, translate } = useAssetProvider()
  if (!asset) return null

  const status = asset.status || 'production'
  // if (status !== 'deprecated' && "flags" in asset && !!asset.flags?.feeDiscountEnabled){
  //   status = 'discount'
  // }

  if (!status?.length || status === 'production') return null

  return (
    <Tooltip
      hasArrow
      placement={'top'}
      label={translate(`assets.assetDetails.tooltips.${status}`)}
    >
      <Image src={`images/vaults/${status}.png`} {...props} />
    </Tooltip>
  )
}

const ActionRequired: React.FC<ImageProps> = (props) => {
  const { vault, asset, translate } = useAssetProvider()
  const { selectors: { selectVaultById } } = usePortfolioProvider()

  let action = null

  // Check Gauge disabled
  const gaugeVault = vault && ("gaugeConfig" in vault) && vault.gaugeConfig?.address && selectVaultById(vault.gaugeConfig?.address)
  const stakedBalance = bnOrZero(asset?.vaultPosition?.underlying.staked)
  const depositedBalance = bnOrZero(asset?.vaultPosition?.underlying.deposited)
  if (stakedBalance.gt(0) && gaugeVault && !gaugeVault.enabled) {
    action = 'redeemFromGauge'
  } else if (depositedBalance.gt(0) && asset?.status === 'deprecated') {
    action = 'deprecated'
  }

  if (!action) return null

  return (
    <Tooltip
      hasArrow
      placement={'top'}
      label={translate(`assets.assetDetails.requiredActions.${action}`)}
    >
      <Image src={`images/vaults/warning.png`} {...props} />
    </Tooltip>
  )
}

export type IconProps = {
  showTooltip?: boolean
} & AvatarProps

const Icon: React.FC<IconProps> = ({
  showTooltip = false,
  ...props
}) => {
  const { asset } = useAssetProvider()

  const avatar = useMemo(() => (
    <Avatar
      id={asset?.id}
      src={asset?.icon}
      icon={<BsQuestion size={24} />}
      {...props}
    />
  ), [asset, props])

  const tooltip = useMemo(() => (
    <Tooltip
      hasArrow
      placement={'top'}
      label={asset?.name}
      isDisabled={!showTooltip}
    >
      {avatar}
    </Tooltip>
  ), [showTooltip, avatar, asset])

  if (!asset) return <Spinner size={props.size || 'sm'} />

  return tooltip
}

const ProtocolIcon: React.FC<IconProps> = ({
  showTooltip = false,
  ...props
}) => {
  const { vault } = useAssetProvider()

  const protocol = useMemo(() => {
    if (!vault || !("protocol" in vault)) return null
    return protocols[vault?.protocol]
  }, [vault])

  if (!protocol) return null

  return (
    <Tooltip
      hasArrow
      placement={'top'}
      label={protocol?.label}
      isDisabled={!showTooltip}
    >
      <Avatar
        src={protocol?.icon}
        icon={<BsQuestion size={24} />}
        {...props}
      />
    </Tooltip>
  )
}

const StakingRewards: React.FC<AvatarProps & BoxProps> = ({ children, ...props }) => {
  const { vault } = useAssetProvider();
  const { selectors: { selectVaultById, selectAssetById } } = usePortfolioProvider()

  const stakingRewards = useMemo(() => {
    if (!vault || !("gaugeConfig" in vault) || !vault.gaugeConfig) return children
    const gaugeVault = ("gaugeConfig" in vault) && vault.gaugeConfig && selectVaultById(vault.gaugeConfig?.address)
    const gaugeAsset = gaugeVault && selectAssetById(gaugeVault.id)

    const rewards = gaugeVault?.enabled && gaugeVault?.rewardTokens.map((rewardToken: UnderlyingTokenProps, index: number) => {
      if (!rewardToken.address) return null
      const rewardTokenRate = bnOrZero(gaugeAsset?.gaugeData?.rewards[rewardToken.address]?.rate)
      if (!rewardTokenRate.gt(0)) return null
      return (
        <AssetProvider key={`asset_${rewardToken.address}_${index}`} assetId={rewardToken.address}>
          <AssetProvider.Icon {...props} ml={index ? -1 : 0} showTooltip={true} />
        </AssetProvider>
      )
    }).filter((reward: any) => !!reward)
    return rewards.length ? rewards : children
  }, [children, vault, props, selectVaultById, selectAssetById])

  return (
    <Flex>
      {stakingRewards}
    </Flex>
  )
}

const DistributedRewards: React.FC<AvatarProps & BoxProps> = ({ children, ...props }) => {
  const { vault } = useAssetProvider()

  const distributedTokens = useMemo(() => {
    if (!vault || !("distributedTokens" in vault)) return children

    const rewards = vault.distributedTokens.map((rewardToken: UnderlyingTokenProps, index: number) => {
      if (!rewardToken.address) return null
      return (
        <AssetProvider key={`asset_${rewardToken.address}_${index}`} assetId={rewardToken.address}>
          <AssetProvider.Icon {...props} ml={index ? -1 : 0} showTooltip={true} />
        </AssetProvider>
      )
    }).filter((reward: any) => !!reward)
    return rewards.length ? rewards : children
  }, [children, vault, props])

  return (
    <Flex>
      {distributedTokens}
    </Flex>
  )
}

const Autocompounding: React.FC<AvatarProps & BoxProps> = ({ children, ...props }) => {
  const { vault } = useAssetProvider()

  const rewardTokens = useMemo(() => {
    if (!vault || !("rewardTokens" in vault)) return children

    const rewards = vault.rewardTokens.map((rewardToken: UnderlyingTokenProps, index: number) => {
      if (!rewardToken.address) return null
      return (
        <AssetProvider key={`asset_${rewardToken.address}_${index}`} assetId={rewardToken.address}>
          <AssetProvider.Icon {...props} ml={index ? -1 : 0} showTooltip={true} />
        </AssetProvider>
      )
    }).filter((reward: any) => !!reward)
    return rewards.length ? rewards : children
  }, [children, vault, props])

  return (
    <Flex>
      {rewardTokens}
    </Flex>
  )
}

const Categories: React.FC<TextProps> = ({ ...props }) => {
  const { vault, translate } = useAssetProvider()
  if (!vault || !("categories" in vault) || isEmpty(vault.categories)) return null
  return (
    <VStack
      spacing={1}
      alignItems={'flex-start'}
    >
      {
        vault?.categories?.map((category: string) => (
          <Tag {...props} variant={'outline'} color={'primary'} size={'sm'} fontWeight={600}>{translate(`assets.categories.${category}.title`)}</Tag>
        ))
      }
    </VStack>
  )
}

type RewardsProps = {
  iconMargin?: number
} & AvatarProps & BoxProps

const Rewards: React.FC<RewardsProps> = ({ children, iconMargin, ...props }) => {
  const { vault } = useAssetProvider()
  const { selectors: { selectVaultById, selectAssetById } } = usePortfolioProvider()

  const rewardTokens = useMemo(() => {
    if (!vault || !("rewardTokens" in vault)) return children

    const gaugeVault = ("gaugeConfig" in vault) && vault.gaugeConfig?.address && selectVaultById(vault.gaugeConfig?.address)

    // Add Gauge rewards
    const rewardTokens = [...vault.rewardTokens]
    if (gaugeVault?.enabled) {
      const gaugeAsset = selectAssetById(gaugeVault.id)
      for (const rewardToken of gaugeVault.rewardTokens) {
        const rewardTokenRate = bnOrZero(gaugeAsset?.gaugeData?.rewards[rewardToken.address]?.rate)
        if (!rewardTokens.includes(rewardToken) && rewardTokenRate.gt(0)) {
          rewardTokens.push(rewardToken)
        }
      }
    }

    const rewards = rewardTokens.map((rewardToken: UnderlyingTokenProps, index: number) => {
      if (!rewardToken.address) return null
      return (
        <AssetProvider key={`asset_${rewardToken.address}_${index}`} assetId={rewardToken.address}>
          <AssetProvider.Icon {...props} ml={index ? iconMargin !== undefined ? iconMargin : -1 : 0} showTooltip={true} />
        </AssetProvider>
      )
    }).filter((reward: any) => !!reward)
    return rewards.length ? rewards : children
  }, [children, vault, props, selectVaultById, selectAssetById, iconMargin])

  return (
    <Flex>
      {rewardTokens}
    </Flex>
  )
}

type ProtocolsProps = {
  iconMargin?: number
  tooltipDisabled?: boolean
} & AvatarProps & BoxProps

const Protocols: React.FC<ProtocolsProps> = ({ children, iconMargin, tooltipDisabled = false, ...props }) => {
  const { vault } = useAssetProvider()
  const { selectors: { selectVaultById } } = usePortfolioProvider()

  const protocols = useMemo(() => {
    if (!vault || !("tokenConfig" in vault) || !("protocols" in vault.tokenConfig)) return children

    const protocolIcons = vault.tokenConfig.protocols.reduce((protocols: JSX.Element[], protocolConfig: IdleTokenProtocol, index: number) => {
      const protocol = selectProtocol(protocolConfig.name)
      const vault = selectVaultById(protocolConfig.address)
      if (!protocol) return protocols
      const label = protocolConfig.label || protocol.label

      const operatorInfo = vault && ("getOperatorInfo" in vault) ? vault.getOperatorInfo() : null
      const protocolIcon = operatorInfo?.image || protocol.icon

      protocols.push(
        <Tooltip
          hasArrow
          label={label}
          placement={'top'}
          key={`icon_${index}`}
          isDisabled={tooltipDisabled}
        >
          <Avatar
            p={1}
            bg={'white'}
            src={protocolIcon}
            icon={<BsQuestion size={24} />}
            sx={{
              "> img": {
                objectFit: 'contain'
              }
            }}
            ml={protocols.length > 0 ? iconMargin !== undefined ? iconMargin : -1 : 0}
            {...props}
          />
        </Tooltip>
      )
      return protocols
    }, [])

    return protocolIcons.length ? protocolIcons : children
  }, [children, vault, props, iconMargin, tooltipDisabled, selectVaultById])

  return (
    <Flex>
      {protocols}
    </Flex>
  )
}

type StrategiesProps = ProtocolsProps & {
  showLabel?: boolean
}

const Strategies: React.FC<StrategiesProps> = ({
  children,
  iconMargin = 1,
  showLabel = false,
  ...props
}) => {
  const { vault, translate } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  const availableStrategies = useMemo(() => {
    if (vault instanceof TrancheVault) return [vault.type]

    if (!vault || !("tokenConfig" in vault) || !("protocols" in vault.tokenConfig)) return []
    return vault.tokenConfig.protocols.reduce((availableStrategies: string[], protocolConfig: IdleTokenProtocol) => {
      const asset = selectAssetById(protocolConfig.address)
      if (!asset || availableStrategies.includes(asset.type)) return availableStrategies
      return [
        ...availableStrategies,
        asset.type
      ]
    }, [])
  }, [vault, selectAssetById])

  const protocols = useMemo(() => {
    if (!availableStrategies.length) return children

    const protocolIcons: JSX.Element[] = availableStrategies.map((strategy: string, index: number) => {
      const strategyConfig = strategies[strategy]
      return (
        <HStack
          spacing={2}
          key={`strategy_${index}`}
        >
          <Tooltip
            hasArrow
            placement={'top'}
            key={`icon_${index}`}
            label={translate(`assets.assetDetails.tooltips.riskProfiles.${vault?.type}_${strategy}`)}
          >
            <Image src={`images/strategies/${strategy}.svg`} ml={iconMargin} {...props} />
          </Tooltip>
          {
            showLabel && (
              <Translation translation={strategyConfig.riskProfile} textStyle={'tableCell'} />
            )
          }
        </HStack>
      )
    })

    return protocolIcons
  }, [translate, vault, children, props, showLabel, iconMargin, availableStrategies])

  return (
    <Flex>
      {protocols}
    </Flex>
  )
}

const Balance: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()
  const { isPortfolioLoaded } = usePortfolioProvider()

  return isPortfolioLoaded ? (
    <Amount value={asset?.balance} {...props} />
  ) : <Spinner size={'sm'} />
}

const VaultBalance: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()
  const { isPortfolioLoaded } = usePortfolioProvider()

  const vaultBalance = asset?.balance && asset?.vaultPrice ? BNify(asset.balance).times(asset.vaultPrice) : BNify(0)

  return isPortfolioLoaded ? (
    <Amount value={vaultBalance} {...props} />
  ) : <Spinner size={'sm'} />
}

const Earnings: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  return asset?.vaultPosition?.underlying.earnings ? (
    <Amount value={asset?.vaultPosition?.underlying.earnings} {...props} />
  ) : <Spinner size={'sm'} />
}

const EarningsUsd: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  return asset?.vaultPosition?.usd.earnings ? (
    <Amount.Usd value={asset?.vaultPosition?.usd.earnings} {...props} />
  ) : <Spinner size={'sm'} />
}

const NetEarnings: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  let netEarnings = asset?.vaultPosition?.underlying.earnings ? BNify(asset?.vaultPosition?.underlying.earnings) : BNify(0)

  // Remove fees for BY
  if (asset && !['AA', 'BB'].includes(asset.type as string)) {
    netEarnings = asset?.vaultPosition?.underlying.earnings && asset?.fee ? BNify(asset?.vaultPosition?.underlying.earnings).minus(BNify(asset.vaultPosition.underlying.earnings).times(asset.fee)) : BNify(0)
  }

  return asset?.vaultPosition?.underlying.earnings ? (
    <Amount value={netEarnings} {...props} />
  ) : <Spinner size={'sm'} />
}

const NetEarningsUsd: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  let netEarnings = asset?.vaultPosition?.usd.earnings ? BNify(asset?.vaultPosition?.usd.earnings) : BNify(0)

  // Remove fees for BY
  if (asset && !['AA', 'BB'].includes(asset.type as string)) {
    netEarnings = asset?.vaultPosition?.usd.earnings && asset?.fee ? BNify(asset?.vaultPosition?.usd.earnings).minus(BNify(asset.vaultPosition.usd.earnings).times(asset.fee)) : BNify(0)
  }

  let tooltipLabel = null
  if (bnOrZero(asset?.vaultPosition?.usd.rewards).gt(0)) {
    const netEarningsWithoutRewards = netEarnings.minus(bnOrZero(asset?.vaultPosition?.usd.rewards))
    tooltipLabel = (
      <VStack
        py={1}
        spacing={1}
      >
        <VStack
          pb={0}
          spacing={1}
        >
          <HStack
            spacing={3}
            width={'100%'}
            alignItems={'baseline'}
            justifyContent={'space-between'}
          >
            <Translation translation={`defi.netEarnings`} />
            <Amount.Usd value={netEarningsWithoutRewards} {...props} fontSize={'md'} />
          </HStack>
          <HStack
            spacing={3}
            width={'100%'}
            alignItems={'baseline'}
            justifyContent={'space-between'}
          >
            <Translation translation={`defi.rewardsEarnings`} />
            <Amount.Usd value={asset?.vaultPosition?.usd.rewards} {...props} fontSize={'md'} />
          </HStack>
        </VStack>
      </VStack>
    )
  }

  return asset?.vaultPosition?.usd.earnings ? (
    <Tooltip
      hasArrow
      placement={'top'}
      label={tooltipLabel}
      isDisabled={!tooltipLabel}
    >
      <TooltipContent>
        <Amount.Usd value={netEarnings} borderBottom={tooltipLabel ? '1px dashed' : 'none'} borderBottomColor={tooltipLabel ? 'cta' : 'none'} {...props} />
      </TooltipContent>
    </Tooltip>
  ) : <Spinner size={'sm'} />
}

const BalanceUsd: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  return asset?.vaultPosition?.usd.redeemable ? (
    <Amount.Usd value={asset?.vaultPosition?.usd.redeemable} {...props} />
  ) : <Spinner size={'sm'} />
}

const Redeemable: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  return asset?.vaultPosition?.underlying.redeemable ? (
    <Amount value={asset?.vaultPosition?.underlying.redeemable} {...props} />
  ) : <Spinner size={'sm'} />
}

const EarningsPerc: React.FC<PercentageProps> = (props) => {
  const { asset } = useAssetProvider()

  return asset?.vaultPosition?.earningsPercentage ? (
    <Amount.Percentage value={asset?.vaultPosition?.earningsPercentage.times(100)} {...props} />
  ) : <Spinner size={'sm'} />
}

const DepositedUsd: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  return asset?.vaultPosition?.usd.deposited ? (
    <Amount.Usd value={asset?.vaultPosition?.usd.deposited} {...props} />
  ) : <Spinner size={'sm'} />
}

const Deposited: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  return asset?.vaultPosition?.underlying.deposited ? (
    <Amount value={asset?.vaultPosition?.underlying.deposited} {...props} />
  ) : <Spinner size={'sm'} />
}

const GaugeShare: React.FC<PercentageProps> = (props) => {
  const { asset } = useAssetProvider()

  const share = asset && asset.totalSupply && BNify(asset?.vaultPosition?.underlying.redeemable).div(asset.totalSupply)

  return share ? (
    <Amount.Percentage value={share} {...props} />
  ) : <Spinner size={'sm'} />
}

const GaugeUserDistribution: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  const share = asset?.totalSupply && BNify(asset?.vaultPosition?.underlying.redeemable).div(asset.totalSupply)
  const userDistributionRate = share && asset?.gaugeData?.distributionRate && BNify(asset.gaugeData.distributionRate).times(share)
  return userDistributionRate ? (
    <Amount value={userDistributionRate} {...props} />
  ) : <Spinner size={'sm'} />
}

const Apr: React.FC<PercentageProps> = (props) => {
  const { asset } = useAssetProvider()

  return asset?.apr ? (
    <Amount.Percentage value={asset?.apr} {...props} />
  ) : <Spinner size={'sm'} />
}

type ApyProps = {
  showGross?: boolean
  showNet?: boolean
  showTooltip?: boolean
  addRewards?: boolean
} & PercentageProps

const Apy: React.FC<ApyProps> = ({ showGross = true, showNet = false, showTooltip = true, addRewards = false, ...props }) => {
  const { asset, vault } = useAssetProvider()

  const netApy = useMemo(() => {
    if (asset?.apyBreakdown) {
      return Object.keys(asset.apyBreakdown).reduce((totalNetApy: BigNumber, apyType: string) => {
        let netApy = bnOrZero(asset.apyBreakdown?.[apyType])

        let isNetApr = false
        if (vault && "flags" in vault && !isEmpty(vault.flags?.aprBreakdownParams) && vault.flags?.aprBreakdownParams?.[apyType]) {
          isNetApr = vault.flags?.aprBreakdownParams?.[apyType].isNet || false
        }

        // Remove fees on base and harvest apy
        if (apyType !== 'rewards' && !isNetApr) {
          netApy = netApy.minus(netApy.times(bnOrZero(asset?.fee)))
        }
        return totalNetApy.plus(netApy)
      }, BNify(0))
    } else {
      return BNify(asset?.apy).minus(BNify(asset?.apy).times(bnOrZero(asset?.fee)))
    }
  }, [asset, vault])

  showGross = showGross && !!asset?.apyBreakdown && Object.keys(asset.apyBreakdown).length > 1

  // console.log('apyBreakdown', asset?.id, asset?.apyBreakdown);

  const tooltipLabel = asset?.apyBreakdown ? (
    <VStack
      py={1}
      spacing={1}
    >
      <VStack
        spacing={1}
        pb={showGross || showNet ? 1 : 0}
        borderBottom={showGross || showNet ? '1px dashed' : 'none'}
        borderBottomColor={'cta'}
      >
        {
          Object.keys(asset.apyBreakdown).map((type: string) => {
            const apr = BNify(asset?.apyBreakdown?.[type])
            if (apr.lte(0) && type !== 'base') return null

            let vaultTranslationKey = `assets.assetDetails.apyBreakdown.${type}`
            if (vault && "translations" in vault && vault.translations?.apyBreakdown?.[type]) {
              vaultTranslationKey = vault?.translations?.apyBreakdown?.[type]
            }

            return (
              <HStack
                spacing={3}
                width={'100%'}
                key={`apr_${type}`}
                alignItems={'baseline'}
                justifyContent={'space-between'}
              >
                <Translation translation={vaultTranslationKey} />
                <Amount.Percentage value={apr} {...props} />
              </HStack>
            )
          })
        }
      </VStack>
      {
        showGross && (
          <HStack
            spacing={3}
            width={'100%'}
            alignItems={'baseline'}
            justifyContent={'space-between'}
          >
            <Translation translation={'assets.assetDetails.apyBreakdown.gross'} />
            <Amount.Percentage value={asset?.apy} {...props} />
          </HStack>
        )
      }
      {
        showNet && (
          <HStack
            spacing={3}
            width={'100%'}
            alignItems={'baseline'}
            justifyContent={'space-between'}
          >
            <Translation translation={'assets.assetDetails.apyBreakdown.net'} />
            <Amount.Percentage value={netApy} {...props} />
          </HStack>
        )
      }
    </VStack>
  ) : null

  const tooltipDisabled = !showTooltip || bnOrZero(asset?.apy).lte(0) || (asset?.apyBreakdown && Object.keys(asset.apyBreakdown).length <= 1)

  return asset?.apy ? (
    <HStack
      spacing={2}
      alignItems={'center'}
      justifyContent={'flex-start'}
    >
      <Tooltip
        hasArrow
        placement={'top'}
        label={tooltipLabel}
        isDisabled={tooltipDisabled}
      >
        <TooltipContent>
          <Amount.Percentage value={asset?.apy} {...props} stackProps={{ spacing: 1 }} borderBottom={showTooltip && !tooltipDisabled ? '1px dashed' : 'none'} borderBottomColor={'cta'} />
        </TooltipContent>
      </Tooltip>
      {
        addRewards && (
          <RewardsEmissions />
        )
      }
    </HStack>
  ) : <Spinner size={'sm'} />

}

const ApyRatio: React.FC<PercentageProps> = (props) => {
  const { asset } = useAssetProvider()

  return asset?.aprRatio ? (
    <Amount.Percentage value={asset?.aprRatio} {...props} />
  ) : <Spinner size={'sm'} />
}

const ApyBoost: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  const apyBoost = asset?.apy && asset?.baseApr?.gt(0) ? asset?.apy.div(asset?.baseApr) : BNify(0)

  return asset?.apy && asset?.baseApr ? (
    <Amount suffix={'x'} decimals={2} value={apyBoost} {...props} />
  ) : <Spinner size={'sm'} />
}

const RewardsApy: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  const rewardsApy = bnOrZero(asset?.apyBreakdown?.rewards)

  return rewardsApy ? (
    <Amount.Percentage decimals={2} value={rewardsApy} {...props} />
  ) : <Spinner size={'sm'} />
}

const RealizedApy: React.FC<PercentageProps> = (props) => {
  const { asset } = useAssetProvider()

  let tooltipLabel = null
  let totalApy = bnOrZero(asset?.vaultPosition?.realizedApy)
  const rewardsApy = bnOrZero(asset?.vaultPosition?.rewardsApy)
  if (rewardsApy.gt(0)) {
    // totalApy = totalApy.plus(rewardsApy)
    const netApy = BigNumber.maximum(0, totalApy.minus(rewardsApy))
    tooltipLabel = (
      <VStack
        py={1}
        spacing={1}
      >
        <VStack
          pb={0}
          spacing={1}
        >
          <HStack
            spacing={3}
            width={'100%'}
            alignItems={'baseline'}
            justifyContent={'space-between'}
          >
            <Translation translation={`defi.realizedApy`} />
            <Amount.Percentage value={netApy} {...props} fontSize={'md'} />
          </HStack>
          <HStack
            spacing={3}
            width={'100%'}
            alignItems={'baseline'}
            justifyContent={'space-between'}
          >
            <Translation translation={`assets.assetDetails.apyBreakdown.rewards`} />
            <Amount.Percentage value={rewardsApy} {...props} fontSize={'md'} />
          </HStack>
        </VStack>
      </VStack>
    )
  }

  // Add gauge APY to realized APY
  if (asset?.apyBreakdown?.gauge && bnOrZero(asset?.apyBreakdown?.gauge).gt(0) && bnOrZero(asset?.vaultPosition?.underlying.staked).gt(0)) {
    totalApy = totalApy.plus(asset?.apyBreakdown.gauge)
    tooltipLabel = (
      <VStack
        py={1}
        spacing={1}
      >
        <VStack
          pb={0}
          spacing={1}
        >
          <HStack
            spacing={3}
            width={'100%'}
            alignItems={'baseline'}
            justifyContent={'space-between'}
          >
            <Translation translation={`defi.realizedApy`} />
            <Amount.Percentage value={asset?.vaultPosition?.realizedApy} {...props} fontSize={'md'} />
          </HStack>
          <HStack
            spacing={3}
            width={'100%'}
            alignItems={'baseline'}
            justifyContent={'space-between'}
          >
            <Translation translation={`assets.assetDetails.apyBreakdown.gauge`} />
            <Amount.Percentage value={asset?.apyBreakdown?.gauge} {...props} fontSize={'md'} />
          </HStack>
        </VStack>
      </VStack>
    )
  }

  return asset?.vaultPosition?.realizedApy ? (
    <Tooltip
      hasArrow
      placement={'top'}
      label={tooltipLabel}
    >
      <TooltipContent>
        <Amount.Percentage value={totalApy} borderBottom={tooltipLabel ? '1px dashed' : 'none'} borderBottomColor={tooltipLabel ? 'cta' : 'none'} {...props} />
      </TooltipContent>
    </Tooltip>
  ) : <Spinner size={'sm'} />
}

const GaugeWeight: React.FC<PercentageProps> = (props) => {
  const { asset } = useAssetProvider()

  return asset?.gaugeData?.weight ? (
    <Amount.Percentage value={asset?.gaugeData?.weight.times(100)} {...props} />
  ) : <Spinner size={'sm'} />
}

const GaugeNextWeight: React.FC<PercentageProps> = (props) => {
  const { asset } = useAssetProvider()

  return asset?.gaugeData?.nextWeight ? (
    <Amount.Percentage value={asset?.gaugeData?.nextWeight.times(100)} {...props} />
  ) : <Spinner size={'sm'} />
}

const GaugeTotalSupply: React.FC<PercentageProps> = (props) => {
  const { asset } = useAssetProvider()

  return asset?.gaugeData?.gaugePoolUsd ? (
    <Amount.Usd value={asset?.gaugeData?.gaugePoolUsd} {...props} />
  ) : <Spinner size={'sm'} />
}

const FeesUsd: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  const feeUsd = asset?.vaultPosition?.usd.earnings && asset?.fee ? BNify(asset.vaultPosition.usd.earnings).minus(bnOrZero(asset.vaultPosition.usd.rewards)).times(asset.fee) : BNify(0)

  return asset?.vaultPosition?.usd.earnings ? (
    <Amount.Usd value={feeUsd} {...props} />
  ) : <Spinner size={'sm'} />
}

const PerformanceFee: React.FC<PercentageProps> = (props) => {
  const { referral } = useAssetPageProvider()
  const { asset, vault } = useAssetProvider()

  const positionReferral = useMemo(() => {
    return referral || asset?.vaultPosition?.referral
  }, [asset, referral])

  const feeDiscountOnReferral = useMemo(() => vault && ("flags" in vault) && vault.flags?.feeDiscountOnReferral ? bnOrZero(vault.flags?.feeDiscountOnReferral) : BNify(0), [vault])
  const performanceFeeDiscounted = useMemo(() => (positionReferral && bnOrZero(feeDiscountOnReferral).gt(0)), [positionReferral, feeDiscountOnReferral])
  const performanceFee = useMemo(() => performanceFeeDiscounted ? feeDiscountOnReferral : bnOrZero(asset?.fee), [performanceFeeDiscounted, asset, feeDiscountOnReferral])

  return asset?.fee ? (
    <HStack
      spacing={2}
      alignItems={'center'}
    >
      <Amount.Percentage value={asset?.fee?.times(100)} {...props} sx={performanceFeeDiscounted ? { textDecoration: 'line-through' } : {}} />
      {
        performanceFeeDiscounted && (
          <Amount.Percentage value={performanceFee.times(100)} color={'brightGreen'} {...props} />
        )
      }
    </HStack>
  ) : <Spinner size={'sm'} />
}

const LastHarvest: React.FC<TextProps> = (props) => {
  // const { locale } = useI18nProvider()
  const { asset, vault } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (!vault || !selectAssetById) return null

  const lastHarvest = asset?.lastHarvest
  const harvestedAsset = selectAssetById(lastHarvest?.tokenAddress)

  // const harvestAPY = asset?.lastHarvest?.aprs[vault.type]
  // const harvestValue = asset?.lastHarvest?.value[vault.type]
  // const harvestDate = dayjs(+asset.lastHarvest.timestamp*1000).format('YYYY/MM/DD HH:mm')

  return lastHarvest === null ? (
    <Text {...props}>-</Text>
  ) : lastHarvest ? (
    <VStack
      spacing={0}
      alignItems={'flex-start'}
    >
      {/*<Text {...props}>+{harvestValue?.toFixed(4)} {harvestedAsset?.token}</Text>*/}
      <Text {...props}>{lastHarvest?.totalValue.toFixed(4)} {harvestedAsset?.token}</Text>
      <TransactionLink chainId={asset.chainId} hash={lastHarvest.hash} fontSize={'xs'} />
      {/*<Amount.Percentage textStyle={'captionSmaller'} lineHeight={'normal'} prefix={'(+'} suffix={' APY)'} value={harvestAPY?.times(100)} />*/}
    </VStack>
  ) : <Spinner size={'sm'} />
}

const Fees: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  const fee = asset?.vaultPosition?.underlying.earnings && asset?.fee ? BNify(asset.vaultPosition.underlying.earnings).times(asset.fee) : BNify(0)

  return asset?.vaultPosition?.usd.earnings ? (
    <Amount value={fee} {...props} />
  ) : <Spinner size={'sm'} />
}

const PoolUsd: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  return asset?.tvlUsd ? (
    <Amount.Usd value={asset?.tvlUsd} {...props} />
  ) : <Spinner size={'sm'} />
}

const TrancheTotalPoolUsd: React.FC<AmountProps> = (props) => {
  const { vault } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (!vault || !(vault instanceof TrancheVault)) return null

  const aaTrancheAsset = selectAssetById(vault?.vaultConfig.Tranches.AA.address)
  const bbTrancheAsset = selectAssetById(vault?.vaultConfig.Tranches.BB.address)

  const totalTvlUsd = bnOrZero(aaTrancheAsset?.tvlUsd).plus(bbTrancheAsset?.tvlUsd)

  return totalTvlUsd ? (
    <Amount.Usd value={totalTvlUsd} {...props} />
  ) : <Spinner size={'sm'} />
}

const SeniorApy: React.FC<AmountProps> = (props) => {
  const { vault } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (!vault || !(vault instanceof TrancheVault)) return null

  const trancheAsset = selectAssetById(vault?.vaultConfig.Tranches.AA.address)

  return (
    <AssetProvider
      assetId={trancheAsset?.id}
    >
      <AssetProvider.Apy {...props} />
    </AssetProvider>
  )
}

const JuniorApy: React.FC<AmountProps> = (props) => {
  const { vault } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (!vault || !(vault instanceof TrancheVault)) return null

  const trancheAsset = selectAssetById(vault?.vaultConfig.Tranches.BB.address)

  return (
    <AssetProvider
      assetId={trancheAsset?.id}
    >
      <AssetProvider.Apy {...props} />
    </AssetProvider>
  )
}


const SeniorRewardsEmissions: React.FC<AssetProviderPropsType> = (props) => {
  const { vault } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (!vault || !(vault instanceof TrancheVault)) return null

  const trancheAsset = selectAssetById(vault?.vaultConfig.Tranches.AA.address)

  return (
    <AssetProvider
      assetId={trancheAsset?.id}
    >
      <AssetProvider.RewardsEmissions {...props} />
    </AssetProvider>
  )
}

const JuniorRewardsEmissions: React.FC<AssetProviderPropsType> = (props) => {
  const { vault } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (!vault || !(vault instanceof TrancheVault)) return null

  const trancheAsset = selectAssetById(vault?.vaultConfig.Tranches.BB.address)

  return (
    <AssetProvider
      assetId={trancheAsset?.id}
    >
      <AssetProvider.RewardsEmissions {...props} />
    </AssetProvider>
  )
}

const SeniorPoolUsd: React.FC<AmountProps> = (props) => {
  const { vault } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (!vault || !(vault instanceof TrancheVault)) return null

  const trancheAsset = selectAssetById(vault?.vaultConfig.Tranches.AA.address)

  return (
    <AssetProvider
      assetId={trancheAsset?.id}
    >
      <AssetProvider.PoolUsd {...props} />
    </AssetProvider>
  )
}

const JuniorPoolUsd: React.FC<AmountProps> = (props) => {
  const { vault } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (!vault || !(vault instanceof TrancheVault)) return null

  const trancheAsset = selectAssetById(vault?.vaultConfig.Tranches.BB.address)

  return (
    <AssetProvider
      assetId={trancheAsset?.id}
    >
      <AssetProvider.PoolUsd {...props} />
    </AssetProvider>
  )
}

const TotalPoolUsd: React.FC<AmountProps> = (props) => {
  const { vault, asset } = useAssetProvider()
  const { vaults, selectors: { selectAssetById } } = usePortfolioProvider()

  let totalTvlUsd = asset?.tvlUsd
  if (asset && vault && ['AA', 'BB'].includes(asset.type as string)) {
    const otherVaultType = asset.type === 'AA' ? 'BB' : 'AA'
    const otherVault = vaults.find((otherVault: Vault) => ("cdoConfig" in otherVault) && ("cdoConfig" in vault) && otherVault.type === otherVaultType && otherVault.cdoConfig.address === vault.cdoConfig.address)
    if (otherVault) {
      const otherAsset = selectAssetById(otherVault.id)
      if (otherAsset) {
        totalTvlUsd = BNify(totalTvlUsd).plus(otherAsset.tvlUsd)
      }
    }
  }

  return !BNify(totalTvlUsd).isNaN() ? (
    <Amount.Usd value={totalTvlUsd} {...props} />
  ) : <Spinner size={'sm'} />
}

const TotalDiscountedFees: React.FC<AmountProps & AssetFieldProps> = (props) => {
  const { stakingData } = usePortfolioProvider()

  // const totalDiscountedFeesUsd = useMemo(() => {
  //   return Object.values(vaultsPositions).reduce( (totalDiscountedFees: BigNumber, vaultPosition: VaultPosition) => {
  //     return totalDiscountedFees.plus(bnOrZero(vaultPosition.usd.discountedFees))
  //   }, BNify(0))
  // }, [vaultsPositions])

  return stakingData ? (
    <Amount.Usd value={stakingData.totalDiscountedFees} {...props} />
  ) : <Spinner size={'sm'} />
}

const StakingTvl: React.FC<AmountProps & AssetFieldProps> = (props) => {
  const { stakingData } = usePortfolioProvider()

  return stakingData ? (
    <TokenAmount assetId={stakingData?.IDLE.asset?.id} showIcon={false} amount={stakingData.IDLE.totalSupply} {...props} />
  ) : <Spinner size={'sm'} />
}

const StkIDLESupply: React.FC<TextProps> = (props) => {
  const { stakingData } = usePortfolioProvider()

  return stakingData?.stkIDLE.totalSupply ? (
    <TokenAmount assetId={stakingData?.stkIDLE.asset?.id} showIcon={false} amount={stakingData.stkIDLE.totalSupply} {...props} />
  ) : <Spinner size={'sm'} />
}

const StkIDLEBalance: React.FC<TextProps> = (props) => {
  const { stakingData } = usePortfolioProvider()

  return stakingData?.position.balance ? (
    <TokenAmount assetId={stakingData?.stkIDLE.asset?.id} showIcon={false} amount={stakingData.position.balance} {...props} />
  ) : <Spinner size={'sm'} />
}

type RewardsEmissionsProps = {
  flexProps?: FlexProps
} & AssetProviderPropsType

// @ts-ignore
const RewardsEmissions: React.FC<RewardsEmissionsProps> = ({ children, flexProps, ...props }) => {
  const { asset, translate } = useAssetProvider()

  if (!asset || !asset.rewardsEmissions || isEmpty(asset.rewardsEmissions)) return children

  const visibleRewardsIds = Object.keys(asset.rewardsEmissions).filter(rewardId => !asset.rewardsEmissions?.[rewardId].apr)
  return (
    <SimpleGrid
      spacing={1}
      width={'full'}
      justifyContent={'flex-start'}
      columns={[1, visibleRewardsIds.length]}
    >
      {
        visibleRewardsIds.map(rewardId => {
          const rewardEmission = asset.rewardsEmissions?.[rewardId]
          if (!rewardEmission || rewardEmission.apr) return null
          const prefix = rewardEmission.prefix !== undefined ? rewardEmission.prefix : '+'
          const suffix = rewardEmission.suffix !== undefined ? rewardEmission.suffix : ''
          const amount = rewardEmission.apr || rewardEmission.annualDistributionOn1000Usd
          const amountComponent = rewardEmission.apr ? Amount.Percentage : null
          const tooltipLabel = rewardEmission.tooltip ? translate(rewardEmission.tooltip) : (rewardEmission.apr ? translate('assets.assetDetails.tooltips.rewardEmissionApr') : translate('assets.assetDetails.tooltips.rewardEmissionTokenOn1000Usd'))
          return (
            <Tooltip
              hasArrow
              placement={'top'}
              label={tooltipLabel}
              key={`reward_${rewardId}`}
            >
              <TooltipContent>
                <Flex
                  py={1}
                  px={2}
                  width={'auto'}
                  borderRadius={8}
                  border={'1px solid'}
                  borderColor={'card.bg'}
                  justifyContent={'center'}
                  backgroundColor={'card.bgLight'}
                  {...flexProps}
                >
                  <TokenAmount assetId={rewardId} abbreviate={false} decimals={bnOrZero(amount).gt(999) ? 0 : 2} showName={false} showIcon={true} size={'2xs'} fontSize={'xs'} amountComponent={amountComponent} prefix={prefix} suffix={suffix} amount={amount} {...props} />
                </Flex>
              </TooltipContent>
            </Tooltip>
          )
        })
      }
    </SimpleGrid>
  )
}


const CreditVaultMode: React.FC<TextProps> = (props) => {
  const { vault } = useAssetProvider()
  if (!vault || !("mode" in vault)) return null
  return (
    <Translation translation={`assets.assetDetails.generalData.epoch.mode.${vault.mode}`} {...props} />
  )
}

type EpochCountdownArgs = {
  prefix?: string
  suffix?: string
} & TextProps

const EpochCountdown: React.FC<EpochCountdownArgs & TextProps> = ({
  prefix,
  suffix,
  ...textProps
}) => {
  const { asset } = useAssetProvider()

  const epochNextActionDate = useMemo(() => {
    if (!asset || !asset.epochData || !("isEpochRunning" in asset.epochData)) return null

    // Vault defaulted
    if (!!asset.epochData.defaulted){
      return null
    }

    // Epoch is running, take end epoch data
    if (!!asset.epochData.isEpochRunning){
      return toDayjs(asset.epochData.epochEndDate).toDate()
    } else {
      return toDayjs(BNify(asset.epochData.epochEndDate).plus(BNify(asset.epochData.bufferPeriod).times(1000)).toNumber()).toDate()
    }
  }, [asset])

  const isEpochRunning = useMemo(() => {
    if (!asset || !asset.epochData || !("isEpochRunning" in asset.epochData)) return null
    return !!asset.epochData.isEpochRunning
  }, [asset])

  if (!epochNextActionDate){
    return null
  }

  return (
    <Countdown date={epochNextActionDate} renderer={ ({ days, hours, minutes, seconds, completed }: any) => {
      return completed ? (
        <Translation prefix={"("} suffix={')'} translation={ isEpochRunning ? 'assets.status.epoch.closing' : 'assets.status.epoch.starting'} {...textProps} />
      ) : (
        <Text {...textProps}>
          {`${prefix ? prefix : ''}`}
          {days>0 && <span>{days}d:</span>}
          {hours>0 && <span>{hours}h:</span>}
          {minutes>0 && <span>{minutes}m:</span>}
          <span>{seconds}s</span>
          {`${suffix ? suffix : ''}`}
        </Text>
      )
    }} />
  )
}

type EpochInfoArgs = {
  field: string
} & TextProps

const EpochInfo: React.FC<EpochInfoArgs> = ({
  field,
  ...props
}) => {
  const { asset } = useAssetProvider()
  const { isPortfolioLoaded } = usePortfolioProvider()

  if (!isPortfolioLoaded){
    return (<Spinner size={'sm'} />)
  }

  if (!asset || !asset.epochData){
    return null
  }

  const value = asset.epochData[field as keyof EpochData]

  // Waiting for value
  if (value === undefined){
    return (<Spinner size={'sm'} />)
  }
  
  switch (field){
    case 'epochStartDate':
    case 'epochEndDate':
      return (<Text {...props}>{ BNify(value).lte(0) ? '-' : formatDate(value, 'YYYY/MM/DD HH:mm')}</Text>)
    case 'epochDuration':
      return (<Text {...props}>{secondsToPeriod(value)}</Text>)
    case 'lastEpochApr':
      return (<Amount.Percentage value={fixTokenDecimals(value, 18)} textStyle={'tableCell'} {...props} />)
    case 'isEpochRunning':
      if (!("isEpochRunning" in asset.epochData)) return null
      const isDefaulted = !!asset.epochData.defaulted
      const color = isDefaulted ? 'red' : (value ? 'yellow' : 'green')
      const status = asset.epochData.status
      return (
        <HStack
          spacing={2}
          alignItems={'center'}
        >
          <Translation translation={`assets.status.epoch.${status}`} {...props} />
          <Box
            width={2}
            height={2}
            borderRadius={'50%'}
            bg={color}
          >
          </Box>
        </HStack>
      )
    default:
      return null
  }
}

export type IdleDistributionProps = TextProps & {
  defaultText?: string
}

const IdleDistribution: React.FC<IdleDistributionProps> = ({ defaultText, ...props }) => {
  const { asset } = useAssetProvider()
  const IDLE = selectUnderlyingToken(GOVERNANCE_CHAINID, PROTOCOL_TOKEN)

  const dailyDistribution = bnOrZero(asset?.idleDistribution).times(BNify(BLOCKS_PER_YEAR).div(365))

  return IDLE ? (
    <HStack
      spacing={0}
      alignItems={'end'}
    >
      <TokenAmount assetId={IDLE.address} showIcon={true} size={'2xs'} fontSize={'sm'} prefix={'+'} amount={dailyDistribution} {...props} />
      <Translation translation={'common.day'} prefix={'/'} fontSize={'85%'} fontWeight={400} textTransform={'lowercase'} />
    </HStack>
  ) : (defaultText ? (<Text {...props}>{defaultText}</Text>) : null)
}

const StakingAPY: React.FC<AmountProps> = (props) => {
  // IIP-36
  return (<Amount.Percentage value={0} {...props} />)
  /*
  // const { stakingData } = usePortfolioProvider()
  return stakingData?.maxApr ? (
    <Amount.Percentage value={stakingData.maxApr} {...props} />
  ) : <Spinner size={'sm'} />
  */
}

const StakingTotalRewards: React.FC<AmountProps & AssetFieldProps> = (props) => {
  const { stakingData } = usePortfolioProvider()

  return stakingData?.IDLE.totalRewards ? (
    <TokenAmount assetId={stakingData?.IDLE.asset?.id} showIcon={false} amount={stakingData.IDLE.totalRewards} {...props} />
  ) : <Spinner size={'sm'} />
}

const StakingDeposited: React.FC<AmountProps & AssetFieldProps> = (props) => {
  const { stakingData } = usePortfolioProvider()

  return stakingData ? (
    <TokenAmount assetId={stakingData?.IDLE.asset?.id} showIcon={false} amount={stakingData.position.deposited} {...props} />
  ) : <Spinner size={'sm'} />
}

type StakingEndDateArgs = AmountProps & {
  showTime?: boolean
}

const StakingEndDate: React.FC<StakingEndDateArgs> = ({
  showTime = true,
  ...props
}) => {
  const { stakingData } = usePortfolioProvider()

  const format = showTime ? 'YYYY/MM/DD HH:mm' : 'YYYY/MM/DD'

  return stakingData?.position.lockEnd ? (
    <Text {...props}>{formatDate(stakingData.position.lockEnd, format, showTime)}</Text>
  ) : <Spinner size={'sm'} />
}

const StakingShare: React.FC<AmountProps> = (props) => {
  const { stakingData } = usePortfolioProvider()

  return stakingData?.position.share ? (
    <Amount.Percentage value={stakingData.position.share} {...props} />
  ) : <Spinner size={'sm'} />
}

const StakingFeeDiscount: React.FC<AmountProps> = (props) => {
  const { stakingData } = usePortfolioProvider()

  return stakingData?.feeDiscount ? (
    <Amount.Percentage value={stakingData?.feeDiscount} {...props} />
  ) : <Spinner size={'sm'} />
}

const StakingAvgLockTime: React.FC<AmountProps> = (props) => {
  const { translate } = useAssetProvider()
  const { stakingData } = usePortfolioProvider()

  const avgLockTime = stakingData && `${BNify(stakingData.avgLockTime).div(365).toFixed(1)}/4 ${translate(`common.years`).toLowerCase()}`

  return stakingData ? (
    <Text {...props}>{avgLockTime}</Text>
  ) : <Spinner size={'sm'} />
}

const StakingAvgLockTimeChart: React.FC = () => {
  const { translate } = useAssetProvider()
  const { stakingData } = usePortfolioProvider()

  if (!stakingData) return <Spinner size={'sm'} />

  // const remainingDays = MAX_STAKING_DAYS-stakingData.avgLockTime
  const stakingPercentage = stakingData.avgLockTime / MAX_STAKING_DAYS * 100

  const data: BarChartData = {
    lock: stakingPercentage,
    other: 100 - stakingPercentage
  }

  const labels = {
    lock: `${BNify(stakingData.avgLockTime).div(365).toFixed(1)} ${translate(`common.years`).toLowerCase()}`,
    other: null
  }

  const colors = {
    lock: '#6AE4FF',
    other: '#202a3e'
  }

  return (
    <Flex
      width={'100%'}
      height={'100%'}
      alignItems={'flex-start'}
    >
      <Flex
        mt={2}
        width={'100%'}
        height={'12px'}
      >
        <BarChart data={data} labels={labels} colors={colors} tooltip={false} />
      </Flex>
    </Flex>
  )
}

const Status: React.FC<AmountProps> = (props) => {
  const { asset, translate } = useAssetProvider()

  if (!asset?.status) return null

  const colorScheme = vaultsStatusSchemes[asset.status]

  const status = translate(`assets.status.${asset.status}`)

  return colorScheme ? (
    <Tag {...props} variant={'solid'} colorScheme={colorScheme} color={'primary'} fontWeight={700}>{status}</Tag>
  ) : <Spinner size={'sm'} />
}

const EpochStatus: React.FC<AmountProps> = (props) => {
  const { asset, translate } = useAssetProvider()

  if (!asset?.epochData || !("status" in asset.epochData)) return null

  const statusKey = asset?.epochData.status
  const colorScheme = vaultsStatusSchemes[statusKey]
  const status = translate(`assets.status.epoch.${statusKey}`)

  return colorScheme ? (
    <Tag {...props} variant={'solid'} colorScheme={colorScheme} color={'primary'} fontWeight={700}>{status}</Tag>
  ) : <Spinner size={'sm'} />
}

const Coverage: React.FC<AmountProps> = (props) => {
  const { asset, vault, translate } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (vault?.type !== 'AA' || !(vault instanceof TrancheVault)) return null

  const bbTranche = selectAssetById(vault?.vaultConfig.Tranches.BB.address)
  const coverageAmount = bbTranche.tvl && asset?.tvl && BNify(asset?.tvl).gt(0) ? bbTranche.tvl.div(asset.tvl) : 0;
  const coverageText = translate('defi.coverageAmount', { amount: '$1', coverageAmount: `$${abbreviateNumber(coverageAmount, 2)}` })

  return asset?.tvlUsd ? (
    <Text {...props}>{coverageText}</Text>
  ) : <Spinner size={'sm'} />
}

const CoveragePercentage: React.FC<AmountProps> = (props) => {
  const { asset, vault } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (vault?.type !== 'AA' || !(vault instanceof TrancheVault)) return null

  const bbTranche = selectAssetById(vault?.vaultConfig.Tranches.BB.address)
  const coveragePercentage = bbTranche.tvl && asset?.tvl && BNify(asset?.tvl).gt(0) ? bbTranche.tvl.div(asset.tvl) : BNify(0);

  return asset?.tvlUsd ? (
    <Amount.Percentage value={coveragePercentage.times(100)} {...props} />
  ) : <Spinner size={'sm'} />
}

const HistoricalRates: React.FC<BoxProps> = (props) => {
  const { asset } = useAssetProvider()
  return asset?.id ? (
    <RateChart
      {...props}
      percentChange={0}
      axisEnabled={false}
      assetIds={[asset?.id]}
      setPercentChange={() => { }}
      timeframe={HistoryTimeframe.WEEK}
    />
  ) : null
}

const ApyRatioChart: React.FC<BoxProps> = (props) => {
  const { asset, vault, translate, theme } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (!vault || !(vault instanceof TrancheVault)) return null

  const vaultType = vault?.type
  const apyRatio = asset?.aprRatio

  const otherVaultType = vaultType === 'AA' ? 'BB' : 'AA'
  const otherVault = selectAssetById(vault?.vaultConfig.Tranches[otherVaultType].address)

  const data: BarChartData = {
    [vaultType]: apyRatio,
    [otherVaultType]: otherVault?.aprRatio
  }

  const labels = Object.keys(data).reduce((labels: BarChartLabels, key: BarChartKey) => {
    return {
      ...labels,
      [key]: translate(strategies[key].label)
    }
  }, {})

  const colors = Object.keys(data).reduce((colors: BarChartColors, key: BarChartKey) => {
    return {
      ...colors,
      [key]: theme.colors.strategies[key]
    }
  }, {})

  return apyRatio ? (
    <Flex
      width={'100%'}
      height={'100%'}
      alignItems={'flex-start'}
      {...props}
    >
      <Flex
        mt={2}
        width={'100%'}
        height={'12px'}
      >
        <BarChart data={data} labels={labels} colors={colors} />
      </Flex>
    </Flex>
  ) : <Spinner size={'sm'} />
}

const ChainIcon: React.FC<ImageProps> = (props) => {
  const { asset, translate } = useAssetProvider()

  return asset?.chainId ? (
    <Tooltip
      hasArrow
      placement={'top'}
      label={translate(`networks.${asset?.chainId}`)}
    >
      <Image src={networks[asset?.chainId].icon as string} {...props} />
    </Tooltip>
  ) : null
}

const Allocation: React.FC = () => {

  const { asset } = useAssetProvider()

  return asset?.allocations ? (
    <Flex
      width={'100%'}
      height={'100%'}
      alignItems={'flex-start'}
    >
      <Flex
        mt={2}
        width={'100%'}
        height={'12px'}
      >
        <AllocationChart assetIds={[asset.id as string]} />
      </Flex>
    </Flex>
  ) : <Spinner size={'sm'} />
}

type GeneralDataProps = {
  field: string
  section?: string

} & AssetProviderPropsType

const GeneralData: React.FC<GeneralDataProps> = ({ field, section, ...props }) => {
  const { asset, vault } = useAssetProvider()

  const operatorInfo = useMemo(() => {
    const operatorName = getObjectPath(vault, 'vaultConfig.operators.0.name')
    return operatorName ? operators[operatorName] : null
  }, [vault])

  const aggregatedVault = useMemo(() => {
    return vault && ("aggregatedVault" in vault) ? vault.aggregatedVault : null
  }, [vault])

  switch (field) {
    case 'chainId':
      return (
        <ChainIcon width={8} height={8} {...props} />
      )
    case 'protocolWithVariant':
      if (!vault || !("variant" in vault) || !vault?.variant?.length) return (<GeneralData field={'protocol'} section={section} {...props} />)
      return (
        <HStack
          spacing={3}
          alignItems={'flex-start'}
        >
          <ProtocolIcon size={props.size || 'sm'} />
          <VStack
            spacing={1}
            alignItems={'flex-start'}
          >
            <ProtocolName textStyle={'tableCell'} {...props} />
            <VaultVariant textStyle={'vaultVariant'} />
          </VStack>
        </HStack>
      )
    case 'vaultOperatorOrProtocol':
      return operatorInfo ? (
        <HStack
          spacing={2}
          alignItems={'center'}
        >
          <Image src={operatorInfo.image} width={9} height={9} />
          <VStack
            height={9}
            spacing={0}
            alignItems={'flex-start'}
            justifyContent={'space-between'}
          >
            <Text textStyle={'tableCell'} lineHeight={1}>{operatorInfo.nameShort || operatorInfo.name}</Text>
            <VaultVariant textStyle={'vaultVariant'} lineHeight={1} />
          </VStack>
        </HStack>
      ) : aggregatedVault ? (
        <HStack
          spacing={3}
          width={'full'}
          alignItems={'center'}
        >
          <Image src={aggregatedVault.icon} w={9} h={9} />
          <VStack
            spacing={[1, 2]}
            alignItems={'space-between'}
          >
            <Translation translation={aggregatedVault.name} textStyle={'tableCell'} lineHeight={1} />
            <Translation translation={aggregatedVault.type} textStyle={'vaultVariant'} lineHeight={1} />
          </VStack>
        </HStack>
      ) : (
        <HStack
          spacing={2}
          alignItems={'center'}
        >
          <ProtocolIcon w={9} h={9} />
          <VStack
            height={9}
            spacing={0}
            alignItems={'flex-start'}
            justifyContent={'space-between'}
          >
            <ProtocolName textStyle={'tableCell'} lineHeight={1} {...props} />
            <VaultVariant textStyle={'vaultVariant'} lineHeight={1} />
          </VStack>
        </HStack>
      )
    case 'operatorWithProtocol':
      if (!operatorInfo) return (<GeneralData field={'protocol'} section={section} {...props} />)
      return (
        <HStack
          spacing={3}
          alignItems={'flex-start'}
        >
          <Image src={operatorInfo.image} width={10} />
          <VStack
            spacing={1}
            alignItems={'flex-start'}
          >
            <Text textTransform={'uppercase'} textStyle={'tableCell'} lineHeight={1.1}>{operatorInfo.nameShort || operatorInfo.name}</Text>
            <ProtocolName textStyle={'vaultVariant'} {...props} />
          </VStack>
        </HStack>
      )
    case 'protocol':
      return (
        <HStack
          spacing={2}
          alignItems={'center'}
        >
          <ProtocolIcon size={props.size || 'sm'} sx={props.sx} />
          <ProtocolName textStyle={'tableCell'} {...props} />
        </HStack>
      )
    case 'asset':
      return (
        <HStack
          spacing={2}
          alignItems={'center'}
        >
          <Icon size={'sm'} {...props} />
          <Name textStyle={'tableCell'} {...props} />
        </HStack>
      )
    case 'assetWithVariant':
      return (
        <HStack
          spacing={2}
          alignItems={'center'}
        >
          <Icon size={'sm'} {...props} />
          <VStack
            spacing={0}
            alignItems={'flex-start'}
          >
            <Name textStyle={'tableCell'} {...props} />
            <VaultVariant textStyle={'vaultVariant'} />
          </VStack>
          <StatusBadge width={6} height={6} />
        </HStack>
      )
    case 'assetWithStatus':
      return (
        <HStack
          spacing={2}
          alignItems={'center'}
        >
          <Icon size={'sm'} {...props} />
          <Name textStyle={'tableCell'} {...props} />
          <StatusBadge width={6} height={6} />
        </HStack>
      )
    case 'strategies':
      return (
        <Strategies {...props} />
      )
    case 'idleDistribution':
      return (
        <IdleDistribution textStyle={'tableCell'} {...props} />
      )
    case 'rewardsEmissions':
      return (
        <RewardsEmissions {...props} />
      )
    /*
    case 'fields':
      console.log(field, fields, fieldsProps, props)
      return (
        <HStack
          spacing={1}
        >
          {
            fields?.map( (field: string) => (
              <GeneralData key={`field_${field}`} field={field} {...props} {...fieldsProps?.[field]} />
            ))
          }
        </HStack>
      )
    */
    case 'stakingTvl':
      return (<StakingTvl textStyle={'tableCell'} />)
    case 'totalDiscountedFees':
      return (<TotalDiscountedFees textStyle={'tableCell'} />)
    case 'stkIDLESupply':
      return (<StkIDLESupply textStyle={'tableCell'} />)
    case 'stkIDLEBalance':
      return (<StkIDLEBalance textStyle={'tableCell'} {...props} />)
    case 'stakingAPY':
      return (<StakingAPY textStyle={'tableCell'} {...props} />)
    case 'stakingTotalRewards':
      return (<StakingTotalRewards textStyle={'tableCell'} {...props} />)
    case 'stakingAvgLockTimeChart':
      return (<StakingAvgLockTimeChart {...props} />)
    case 'stakingAvgLockTime':
      return (<StakingAvgLockTime textStyle={'tableCell'} {...props} />)
    case 'stakingDeposited':
      return (<StakingDeposited textStyle={'tableCell'} {...props} />)
    case 'stakingEndDate':
      return (<StakingEndDate textStyle={'tableCell'} {...props} />)
    case 'stakingFeeDiscount':
      return (<StakingFeeDiscount textStyle={'tableCell'} {...props} />)
    case 'stakingShare':
      return (<StakingShare textStyle={'tableCell'} {...props} />)
    case 'tvl':
    case 'pool':
      return (<PoolUsd textStyle={'tableCell'} {...props} />)
    case 'trancheTotalTvl':
      return (<TrancheTotalPoolUsd textStyle={'tableCell'} {...props} />)
    case 'juniorApy':
      return (<JuniorApy textStyle={'tableCell'} {...props} />)
    case 'seniorApy':
      return (<SeniorApy textStyle={'tableCell'} {...props} />)
    case 'juniorRewardsEmissions':
      return (<JuniorRewardsEmissions textStyle={'tableCell'} {...props} />)
    case 'seniorRewardsEmissions':
      return (<SeniorRewardsEmissions textStyle={'tableCell'} {...props} />)
    case 'productTag':
      return (<ProductTag type={asset?.type} {...props} />)
    case 'productTagWithRisk':
      return (
        <HStack
          spacing={1}
        >
          <ProductTag type={asset?.type} {...props} />
          <AssetProvider.Strategies h={6} w={6} />
        </HStack>
      )
    case 'strategyBadge':
      return (<StrategyBadge {...props} />)
    case 'apy':
      return (<Apy showNet={section === 'asset'} textStyle={'tableCell'} {...props} />)
    case 'apr':
      return (<Apr textStyle={'tableCell'} {...props} />)
    case 'apyWithRewards':
      return (<Apy addRewards={true} showNet={section === 'asset'} textStyle={'tableCell'} {...props} />)
    case 'apy7':
      return (<Amount.Percentage value={asset?.apy7} textStyle={'tableCell'} {...props} />)
    case 'apy30':
      return (<Amount.Percentage value={asset?.apy30} textStyle={'tableCell'} {...props} />)
    case 'apyRatio':
      return <ApyRatioChart width={'100%'} />
    case 'apyBoost':
      return (<ApyBoost textStyle={'tableCell'} {...props} />)
    case 'coverage':
      return (<Coverage textStyle={'tableCell'} {...props} />)
    case 'coveragePercentage':
      return (<CoveragePercentage textStyle={'tableCell'} {...props} />)
    case 'performanceFee':
      return (<PerformanceFee textStyle={'tableCell'} {...props} />)
    case 'lastHarvest':
      return (<LastHarvest textStyle={'tableCell'} {...props} />)
    case 'balanceUsd':
      return (<BalanceUsd textStyle={'tableCell'} {...props} />)
    case 'realizedApy':
      return (<RealizedApy textStyle={'tableCell'} {...props} />)
    case 'earningsUSd':
      return (<EarningsUsd textStyle={'tableCell'} {...props} />)
    case 'weight':
      return (<GaugeWeight textStyle={'tableCell'} {...props} />)
    case 'nextWeight':
      return (<GaugeNextWeight textStyle={'tableCell'} {...props} />)
    case 'gaugeTotalSupply':
      return (<GaugeTotalSupply textStyle={'tableCell'} {...props} />)
    case 'statusBadge':
      return (<StatusBadge width={6} height={6} {...props} />)
    case 'actionRequired':
      return (<ActionRequired width={6} height={6} {...props} />)
    case 'vaultVariant':
      return (<VaultVariant {...props} />)
    case 'mode':
      return (<CreditVaultMode textStyle={'tableCell'} {...props} />)
    case 'epochDuration':
    case 'epochStartDate':
    case 'epochEndDate':
    case 'lastEpochApr':
      return (<EpochInfo field={field} textStyle={'tableCell'} {...props} />)
    case 'epochCountdown':
      return (<EpochCountdown textStyle={'tableCell'} {...props} />)
    case 'assetClass':
      return (
        <Categories {...props} />
      )
    case 'rewards':
      return (
        <Rewards size={'sm'} {...props}>
          <Text textStyle={'tableCell'} {...props}>-</Text>
        </Rewards>
      )
    case 'protocols':
      return (
        <Protocols size={'sm'} {...props}>
          <GeneralData field={'protocolWithVariant'} {...props} />
        </Protocols>
      )
    case 'status':
      return (<Status size={'md'}></Status>)
    case 'epochStatus':
      return (<EpochStatus size={'md'}></EpochStatus>)
    case 'allocation':
      return (<Allocation />)
    case 'stakingRewards':
      return (
        <StakingRewards size={'xs'}>
          <Text textStyle={'tableCell'} {...props}>-</Text>
        </StakingRewards>
      )
    case 'distributedRewards':
      return (
        <DistributedRewards size={'xs'}>
          <Text textStyle={'tableCell'} {...props}>-</Text>
        </DistributedRewards>
      )
    case 'autoCompounding':
      return (
        <Autocompounding size={'xs'}>
          <Text textStyle={'tableCell'} {...props}>-</Text>
          {
            /*
            <RewardsEmissions size={'xs'}>
              <Text textStyle={'tableCell'} {...props}>-</Text>
            </RewardsEmissions>
            */
          }
        </Autocompounding>
      )
    default:
      return null
  }
}

AssetProvider.Apr = Apr
AssetProvider.Apy = Apy
AssetProvider.Name = Name
AssetProvider.Icon = Icon
AssetProvider.Fees = Fees
AssetProvider.Symbol = Symbol
AssetProvider.Rewards = Rewards
AssetProvider.Balance = Balance
AssetProvider.FeesUsd = FeesUsd
AssetProvider.PoolUsd = PoolUsd
AssetProvider.Coverage = Coverage
AssetProvider.Earnings = Earnings
AssetProvider.ApyRatio = ApyRatio
AssetProvider.Strategy = Strategy
AssetProvider.ApyBoost = ApyBoost
AssetProvider.EpochInfo = EpochInfo
AssetProvider.SeniorApy = SeniorApy
AssetProvider.JuniorApy = JuniorApy
AssetProvider.Protocols = Protocols
AssetProvider.Deposited = Deposited
AssetProvider.ChainIcon = ChainIcon
AssetProvider.RewardsApy = RewardsApy
AssetProvider.GaugeShare = GaugeShare
AssetProvider.Redeemable = Redeemable
AssetProvider.Allocation = Allocation
AssetProvider.BalanceUsd = BalanceUsd
AssetProvider.Strategies = Strategies
AssetProvider.GeneralData = GeneralData
AssetProvider.RealizedApy = RealizedApy
AssetProvider.EarningsUsd = EarningsUsd
AssetProvider.NetEarnings = NetEarnings
AssetProvider.VaultVariant = VaultVariant
AssetProvider.TotalPoolUsd = TotalPoolUsd
AssetProvider.VaultBalance = VaultBalance
AssetProvider.EarningsPerc = EarningsPerc
AssetProvider.DepositedUsd = DepositedUsd
AssetProvider.ProtocolName = ProtocolName
AssetProvider.ProtocolIcon = ProtocolIcon
AssetProvider.SeniorPoolUsd = SeniorPoolUsd
AssetProvider.JuniorPoolUsd = JuniorPoolUsd
AssetProvider.StrategyBadge = StrategyBadge
AssetProvider.ApyRatioChart = ApyRatioChart
AssetProvider.EpochCountdown = EpochCountdown
AssetProvider.StakingEndDate = StakingEndDate
AssetProvider.NetEarningsUsd = NetEarningsUsd
AssetProvider.StakingRewards = StakingRewards
AssetProvider.PerformanceFee = PerformanceFee
AssetProvider.HistoricalRates = HistoricalRates
AssetProvider.Autocompounding = Autocompounding
AssetProvider.RewardsEmissions = RewardsEmissions
AssetProvider.DistributedRewards = DistributedRewards
AssetProvider.TrancheTotalPoolUsd = TrancheTotalPoolUsd
AssetProvider.KycVerificationBadge = KycVerificationBadge
AssetProvider.GaugeUserDistribution = GaugeUserDistribution