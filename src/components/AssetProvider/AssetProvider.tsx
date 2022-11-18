// import dayjs from 'dayjs'
import { BsQuestion } from 'react-icons/bs'
import { useTranslate } from 'react-polyglot'
import type { BigNumber } from 'bignumber.js'
import { strategies } from 'constants/strategies'
import { UnderlyingToken } from 'vaults/UnderlyingToken'
// import { useI18nProvider } from 'contexts/I18nProvider'
import { RateChart } from 'components/RateChart/RateChart'
import { BNify, apr2apy, abbreviateNumber } from 'helpers/'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import React, { useMemo, createContext, useContext } from 'react'
import { AllocationChart } from 'components/AllocationChart/AllocationChart'
import { Amount, AmountProps, PercentageProps } from 'components/Amount/Amount'
import type { FlexProps, BoxProps, ThemingProps, TextProps, AvatarProps } from '@chakra-ui/react'
import { useTheme, Text, Flex, Avatar, Tooltip, Spinner, VStack, HStack, Tag } from '@chakra-ui/react'
import { BarChart, BarChartData, BarChartLabels, BarChartColors, BarChartKey } from 'components/BarChart/BarChart'
import { Asset, Vault, UnderlyingTokenProps, protocols, HistoryTimeframe, vaultsStatusSchemes } from 'constants/'

type AssetCellProps = {
  assetId: string | undefined
} & FlexProps & ThemingProps

// type LogoProps = AssetProps & {
//   [x: string]: any
// }

type ContextProps = {
  assetId: string | null | undefined
  asset: Asset | null
  vault: Vault | null
  underlyingAsset: Asset | null
  underlyingAssetVault: UnderlyingToken | null
  translate: Function
  theme: any
}

const initialState = {
  assetId: null,
  asset: null,
  underlyingAsset: null,
  underlyingAssetVault: null,
  vault: null,
  translate: () => {},
  theme: null
}

const AssetContext = createContext<ContextProps>(initialState)

export const useAssetProvider = () => useContext(AssetContext)

export const AssetProvider = ({assetId, children, ...rest}: AssetCellProps) => {
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

  return (
    <AssetContext.Provider value={{asset, vault, underlyingAsset, underlyingAssetVault, assetId, translate, theme}}>
      <Flex {...rest}>
        {children}
      </Flex>
    </AssetContext.Provider>
  )
}

type AssetFieldProps = {
  value?: string | number | BigNumber
} & TextProps

