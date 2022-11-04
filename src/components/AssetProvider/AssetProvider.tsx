import { BNify, apr2apy } from 'helpers/'
import type { BigNumber } from 'bignumber.js'
import { Amount } from 'components/Amount/Amount'
import { RateChart } from 'components/RateChart/RateChart'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import React, { useMemo, createContext, useContext } from 'react'
import { Text, Flex, Avatar, Tooltip, Spinner } from '@chakra-ui/react'
import type { BoxProps, ThemingProps, TextProps, AvatarProps } from '@chakra-ui/react'
import { Asset, Vault, UnderlyingTokenProps, protocols, HistoryTimeframe } from 'constants/'

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
  assetId:null,
  asset:null,
  vault:null
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
  const { asset } = useAssetProvider();
  return (
    <Text {...props}>{asset?.name}</Text>
  )
}
const Symbol: React.FC<AssetFieldProps> = (props) => {
  const { asset } = useAssetProvider();
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
  const { asset } = useAssetProvider();

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

const Rewards: React.FC<AvatarProps & BoxProps> = ({children, ...props}) => {
  const {vault} = useAssetProvider();
  
  const rewardTokens = useMemo(() => {
    if (!vault || !("rewardTokens" in vault)) return children
    const rewards = vault.rewardTokens.map( (rewardToken: UnderlyingTokenProps, index: number) => {
      if (!rewardToken.address) return null
      return (
        <AssetProvider key={`asset_${index}`} assetId={rewardToken.address}>
          <AssetProvider.Icon {...props} ml={index ? -1 : 0} showTooltip={true} />
        </AssetProvider>
      )
    }).filter( reward => !!reward )
    return rewards.length ? rewards : children
  }, [children, vault, props])

  return (
    <Flex>
      {rewardTokens}
    </Flex>
  )
}

const Balance: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider();
  
  return asset?.balance ? (
    <Amount value={asset.balance} {...props} />
  ) : <Spinner size={'sm'} />
}

const Earnings: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider();
  
  return asset?.vaultPosition?.underlying.earnings ? (
    <Amount value={asset?.vaultPosition?.underlying.earnings} {...props} />
  ) : <Spinner size={'sm'} />
}

const EarningsUsd: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider();
  
  return asset?.vaultPosition?.usd.earnings ? (
    <Amount.Usd value={asset?.vaultPosition?.usd.earnings} {...props} />
  ) : <Spinner size={'sm'} />
}

const BalanceUsd: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider();
  
  return asset?.vaultPosition?.usd.redeemable ? (
    <Amount.Usd value={asset?.vaultPosition?.usd.redeemable} {...props} />
  ) : <Spinner size={'sm'} />
}

const EarningsPerc: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider();
  
  return asset?.vaultPosition?.earningsPercentage ? (
    <Amount.Percentage value={asset?.vaultPosition?.earningsPercentage.times(100)} {...props} />
  ) : <Spinner size={'sm'} />
}

const DepositedUsd: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider();
  
  return asset?.vaultPosition?.usd.deposited ? (
    <Amount.Usd value={asset?.vaultPosition?.usd.deposited} {...props} />
  ) : <Spinner size={'sm'} />
}

const Deposited: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider();
  
  return asset?.vaultPosition?.underlying.deposited ? (
    <Amount value={asset?.vaultPosition?.underlying.deposited} {...props} />
  ) : <Spinner size={'sm'} />
}

const Apr: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider();
  
  return asset?.apr ? (
    <Amount.Percentage value={asset?.apr} {...props} />
  ) : <Spinner size={'sm'} />
}

const Apy: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider();
  
  return asset?.apy ? (
    <Amount.Percentage value={asset?.apy} {...props} />
  ) : <Spinner size={'sm'} />
}

const RealizedApy: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider();

  const realizedApy = asset?.vaultPosition?.earningsPercentage && asset?.vaultPosition?.depositDuration ? apr2apy(asset?.vaultPosition?.earningsPercentage.times(31536000).div(asset?.vaultPosition?.depositDuration)).times(100) : BNify(0);
  // console.log('earningsPercentage', asset?.vaultPosition?.earningsPercentage, 'depositDuration', asset?.vaultPosition?.depositDuration, 'realizedApy', realizedApy.toString())
  
  return asset?.vaultPosition?.depositDuration ? (
    <Amount.Percentage value={realizedApy} {...props} />
  ) : <Spinner size={'sm'} />
}

const FeesUsd: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider();

  const feeUsd = asset?.vaultPosition?.usd.earnings && asset?.fee ? BNify(asset.vaultPosition.usd.earnings).times(asset.fee) : BNify(0)
  
  return asset?.vaultPosition?.usd.earnings ? (
    <Amount.Usd value={feeUsd} {...props} />
  ) : <Spinner size={'sm'} />
}

const Fees: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider();

  const fee = asset?.vaultPosition?.underlying.earnings && asset?.fee ? BNify(asset.vaultPosition.underlying.earnings).times(asset.fee) : BNify(0)
  
  return asset?.vaultPosition?.usd.earnings ? (
    <Amount value={fee} {...props} />
  ) : <Spinner size={'sm'} />
}

const PoolUsd: React.FC<TextProps> = (props) => {
  const { asset } = useAssetProvider();
  
  return asset?.tvlUsd ? (
    <Amount.Usd value={asset?.tvlUsd} {...props} />
  ) : <Spinner size={'sm'} />
}

const HistoricalRates: React.FC<BoxProps> = (props) => {
  const { asset } = useAssetProvider();
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
AssetProvider.RealizedApy = RealizedApy
AssetProvider.EarningsUsd = EarningsUsd
AssetProvider.EarningsPerc = EarningsPerc
AssetProvider.DepositedUsd = DepositedUsd
AssetProvider.ProtocolName = ProtocolName
AssetProvider.ProtocolIcon = ProtocolIcon
AssetProvider.HistoricalRates = HistoricalRates