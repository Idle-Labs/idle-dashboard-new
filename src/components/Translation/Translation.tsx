import Polyglot from 'node-polyglot'
import { useTranslate } from 'react-polyglot'
import { TextProps, HeadingProps, Text } from '@chakra-ui/react'

type TranslationProps = {
  component?: React.FC,
  prefix?: string
  suffix?: string
  params?: Record<string, any>
  translation: string | null | undefined | [string, number | Polyglot.InterpolationOptions]
} & TextProps & HeadingProps

export const Translation: React.FC<TranslationProps> = ({component, translation, params = {}, prefix='', suffix='', children, ...props}) => {
  const translate = useTranslate()
  const Component = component || Text
  const translatedText = `${prefix}${translate(translation, params)}${suffix}`
  return (
    <Component {...props}>
      {translatedText}
    </Component>
  )
}