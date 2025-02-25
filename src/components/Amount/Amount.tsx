import React, { isValidElement } from 'react'
import type { NumberType } from 'constants/types'
import { Text, TextProps, HStack, StackProps } from '@chakra-ui/react'
import { BNify, abbreviateNumber, numberToPercentage, isBigNumberNaN, formatMoney, formatNumber } from 'helpers/'

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
  formatOptions?: Intl.NumberFormatOptions
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
  formatOptions,
  stackProps = {},
  abbreviate = true,
  abbreviateThresold,
  ...props
}: AmountProps) => {
  const checkThreshold = !abbreviateThresold || (value && !isBigNumberNaN(value) && Number(value)>=abbreviateThresold)
  // let parsedValue = isBigNumberNaN(value) ? '-' : (typeof value === 'string' && isNaN(parseFloat(value)) ? value : (abbreviate && checkThreshold ? abbreviateNumber(value, decimals, maxPrecision, minPrecision) : (decimals ? BNify(value).toFixed(decimals) : value)))

  // Add minus sign in prefix
  // if (BNify(parsedValue).lt(0)){
  //   prefix=`-${prefix}`
  //   parsedValue = Math.abs(parsedValue)
  // }

  let parsedValue: string | number = Number(value)

  if (!isNaN(parsedValue)){
    parsedValue = formatNumber(parsedValue, decimals, {
      ...formatOptions,
      notation: abbreviate ? 'compact' : 'standard'
    })
  } else {
    parsedValue = '-'
  }

  const showPrefixSuffix = parsedValue.toString().length>0 && parsedValue !== '-'

  // if (!abbreviate && !BNify(parsedValue).isNaN() && BNify(parsedValue).gte(1000)){
  //   parsedValue = formatNumber(+parsedValue, decimals, formatOptions)
  // } else if (!BNify(parsedValue).isNaN() && decimals !== undefined) {
  //   parsedValue = formatNumber(+parsedValue, decimals, formatOptions)
  // }

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
    <Text {...props}>{parsedValue}</Text>
  )
}

export const Usd: React.FC<AmountProps> = ({
  value,
  prefix = '',
  decimals = 2,
  ...props
}) => {
  return (
    <Amount value={value} prefix={prefix} decimals={decimals} {...props} formatOptions={{style: "currency", currency: "USD"}} />
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