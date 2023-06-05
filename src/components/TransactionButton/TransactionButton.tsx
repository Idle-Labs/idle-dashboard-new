import './progress.css'
import type { AssetId } from 'constants/types'
import { ContractSendMethod } from 'web3-eth-contract'
import { useWalletProvider } from 'contexts/WalletProvider'
import { MdOutlineDone, MdOutlineClose } from 'react-icons/md'
import { Translation } from 'components/Translation/Translation'
import useBoundingRect from "hooks/useBoundingRect/useBoundingRect"
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import React, { useRef, useCallback, useState, useMemo, useEffect } from 'react'
import { useTheme, ButtonProps, Button, Flex, Spinner, Text, TextProps, FlexProps } from '@chakra-ui/react'

type TransactionButtonValueProps = {
  text: string
  contractSendMethod: ContractSendMethod
} & TextProps & FlexProps

export const TransactionButtonValue: React.FC<TransactionButtonValueProps> = ({
  text,
  contractSendMethod,
  ...props
}) => {
  const theme = useTheme()
  const intervalId = useRef<any>(null)
  const [ remainingTime, setRemainingTime ] = useState<number | null>(null)
  const { state: { transaction }, cleanTransaction } = useTransactionManager()

  // @ts-ignore
  const isRightTransaction = useMemo(() => JSON.stringify(transaction?.contractSendMethod?._method) === JSON.stringify(contractSendMethod._method), [transaction, contractSendMethod])

  const transactionStarted = useMemo(() => {
    return isRightTransaction && transaction.status && ['pending', 'success', 'failed'].includes(transaction.status) && transaction.estimatedTime
  }, [transaction, isRightTransaction])

  const transitionDuration = useMemo(() => {
    return transactionStarted && transaction.status === 'pending' ? transaction.estimatedTime : 0.5
  }, [transactionStarted, transaction])

  const startCountdown = useCallback(() => {
    // console.log('getRemainingTime', transaction)
    if (!transaction.timestamp || !transaction.estimatedTime) return null
    const targetTimestamp = +transaction.timestamp+(transaction.estimatedTime*1000)
    // console.log('getRemainingTime - targetTimestamp', targetTimestamp, Math.max(0, Math.ceil((targetTimestamp-Date.now())/1000)))
    const remainingTime = Math.max(0, Math.ceil((targetTimestamp-Date.now())/1000))

    setRemainingTime(remainingTime)
    if (!remainingTime) return
    // console.log('TransactionButton - startCountdown')
    intervalId.current = setTimeout(() => {
      startCountdown()
    }, 1000)
  }, [transaction])

  useEffect(() => {
    if (!isRightTransaction) return
    if (transaction.status === 'success' || transaction.status === 'failed'){
      // console.log('Clear Interval', intervalId.current)
      if (intervalId.current){
        clearInterval(intervalId.current)
        intervalId.current = null
      }
      // Clean transaction if success or failed
      if (transaction.status === 'success' || transaction.error?.code !== 4001){
        setTimeout(() => {
          cleanTransaction()
        }, 4000)
      }
    } else if (transaction.status === 'pending' && !intervalId.current){
      startCountdown()
    }
  }, [isRightTransaction, transaction.status, startCountdown, cleanTransaction, transaction.error?.code])
  
  const textComponent = useMemo(() => {
    if (isRightTransaction){
      switch (transaction?.status){
        case 'created':
          return (
            <Spinner size={'sm'} />
          )
        case 'pending':
          if (!transaction.timestamp || !transaction.estimatedTime){
            return (
              <Spinner size={'sm'} />
            )
          }
          // const targetTimestamp = +transaction.timestamp+(transaction.estimatedTime*1000)
          // const remainingTime = Math.max(0, Math.ceil((targetTimestamp-Date.now())/1000))
          // Return spinner if long transaction
          if (!remainingTime){
            return (
              <Spinner size={'sm'} />
            )
          }
          return (
            <Text textStyle={'ctaStatic'}>{remainingTime}s</Text>
          )
        case 'success':
          return (
            <Flex
              {...props}
              alignItems={'center'}
              justifyContent={'center'}
            >
              <MdOutlineDone size={24} color={theme.colors.green['400']} />
            </Flex>
          )
        case 'failed':
          if (transaction.error?.code !== 4001){
            return (
              <Flex
                {...props}
                alignItems={'center'}
                justifyContent={'center'}
              >
                <MdOutlineClose size={24} color={theme.colors.red['400']} />
              </Flex>
            )
          }
        break
        default:
        break
      }
    }
    return (
      <Translation translation={text} textStyle={'ctaStatic'} />
    )
  }, [isRightTransaction, remainingTime, transaction, text, theme, props])

  const progressBg = useMemo(() => {
    switch (transaction.status){
      case 'success':
      case 'failed':
        return 'transparent'
      default:
        return 'primary'
    }
  }, [transaction])

  return (
    <>
      <Flex
        top={0}
        left={0}
        bottom={0}
        bg={progressBg}
        overflow={'hidden'}
        position={'absolute'}
        alignItems={'center'}
        justifyContent={'center'}
        transition={'background 0.5s ease-in-out'}
        sx={{
          animationIterationCount: 1,
          animationFillMode: 'forwards',
          animationTimingFunction: 'ease-in-out',
          animationDuration: `${transitionDuration}s`,
          animationName: transactionStarted ? 'progress' : 'none',
          animationPlayState: transactionStarted ? 'running' : 'stopped',
        }}
      >
        <Flex
          left={0}
          width={props.width}
          alignItems={'center'}
          position={'absolute'}
          justifyContent={'center'}
          sx={{
            '> *':{
              color:'black !important',
              borderColor:'black !important',
            }
          }}
        >
          {textComponent}
        </Flex>
      </Flex>
      {textComponent}
    </>
  )
}

