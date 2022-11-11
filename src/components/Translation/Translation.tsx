import Polyglot from 'node-polyglot'
import { useTranslate } from 'react-polyglot'
import { TextProps, HeadingProps, Text } from '@chakra-ui/react'

type DefaultProps = TextProps & HeadingProps

export type TranslationProps<T = DefaultProps> = {
  component?: React.FC,
  prefix?: string
  suffix?: string
  params?: Record<string, any>
  translation: string | null | undefined | [string, number | Polyglot.InterpolationOptions]
} & T

export const Translation = <T = void>({
  component,
  translation,
  params = {},
  prefix='',
  suffix='',
  ...props
}: TranslationProps<T>) => {
  const translate = useTranslate()
  const Component = component || Text
  const translatedText = `${prefix}${translate(translation, params)}${suffix}`
  return (
    <Component {...props}>
      {translatedText}
    </Component>
  )
}