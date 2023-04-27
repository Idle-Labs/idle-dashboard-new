import { ChartData } from 'constants/types'
import { useMemo, useCallback } from 'react'
import { useTranslate } from 'react-polyglot'
import { Link, Tooltip } from '@chakra-ui/react'
import { MdOutlineFileDownload } from 'react-icons/md'
import { historyDataToCsv, rainbowDataToCsv, downloadFile } from 'helpers/'

type DownloadCsvDataProps = {
  fileName?: string
  chartData: ChartData
  isRainbowChart: boolean
}

export const DownloadCsvData: React.FC<DownloadCsvDataProps> = ({
  fileName,
  chartData,
  isRainbowChart
}) => {
  const translate = useTranslate()

  const historyDataCsv = useMemo(() => {
    return historyDataToCsv(chartData.total)
  }, [chartData])

  const rainbowDataCsv = useMemo(() => {
    return rainbowDataToCsv(chartData.rainbow)
  }, [chartData])

  const downloadCsv = useCallback(() => {
    return downloadFile(isRainbowChart ? rainbowDataCsv : historyDataCsv, fileName)
  }, [historyDataCsv, rainbowDataCsv, isRainbowChart, fileName])

  // console.log('chartData', chartData, historyDataCsv, rainbowDataCsv)

  return (
    <Tooltip
      hasArrow
      placement={'top'}
      label={translate('transactionHistory.downloadCSV')}
    >
      <Link>
        <MdOutlineFileDownload color={'primary'} size={24} onClick={() => downloadCsv()} />
      </Link>
    </Tooltip>
  )
}