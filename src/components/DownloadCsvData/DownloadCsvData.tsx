import { ChartData } from 'constants/types'
import { useMemo, useCallback } from 'react'
import { MdOutlineFileDownload } from 'react-icons/md'
import { historyDataToCsv, rainbowDataToCsv, downloadFile } from 'helpers/'

type DownloadCsvDataProps = {
  chartData: ChartData
  isRainbowChart: boolean
}

export const DownloadCsvData: React.FC<DownloadCsvDataProps> = ({
  chartData,
  isRainbowChart
}) => {

  const historyDataCsv = useMemo(() => {
    return historyDataToCsv(chartData.total)
  }, [chartData])

  const rainbowDataCsv = useMemo(() => {
    return rainbowDataToCsv(chartData.rainbow)
  }, [chartData])

  const downloadCsv = useCallback(() => {
    return downloadFile(isRainbowChart ? rainbowDataCsv : historyDataCsv, 'balances.csv')
  }, [historyDataCsv, rainbowDataCsv, isRainbowChart])

  // console.log('chartData', chartData, historyDataCsv, rainbowDataCsv)

  return (
    <MdOutlineFileDownload color={'primary'} size={24} onClick={() => downloadCsv()} />
  )
}