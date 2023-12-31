import { I18n } from 'react-polyglot'
import { getObjectPath } from 'helpers/'
import React, { useContext } from 'react'
import useLocalForge from 'hooks/useLocalForge'
import { translations } from 'constants/translations'
import { InterpolationOptions, transformPhrase } from 'node-polyglot'

const defaultLocale = 'en'

type ContextProps = {
  locale: string
  messages: any
  setLocale: Function
}

const initialState: ContextProps = {
  messages: {},
  locale: defaultLocale,
  setLocale: () => {}
}

const I18nContext = React.createContext<ContextProps>(initialState)

export const useI18nProvider = () => useContext(I18nContext)

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [ locale, setLocale ] = useLocalForge('selectedLocale', defaultLocale)
  const messages = translations[locale]
  const onMissingKey = (key: string, substitutions?: InterpolationOptions) => {
    const translation = getObjectPath(translations[defaultLocale], key)
    return typeof translation === 'string' ? transformPhrase(translation, substitutions) : key
  }
  return (
    <I18nContext.Provider value={{locale, setLocale, messages}}>
      <I18n locale={locale} messages={messages} allowMissing={true} onMissingKey={onMissingKey}>
        {children}
      </I18n>
    </I18nContext.Provider>
  )
}
