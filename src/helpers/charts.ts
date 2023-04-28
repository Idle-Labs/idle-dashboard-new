// import sortedIndexBy from 'lodash/sortedIndexBy'
import { HistoryData, RainbowData } from 'constants/types'
import { bnOrZero, formatDate, BNify } from 'helpers/utilities'

type CalculatePercentChange = (data: HistoryData[]) => number

export const calculatePercentChange: CalculatePercentChange = data => {
  const firstPrice = bnOrZero(data?.[0]?.value)
  const lastPrice = bnOrZero(data?.[data.length - 1]?.value)
  return lastPrice.minus(firstPrice).div(firstPrice.abs()).times(100).decimalPlaces(2).toNumber()
}

export const historyDataToCsv = (data: HistoryData[]): string | null => {

  if (!data || !data.length) return null

  const rows = data.reduce( (rows: string[][], d: HistoryData) => {
    const date = formatDate(d.date)
    const value = BNify(d.value).toString()
    rows.push([date, value])
    return rows
  }, [
    ['Date', 'Value']
  ])

  const csv = rows.reduce( (text: string, row: string[]) => {
    text = `${text}"${row.join('","')}"\n`
    return text
  }, '')

  return csv
}

export const rainbowDataToCsv = (data: RainbowData[]): string | null => {

  if (!data || !data.length) return null

  const keys = Object.keys(data[0]).filter( (key: string) => !['date', 'total'].includes(key) )

  const rows = data.reduce( (rows: string[][], d: RainbowData) => {
    const date = formatDate(d.date)
    // const total = BNify(d.total).toString()
    const row = [date]
    keys.forEach( (key: string) => {
      row.push(BNify(d[key]).toString())
    })
    rows.push(row)
    return rows
  }, [
    ['Date'].concat(keys)//.concat(['Total'])
  ])

  const csv = rows.reduce( (text: string, row: string[]) => {
    text = `${text}"${row.join('","')}"\n`
    return text
  }, '')

  return csv
}