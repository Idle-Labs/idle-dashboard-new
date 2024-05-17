import { useTranslate } from 'react-polyglot'
import { FlexProps, TextProps, HeadingProps, Text } from '@chakra-ui/react'

type DefaultProps = TextProps & HeadingProps

export type TranslationProps<T = DefaultProps> = {
  component?: any,
  prefix?: string
  suffix?: string
  joinChar?: string
  isHtml?: boolean
  leaveEmpty?: boolean
  params?: Record<string, any>
  translation: string | null | undefined | [string, number] | string[]
  children?: FlexProps["children"]
} & T

export const Translation = <T = void>({
  component,
  translation,
  params = {},
  prefix = '',
  suffix = '',
  joinChar = ' ',
  isHtml = false,
  leaveEmpty = false,
  children,
  ...props
}: TranslationProps<T>) => {
  const translate = useTranslate()
  const Component = component || Text

  const translations: any[] = Array.isArray(translation) ? translation : [translation]
  const translatedTexts = translations.reduce((translatedTexts: string[], key: string) => {
    const translation = translate(key, params)
    if (leaveEmpty && translation === key) return translatedTexts
    return [
      ...translatedTexts,
      translation
    ]
  }, [])
  const translatedText = translatedTexts.join(joinChar)

  const formattedText = `${prefix}${translatedText}${suffix}`
  return isHtml ? (
    <Component {...props} dangerouslySetInnerHTML={{ __html: formattedText }} />
  ) : children ? (
    <Component {...props}>
      {children}
    </Component>
  ) : (
    <Component {...props}>
      {formattedText}
    </Component>
  )
}