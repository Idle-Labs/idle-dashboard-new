import { estimateGasLimit } from 'helpers/'
import type { TransactionReceipt } from 'web3-core'
import { useWeb3Provider } from 'contexts/Web3Provider'
import type { ProviderProps } from 'contexts/common/types'
import { useWalletProvider } from 'contexts/WalletProvider'
import type { ReducerActionTypes, ErrnoException } from 'constants/types'
import { Contract, ContractSendMethod, SendOptions } from 'web3-eth-contract'
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'

type Transaction = {
  hash: string | null
  status: string | null
  created: number | null
  confirmationCount: number
  lastUpdated: number | null
  error: ErrnoException | null
  receipt: TransactionReceipt | null
  contractSendMethod: ContractSendMethod | null
}

type ContextProps = {
  retry: Function
  sendTransaction: Function
  transaction: Transaction | null
}

const initialContextState = {
  retry: () => {},
  transaction: null,
  sendTransaction: () => {}
}

const transactionInitialState: Transaction = {
  hash: null,
  error: null,
  status: null,
  receipt: null,
  created: null,
  lastUpdated: null,
  confirmationCount: 0,
  contractSendMethod: null
}

const reducer = (state: Transaction, action: ReducerActionTypes) => {
  const lastUpdated = Date.now()
  switch (action.type){
    case 'RESET':
      return {...transactionInitialState}
    case 'CREATE':
      return {...transactionInitialState, contractSendMethod: action.payload, status: 'created', created: lastUpdated, lastUpdated}
    case 'SET_RECEIPT':
      return {...state, receipt: action.payload, lastUpdated}
    case 'SET_HASH':
      return {...state, hash: action.payload, lastUpdated}
    case 'SET_STATUS':
      return {...state, status: action.payload, lastUpdated}
    case 'SET_ERROR':
      return {...state, error: action.payload, lastUpdated}
    case 'INCREASE_CONFIRMATION_COUNT':
      return {...state, confirmationCount: state.confirmationCount+1, lastUpdated}
    default:
      return {...state}
  }
}

const TransactionManagerContext = createContext<ContextProps>(initialContextState)

export const useTransactionManager = () => useContext(TransactionManagerContext)

export function TransactionManagerProvider({children}: ProviderProps) {

  const { web3 }  = useWeb3Provider()
  const { account } = useWalletProvider()
  const [ transaction, dispatch ] = useReducer(reducer, transactionInitialState)

  useEffect(() => {
    if (!transaction) return
    console.log('Transaction CHANGED', transaction)
  }, [transaction])

  const sendTransaction = useCallback(
    async (contractSendMethod: ContractSendMethod) => {
      if (!account || !web3) return null

      const sendOptions: SendOptions = {
        from: account?.address
      }
      const gas = await estimateGasLimit(contractSendMethod, sendOptions)

      if (gas) {
        sendOptions.gas = gas
      }

      const transactionHandler = contractSendMethod.send(sendOptions)
        .on("transactionHash", (hash: string) => {
          console.log('transactionHash', hash)
          dispatch({type: 'SET_HASH', payload: hash})
          dispatch({type: 'SET_STATUS', payload: "pending"})
        })
        .on("receipt", (receipt: TransactionReceipt) => {
          console.log('receipt', receipt)
          dispatch({type: 'SET_RECEIPT', payload: receipt})
        })
        .on("confirmation", (confirmationNumber: number, receipt: TransactionReceipt) => {
          console.log('confirmation', confirmationNumber, receipt)
          dispatch({type: 'INCREASE_CONFIRMATION_COUNT', payload: null})
          if (receipt.status) {
            dispatch({type: 'SET_STATUS', payload: "success"})
          } else if (!receipt.status) {
            dispatch({type: 'SET_STATUS', payload: "failed"})
          }
        })
        .on("error", (error: ErrnoException) => {
          console.log('error', error)
          dispatch({type: 'SET_ERROR', payload: error})
          dispatch({type: 'SET_STATUS', payload: 'failed'})
        });

      dispatch({type: 'CREATE', payload: contractSendMethod})
    }
  , [account, web3])

  const retry = useCallback(() => {
    console.log('retry', transaction.contractSendMethod)
    if (!transaction.contractSendMethod) return
    sendTransaction(transaction.contractSendMethod)
  }, [sendTransaction, transaction.contractSendMethod])

  return (
    <TransactionManagerContext.Provider value={{ transaction, sendTransaction, retry }}>
      {children}
    </TransactionManagerContext.Provider>
  )
}