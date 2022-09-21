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