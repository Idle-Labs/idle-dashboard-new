import { useWeb3Provider } from 'contexts/Web3Provider'
import type { ProviderProps } from 'contexts/common/types'
import { useWalletProvider } from 'contexts/WalletProvider'
import type { Transaction, TransactionReceipt } from 'web3-core'
import { estimateGasLimit, makeEtherscanApiRequest } from 'helpers/'
import type { ReducerActionTypes, ErrnoException } from 'constants/types'
import { Contract, ContractSendMethod, SendOptions } from 'web3-eth-contract'
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'

type StateProps = {
  hash: string | null
  status: string | null
  created: number | null
  confirmationCount: number
  timestamp: number | null
  lastUpdated: number | null
  estimatedTime: number | null
  error: ErrnoException | null
  transaction: Transaction | null
  receipt: TransactionReceipt | null
  contractSendMethod: ContractSendMethod | null
}

type ContextProps = {
  retry: Function
  sendTransaction: Function
  state: StateProps | null
}

const initialContextState = {
  retry: () => {},
  state: null,
  sendTransaction: () => {}
}

// const initialStateMock = : StateProps = {
//   hash: 'dwa',
//   error: null,
//   status: 'failed',
//   receipt: null,
//   created: null,
//   timestamp: null,
//   transaction: {
//     blockHash: "0x78530138977589b8b3b8aa253126c2691124c56f3c9c52057ffc2269d14ac593",
//     blockNumber: 15947982,
//     from: "0x473780deAF4a2Ac070BBbA936B0cdefe7F267dFc",
//     gas: 27500,
//     gasPrice: "530146068900",
//     hash: "0x90ef32488e8fa4206d02b8acb411f1c49b092ba855efb158d27b751c93de7ad6",
//     input: "0x",
//     to: "",
//     nonce: 8666,
//     transactionIndex: 123,
//     value: "676521416807297978",
//   },
//   lastUpdated: null,
//   estimatedTime: 15,
//   confirmationCount: 0,
//   contractSendMethod: null,
// }

const initialState: StateProps = {
  hash: null,
  error: null,
  status: null,
  receipt: null,
  created: null,
  timestamp: null,
  transaction: null,
  lastUpdated: null,
  estimatedTime: null,
  confirmationCount: 0,
  contractSendMethod: null,
}

const reducer = (state: StateProps, action: ReducerActionTypes) => {
  const lastUpdated = Date.now()
  switch (action.type){
    case 'RESET':
      return {...initialState}
    case 'CREATE':
      return {...initialState, contractSendMethod: action.payload, status: 'created', created: lastUpdated, lastUpdated}
    case 'SET_RECEIPT':
      return {...state, receipt: action.payload, lastUpdated}
    case 'SET_ESTIMATED_TIME':
      return {...state, timestamp: lastUpdated, estimatedTime: action.payload, lastUpdated}
    case 'SET_HASH':
      return {...state, hash: action.payload, lastUpdated}
    case 'SET_TRANSACTION':
      return {...state, transaction: action.payload, lastUpdated}
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
  const { account, chainId, explorer } = useWalletProvider()
  const [ state, dispatch ] = useReducer(reducer, initialState)

  useEffect(() => {
    if (!state) return
    console.log('Transaction CHANGED', state)
  }, [state])

  // Get estimated time
  useEffect(() => {
    if (!state.transaction?.gasPrice || !explorer || !chainId) return
    (async() => {
      const endpoint = `${explorer.endpoints[chainId]}?module=gastracker&action=gasestimate&gasprice=${state.transaction?.gasPrice}`
      const estimatedTime = await makeEtherscanApiRequest(endpoint, explorer.keys)
      dispatch({type: 'SET_ESTIMATED_TIME', payload: parseInt('15')})
    })()
  }, [state.transaction, explorer, chainId])

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
        .on("transactionHash", async (hash: string) => {
          console.log('transactionHash', hash)
          dispatch({type: 'SET_HASH', payload: hash})
          dispatch({type: 'SET_STATUS', payload: "pending"})

          ;(async() => {
            const transaction = await web3.eth.getTransaction(hash)
            if (transaction) {
              dispatch({type: 'SET_TRANSACTION', payload: transaction})
            }
          })()
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
    console.log('retry', state.contractSendMethod)
    if (!state.contractSendMethod) return
    sendTransaction(state.contractSendMethod)
  }, [sendTransaction, state.contractSendMethod])

  return (
    <TransactionManagerContext.Provider value={{ state, sendTransaction, retry }}>
      {children}
    </TransactionManagerContext.Provider>
  )
}