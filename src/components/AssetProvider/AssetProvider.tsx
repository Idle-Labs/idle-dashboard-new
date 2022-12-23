// import dayjs from 'dayjs'
import { BsQuestion } from 'react-icons/bs'
import { useTranslate } from 'react-polyglot'
import type { BigNumber } from 'bignumber.js'
import { strategies } from 'constants/strategies'
import { BNify, abbreviateNumber } from 'helpers/'
import { UnderlyingToken } from 'vaults/UnderlyingToken'
import { selectProtocol } from 'selectors/selectProtocol'
import type { IdleTokenProtocol } from 'constants/vaults'
// import { useI18nProvider } from 'contexts/I18nProvider'
import { RateChart } from 'components/RateChart/RateChart'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import React, { useMemo, createContext, useContext } from 'react'
import { TooltipContent } from 'components/TooltipContent/TooltipContent'
import { AllocationChart } from 'components/AllocationChart/AllocationChart'
import { TransactionLink } from 'components/TransactionLink/TransactionLink'
import { Amount, AmountProps, PercentageProps } from 'components/Amount/Amount'
import type { FlexProps, BoxProps, ThemingProps, TextProps, AvatarProps } from '@chakra-ui/react'
import { Asset, Vault, UnderlyingTokenProps, protocols, HistoryTimeframe, vaultsStatusSchemes } from 'constants/'
import { BarChart, BarChartData, BarChartLabels, BarChartColors, BarChartKey } from 'components/BarChart/BarChart'
import { useTheme, SkeletonText, Text, Flex, Avatar, Tooltip, Spinner, VStack, HStack, Tag } from '@chakra-ui/react'

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
  translate: () => {},
  underlyingAsset: null,
  underlyingAssetVault: null
}

const AssetContext = createContext<ContextProps>(initialState)

export const useAssetProvider = () => useContext(AssetContext)

export const AssetProvider = ({assetId, wrapFlex = true, children, ...flexProps}: AssetCellProps) => {
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
    <AssetContext.Provider value={{asset, vault, underlyingAsset, underlyingAssetVault, assetId, translate, theme}}>
      {wrappedChildren}
    </AssetContext.Provider>
  )
}

type AssetFieldProps = {
  value?: string | number | BigNumber
} & TextProps

const Name: React.FC<AssetFieldProps> = (props) => {
  const { asset } = useAssetProvider()
  return (
    <SkeletonText minW={!asset ? '50px' : 'auto'} noOfLines={2} isLoaded={!!asset}>
      <Text {...props}>{asset?.name}</Text>
    </SkeletonText>
  )
}

const Symbol: React.FC<AssetFieldProps> = (props) => {
  const { asset } = useAssetProvider()
  return (
    <Text {...props}>{asset?.token}</Text>
  )
}

const ProtocolName: React.FC<AssetFieldProps> = (props) => {
  const { vault } = useAssetProvider();
  return (
    <Text textTransform={'uppercase'} {...props}>{vault && "protocol" in vault ? vault?.protocol : ''}</Text>
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
    >
      {avatar}
    </Tooltip>
  ), [avatar, asset])

  if (!asset) return <Spinner size={props.size || 'sm'} />

  return showTooltip ? tooltip : avatar
}

const ProtocolIcon: React.FC<IconProps> = ({
  showTooltip = false,
  ...props
}) => {
  const { vault } = useAssetProvider();
  
  const protocol = useMemo(() => {
    if (!vault || !("protocol" in vault)) return null
    return protocols[vault?.protocol]
  }, [vault])

  const avatar = useMemo(() => (
    <Avatar
      src={protocol?.icon}
      icon={<BsQuestion size={24} />}
      {...props}
    />
  ), [protocol, props])

  const tooltip = useMemo(() => (
    <Tooltip
      hasArrow
      placement={'top'}
      label={protocol?.label}
    >
      {avatar}
    </Tooltip>
  ), [avatar, protocol])

  if (!protocol) return null

  return showTooltip ? tooltip : avatar
}