const Name: React.FC<AssetFieldProps> = (props) => {
  const { asset } = useAssetProvider()
  return (
    <Text {...props}>{asset?.name}</Text>
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

type IconProps = {
  showTooltip?: boolean
} & AvatarProps

const Icon: React.FC<IconProps> = ({
  showTooltip = false,
  ...props
}) => {
  const { asset } = useAssetProvider()

  const avatar = useMemo(() => (
    <Avatar
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

  if (!asset) return null

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
        <AssetProvider key={`asset_${rewardToken.address}`} assetId={rewardToken.address}>
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
  const {vault} = useAssetProvider();
  
  const rewardTokens = useMemo(() => {
    if (!vault || !("rewardTokens" in vault)) return children

    const rewards = vault.rewardTokens.map( (rewardToken: UnderlyingTokenProps, index: number) => {
      if (!rewardToken.address) return null
      return (
        <AssetProvider key={`asset_${rewardToken.address}`} assetId={rewardToken.address}>
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

const Rewards: React.FC<AvatarProps & BoxProps> = ({children, ...props}) => {
  const {vault} = useAssetProvider();
  const { selectors: { selectVaultById } } = usePortfolioProvider()
  
  const rewardTokens = useMemo(() => {
    if (!vault || !("rewardTokens" in vault)) return children

    const gaugeVault = ("gaugeConfig" in vault) && vault.gaugeConfig?.address && selectVaultById(vault.gaugeConfig?.address)
    
    // Add Gauge rewards
    const rewardTokens = [...vault.rewardTokens]
    if (gaugeVault){
      rewardTokens.push(...gaugeVault.rewardTokens)
    }

    const rewards = rewardTokens.map( (rewardToken: UnderlyingTokenProps, index: number) => {
      if (!rewardToken.address) return null
      return (
        <AssetProvider key={`asset_${rewardToken.address}`} assetId={rewardToken.address}>
          <AssetProvider.Icon {...props} ml={index ? -1 : 0} showTooltip={true} />
        </AssetProvider>
      )
    }).filter( (reward: any) => !!reward )
    return rewards.length ? rewards : children
  }, [children, vault, props, selectVaultById])

  return (
    <Flex>
      {rewardTokens}
    </Flex>
  )
}

const Balance: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.balance ? (
    <Amount value={asset.balance} {...props} />
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

const BalanceUsd: React.FC<AmountProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.vaultPosition?.usd.redeemable ? (
    <Amount.Usd value={asset?.vaultPosition?.usd.redeemable} {...props} />
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

const Apr: React.FC<PercentageProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.apr ? (
    <Amount.Percentage value={asset?.apr} {...props} />
  ) : <Spinner size={'sm'} />
}

const Apy: React.FC<PercentageProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.apy ? (
    <Amount.Percentage value={asset?.apy} {...props} />
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

  const harvestedAsset = selectAssetById(asset?.lastHarvest?.tokenAddress)

  const harvestAPY = asset?.lastHarvest?.aprs[vault.type]
  const harvestValue = asset?.lastHarvest?.value[vault.type]
  // const harvestDate = dayjs(+asset.lastHarvest.timestamp*1000).format('YYYY/MM/DD HH:mm')
  
  return asset?.lastHarvest === null ? (
    <Text {...props}>-</Text>
  ) : asset?.lastHarvest ? (
    <VStack
      spacing={0}
      alignItems={'flex-start'}
    >
      <Text {...props}>{harvestValue?.toFixed(4)} {harvestedAsset?.token}</Text>
      <Amount.Percentage textStyle={'captionSmaller'} lineHeight={'normal'} prefix={'(+'} suffix={' APY)'} value={harvestAPY?.times(100)} />
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
  const coverageAmount = bbTranche.tvl && asset?.tvl ? bbTranche.tvl.div(asset.tvl) : 0;
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

const Allocation: React.FC<BoxProps> = (props) => {

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
} & TextProps & AvatarProps & BoxProps & ThemingProps

const GeneralData: React.FC<GeneralDataProps> = ({ field, ...props }) => {

  switch (field) {
    case 'protocol':
      return (
        <HStack
          spacing={2}
          alignItems={'center'}
        >
          <ProtocolIcon size={'xs'} />
          <ProtocolName textStyle={'tableCell'} />
        </HStack>
      )
    case 'pool':
      return (<PoolUsd textStyle={'tableCell'} />)
    case 'apy':
      return (<Apy textStyle={'tableCell'} />)
    // case 'apyRatio':
    //   return (<ApyRatio textStyle={'tableCell'} />)  
    case 'apyRatio':
      return <ApyRatioChart width={'100%'} />
    case 'apyBoost':
      return (<ApyBoost textStyle={'tableCell'} />)  
    case 'coverage':
      return (<Coverage textStyle={'tableCell'} />)  
    case 'performanceFee':
      return (<PerformanceFee textStyle={'tableCell'} />)  
    case 'lastHarvest':
      return (<LastHarvest textStyle={'tableCell'} />)  
    case 'rewards':
      return (
        <Rewards size={'xs'}>
          <Text textStyle={'tableCell'}>-</Text>
        </Rewards>
      )
    case 'status':
      return (<Status size={'md'}></Status>)
    case 'allocation':
      return (<Allocation />)
    case 'stakingRewards':
      return (
        <StakingRewards size={'xs'}>
          <Text textStyle={'tableCell'}>-</Text>
        </StakingRewards>
      )
    case 'autoCompounding':
      return (
        <Autocompounding size={'xs'}>
          <Text textStyle={'tableCell'}>-</Text>
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
AssetProvider.Deposited = Deposited
AssetProvider.Allocation = Allocation
AssetProvider.BalanceUsd = BalanceUsd
AssetProvider.GeneralData = GeneralData
AssetProvider.RealizedApy = RealizedApy
AssetProvider.EarningsUsd = EarningsUsd
AssetProvider.EarningsPerc = EarningsPerc
AssetProvider.DepositedUsd = DepositedUsd
AssetProvider.ProtocolName = ProtocolName
AssetProvider.ProtocolIcon = ProtocolIcon
AssetProvider.ApyRatioChart = ApyRatioChart
AssetProvider.StakingRewards = StakingRewards
AssetProvider.PerformanceFee = PerformanceFee
AssetProvider.HistoricalRates = HistoricalRates