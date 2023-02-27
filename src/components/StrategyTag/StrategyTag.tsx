import { Tag, TextProps } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'

type StrategyTagProps = {
  strategy: string | undefined
} & TextProps

export const StrategyTag: React.FC<StrategyTagProps> = ({ strategy, ...textProps }) => {
  if (!strategy) return null
  return (
    <Translation
      px={4}
      py={'5.5px'}
      component={Tag}
      fontWeight={600}
      color={'primary'}
      bg={`tags.${strategy}`}
      translation={`strategies.${strategy}.label`}
      {...textProps}
    />
  )
}