import React from 'react'
import type { Number } from 'constants/types'
import { Text, TextProps } from '@chakra-ui/react'
import { abbreviateNumber, numberToPercentage, isBigNumberNaN } from 'helpers/'

export type AmountProps = {
  value?: Number
  prefix?: string | React.ReactElement
  suffix?: string | React.ReactElement
  decimals?: number
  abbreviate?: boolean
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
  ...props
}: AmountProps) => {
  const parsedValue = isBigNumberNaN(value) ? '-' : (typeof value === 'string' ? value : (abbreviate ? abbreviateNumber(value, decimals) : value))
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
    <Amount value={parsedValue} {...props} />
  )
}

export const Usd: React.FC<AmountProps> = ({
  value,
  ...props
}) => {
  return (
    <Amount value={value} prefix={'$'} {...props} />
  )
}

Amount.Usd = Usd
Amount.Percentage = Percentage