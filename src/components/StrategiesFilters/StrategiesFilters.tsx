import React from 'react'
import { HStack, Button } from '@chakra-ui/react'
import { strategies } from 'constants/strategies'
import { useThemeProvider } from 'contexts/ThemeProvider'
// import { useWalletProvider } from 'contexts/WalletProvider'
import { StrategyLabel } from 'components/StrategyLabel/StrategyLabel'
import { useUserHasFunds } from 'hooks/useUserHasFunds/useUserHasFunds'

type StrategiesFiltersType = {
  showOnMobile?: boolean
  checkUserFunds?: boolean
  toggleStrategy: Function
  selectedStrategies?: string[]
  availableStrategies?: string[]
}

export const StrategiesFilters: React.FC<StrategiesFiltersType> = ({ checkUserFunds = false, showOnMobile = true, toggleStrategy, availableStrategies, selectedStrategies }) => {
  const userHasFunds = useUserHasFunds()
  const { isMobile } = useThemeProvider()

  if (checkUserFunds && !userHasFunds) return null
  if (!showOnMobile && isMobile) return null

  return (
    <HStack
      spacing={3}
    >
      {
        (availableStrategies || Object.keys(strategies)).filter( strategy => strategies[strategy].visible ).map( (strategy: string) => {
          return (
            <Button
              minW={'180px'}
              variant={'filter'}
              key={`strategy_${strategy}`}
              onClick={() => toggleStrategy(strategy)}
              aria-selected={selectedStrategies?.includes(strategy)}
            >
              <StrategyLabel
                color={'primary'}
                strategy={strategy}
              />
            </Button>
          )
        })
      }
    </HStack>
  )
}