import React from 'react'
import { strategies } from 'constants/strategies'
import { Translation } from 'components/Translation/Translation'
import { TextProps, BoxProps, Box, Flex, Text, HStack } from '@chakra-ui/react'

type StrategyLabelArgs = {
  strategy?: string
} & TextProps

export const StrategyLabel: React.FC<StrategyLabelArgs> = ({ strategy, ...props }) => {
  if (!strategy) return null
  const strategyConfig = strategies[strategy]
  if (!strategyConfig) return null
  return (
    <HStack
      spacing={2}
      alignItems={'center'}
    >
      <Translation component={Text} translation={strategyConfig?.label} textStyle={'ctaStatic'} {...props} />
      <Box
        width={2}
        height={2}
        borderRadius={'50%'}
        bg={strategyConfig.color}
      >
      </Box>
    </HStack>
  )
}