type TransactionButtonProps = {
  text: string
  amount?: string
  assetId: AssetId
  vaultId: AssetId
  actionType?: string
  chainIds?: (string|number)[]
  contractSendMethod: ContractSendMethod
}

export const TransactionButton: React.FC<TransactionButtonProps & ButtonProps> = ({
  text,
  amount,
  assetId,
  vaultId,
  actionType,
  chainIds = [],
  contractSendMethod,
  ...props
}) => {
  // @ts-ignore
  const [ref, { width }] = useBoundingRect()
  const { checkChainEnabled } = useWalletProvider()
  const { sendTransaction, state: { transaction } } = useTransactionManager()

  const isChainEnabled = useMemo(() => checkChainEnabled(chainIds), [chainIds, checkChainEnabled])

  // @ts-ignore
  const isRightTransaction = useMemo(() => JSON.stringify(transaction?.contractSendMethod?._method) === JSON.stringify(contractSendMethod._method), [transaction, contractSendMethod])

  const onClick = useCallback(() => {
    if (transaction.status === 'created' || transaction.status === 'pending') return
    // console.log('onClick', vaultId, assetId, contractSendMethod)
    return sendTransaction(vaultId, assetId, contractSendMethod, actionType, amount)
  }, [transaction, vaultId, assetId, contractSendMethod, actionType, amount, sendTransaction])

  const borderColor = useMemo(() => {
    if (!isRightTransaction) return 'primary'
    switch (transaction.status){
      case 'success':
        return 'green.400'
      case 'failed':
        return transaction.error?.code !== 4001 ? 'red.400' : 'primary'
      default:
        return 'primary'
    }
  }, [isRightTransaction, transaction])

  const isButtonDisabled = useMemo(() => !!props.disabled || !isChainEnabled, [props, isChainEnabled])

  return (
    <Button
      py={2}
      px={10}
      overflow={'hidden'}
      position={'relative'}
      width={width || 'auto'}
      borderColor={borderColor}
      onClick={() => onClick()}
      ref={ref as typeof useRef}
      variant={'ctaPrimaryOutline'}
      transition={'border 0.5s ease-in-out'}
      {...props}
      disabled={isButtonDisabled}
    >
      <TransactionButtonValue text={text} contractSendMethod={contractSendMethod} width={width} />
    </Button>
  )
}