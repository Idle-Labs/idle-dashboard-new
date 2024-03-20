import React, { isValidElement } from 'react'
import type { NumberType } from 'constants/types'
import { Text, TextProps, HStack, StackProps } from '@chakra-ui/react'
import { BNify, abbreviateNumber, numberToPercentage, isBigNumberNaN, formatMoney } from 'helpers/'

export type AmountProps = {
  stackProps?: StackProps
  value?: NumberType | null
  prefix?: string | React.ReactElement
  suffix?: string | React.ReactElement
  decimals?: number
  abbreviate?: boolean
  maxPrecision?: number
  minPrecision?: number
  abbreviateThresold?: number
} & TextProps

export type PercentageProps = {
  maxValue?: number
  minValue?: number
} & AmountProps

export const Amount = ({
  value,
  prefix = '',
  suffix = '',
  decimals,
  maxPrecision,
  minPrecision,
  stackProps = {},
  abbreviate = true,
  abbreviateThresold,
  ...props
}: AmountProps) => {
  const checkThreshold = !abbreviateThresold || (value && !isBigNumberNaN(value) &&  value>=abbreviateThresold)
  let parsedValue = isBigNumberNaN(value) ? '-' : (typeof value === 'string' && isNaN(parseFloat(value)) ? value : (abbreviate && checkThreshold ? abbreviateNumber(value, decimals, maxPrecision, minPrecision) : (decimals ? BNify(value).toFixed(decimals) : value)))

  const showPrefixSuffix = parsedValue.toString().length>0 && parsedValue !== '-'

  // Add minus sign in prefix
  if (BNify(parsedValue).lt(0)){
    prefix=`-${prefix}`
    parsedValue = Math.abs(parsedValue)
  }

  if (!abbreviate && !BNify(parsedValue).isNaN() && BNify(parsedValue).gte(1000)){
    parsedValue = formatMoney(+parsedValue, decimals)
  } else if (!BNify(parsedValue).isNaN() && decimals !== undefined) {
    parsedValue = BNify(parsedValue).toFixed(decimals)
  }

  const showPrefix = showPrefixSuffix && !!prefix
  const showSuffix = showPrefixSuffix && !!suffix
  const prefixIsString = typeof prefix === 'string'
  const suffixIsString = typeof suffix === 'string'
  const prefixIsElement = isValidElement(prefix)
  const suffixIsElement = isValidElement(suffix)

  return (
    <HStack
      spacing={0}
      alignItems={'baseline'}
      {...stackProps}
    >
      {showPrefix && prefixIsElement ? prefix : null}
      <Text {...props}>
        {`${showPrefix && prefixIsString ? prefix : ''}${parsedValue.toString()}${showSuffix && suffixIsString ? suffix : ''}`}
      </Text>
      {showSuffix && suffixIsElement ? suffix : null}
    </HStack>
  )
}

export const Percentage: React.FC<PercentageProps> = ({
  value,
  decimals,
  minValue = 0,
  maxValue = 9999,
  ...props
}) => {
  const parsedValue = numberToPercentage(value, decimals, maxValue, minValue)
  return (
    <Amount abbreviate={false} value={parsedValue} {...props} />
  )
}

export const Usd: React.FC<AmountProps> = ({
  value,
  prefix = '',
  decimals = 2,
  ...props
}) => {
  prefix = isBigNumberNaN(value) ? '' : `${prefix.replace(/\$/,'')}$`
  // Check minus values
  if (!isBigNumberNaN(value) && BNify(value).lt(0)){
    // Show minus sign if parsed value is lower than 0.01
    if (BNify(value).lte(-0.01)){
      prefix = `-${prefix}`
    }
    value = BNify(value).abs()
  }
  return (
    <Amount value={value} prefix={prefix} decimals={decimals} {...props} />
  )
}

export const Int: React.FC<AmountProps> = ({
  value,
  ...props
}) => {
  return (
    <Amount value={value} decimals={0} {...props} />
  )
}

Amount.Usd = Usd
Amount.Int = Int
Amount.Percentage = Percentage