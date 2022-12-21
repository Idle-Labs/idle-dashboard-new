import { lazy } from 'react'
import utc from 'dayjs/plugin/utc'
import BigNumber from 'bignumber.js'
import dayjs, { ManipulateType } from 'dayjs'
import dayOfYear from 'dayjs/plugin/dayOfYear'
import { HistoryTimeframe } from 'constants/types'
import { LEGACY_DASHBOARD_URL } from 'constants/vars'

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
export const normalizeTokenAmount = (tokenBalance: BNifyInput, tokenDecimals: number) => {
  return BNify(tokenBalance).times(`1e${tokenDecimals}`).integerValue(BigNumber.ROUND_FLOOR).toFixed(0);
}
export const fixTokenDecimals = (tokenBalance: BNifyInput, tokenDecimals?: number) => {
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

export const dayDiff = (t1: number, t2: number) => {
  dayjs.extend(dayOfYear)
  return Math.abs(dayjs(t1).dayOfYear()-dayjs(t2).dayOfYear())
}

export const dateDiff = (t1: number, t2: number, unit: any = 'ms', returnDecimals = false) => {
  return Math.abs(dayjs(t1).diff(t2, unit, returnDecimals))
}

export const dateToLocale = (timestamp: number, locale: string) => {
  return dayjs(timestamp).locale(locale).format('LLL')
}

export const formatDate = (timestamp: number | string, format = 'YYYY/MM/DD', isUTC = false) => {
  dayjs.extend(utc)
  const day = dayjs(+timestamp)
  return (isUTC ? day.utc() : day).format(format).concat(isUTC ? ' UTC' : '')
}

export const splitArrayIntoChunks = (array: any, chunkSize: number) => {
  const output = []
  for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      output.push(chunk)
  }
  return output
}

export const hashCode = (s: string): string => {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString();
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

export const sumArray = function (array: Array<any>) {
  return array.reduce(function (pv, cv) { return pv + cv; }, 0);
}

export const maxArray = function (array: Array<any>) {
  return Math.max.apply(null, array);
}

export const avgArray = function (array: Array<any>) {
  return sumArray(array) / array.length;
}

export const abbreviateNumber = (value: any, decimals = 2, maxPrecision = 5, minPrecision = 0) => {

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

export function requestTimeout(callback: Function, delay: number) {
  // Create an object to store the timeout id and state
  const timeout: {id: number | null, stopped: boolean} = {
    id: null,
    stopped: false
  };

  const clear = () => {
    timeout.stopped = true
    if (timeout.id){
      cancelAnimationFrame(timeout.id)
    }
  }

  // Record the start time
  const start = performance.now();

  // Start the animation
  function animate() {
    // If the timeout is stopped, do not continue
    if (timeout.stopped) return;

    // Calculate the elapsed time
    const elapsed = performance.now() - start;

    // If the specified delay has passed, execute the callback
    if (elapsed >= delay) {
      callback();
    } else {
      // Schedule the next frame
      timeout.id = requestAnimationFrame(animate);
    }
  }

  // Start the animation and store the timeout id
  timeout.id = requestAnimationFrame(animate);

  // Return the timeout object
  return {
    id: timeout.id,
    clear
  }
}

export const lazyLoadComponent = (component: string) => {
  return lazy(() => {
    const promise = import(`components/${component}/${component}`)
    return promise.then(module => ({default: module[component]}))
  })
}

export const getLegacyDashboardUrl = (section: string) => {
  return `${LEGACY_DASHBOARD_URL}${section}`
}

export const openWindow = (url: string) => {
  return window.open(url, '_blank', 'noopener');
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
    .catch(/*err => null*/)
}

export const asyncReduce = async <T, U>(
  array: T[],
  callback: (currentValue: T, currentIndex: number) => Promise<any>,
  aggregateFunction: (acc: U, currentValue: U) => U,
  initialValue: U,
): Promise<U> => {
  const promises = array.map(async (currentValue, currentIndex) => {
    return callback(currentValue, currentIndex)
  });
  return Promise.all(promises).then(results => results.reduce((accumulator, currentValue) => aggregateFunction(accumulator, currentValue), initialValue))
}

export const asyncForEach = async (array: any[], callback: Function, asyncEnabled = true) => {
  let output = [];
  if (asyncEnabled) {
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

export const sortArrayByKey = (array: any[], key: string, order = 'asc') => {
  const val1 = order === 'asc' ? -1 : 1
  const val2 = order === 'asc' ? 1 : -1
  return [...array].sort((a, b) => (parseInt(a[key]) < parseInt(b[key]) ? val1 : val2));
}

export const shortenHash = (hash: string, startLen = 7, endLen = 4) => {
  let shortHash = hash;
  const txStart = shortHash.substr(0, startLen);
  const txEnd = shortHash.substr(shortHash.length - endLen);
  shortHash = txStart + "..." + txEnd;
  return shortHash;
}

export const getObjectPath = (object: any, path: string, fallback: any = null): any => {
  if (!path) return undefined
  const dotIndex = path ? path.indexOf('.') : -1;
  
  if (!object || object === undefined) {
    return fallback || undefined;
  }
  
  if (dotIndex === -1) {
    if (path.length && path in object) {
      return object[path];
    }
    return fallback || undefined;
  }
  
  return getObjectPath(object[path.substr(0, dotIndex)], path.substr(dotIndex + 1), fallback);
}

export const sortNumeric = (a: any, b: any, field: any): number => {
  const n1 = BNify(getObjectPath(a.original, field)).isNaN() ? BNify(-1) : BNify(getObjectPath(a.original, field))
  const n2 = BNify(getObjectPath(b.original, field)).isNaN() ? BNify(-1) : BNify(getObjectPath(b.original, field))
  return n1.gt(n2) ? -1 : 1
}

export const sortAlpha = (a: any, b: any, field: any): number => {
  return getObjectPath(a.original, field).localeCompare(getObjectPath(b.original, field))
}
