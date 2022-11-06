import { useMemo } from 'react'
import type { AssetId } from 'constants/types'
import { protocols } from 'constants/protocols'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'

export type ProtocolName = keyof typeof protocols
export interface ProtocolAllocation {
  [protocol: ProtocolName]: Number
}

type UseAllocationChartDataArgs = {
  assetId: AssetId | undefined
}

type UseAllocationChartDataReturn = {
  allocations: ProtocolAllocation | null
}

type UseAllocationChartData = (args: UseAllocationChartDataArgs) => UseAllocationChartDataReturn

export const useAllocationChartData: UseAllocationChartData = ({ assetId }) => {

  // console.log('args', args)
  // const assetId = args.assetId

  const { selectors: { selectAssetById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    if (!selectAssetById) return
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  return {
    allocations: asset?.allocations
  }
}