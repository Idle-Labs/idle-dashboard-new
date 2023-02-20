import { Tag, TextProps } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'

type StrategyTagProps = {
  strategy: string
} & TextProps

export const StrategyTag: React.FC<StrategyTagProps> = ({ strategy, ...textProps }) => {
  return (
    <Translation component={Tag} translation={`strategies.${strategy}.label`} bg={`tags.${strategy}`} color={'primary'} px={4} py={'5px'} {...textProps} />
  )
}