const StakingRewards: React.FC<AvatarProps & BoxProps> = ({children, ...props}) => {
  const {vault} = useAssetProvider();
  const { selectors: { selectVaultById } } = usePortfolioProvider()
  
  const stakingRewards = useMemo(() => {
    if (!vault || !("gaugeConfig" in vault) || !vault.gaugeConfig) return children
    const gaugeVault = ("gaugeConfig" in vault) && vault.gaugeConfig && selectVaultById(vault.gaugeConfig?.address)

    const rewards = gaugeVault.rewardTokens.map( (rewardToken: UnderlyingTokenProps, index: number) => {
      if (!rewardToken.address) return null
      return (
        <AssetProvider key={`asset_${rewardToken.address}_${index}`} assetId={rewardToken.address}>
          <AssetProvider.Icon {...props} ml={index ? -1 : 0} showTooltip={true} />
        </AssetProvider>
      )
    }).filter( (reward: any) => !!reward )
    return rewards.length ? rewards : children
  }, [children, vault, props, selectVaultById])

  return (
    <Flex>
      {stakingRewards}
    </Flex>
  )
}

const Autocompounding: React.FC<AvatarProps & BoxProps> = ({children, ...props}) => {
  const { vault } = useAssetProvider();
  
  const rewardTokens = useMemo(() => {
    if (!vault || !("rewardTokens" in vault)) return children

    const rewards = vault.rewardTokens.map( (rewardToken: UnderlyingTokenProps, index: number) => {
      if (!rewardToken.address) return null
      return (
        <AssetProvider key={`asset_${rewardToken.address}_${index}`} assetId={rewardToken.address}>
          <AssetProvider.Icon {...props} ml={index ? -1 : 0} showTooltip={true} />
        </AssetProvider>
      )
    }).filter( (reward: any) => !!reward )
    return rewards.length ? rewards : children
  }, [children, vault, props])

  return (
    <Flex>
      {rewardTokens}
    </Flex>
  )
}

type RewardsProps = {
 iconMargin?: number
} & AvatarProps & BoxProps

const Rewards: React.FC<RewardsProps> = ({children, iconMargin, ...props}) => {
  const { vault } = useAssetProvider();
  const { selectors: { selectVaultById } } = usePortfolioProvider()
  
  const rewardTokens = useMemo(() => {
    if (!vault || !("rewardTokens" in vault)) return children

    const gaugeVault = ("gaugeConfig" in vault) && vault.gaugeConfig?.address && selectVaultById(vault.gaugeConfig?.address)
    
    // Add Gauge rewards
    const rewardTokens = [...vault.rewardTokens]
    if (gaugeVault){
      for (const rewardToken of gaugeVault.rewardTokens){
        if (!rewardTokens.includes(rewardToken)){
          rewardTokens.push(rewardToken)
        }
      }
    }

    const rewards = rewardTokens.map( (rewardToken: UnderlyingTokenProps, index: number) => {
      if (!rewardToken.address) return null
      return (
        <AssetProvider key={`asset_${rewardToken.address}_${index}`} assetId={rewardToken.address}>
          <AssetProvider.Icon {...props} ml={index ? iconMargin !== undefined ? iconMargin : -1 : 0} showTooltip={true} />
        </AssetProvider>
      )
    }).filter( (reward: any) => !!reward )
    return rewards.length ? rewards : children
  }, [children, vault, props, selectVaultById, iconMargin])

  return (
    <Flex>
      {rewardTokens}
    </Flex>
  )
}

type ProtocolsProps = {
 iconMargin?: number
} & AvatarProps & BoxProps

const Protocols: React.FC<ProtocolsProps> = ({children, iconMargin, ...props}) => {
  const { vault } = useAssetProvider();
  // const { selectors: { selectVaultById } } = usePortfolioProvider()
  
  const protocols = useMemo(() => {
    if (!vault || !("tokenConfig" in vault) || !("protocols" in vault.tokenConfig)) return children

    const protocolIcons = vault.tokenConfig.protocols.reduce( (protocols: JSX.Element[], protocolConfig: IdleTokenProtocol, index: number) => {
      const protocol = selectProtocol(protocolConfig.name)
      if (!protocol) return protocols
      protocols.push(
        <Tooltip
          hasArrow
          placement={'top'}
          key={`icon_${index}`}
          label={protocol.label}
        >
          <Avatar
            p={1}
            bg={'white'}
            src={protocol.icon}
            icon={<BsQuestion size={24} />}
            sx={{
              "> img": {
                objectFit: 'contain'
              }
            }}
            ml={protocols.length>0 ? iconMargin !== undefined ? iconMargin : -1 : 0}
            {...props}
          />
        </Tooltip>
      )
      return protocols
    }, [])

    return protocolIcons.length ? protocolIcons : children
  }, [children, vault, props, iconMargin])

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

const NetEarnings: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  const netEarnings = asset?.vaultPosition?.underlying.earnings && asset?.fee ? BNify(asset?.vaultPosition?.underlying.earnings).minus(BNify(asset.vaultPosition.underlying.earnings).times(asset.fee)) : BNify(0)
  
  return asset?.vaultPosition?.underlying.earnings ? (
    <Amount.Usd value={netEarnings} {...props} />
  ) : <Spinner size={'sm'} />
}

