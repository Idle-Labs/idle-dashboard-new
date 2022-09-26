import { I18n } from 'react-polyglot'
import React, { useContext } from 'react'
import { getObjectPath } from '../helpers'
import useLocalForge from '../hooks/useLocalForge'
import { translations } from '../constants/translations'
import { InterpolationOptions, transformPhrase } from 'node-polyglot'

const defaultLocale = 'en'

type ContextProps = {
  locale: string
  setLocale: Function
}

const initialState: ContextProps = {
  locale: defaultLocale,
  setLocale: () => {}
}

const I18nContext = React.createContext<ContextProps>(initialState)

export const useI18nProvider = () => useContext(I18nContext)

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [ locale, setLocale ] = useLocalForge('locale', defaultLocale)
  const messages = translations[locale]
  const onMissingKey = (key: string, substitutions?: InterpolationOptions) => {
    const translation = getObjectPath(translations[defaultLocale], key)
    return typeof translation === 'string' ? transformPhrase(translation, substitutions) : key
  }
  return (
    <I18nContext.Provider value={{locale, setLocale}}>
      <I18n locale={locale} messages={messages} allowMissing={true} onMissingKey={onMissingKey}>
        {children}
      </I18n>
    </I18nContext.Provider>
  )
}
