import { ProviderProps } from './common/types'
import useLocalForge from 'hooks/useLocalForge'
import { useSearchParams } from 'react-router-dom'
import { useMemo, createContext, useContext, useEffect } from 'react'

export type AuthCodeContextProps = {
  authCode: string | undefined
}

const initialState: AuthCodeContextProps = {
  authCode: undefined
}

const AuthCodeContext = createContext<AuthCodeContextProps>(initialState)

export const useAuthCodeProvider = () => useContext(AuthCodeContext)

export function AuthCodeProvider({ children }: ProviderProps) {
  const searchParams = useSearchParams()
  const [ getSearchParams ] = useMemo(() => searchParams, [searchParams])
  const [ storedAuthCode, setStoredAuthCode, , storedAuthCodeLoaded ] = useLocalForge('authCode', null)
  
  
  // Get selected tab id from search params
  const authCode = useMemo((): string | undefined => {
    const authCode = getSearchParams.get('_authCode')
    if (authCode?.length){
      try {
        return atob(authCode)
      } catch (err){
        return
      }
    }
    return storedAuthCode
  }, [getSearchParams, storedAuthCode])

  // Store AuthCode
  useEffect(() => {
    if (authCode && storedAuthCodeLoaded && authCode !== storedAuthCode){
      setStoredAuthCode(authCode)
    }
  }, [authCode, storedAuthCode, storedAuthCodeLoaded, setStoredAuthCode])

  return (
    <AuthCodeContext.Provider value={{authCode}}>
      {children}
    </AuthCodeContext.Provider>
  )
}
