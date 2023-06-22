import { lazy } from 'react'
import dayjs from 'classes/dayjs'
import BigNumber from 'bignumber.js'
import { Dayjs, ManipulateType } from 'dayjs'
import { HistoryTimeframe, DateRange } from 'constants/types'

type BNifyInput = any

export const BNify = (s: BNifyInput): BigNumber => new BigNumber(typeof s === 'object' ? s : String(s))

export function bnOrZero(n: BNifyInput): BigNumber {
  const value = BNify(n || 0)
  return value.isFinite() ? value : BNify(0)
}

export function integerValue(value: BNifyInput) :string {
  return BNify(value).integerValue(BigNumber.ROUND_FLOOR).toFixed(0);
}
export function normalizeTokenDecimals(tokenDecimals: number): BigNumber {
  return BNify(`1e${tokenDecimals}`);
}
export function normalizeTokenAmount(tokenBalance: BNifyInput, tokenDecimals: number) {
  return BNify(tokenBalance).times(`1e${tokenDecimals}`).integerValue(BigNumber.ROUND_FLOOR).toFixed(0);
}
export function fixTokenDecimals(tokenBalance: BNifyInput, tokenDecimals?: number) {
  if (!tokenDecimals) {
    return BNify(tokenBalance);
  }
  return BNify(tokenBalance).div(`1e${tokenDecimals}`);
}

