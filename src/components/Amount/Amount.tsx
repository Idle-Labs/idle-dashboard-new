import React from 'react'
import type { Number } from 'constants/types'
import { Text, TextProps } from '@chakra-ui/react'
import { abbreviateNumber, numberToPercentage, isBigNumberNaN } from 'helpers/'

type AmountProps = {
  value?: Number
  prefix?: string | React.ReactElement
  suffix?: string | React.ReactElement
  maxDecimals?: number
  abbreviate?: boolean
} & TextProps

type PercentageProps = {
  maxValue?: number
} & AmountProps

export const Amount = ({
  value,
  prefix = '',
  suffix = '',
  maxDecimals,
  abbreviate = true,
  ...props
}: AmountProps) => {
  const parsedValue = isBigNumberNaN(value) ? '-' : (typeof value === 'string' ? value : (abbreviate ? abbreviateNumber(value, maxDecimals) : value))
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

Amount.Percentage = Percentage