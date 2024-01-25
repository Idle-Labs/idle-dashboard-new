import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import useLocalForge from 'hooks/useLocalForge'
import { MdOutlineRefresh } from 'react-icons/md'
import { ReducerActionTypes } from 'constants/types'
import { useI18nProvider } from 'contexts/I18nProvider'
import { useWeb3Provider } from 'contexts/Web3Provider'
import { useCacheProvider } from 'contexts/CacheProvider'
import type { ProviderProps } from 'contexts/common/types'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'
import { saveSignature, checkSignature, verifySignature } from 'helpers/'
import React, { useState, useMemo, useReducer, useCallback, useEffect } from 'react'
import { Center, Heading, Button, HStack, VStack, Checkbox, Box, Spinner, Image } from '@chakra-ui/react'

type InitialState = Record<string, boolean>

export const AuthWall = ({ children }: ProviderProps) => {
  const translate = useTranslate()
  const { web3 } = useWeb3Provider()
  const { messages } = useI18nProvider()
  const cacheProvider = useCacheProvider()
  const [ sending, setSending ] = useState<boolean>(false)
  const { account, prevAccount, disconnect } = useWalletProvider()
  const [ storedSignature, setStoredSignature ] = useState<any>(null)
  const [ signatureCheckError, setSignatureCheckError ] = useState<boolean>(false)
  const [ lastCheckTimestamp, setLastCheckTimestamp ] = useState<number | null>(null)
  const [ signatureTimestamp, setSignatureTimestamp ] = useState<string | null>(null)

  const initialState: InitialState = useMemo(() => Object.keys(messages.authWall.options).reduce( (initialState, optionKey) => {
    return {
      ...initialState,
      [optionKey]: false
    }
  }, {}), [messages])

  const reducer = useCallback((state: InitialState, action: ReducerActionTypes) => {
    switch (action.type){
      case 'TOGGLE_OPTION':
        return {
          ...state,
          [action.payload.optionKey]: !state[action.payload.optionKey]
        }
      default:
        return {
          ...state
        }
    }
  }, [])

  const messageToSign = useMemo(() => {
    const texts = [translate('authWall.signature_title'), translate('authWall.subtitle')]
    Object.keys(messages.authWall.options).forEach( optionKey => {
      texts.push('- '+translate(`authWall.options.${optionKey}`))
    })
    return texts.join("\n")
  }, [messages, translate])

  // Get store signature
  useEffect(() => {
    if (!cacheProvider || !account?.address || !web3) return
    ;(async() => {
      // Get and verify stored signature
      const storedSignatureData = await cacheProvider.getCachedUrl(`signature_${account.address}`)
      if (storedSignatureData){
        const storedSignatureVerified = await verifySignature(web3, account?.address, messageToSign, storedSignatureData.data.signature)
        if (storedSignatureVerified){
          setStoredSignature(storedSignatureData.data)
        } else {
          cacheProvider.removeCachedUrl(`signature_${account.address}`)
        }
      }
    })()
  }, [web3, account, cacheProvider, setStoredSignature, messageToSign])

  const [ state, dispatch ] = useReducer(reducer, initialState)

  const accountChanged = useMemo(() => {
    return !!account && !!prevAccount && account.address !== prevAccount.address
  }, [account, prevAccount])

  const canContinue = useMemo(() => {
    return Object.values(state).filter( v => v === false ).length === 0
  }, [state])

  // TODO: Send signature to server if not saved

  const sendSignature = useCallback(async (signature: string) => {
    if (!account?.address) return;
    const response = await saveSignature(account.address, signature);

    if (cacheProvider){
      const dataToStore = {timestamp: Date.now(), signature, saved: !!response}
      cacheProvider.saveData(`signature_${account.address}`, dataToStore, null)
      setStoredSignature(dataToStore)
    }
  }, [account, cacheProvider])

  const getSignatureTimestamp = useCallback(async () => {
    if (!account?.address || !web3) return;
    const signature = await checkSignature(account?.address as string)
    
    setSignatureCheckError(false)
    setLastCheckTimestamp(Date.now())

    // Signature not retrieved
    if (!signature){

      // Check stored signature before thwowing errors
      const storedSignatureVerified = storedSignature && await verifySignature(web3, account?.address, messageToSign, storedSignature.signature)
      if (storedSignatureVerified){
        return setSignatureTimestamp(storedSignature?.timestamp)
      }

      return setSignatureCheckError(true)
    }

    if (signature?.timestamp){
      setSignatureTimestamp(signature?.timestamp)
    }

  }, [web3, account?.address, storedSignature, messageToSign, setSignatureTimestamp, setLastCheckTimestamp, setSignatureCheckError])

  const signAndSend = useCallback(async () => {
    if (!account?.address || !web3) return;

    setSending(true)

    try {
      // @ts-ignore
      const signature = await web3.eth.personal.sign(messageToSign, account.address)
      if (signature){
        await sendSignature(signature)
        getSignatureTimestamp()
      }
    } catch (err){
    } finally {
      setSending(false)
    }
  }, [web3, account, messageToSign, sendSignature, setSending, getSignatureTimestamp])

  // Check signature
  useEffect(() => {
    if (!account?.address) return;
    getSignatureTimestamp()
  }, [account, getSignatureTimestamp])

  useEffect(() => {
    if (accountChanged){
      setSending(false)
      setLastCheckTimestamp(null)
      setSignatureTimestamp(null)
    }
  }, [accountChanged, setLastCheckTimestamp, setSignatureTimestamp, setSending])

  if (!account || account?.isCustom === true || signatureTimestamp){
    return (
      <Box
        width={'full'}
      >
        {children}
      </Box>
    )
  }

  if (!lastCheckTimestamp || !web3){
    return (
      <Center width={'full'} mt={10} flex={1}>
        <Spinner size={'xl'} />
      </Center>
    )
  }

  return (
    <Center width={'full'} pt={10} mt={10} flex={1}>
      <Card maxW={'52em'}>
        {
          false && signatureCheckError ? (
            <VStack
              spacing={4}
              alignItems={'center'}
            >
              <Image src={`images/vaults/warning.png`} width={10} />
              <Translation translation={'authWall.checkError'} textAlign={'center'} />
              <Translation component={Button} leftIcon={<MdOutlineRefresh size={22} />} variant={'ctaFull'} translation={'common.retry'} width={'10em'} onClick={() => getSignatureTimestamp()} />
            </VStack>
          ) : (
            <VStack
              spacing={4}
            >
              <Translation component={Heading} translation={'authWall.title'} as={'h3'} fontSize={'h3'} textAlign={'center'} isHtml />
              <Translation translation={'authWall.subtitle'} textAlign={'left'} />
              <VStack
                spacing={3}
              >
                {
                  Object.keys(messages.authWall.options).map( optionKey => (
                    <Checkbox key={`option_${optionKey}`} size={'md'} isChecked={state[optionKey]} onChange={() => dispatch({type:'TOGGLE_OPTION', payload: {optionKey}}) } alignItems={'baseline'}>
                      <Translation translation={`authWall.options.${optionKey}`} />
                    </Checkbox>
                  ))
                }
              </VStack>
              <HStack
                pt={2}
                spacing={10}
                width={'full'}
                justifyContent={'center'}
              >
                <Translation component={Button} variant={'ctaPrimaryOutline'} translation={'authWall.ctaCancel'} width={'10em'} onClick={() => disconnect()} />
                <Button disabled={!canContinue || sending} variant={'ctaFull'} width={'10em'} onClick={() => signAndSend()}>
                  {
                    sending ? (
                      <Spinner size={'md'} />
                    ) : (
                      <Translation translation={'authWall.ctaAgree'} />
                    )
                  }
                </Button>
              </HStack>
            </VStack>
          )
        }
      </Card>
    </Center>
  )
}