export function hexToRgb(hex: string): number[]{
  const aRgbHex = hex.replace(/^#/,'').match(/.{1,2}/g)
  return [
    parseInt(aRgbHex?.[0]||'0', 16),
    parseInt(aRgbHex?.[1]||'0', 16),
    parseInt(aRgbHex?.[2]||'0', 16)
  ]
}

export function downloadFile(content: any, fileName: string = 'export.csv') {
  const file = new File([content as BlobPart], fileName, {
    type: 'text/plain',
  })

  const link = document.createElement('a')
  const url = URL.createObjectURL(file)

  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function apr2apy(apr: BNifyInput) {
  return BNify((BNify(1).plus(BNify(apr).div(365))).pow(365).minus(1).toFixed(18));
}

export function removeItemFromArray<T>(arr: T[], item: T): T[] {
  const index = arr.indexOf(item);
  if (index !== -1) {
    arr.splice(index, 1);
  }
  return arr;
}

export function isBigNumberNaN(amount: any) {
  const isNull = amount === null
  const isUndefined = amount === undefined
  const isBigNumber = amount instanceof BigNumber
  return isNull || isUndefined || (isBigNumber && BNify(amount).isNaN())
}

export function numberToPercentage(value: any, decimals = 2, maxValue = 9999, minValue = 0) {
  const isOverMaxValue = maxValue && BNify(value).gt(maxValue)
  const isBelowMinValue = minValue && BNify(value).lt(minValue)
  return isBigNumberNaN(value) ? '-' : (isOverMaxValue ? `>${maxValue}` : (isBelowMinValue ? `<${minValue}` : BNify(value).toFixed(decimals)))+'%'
}

export function getTimeframeTimestamp(timeframe: HistoryTimeframe): number {
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

export function getChartTimestampBounds(timeframe?: HistoryTimeframe, dateRange?: DateRange): number[] {
  const startTimestamp = dateRange?.startDate ? dateRange.startDate.startOf('day').valueOf() : (timeframe ? getTimeframeTimestamp(timeframe) : 0)
  const endTimestamp = dateRange?.endDate ? dateRange.endDate.endOf('day').valueOf() : 0
  return [startTimestamp, endTimestamp]
}

export function dayMax(d1: Dayjs, d2: Dayjs) {
  return dayjs.max(d1, d2)
}

export function dayMin(d1: Dayjs, d2: Dayjs) {
  return dayjs.min(d1, d2)
}

export function dayDiff(t1: number, t2: number) {
  return Math.abs(dayjs(t1).dayOfYear()-dayjs(t2).dayOfYear())
}

export function dateDiff(t1: number, t2: number, unit: any = 'ms', returnDecimals = false) {
  return Math.abs(dayjs(t1).diff(t2, unit, returnDecimals))
}

export function toDayjs(timestamp?: Date | number | string) {
  return dayjs(timestamp)
}

export function dateToLocale (timestamp: number, locale: string) {
  return dayjs(timestamp).locale(locale).format('LLL')
}

export function formatMoney (amount: number, decimalCount = 2, decimal = ".", thousands = ","): string | null {
  try {
    decimalCount = Math.abs(decimalCount);
    decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

    const negativeSign = amount < 0 ? "-" : "";

    // @ts-ignore
    let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
    let j = (i.length > 3) ? i.length % 3 : 0;

    // @ts-ignore
    return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
  } catch (e) {
    return null;
  }
}

export function formatDate (timestamp: number | string, format = 'YYYY/MM/DD', isUTC = false) {
  const day = dayjs(+timestamp)
  return (isUTC ? day.utc() : day).format(format).concat(isUTC ? ' UTC' : '')
}

export function splitArrayIntoChunks (array: any, chunkSize: number) {
  const output = []
  for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      output.push(chunk)
  }
  return output
}

export function hashCode (s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString();
}

export function formatTime (seconds: any) {
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

export function sumArray (array: Array<any>) {
  return array.reduce(function (pv, cv) { return pv + cv; }, 0);
}

export function maxArray (array: Array<any>) {
  return Math.max.apply(null, array);
}

export function avgArray (array: Array<any>) {
  return sumArray(array) / array.length;
}

export function abbreviateNumber (value: any, decimals = 2, maxPrecision = 5, minPrecision = 0) {

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

export async function asyncWait(duration: number) {
  return new Promise(resolve => setTimeout(resolve, duration));
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

export function checkAddress(address: string) {
  return address && /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function cmpAddrs(addr1: string, addr2: string) {
  return addr1.toLowerCase() === addr2.toLowerCase()
}

export function lazyLoadComponent(component: string) {
  return lazy(() => {
    const promise = import(`components/${component}/${component}`)
    return promise.then(module => ({default: module[component]}))
  })
}

export function isEmpty (object: any) {
  return !object || !Object.keys(object).length
}

export function getTimestampRange (startDate: (Date | number | string), endDate: (Date | number | string)) {
  const startDayTimestamp = +(dayjs(startDate).startOf('day').valueOf())
  const endDayTimestamp = +(dayjs(endDate).startOf('day').valueOf())

  const dayTimestamp = 86400000
  const days = Math.ceil((endDayTimestamp-startDayTimestamp)/dayTimestamp)

  if (isBigNumberNaN(days)) return []

  return Array.from(Array(days+1).keys()).map( (dayIndex: number) => {
    return +(dayjs(startDayTimestamp+(dayTimestamp*dayIndex)).startOf('day').valueOf())
  })
}

export async function catchPromise (promise: Promise<any>) {
  return promise
    .then(data => data)
    .catch(/*err => null*/)
}

export async function asyncReduce <T, U>(
  array: T[],
  callback: (currentValue: T, currentIndex: number) => Promise<any>,
  aggregateFunction: (acc: U, currentValue: U) => U,
  initialValue: U,
): Promise<U> {
  const promises = array.map(async (currentValue, currentIndex) => {
    return callback(currentValue, currentIndex)
  });
  return Promise.all(promises).then(results => results.reduce((accumulator, currentValue) => aggregateFunction(accumulator, currentValue), initialValue))
}

export async function asyncForEach (array: any[], callback: Function, asyncEnabled = true) {
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

export function sortArrayByKey(array: any[], key: string, order = 'asc') {
  const val1 = order === 'asc' ? -1 : 1
  const val2 = order === 'asc' ? 1 : -1
  return [...array].sort((a, b) => (parseInt(a[key]) < parseInt(b[key]) ? val1 : val2));
}

export function shortenHash(hash: string, startLen = 7, endLen = 4) {
  let shortHash = hash;
  const txStart = shortHash.substr(0, startLen);
  const txEnd = shortHash.substr(shortHash.length - endLen);
  shortHash = txStart + "..." + txEnd;
  return shortHash;
}

export function getObjectPath(object: any, path: string, fallback: any = null): any {
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

export function sortNumeric(a: any, b: any, field: any): number {
  const n1 = BNify(getObjectPath(a.original, field)).isNaN() ? BNify(-1) : BNify(getObjectPath(a.original, field))
  const n2 = BNify(getObjectPath(b.original, field)).isNaN() ? BNify(-1) : BNify(getObjectPath(b.original, field))
  return n1.gt(n2) ? -1 : 1
}

export function sortAlpha(a: any, b: any, field: any): number {
  return getObjectPath(a.original, field).localeCompare(getObjectPath(b.original, field))
}