const EarningsUsd: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.vaultPosition?.usd.earnings ? (
    <Amount.Usd value={asset?.vaultPosition?.usd.earnings} {...props} />
  ) : <Spinner size={'sm'} />
}

const NetEarningsUsd: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()

  const netEarnings = asset?.vaultPosition?.usd.earnings && asset?.fee ? BNify(asset?.vaultPosition?.usd.earnings).minus(BNify(asset.vaultPosition.usd.earnings).times(asset.fee)) : BNify(0)
  
  return asset?.vaultPosition?.usd.earnings ? (
    <Amount.Usd value={netEarnings} {...props} />
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
} & PercentageProps

const Apy: React.FC<ApyProps> = ({ showGross = true, showNet = false, ...props}) => {
  const { asset } = useAssetProvider()

  const netApy = BNify(asset?.apy).minus(BNify(asset?.apy).times(BNify(asset?.fee)))

  showGross = showGross && !!asset?.apyBreakdown && Object.keys(asset.apyBreakdown).length>1

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
          Object.keys(asset.apyBreakdown).map( (type: string) => {
            const apr = BNify(asset?.apyBreakdown?.[type])
            if (apr.lte(0) && type!=='base') return null
            return (
              <HStack
                spacing={3}
                width={'100%'}
                key={`apr_${type}`}
                alignItems={'baseline'}
                justifyContent={'space-between'}
              >
                <Translation translation={`assets.assetDetails.apyBreakdown.${type}`} />
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

  return asset?.apy ? (
    <Tooltip
      hasArrow
      placement={'top'}
      label={tooltipLabel}
    >
      <TooltipContent>
        <Amount.Percentage value={asset?.apy} {...props} borderBottom={'1px dashed'} borderBottomColor={'cta'} />
      </TooltipContent>
    </Tooltip>
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

const RealizedApy: React.FC<PercentageProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.vaultPosition?.realizedApy ? (
    <Amount.Percentage value={asset?.vaultPosition?.realizedApy} {...props} />
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

  const feeUsd = asset?.vaultPosition?.usd.earnings && asset?.fee ? BNify(asset.vaultPosition.usd.earnings).times(asset.fee) : BNify(0)
  
  return asset?.vaultPosition?.usd.earnings ? (
    <Amount.Usd value={feeUsd} {...props} />
  ) : <Spinner size={'sm'} />
}

const PerformanceFee: React.FC<PercentageProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.fee ? (
    <Amount.Percentage value={asset?.fee?.times(100)} {...props} />
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
      <TransactionLink hash={lastHarvest.hash} fontSize={'xs'} />
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

const Status: React.FC<AmountProps> = (props) => {
  const { asset, translate } = useAssetProvider()

  if (!asset?.status) return null

  const colorScheme = vaultsStatusSchemes[asset.status]
  
  const status = translate(`assets.status.${asset.status}`)
  
  return colorScheme ? (
    <Tag {...props} variant={'solid'} colorScheme={colorScheme} color={'primary'} fontWeight={700}>{status}</Tag>
  ) : <Spinner size={'sm'} />
}

const Coverage: React.FC<AmountProps> = (props) => {
  const { asset, vault, translate } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (vault?.type !== 'AA' || !("vaultConfig" in vault)) return null

  const bbTranche = selectAssetById(vault?.vaultConfig.Tranches.BB.address)
  const coverageAmount = bbTranche.tvl && asset?.tvl && BNify(asset?.tvl).gt(0) ? bbTranche.tvl.div(asset.tvl) : 0;
  const coverageText = translate('defi.coverageAmount', {amount: '$1', coverageAmount: `$${abbreviateNumber(coverageAmount, 2)}`})
  
  return asset?.tvlUsd ? (
    <Text {...props}>{coverageText}</Text>
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
      setPercentChange={() => {}}
      timeframe={HistoryTimeframe.WEEK}
    />
  ) : null
}

const ApyRatioChart: React.FC<BoxProps> = (props) => {
  const { asset, vault, translate, theme } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (!vault || !("vaultConfig" in vault)) return null

  const vaultType = vault?.type
  const apyRatio = asset?.aprRatio

  const otherVaultType = vaultType === 'AA' ? 'BB' : 'AA'
  const otherVault = selectAssetById(vault?.vaultConfig.Tranches[otherVaultType].address)

  const data: BarChartData = {
    [vaultType]:apyRatio,
    [otherVaultType]:otherVault?.aprRatio
  }

  const labels = Object.keys(data).reduce( (labels: BarChartLabels, key: BarChartKey) => {
    return {
      ...labels,
      [key]: translate(strategies[key].label)
    }
  }, {})

  const colors = Object.keys(data).reduce( (colors: BarChartColors, key: BarChartKey) => {
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
        <AllocationChart assetId={asset?.id} />
      </Flex>
    </Flex>
  ) : <Spinner size={'sm'} />
}

type GeneralDataProps = {
  field: string
  section?: string
} & TextProps & AvatarProps & BoxProps & ThemingProps

const GeneralData: React.FC<GeneralDataProps> = ({ field, section, ...props }) => {
  const { asset } = useAssetProvider()
  switch (field) {
    case 'protocol':
      return (
        <HStack
          spacing={2}
          alignItems={'center'}
        >
          <ProtocolIcon size={'sm'} />
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
    case 'tvl':
    case 'pool':
      return (<PoolUsd textStyle={'tableCell'} {...props} />)
    case 'apy':
      return (<Apy showNet={section === 'asset'} textStyle={'tableCell'} {...props} />)
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
    case 'performanceFee':
      return (<PerformanceFee textStyle={'tableCell'} {...props} />)
    case 'lastHarvest':
      return (<LastHarvest textStyle={'tableCell'} {...props} />)
    case 'balanceUsd':
      return (<BalanceUsd textStyle={'tableCell'} {...props} />)
    case 'realizedApy':
      return (<RealizedApy textStyle={'tableCell'} {...props} />)
    case 'weight':
      return (<GaugeWeight textStyle={'tableCell'} {...props} />)
    case 'nextWeight':
      return (<GaugeNextWeight textStyle={'tableCell'} {...props} />)
    case 'gaugeTotalSupply':
      return (<GaugeTotalSupply textStyle={'tableCell'} {...props} />)
    case 'rewards':
      return (
        <Rewards size={'xs'} {...props}>
          <Text textStyle={'tableCell'} {...props}>-</Text>
        </Rewards>
      )
    case 'protocols':
      return (
        <Protocols size={'xs'} {...props}>
          <Text textStyle={'tableCell'} {...props}>-</Text>
        </Protocols>
      )
    case 'status':
      return (<Status size={'md'}></Status>)
    case 'allocation':
      return (<Allocation />)
    case 'stakingRewards':
      return (
        <StakingRewards size={'xs'}>
          <Text textStyle={'tableCell'} {...props}>-</Text>
        </StakingRewards>
      )
    case 'autoCompounding':
      return (
        <Autocompounding size={'xs'}>
          <Text textStyle={'tableCell'} {...props}>-</Text>
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
AssetProvider.Earnings = Earnings
AssetProvider.ApyRatio = ApyRatio
AssetProvider.Protocols = Protocols
AssetProvider.Deposited = Deposited
AssetProvider.GaugeShare = GaugeShare
AssetProvider.Redeemable = Redeemable
AssetProvider.Allocation = Allocation
AssetProvider.BalanceUsd = BalanceUsd
AssetProvider.GeneralData = GeneralData
AssetProvider.RealizedApy = RealizedApy
AssetProvider.EarningsUsd = EarningsUsd
AssetProvider.NetEarnings = NetEarnings
AssetProvider.VaultBalance = VaultBalance
AssetProvider.EarningsPerc = EarningsPerc
AssetProvider.DepositedUsd = DepositedUsd
AssetProvider.ProtocolName = ProtocolName
AssetProvider.ProtocolIcon = ProtocolIcon
AssetProvider.ApyRatioChart = ApyRatioChart
AssetProvider.NetEarningsUsd = NetEarningsUsd
AssetProvider.StakingRewards = StakingRewards
AssetProvider.PerformanceFee = PerformanceFee
AssetProvider.HistoricalRates = HistoricalRates
AssetProvider.GaugeUserDistribution = GaugeUserDistribution