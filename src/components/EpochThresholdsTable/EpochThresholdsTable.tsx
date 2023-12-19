import { Column } from 'react-table'
import React, { useMemo } from 'react'
import { Text } from '@chakra-ui/react'
import { useTranslate } from 'react-polyglot'
import { Amount } from 'components/Amount/Amount'
import { sortNumeric, dateToLocale } from 'helpers/'
import { Card, CardProps } from 'components/Card/Card'
import { useI18nProvider } from 'contexts/I18nProvider'
import { ReactTable } from 'components/ReactTable/ReactTable'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { NumberType, EpochWeekThreshold, BigNumber } from 'constants/types'

type EpochThresholdsTableArgs = {
  assetId: number
  sortEnabled?: boolean
} & CardProps

export const EpochThresholdsTable: React.FC<EpochThresholdsTableArgs> = ({
  assetId,
  sortEnabled = true,
  ...cardProps
}) => {
  const translate = useTranslate()
  const { locale } = useI18nProvider()
  const { selectors: { selectAssetById } } = usePortfolioProvider()
  
  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const columns: Column<EpochWeekThreshold>[] = useMemo(() => ([
    {
      id:'number',
      accessor:'number',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.number'),
      Cell: ({ value }: { value: NumberType }) => {
        return (
          <Amount.Int textStyle={'tableCell'} value={value} />
        )
      },
      sortType: sortNumeric
    },
    {
      id:'start',
      accessor:'start',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.start'),
      Cell: ({ value }: { value: number }) => {
        return (
          <Text textStyle={'tableCell'}>{dateToLocale(value, locale)}</Text>
        )
      },
      sortType: sortNumeric
    },
    {
      id:'end',
      accessor:'end',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.end'),
      Cell: ({ value }: { value: number }) => {
        return (
          <Text textStyle={'tableCell'}>{dateToLocale(value, locale)}</Text>
        )
      },
      sortType: sortNumeric
    },
    {
      id:'threshold',
      accessor:'threshold',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.threshold'),
      Cell: ({ value }: { value: BigNumber }) => {
        return (
          <Amount.Usd abbreviate={false} decimals={0} prefix={asset.epochData.bullish ? '> ' : '< '} textStyle={'tableCell'} value={value} />
        )
      },
      sortType: sortNumeric
    },
  ]), [sortEnabled, translate, locale, asset])

  const initialState = {
    sortBy: [
      {
        id: 'number',
        desc: true
      }
    ]
  }

  const data = useMemo(() => {
    if (!asset?.epochData?.weeklyThresholds) return []
    return Object.values(asset?.epochData?.weeklyThresholds) as EpochWeekThreshold[]
  }, [asset])

  if (!asset?.epochData?.weeklyThresholds) return null

  return (
    <Card
      {...cardProps}
    >
      <ReactTable columns={columns} data={data} page={1} rowsPerPage={data.length} initialState={initialState} />
    </Card>
  )
}