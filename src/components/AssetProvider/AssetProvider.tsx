import { BNify, apr2apy } from 'helpers/'
import { useTranslate } from 'react-polyglot'
import type { BigNumber } from 'bignumber.js'
import { Amount } from 'components/Amount/Amount'
import { RateChart } from 'components/RateChart/RateChart'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import React, { useMemo, createContext, useContext } from 'react'
import { Text, Flex, Avatar, Tooltip, Spinner, HStack, Tag } from '@chakra-ui/react'
import type { BoxProps, ThemingProps, TextProps, AvatarProps } from '@chakra-ui/react'
import { Asset, Vault, UnderlyingTokenProps, protocols, HistoryTimeframe, vaultsStatusSchemes } from 'constants/'

type AssetCellProps = {
  assetId: string | undefined
} & BoxProps & ThemingProps

// type LogoProps = AssetProps & {
//   [x: string]: any
// }

type ContextProps = {
  assetId: string | null | undefined
  asset: Asset | null
  vault: Vault | null
}

const initialState = {
  assetId: null,
  asset: null,
  vault: null
}

const AssetContext = createContext<ContextProps>(initialState)

const useAssetProvider = () => useContext(AssetContext)

export const AssetProvider = ({assetId, children, ...rest}: AssetCellProps) => {

  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    if (!selectAssetById || !assetId) return null
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const vault = useMemo(() => {
    if (!selectVaultById || !assetId) return null
    return selectVaultById(assetId)
  }, [assetId, selectVaultById])

  return (
    <AssetContext.Provider value={{asset, vault, assetId}}>
      <Flex>
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

const Balance: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.balance ? (
    <Amount value={asset.balance} {...props} />
  ) : <Spinner size={'sm'} />
}

const Earnings: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.vaultPosition?.underlying.earnings ? (
    <Amount value={asset?.vaultPosition?.underlying.earnings} {...props} />
  ) : <Spinner size={'sm'} />
}

const EarningsUsd: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.vaultPosition?.usd.earnings ? (
    <Amount.Usd value={asset?.vaultPosition?.usd.earnings} {...props} />
  ) : <Spinner size={'sm'} />
}

const BalanceUsd: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.vaultPosition?.usd.redeemable ? (
    <Amount.Usd value={asset?.vaultPosition?.usd.redeemable} {...props} />
  ) : <Spinner size={'sm'} />
}

const EarningsPerc: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.vaultPosition?.earningsPercentage ? (
    <Amount.Percentage value={asset?.vaultPosition?.earningsPercentage.times(100)} {...props} />
  ) : <Spinner size={'sm'} />
}

const DepositedUsd: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.vaultPosition?.usd.deposited ? (
    <Amount.Usd value={asset?.vaultPosition?.usd.deposited} {...props} />
  ) : <Spinner size={'sm'} />
}

const Deposited: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.vaultPosition?.underlying.deposited ? (
    <Amount value={asset?.vaultPosition?.underlying.deposited} {...props} />
  ) : <Spinner size={'sm'} />
}

const Apr: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.apr ? (
    <Amount.Percentage value={asset?.apr} {...props} />
  ) : <Spinner size={'sm'} />
}

const Apy: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.apy ? (
    <Amount.Percentage value={asset?.apy} {...props} />
  ) : <Spinner size={'sm'} />
}

const ApyRatio: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.aprRatio ? (
    <Amount.Percentage value={asset?.aprRatio} {...props} />
  ) : <Spinner size={'sm'} />
}

const ApyBoost: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.apy && asset?.baseApr ? (
    <Amount suffix={'x'} maxDecimals={2} value={asset?.apy.div(asset?.baseApr)} {...props} />
  ) : <Spinner size={'sm'} />
}

const RealizedApy: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()

  const realizedApy = asset?.vaultPosition?.earningsPercentage && asset?.vaultPosition?.depositDuration ? apr2apy(asset?.vaultPosition?.earningsPercentage.times(31536000).div(asset?.vaultPosition?.depositDuration)).times(100) : BNify(0);
  // console.log('earningsPercentage', asset?.vaultPosition?.earningsPercentage, 'depositDuration', asset?.vaultPosition?.depositDuration, 'realizedApy', realizedApy.toString())
  
  return asset?.vaultPosition?.depositDuration ? (
    <Amount.Percentage value={realizedApy} {...props} />
  ) : <Spinner size={'sm'} />
}

const FeesUsd: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()

  const feeUsd = asset?.vaultPosition?.usd.earnings && asset?.fee ? BNify(asset.vaultPosition.usd.earnings).times(asset.fee) : BNify(0)
  
  return asset?.vaultPosition?.usd.earnings ? (
    <Amount.Usd value={feeUsd} {...props} />
  ) : <Spinner size={'sm'} />
}

const Fees: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()

  const fee = asset?.vaultPosition?.underlying.earnings && asset?.fee ? BNify(asset.vaultPosition.underlying.earnings).times(asset.fee) : BNify(0)
  
  return asset?.vaultPosition?.usd.earnings ? (
    <Amount value={fee} {...props} />
  ) : <Spinner size={'sm'} />
}

const PoolUsd: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider()
  
  return asset?.tvlUsd ? (
    <Amount.Usd value={asset?.tvlUsd} {...props} />
  ) : <Spinner size={'sm'} />
}

const Status: React.FC<TextProps> = (props) => {
  const translate = useTranslate()
  const { asset } = useAssetProvider()

  if (!asset?.status) return null

  const colorScheme = vaultsStatusSchemes[asset.status]
  
  const status = translate(`assets.status.${asset.status}`)
  
  return colorScheme ? (
    <Tag {...props} variant={'solid'} colorScheme={colorScheme} color={'primary'} fontWeight={700}>{status}</Tag>
  ) : <Spinner size={'sm'} />
}

const Coverage: React.FC<TextProps> = (props) => {
  const translate = useTranslate()
  const { asset, vault } = useAssetProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  if (vault?.type !== 'AA' || !("vaultConfig" in vault)) return null

  const bbTranche = selectAssetById(vault?.vaultConfig.Tranches.BB.address)

  const coverageAmount = bbTranche.tvl && asset?.tvl ? bbTranche.tvl.div(asset.tvl).toFixed(2)+'$' : '0.00$';

  const coverageText = translate('defi.coverageAmount', {amount: '1$', coverageAmount})
  
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
    case 'apyRatio':
      return (<ApyRatio textStyle={'tableCell'} />)  
    case 'apyBoost':
      return (<ApyBoost textStyle={'tableCell'} />)  
    case 'coverage':
      return (<Coverage textStyle={'tableCell'} />)  
    case 'rewards':
      return (
        <Rewards size={'xs'}>
          <Text textStyle={'tableCell'}>-</Text>
        </Rewards>
      )
    case 'status':
      return (
        <Status size={'md'}></Status>
      )
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
AssetProvider.Deposited = Deposited
AssetProvider.BalanceUsd = BalanceUsd
AssetProvider.GeneralData = GeneralData
AssetProvider.RealizedApy = RealizedApy
AssetProvider.EarningsUsd = EarningsUsd
AssetProvider.EarningsPerc = EarningsPerc
AssetProvider.DepositedUsd = DepositedUsd
AssetProvider.ProtocolName = ProtocolName
AssetProvider.ProtocolIcon = ProtocolIcon
AssetProvider.StakingRewards = StakingRewards
AssetProvider.HistoricalRates = HistoricalRates