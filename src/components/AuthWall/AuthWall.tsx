import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import { ReducerActionTypes } from 'constants/types'
import { useI18nProvider } from 'contexts/I18nProvider'
import { useWeb3Provider } from 'contexts/Web3Provider'
import { saveSignature, checkSignature } from 'helpers/'
import type { ProviderProps } from 'contexts/common/types'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'
import React, { useState, useMemo, useReducer, useCallback, useEffect } from 'react'
import { Center, Heading, Button, HStack, VStack, Checkbox, Box, Spinner } from '@chakra-ui/react'

type InitialState = Record<string, boolean>

export const AuthWall = ({ children }: ProviderProps) => {
  const translate = useTranslate()
  const { web3 } = useWeb3Provider()
  const { messages } = useI18nProvider()
  const [ sending, setSending ] = useState<boolean>(false)
  const { account, prevAccount, disconnect } = useWalletProvider()
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

  const [ state, dispatch ] = useReducer(reducer, initialState)

  const accountChanged = useMemo(() => {
    return !!account && !!prevAccount && account.address !== prevAccount.address
  }, [account, prevAccount])

  const canContinue = useMemo(() => {
    return Object.values(state).filter( v => v === false ).length === 0
  }, [state])

  const sendSignature = useCallback(async (signature: string) => {
    if (!account?.address) return;
    return await saveSignature(account.address, signature);
  }, [account])

  const getSignatureTimestamp = useCallback(async () => {
    if (!account?.address) return;
    const signature = await checkSignature(account.address)
    if (signature?.timestamp){
      setSignatureTimestamp(signature?.timestamp)
    }
    setLastCheckTimestamp(Date.now())
  }, [account?.address, setSignatureTimestamp, setLastCheckTimestamp])

  const signAndSend = useCallback(async () => {
    if (!account?.address || !web3) return;

    setSending(true)

    const texts = [translate('authWall.signature_title'), translate('authWall.subtitle')]

    Object.keys(messages.authWall.options).forEach( optionKey => {
      texts.push('- '+translate(`authWall.options.${optionKey}`))
    })

    try {
      // @ts-ignore
      const signature = await web3.eth.personal.sign(texts.join("\n"), account.address)
      if (signature){
        await sendSignature(signature)
        getSignatureTimestamp()
      }
    } catch (err){
    }

    setSending(false)
  }, [web3, account, messages, translate, sendSignature, setSending, getSignatureTimestamp])

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
      </Card>
    </Center>
  )
}