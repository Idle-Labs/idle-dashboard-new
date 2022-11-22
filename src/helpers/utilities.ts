import BigNumber from 'bignumber.js'
import type { Number } from 'constants/types'
import dayjs, { ManipulateType } from 'dayjs'
import { HistoryTimeframe } from 'constants/types'

type BNifyInput = any

export const BNify = (s: BNifyInput): BigNumber => new BigNumber(typeof s === 'object' ? s : String(s))

export const bnOrZero = (n: BNifyInput): BigNumber => {
  const value = BNify(n || 0)
  return value.isFinite() ? value : BNify(0)
}

export const integerValue = (value: BNifyInput) :string => {
  return BNify(value).integerValue(BigNumber.ROUND_FLOOR).toFixed(0);
}
export const normalizeTokenDecimals = (tokenDecimals: number): BigNumber => {
  return BNify(`1e${tokenDecimals}`);
}
export const normalizeTokenAmount = (tokenBalance: BNifyInput, tokenDecimals: number, round: boolean = true) => {
  return BNify(tokenBalance).times(`1e${tokenDecimals}`).integerValue(BigNumber.ROUND_FLOOR).toFixed(0);
}
export const fixTokenDecimals = (tokenBalance: BNifyInput, tokenDecimals?: number, exchangeRate?: BNifyInput) => {
  if (!tokenDecimals) {
    return BNify(tokenBalance);
  }
  return BNify(tokenBalance).div(`1e${tokenDecimals}`);
}

export const apr2apy = (apr: BNifyInput) => {
  return BNify((BNify(1).plus(BNify(apr).div(365))).pow(365).minus(1).toFixed(18));
}

export const isBigNumberNaN = (amount: any) => {
  const isNull = amount === null
  const isUndefined = amount === undefined
  const isBigNumber = amount instanceof BigNumber
  return isNull || isUndefined || (isBigNumber && BNify(amount).isNaN())
}

export const numberToPercentage = (value: any, decimals = 2, maxValue = 9999) => {
  return isBigNumberNaN(value) ? '-' : (maxValue && BNify(value).gt(maxValue) ? `>${maxValue}` : BNify(value).toFixed(decimals))+'%'
}

export const getTimeframeTimestamp = (timeframe: HistoryTimeframe): number => {
  if (timeframe === 'ALL') return 0
  const periods: Record<string, ManipulateType> = {
    'W':'week',
    'M':'month',
    'Y':'year',
  }
  const value = parseInt(timeframe.substr(0, 1))
  const period = periods[timeframe.substr(1)]
  return dayjs().subtract(value, period).startOf('day').valueOf()
}

export const dateToLocale = (timestamp: number, locale: string) => {
  return dayjs(timestamp).locale(locale).format('LLL')
}

export const formatDate = (timestamp: number | string, format: string = 'YYYY/MM/DD') => {
  return dayjs(+timestamp).format(format)
}

export const splitArrayIntoChunks = (array: any, chunkSize: number) => {
  const output = []
  for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      output.push(chunk)
  }
  return output
}

export const formatTime = (seconds: any) => {
  if (!seconds) return ['0s']
  const suffixes = ['h', 'm', 's']
  let timesJoined = new Date(seconds * 1000).toISOString().substr(11, 8).replace(/:/g, "").replace(/^0+/g,"")
  const zerosToPrepend = timesJoined.length%2
  if (zerosToPrepend) {
    timesJoined = `${'0'.repeat(zerosToPrepend)}${timesJoined}`
  }
  const times = timesJoined.match(/.{1,2}/g);
  const timesFormatted = times ? times.map( (v, index) => parseInt(v)+suffixes.slice(suffixes.length-times.length)[index] ) : ['0s']
  return timesFormatted.join(' ')
}

export const abbreviateNumber = (value: any, decimals: number = 2, maxPrecision: number = 5, minPrecision: number = 0) => {

  const isNegative = parseFloat(value) < 0;
  let newValue: any = BNify(value).abs();
  const suffixes = ["", "K", "M", "B", "T"];
  let suffixNum = 0;
  while (newValue.gte(1000)) {
    newValue = newValue.div(1000);
    suffixNum++;
  }

  maxPrecision = Math.max(1, maxPrecision);

  // Prevent decimals on integer number
  if (value >= 1000) {
    const decimalPart = decimals ? newValue.mod(1).toFixed(maxPrecision).substr(2, decimals) : null;
    newValue = parseInt(newValue).toString() + (decimalPart ? '.' + decimalPart : '');
  } else {
    newValue = newValue.toFixed(decimals);
  }

  // Adjust number precision
  if (newValue >= 1 && (newValue.length - 1) > maxPrecision) {
    newValue = parseFloat(newValue).toPrecision(maxPrecision);
  } else if ((newValue.length - 1) < minPrecision) {
    const difference = minPrecision - (newValue.length - 1);
    const append = BNify(value).abs().toString().replace('.', '').substr((newValue.length - 1), difference);
    newValue += append;
  }

  // Add minus if number is negative
  if (isNegative) {
    newValue = '-' + newValue;
  }

  const suffix = suffixNum>=suffixes.length ? '' : suffixes[suffixNum].toLowerCase();
  newValue += suffix;

  return newValue;
}

export const isEmpty = (object: any) => {
  return !object || !Object.keys(object).length
}

export const getTimestampRange = (startDate: (Date | number | string), endDate: (Date | number | string)) => {
  const startDayTimestamp = +(dayjs(startDate).startOf('day').valueOf())
  const endDayTimestamp = +(dayjs(endDate).startOf('day').valueOf())

  const dayTimestamp = 86400000
  const days = Math.ceil((endDayTimestamp-startDayTimestamp)/dayTimestamp)

  if (isBigNumberNaN(days)) return []

  return Array.from(Array(days+1).keys()).map( (dayIndex: number) => {
    return +(dayjs(startDayTimestamp+(dayTimestamp*dayIndex)).startOf('day').valueOf())
  })
}

export const catchPromise = async (promise: Promise<any>) => {
  return promise
    .then(data => data)
    .catch(err => null)
}

export const asyncForEach = async (array: any[], callback: Function, async: boolean = true) => {
  let output = [];
  if (async) {
    output = await Promise.all(array.map((c, index) => {
      return callback(c, index, array);
    }));
  } else {
    for (let index = 0; index < array.length; index++) {
      output.push(await callback(array[index], index, array));
    }
  }
  return output;
}

export const sortArrayByKey = (array: any[], key: string, order: string = 'asc') => {
  const val1 = order === 'asc' ? -1 : 1
  const val2 = order === 'asc' ? 1 : -1
  return array.sort((a, b) => (parseInt(a[key]) < parseInt(b[key]) ? val1 : val2));
}

export const shortenHash = (hash: string, startLen: number = 7, endLen: number = 4) => {
  let shortHash = hash;
  const txStart = shortHash.substr(0, startLen);
  const txEnd = shortHash.substr(shortHash.length - endLen);
  shortHash = txStart + "..." + txEnd;
  return shortHash;
}

export const getObjectPath = (object: any, path: string, fallback: any = null): any => {
  const dot = path.indexOf('.');
  
  if (!object || object === undefined) {
    return fallback || undefined;
  }
  
  if (dot === -1) {
    if (path.length && path in object) {
      return object[path];
    }
    return fallback || undefined;
  }
  
  return getObjectPath(object[path.substr(0, dot)], path.substr(dot + 1), fallback);
}