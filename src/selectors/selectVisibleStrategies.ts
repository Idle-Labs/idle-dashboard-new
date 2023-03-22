import { strategies } from 'constants/strategies'

export function selectVisibleStrategies(){
  return Object.keys(strategies).filter( strategy => strategies[strategy].visible )
}