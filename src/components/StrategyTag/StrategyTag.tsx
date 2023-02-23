import { Tag, TextProps } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'

type StrategyTagProps = {
  strategy: string | undefined
} & TextProps

export const StrategyTag: React.FC<StrategyTagProps> = ({ strategy, ...textProps }) => {
  if (!strategy) return null
  return (
    <Translation component={Tag} translation={`strategies.${strategy}.label`} bg={`tags.${strategy}`} fontWeight={600} color={'primary'} px={4} py={'5px'} {...textProps} />
  )
}