import { BigNumber } from 'bignumber.js'
import { BNify, bnOrZero, integerValue } from 'helpers/'
import { NumberType, MAX_STAKING_SECONDS } from 'constants/'
import { STAKING_FEE_DISCOUNTS } from 'constants/stakingFeeDiscounts'

export function getFeeDiscount(stkIDLEamount: NumberType | null): BigNumber {
  const feeDiscountTierAmount: string | undefined = Object.keys(STAKING_FEE_DISCOUNTS).reverse().find( tierAmount => BNify(tierAmount).lte(bnOrZero(stkIDLEamount)) )
  if (feeDiscountTierAmount){
    return BNify(STAKING_FEE_DISCOUNTS[+feeDiscountTierAmount as number])
  }
  return BNify(0)
}

export function getStakingPower(lockEndTime: NumberType | null, startTime?: NumberType | null): BigNumber {
  if (!startTime){
    startTime = BNify(Date.now()).div(1000)
  }
  const stakingDurationSeconds = BigNumber.maximum(0, BNify(lockEndTime).minus(integerValue(startTime)))
  return stakingDurationSeconds.div(MAX_STAKING_SECONDS)
}

export function getStkIDLE(amount: NumberType | null, stakingPower: NumberType | null): BigNumber {
  return bnOrZero(amount).times(bnOrZero(stakingPower))
}