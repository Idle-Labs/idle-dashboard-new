import BigNumber from 'bignumber.js';

type BNifyInput = any

export const BNify = (s:BNifyInput): BigNumber => new BigNumber(typeof s === 'object' ? s : String(s))

export const integerValue = (value:BNifyInput) :string => {
  return BNify(value).integerValue(BigNumber.ROUND_FLOOR).toFixed(0);
}
export const normalizeTokenDecimals = (tokenDecimals: number): BigNumber => {
  return BNify(`1e${tokenDecimals}`);
}
export const normalizeTokenAmount = (tokenBalance: BNifyInput, tokenDecimals: number, round: boolean = true) => {
  const normalizedTokenDecimals = normalizeTokenDecimals(tokenDecimals);
  return BNify(tokenBalance).times(normalizedTokenDecimals).integerValue(BigNumber.ROUND_FLOOR).toFixed(0);
}
export const fixTokenDecimals = (tokenBalance: BNifyInput, tokenDecimals: number, exchangeRate?: BNifyInput) => {
  if (!tokenDecimals) {
    return BNify(tokenBalance);
  }
  const normalizedTokenDecimals = normalizeTokenDecimals(tokenDecimals);
  let balance = BNify(tokenBalance).div(normalizedTokenDecimals);
  if (exchangeRate && !exchangeRate.isNaN()) {
    balance = balance.times(exchangeRate);
  }
  return balance;
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
  
  if (object === undefined) {
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