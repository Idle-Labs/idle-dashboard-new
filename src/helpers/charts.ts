import { HistoryData } from 'constants/types'
// import sortedIndexBy from 'lodash/sortedIndexBy'
import { bnOrZero } from 'helpers/utilities'

type CalculatePercentChange = (data: HistoryData[]) => number

export const calculatePercentChange: CalculatePercentChange = data => {
  const firstPrice = bnOrZero(data?.[0]?.value)
  const lastPrice = bnOrZero(data?.[data.length - 1]?.value)
  return lastPrice.minus(firstPrice).div(firstPrice.abs()).times(100).decimalPlaces(2).toNumber()
}
