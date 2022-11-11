import React from 'react'
import type { Number } from 'constants/types'
import { Text, TextProps } from '@chakra-ui/react'
import { BNify, abbreviateNumber, numberToPercentage, isBigNumberNaN } from 'helpers/'

export type AmountProps = {
  value?: Number
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
  const parsedValue = isBigNumberNaN(value) ? '-' : /*(typeof value === 'string' ? value : */(abbreviate && checkThreshold ? abbreviateNumber(value, decimals) : (decimals ? BNify(value).toFixed(decimals) : value))
  // console.log('parsedValue', typeof value, decimals, parsedValue)
  return (
    <Text {...props}>
      {prefix}
      {parsedValue.toString()}
      {suffix}
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
  decimals = 2,
  ...props
}) => {
  return (
    <Amount value={value} prefix={'$'} decimals={decimals} {...props} />
  )
}

Amount.Usd = Usd
Amount.Percentage = Percentage