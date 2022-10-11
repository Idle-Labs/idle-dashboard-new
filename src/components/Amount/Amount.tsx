import React from 'react'
import type { Number } from 'constants/types'
import { abbreviateNumber, BNify } from 'helpers/'
import { Text, TextProps } from '@chakra-ui/react'

type AmountProps = {
  value: Number
  prefix?: string | React.ReactElement
  suffix?: string | React.ReactElement
  maxDecimals?: number
  abbreviated?: boolean
} & TextProps

type PercentageProps = {
  maxValue?: number
} & AmountProps

export const Amount = ({
  value,
  prefix = '',
  suffix = '',
  maxDecimals,
  abbreviated = true,
  ...props
}: AmountProps) => {
  const parsedValue = typeof value === 'string' ? value : (abbreviated ? abbreviateNumber(value, maxDecimals) : value)
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
  const parsedValue = maxValue && BNify(value).gt(maxValue) ? `>${maxValue}` : value
  return (
    <Amount suffix={'%'} value={parsedValue} {...props} />
  )
}

Amount.Percentage = Percentage