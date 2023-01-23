import { useMemo } from 'react'
import { useWalletProvider } from 'contexts/WalletProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'

export function useUserHasFunds(): boolean {
  const { account } = useWalletProvider()
  const { isVaultsPositionsLoaded, vaultsPositions } = usePortfolioProvider()

  const userHasFunds = useMemo(() => {
    return account && isVaultsPositionsLoaded && Object.keys(vaultsPositions).length>0
  }, [account, isVaultsPositionsLoaded, vaultsPositions])

  return !!userHasFunds
}