import Polyglot from 'node-polyglot'
import { useTranslate } from 'react-polyglot'
import { TextProps, HeadingProps, Text } from '@chakra-ui/react'

type TranslationProps = {
  component?: React.FC,
  translation: string | null | undefined | [string, number | Polyglot.InterpolationOptions]
} & TextProps & HeadingProps

export const Translation: React.FC<TranslationProps> = ({component, translation, children, ...props}) => {
  const translate = useTranslate()
  const Component = component || Text
  return (
    <Component {...props}>
      {translate(translation)}
    </Component>
  )
}