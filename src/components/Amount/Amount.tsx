import React from 'react'
import type { Number } from 'constants/types'
import { Text, TextProps } from '@chakra-ui/react'
import { BNify, abbreviateNumber, numberToPercentage, isBigNumberNaN } from 'helpers/'

export type AmountProps = {
  value?: Number | null
  prefix?: string | React.ReactElement
  suffix?: string | React.ReactElement
  decimals?: number
  abbreviate?: boolean
  abbreviateThresold?: number
} & TextProps

export type PercentageProps = {
  maxValue?: number
} & AmountProps

export const Amount = ({
  value,
  prefix = '',
  suffix = '',
  decimals,
  abbreviate = true,
  abbreviateThresold,
  ...props
}: AmountProps) => {
  const checkThreshold = !abbreviateThresold || (value && !isBigNumberNaN(value) &&  value>=abbreviateThresold)
  const parsedValue = isBigNumberNaN(value) ? '-' : (typeof value === 'string' && isNaN(parseFloat(value)) ? value : (abbreviate && checkThreshold ? abbreviateNumber(value, decimals) : (decimals ? BNify(value).toFixed(decimals) : value)))
  // console.log('parsedValue', typeof value, decimals, parsedValue)

  const showPrefixSuffix = parsedValue.toString().length>0 && parsedValue !== '-'
  return (
    <Text {...props}>
      {showPrefixSuffix && (prefix || '')}
      {parsedValue.toString()}
      {showPrefixSuffix && (suffix || '')}
    </Text>
  )
}

export const Percentage: React.FC<PercentageProps> = ({
  value,
  maxValue = 9999,
  ...props
}) => {
  const parsedValue = numberToPercentage(value)
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