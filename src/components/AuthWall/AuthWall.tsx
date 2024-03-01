import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import { ReducerActionTypes } from 'constants/types'
import { MdOutlineArrowForward } from 'react-icons/md'
import { useI18nProvider } from 'contexts/I18nProvider'
import { useWeb3Provider } from 'contexts/Web3Provider'
import { useCacheProvider } from 'contexts/CacheProvider'
import type { ProviderProps } from 'contexts/common/types'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'
import React, { useState, useMemo, useReducer, useCallback, useEffect } from 'react'
import { Center, Heading, Button, HStack, VStack, Checkbox, Box, Spinner, Image } from '@chakra-ui/react'
import { saveSignature, checkSignature, verifySignature, verifyGnosisSignature, parseAndReplaceAnchorTags } from 'helpers/'

type InitialState = Record<string, boolean>

export const AuthWall = ({ children }: ProviderProps) => {
  const translate = useTranslate()
  const { web3 } = useWeb3Provider()
  const { messages } = useI18nProvider()
  const cacheProvider = useCacheProvider()
  const [ sending, setSending ] = useState<boolean>(false)
  const [ storedSignature, setStoredSignature ] = useState<any>(null)
  const [ signatureCheckError, setSignatureCheckError ] = useState<boolean>(false)
  const [ lastCheckTimestamp, setLastCheckTimestamp ] = useState<number | null>(null)
  const [ signatureTimestamp, setSignatureTimestamp ] = useState<string | null>(null)
  const { walletInitialized, wallet, account, prevAccount, disconnect } = useWalletProvider()
  const [ lastSaveAttempTimestamp, setLastSaveAttempTimestamp ] = useState<number | null>(null)
  const [ signatureCheckErrorContinue, setSignatureCheckErrorContinue ] = useState<boolean>(false)

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
    const texts = [translate('authWall.signatureTitle')]
    Object.keys(messages.authWall.options).forEach( optionKey => {
      texts.push('- '+parseAndReplaceAnchorTags(translate(`authWall.options.${optionKey}`)))
    })
    return texts.join("\n")
  }, [messages, translate])

  const verifySignatureFunction = useCallback(async (...params: any[]): Promise<any> => {
    return wallet?.label === 'WalletConnect'
    ? await verifyGnosisSignature(...params as Parameters<typeof verifyGnosisSignature>)
    : await verifySignature(...params as Parameters<typeof verifySignature>)
  }, [wallet])

  const getSignatureTimestamp = useCallback(async () => {
    if (!account?.address || !web3) return;

    setLastCheckTimestamp(null)

    const signature = await checkSignature(account?.address as string, messageToSign)
    
    setSignatureCheckError(false)
    setLastCheckTimestamp(Date.now())

    // Signature not retrieved
    if (!signature){

      // Check stored signature before thwowing errors
      const storedSignatureVerified = storedSignature && await verifySignatureFunction(web3, account?.address, messageToSign, storedSignature.signature)
      if (storedSignatureVerified){
        return setSignatureTimestamp(storedSignature?.timestamp)
      }

      setSignatureCheckErrorContinue(false)
      return setSignatureCheckError(true)
    }

    if (signature?.timestamp){
      setSignatureTimestamp(signature?.timestamp)
    }

  }, [web3, account?.address, storedSignature, messageToSign, verifySignatureFunction, setSignatureTimestamp, setLastCheckTimestamp, setSignatureCheckError, setSignatureCheckErrorContinue])


  // Get store signature
  useEffect(() => {
    if (!cacheProvider || !account?.address || !web3 || !!storedSignature) return
    ;(async() => {
      // Get and verify stored signature
      const storedSignatureData = await cacheProvider.getCachedUrl(`signature_${account.address}`)
      console.log('storedSignatureData', account.address, storedSignatureData)
      if (storedSignatureData){
        const storedSignatureVerified = await verifySignatureFunction(web3, account?.address, messageToSign, storedSignatureData.data.signature)
        console.log('storedSignatureVerified', storedSignatureVerified)
        if (storedSignatureVerified){
          setStoredSignature(storedSignatureData.data)
          // Check signature timestamp
          return setSignatureTimestamp(storedSignatureData.data.timestamp)
        } else {
          cacheProvider.removeCachedUrl(`signature_${account.address}`)
        }
      }
    })()
  }, [web3, account, cacheProvider, storedSignature, setStoredSignature, messageToSign, verifySignatureFunction, getSignatureTimestamp])

  const [ state, dispatch ] = useReducer(reducer, initialState)

  const accountChanged = useMemo(() => {
    return !!account && !!prevAccount && account.address !== prevAccount.address
  }, [account, prevAccount])

  const canContinue = useMemo(() => {
    return Object.values(state).filter( v => v === false ).length === 0
  }, [state])

  const sendSignature = useCallback(async (signature: string) => {
    if (!account?.address) return;

    // Send signature to server
    const response = await saveSignature(account.address, messageToSign, signature);

    console.log('sendSignature', response)

    // Store signature locally
    if (cacheProvider){
      const dataToStore = {timestamp: Date.now(), signature, saved: !!response}
      cacheProvider.saveData(`signature_${account.address}`, dataToStore, null)
      setStoredSignature(dataToStore)

      // Try to send signature again in case of no response
      if (!response){
        setTimeout(() => {
          sendSignature(signature)
        }, 60000)
      }
    }
  }, [account, cacheProvider, messageToSign])

  const signAndSend = useCallback(async () => {
    if (!account?.address || !web3) return;
    setSending(true)
    try {
      const signature = await web3.eth.personal.sign(messageToSign, account.address, '', () => {})
      console.log('signature', signature)
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

  // Reset signature when account changes
  useEffect(() => {
    if (accountChanged){
      setSending(false)
      setLastCheckTimestamp(null)
      setSignatureTimestamp(null)
    }
  }, [accountChanged, setLastCheckTimestamp, setSignatureTimestamp, setSending])

  // Try to send the signature to server if not saved (fires only once)
  useEffect(() => {
    if (!storedSignature || !!storedSignature.saved || !account?.address || lastSaveAttempTimestamp) return
    sendSignature(storedSignature.signature)
    // Save save attemp timestamp
    setLastSaveAttempTimestamp(Date.now())
  }, [account, storedSignature, lastSaveAttempTimestamp, sendSignature, setLastSaveAttempTimestamp])

  if (walletInitialized && (!account || account?.isCustom === true || signatureTimestamp)){
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
          signatureCheckError && !signatureCheckErrorContinue ? (
            <VStack
              spacing={4}
              alignItems={'center'}
            >
              <Image src={`images/vaults/warning.png`} width={10} />
              <Translation translation={'authWall.checkError'} textAlign={'center'} />
              <HStack
                spacing={4}
                width={'full'}
                alignItems={'center'}
                justifyContent={'center'}
              >
                <Translation component={Button} variant={'ctaPrimaryOutline'} translation={'common.cancel'} width={'10em'} onClick={() => disconnect()} />
                <Translation component={Button} rightIcon={<MdOutlineArrowForward size={22} />} variant={'ctaFull'} translation={'common.continue'} width={'10em'} onClick={() => setSignatureCheckErrorContinue(true)} />
              </HStack>
            </VStack>
          ) : (
            <VStack
              spacing={4}
            >
              <Translation component={Heading} translation={'common.welcome'} as={'h2'} fontSize={'h2'} textAlign={'center'} isHtml />
              <Translation component={Heading} translation={'authWall.title'} as={'h3'} fontSize={'h3'} textAlign={'center'} isHtml />
              <VStack
                spacing={3}
              >
                {
                  Object.keys(messages.authWall.options).map( optionKey => (
                    <Checkbox key={`option_${optionKey}`} size={'md'} isChecked={state[optionKey]} onChange={() => dispatch({type:'TOGGLE_OPTION', payload: {optionKey}}) } alignItems={'baseline'}>
                      <Translation translation={`authWall.options.${optionKey}`} isHtml />
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