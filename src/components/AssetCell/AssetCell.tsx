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

export const AssetCell = ({assetId, children, ...rest}: AssetCellProps) => {

  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    if (!selectAssetById) return null
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const vault = useMemo(() => {
    if (!selectVaultById) return null
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

// const Logo: React.FC = ({assetId, ...rest}) => {
    
// }
type AssetFieldProps = {
  value?: string | number | BigNumber
} & TextProps & BoxProps & ThemingProps

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

const Rewards: React.FC<AvatarProps> = (props) => {
  const {vault} = useAssetProvider();
  
  const rewardTokens = useMemo(() => {
    if (!vault || !("rewardTokens" in vault)) return null
    return vault.rewardTokens.map( (rewardToken: UnderlyingTokenProps, index: number) => {
      if (!rewardToken.address) return null
      return (
        <AssetCell key={`asset_${index}`} assetId={rewardToken.address}>
          <AssetCell.Icon {...props} ml={-2} showTooltip={true} />
        </AssetCell>
      )
    })
  }, [vault, props])

  return (
    <Flex>
      {rewardTokens}
    </Flex>
  )
}
const Balance: React.FC<AvatarProps> = (props) => {
  const { asset } = useAssetProvider();
  
  return asset?.balance ? (
    <Amount value={asset.balance} {...props} />
  ) : <Spinner size={'sm'} />
}

const HistoricalRates: React.FC<BoxProps> = (props) => {
  const { asset } = useAssetProvider();

  const chart = useMemo(() => {
    if (!asset?.id || !asset?.rates) return null
    return (
      <RateChart
        {...props}
        percentChange={0}
        axisEnabled={false}
        assetIds={[asset.id]}
        setPercentChange={() => {}}
        timeframe={HistoryTimeframe.DAY}
      />
    )
  }, [asset?.id, asset?.rates, props])

  return chart
}

AssetCell.Name = Name
AssetCell.Icon = Icon
AssetCell.Symbol = Symbol
AssetCell.Rewards = Rewards
AssetCell.Balance = Balance
AssetCell.ProtocolName = ProtocolName
AssetCell.ProtocolIcon = ProtocolIcon
AssetCell.HistoricalRates = HistoricalRates