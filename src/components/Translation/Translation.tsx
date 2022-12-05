import { useTranslate } from 'react-polyglot'
import { TextProps, HeadingProps, Text } from '@chakra-ui/react'

type DefaultProps = TextProps & HeadingProps

export type TranslationProps<T = DefaultProps> = {
  component?: React.FC,
  prefix?: string
  suffix?: string
  joinChar?: string
  params?: Record<string, any>
  translation: string | null | undefined | [string, number] | string[]
} & T

export const Translation = <T = void>({
  component,
  translation,
  params = {},
  prefix='',
  suffix='',
  joinChar=' ',
  ...props
}: TranslationProps<T>) => {
  const translate = useTranslate()
  const Component = component || Text

  const translations: any[] = Array.isArray(translation) ? translation : [translation]
  const translatedTexts = translations.reduce( (translatedTexts: string[], key: string) => {
    return [
      ...translatedTexts,
      translate(key, params)
    ]
  }, [])
  const translatedText = translatedTexts.join(joinChar)

  const formattedText = `${prefix}${translatedText}${suffix}`
  return (
    <Component {...props}>
      {formattedText}
    </Component>
  )
}