import React, { useMemo } from 'react'
import { Flex } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { AssetGeneralData } from 'components/AssetGeneralData/AssetGeneralData'

export const GaugeStaking: React.FC = () => {
  const { params } = useBrowserRouter()
  const { selectors: { selectAssetById, selectVaultGauge } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const vaultGauge = useMemo(() => {
    return selectVaultGauge && selectVaultGauge(params.asset)
  }, [selectVaultGauge, params.asset])

  return (
    <AssetGeneralData assetId={vaultGauge?.id} />
  )
}