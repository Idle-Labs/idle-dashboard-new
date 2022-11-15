import BigNumber from 'bignumber.js'
import { ChainlinkHelper } from 'classes/'
import { selectUnderlyingToken } from 'selectors/'
import { chains, TransactionSpeed } from 'constants/'
import { useWeb3Provider } from 'contexts/Web3Provider'
import type { ProviderProps } from 'contexts/common/types'
import { useWalletProvider } from 'contexts/WalletProvider'
import type { Transaction, TransactionReceipt } from 'web3-core'
import { Contract, ContractSendMethod, SendOptions } from 'web3-eth-contract'
import type { ReducerActionTypes, ErrnoException } from 'constants/types'
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { BNify, estimateGasLimit, makeEtherscanApiRequest, fixTokenDecimals } from 'helpers/'

type GasOracle = {
  FastGasPrice: string
  LastBlock: string
  ProposeGasPrice: string
  SafeGasPrice: string
  gasUsedRatio: string
  suggestBaseFee: string
}

type TransactionStatus = {
  hash: string | null
  status: string | null
  created: number | null
  timestamp: number | null
  confirmationCount: number
  lastUpdated: number | null
  estimatedTime: number | null
  error: ErrnoException | null
  transaction: Transaction | null
  receipt: TransactionReceipt | null
  contractSendMethod: ContractSendMethod | null
}

type StateProps = {
  gasPrice: string | null
  transactionsCount: number
  gasOracle: GasOracle | null
  tokenPriceUsd: BigNumber | null
  transaction: TransactionStatus
  transactionSpeed: TransactionSpeed
}

type ContextProps = {
  retry: Function
  state: StateProps
  sendTransaction: Function
  estimateGasFee: Function
  cleanTransaction: Function
  sendTransactionTest: Function
  setTransactionSpeed: Function
}

const initialState: StateProps = {
  gasPrice: null,
  gasOracle: null,
  tokenPriceUsd: null,
  transactionsCount: 0,
  transactionSpeed: TransactionSpeed.Average,
  transaction: {
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
}

const initialContextState = {
  retry: () => {},
  state: initialState,
  estimateGasFee: () => {},
  sendTransaction: () => {},
  cleanTransaction: () => {},
  sendTransactionTest: () => {},
  setTransactionSpeed: () => {}
}

// const initialStateMock = : StateProps = {
//   hash: '0x90ef32488e8fa4206d02b8acb411f1c49b092ba855efb158d27b751c93de7ad6',
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

const reducer = (state: StateProps, action: ReducerActionTypes) => {
  console.log('dispatch', action.type, action.payload)
  const lastUpdated = Date.now()
  switch (action.type){
    case 'RESET':
      return {
        ...state,
        transaction: {
          ...initialState.transaction
        }
      }
    case 'INCREMENT_TRANSACTIONS_COUNT':
      return {
        ...state,
        transactionsCount: state.transactionsCount+1
      }
    case 'SET_TRANSACTION_SPEED':
      return {
        ...state,
        transactionSpeed: action.payload
      }
    case 'SET_GAS_PRICE':
      return {
        ...state,
        gasPrice: action.payload
      }
    case 'SET_GAS_ORACLE':
      return {
        ...state,
        gasOracle : action.payload
      }
    case 'SET_TOKEN_PRICE':
      return {
        ...state,
        tokenPriceUsd : action.payload
      }
    case 'CREATE':
      return {
        ...state,
        transaction: {
          ...initialState.transaction,
          contractSendMethod: action.payload,
          status: 'created',
          created: lastUpdated,
          lastUpdated
        }
      }
    case 'SET_RECEIPT':
      return {
        ...state,
        transaction: {
          ...state.transaction,
          receipt: action.payload,
          lastUpdated
        }
      }
    case 'SET_ESTIMATED_TIME':
      return {
        ...state,
        transaction: {
          ...state.transaction,
          timestamp: lastUpdated,
          estimatedTime: action.payload,
          lastUpdated
        }
      }
    case 'SET_HASH':
      return {
        ...state,
        transaction: {
          ...state.transaction,
          hash: action.payload,
          lastUpdated
        }
      }
    case 'SET_TRANSACTION':
      return {
        ...state,
        transaction: {
          ...state.transaction,
          transaction: action.payload,
          lastUpdated
        }
      }
    case 'SET_STATUS':
      return {
        ...state,
        transaction: {
          ...state.transaction,
          status: action.payload,
          lastUpdated
        }
      }
    case 'SET_ERROR':
      return {
        ...state,
        transaction: {
          ...state.transaction,
          error: action.payload,
          lastUpdated
        }
      }
    case 'INCREASE_CONFIRMATION_COUNT':
      return {
        ...state,
        transaction: {
          ...state.transaction,
          confirmationCount: state.transaction.confirmationCount+1,
          lastUpdated
        }
      }
    default:
      return {...state}
  }
}

const TransactionManagerContext = createContext<ContextProps>(initialContextState)

export const useTransactionManager = () => useContext(TransactionManagerContext)

export function TransactionManagerProvider({children}: ProviderProps) {
  const { web3 }  = useWeb3Provider()
  const [ state, dispatch ] = useReducer(reducer, initialState)
  const { account, chainId, walletInitialized, explorer } = useWalletProvider()

  // Get chain token price
  useEffect(() => {
    if (!walletInitialized || !chainId || !web3) return
    ;(async () => {
      const chainToken = selectUnderlyingToken(chainId, chains[chainId].token)
      if (!chainToken || !chainToken.address) return
      
      const chainlinkHelper: ChainlinkHelper = new ChainlinkHelper(chainId, web3)
      const chainTokenPriceUsd = await chainlinkHelper.getTokenPriceUsd(chainToken.address)
      if (!chainTokenPriceUsd) return
      dispatch({type: 'SET_TOKEN_PRICE', payload: chainTokenPriceUsd})
      // console.log('chainToken', chainToken, chainTokenPriceUsd)
    })()
  }, [walletInitialized, chainId, web3])

  // Track transaction changed
  useEffect(() => {
    if (!state.transaction) return
    console.log('Transaction CHANGED', state.transaction)
  }, [state.transaction])

  // Fix gas price decimals
  const setGasPrice = useCallback((gasPrice: string) => {
    dispatch({type: 'SET_GAS_PRICE', payload: BNify(gasPrice).times(1e9)})
  }, [dispatch])

  // Set estimated time
  useEffect(() => {
    if (state.transaction?.status !== 'pending' || !state.transaction?.transaction?.gasPrice || !explorer || !chainId || state.transaction?.estimatedTime) return
    ;(async () => {
      const endpoint = `${explorer.endpoints[chainId]}?module=gastracker&action=gasestimate&gasprice=${state.transaction?.transaction?.gasPrice}`
      const estimatedTime = await makeEtherscanApiRequest(endpoint, explorer.keys)
      dispatch({type: 'SET_ESTIMATED_TIME', payload: parseInt(estimatedTime)})
    })()
  }, [state.transaction, explorer, chainId])

  // Get Gas Oracle
  useEffect(() => {
    if (!walletInitialized || !explorer || !chainId || state.gasOracle) return
    console.log('Get Gas Oracle', walletInitialized, explorer, chainId, state.gasOracle)
    ;(async () => {
      const endpoint = `${explorer.endpoints[chainId]}?module=gastracker&action=gasoracle`
      const gasOracle = await makeEtherscanApiRequest(endpoint, explorer.keys)
      console.log('gasOracle', gasOracle)
      if (gasOracle) {
        dispatch({type: 'SET_GAS_ORACLE', payload: gasOracle})
        // Set gas price
        // setGasPrice(gasOracle.ProposeGasPrice)
        dispatch({type: 'SET_GAS_PRICE', payload: gasOracle.ProposeGasPrice})
      }
    })()
  }, [explorer, chainId, walletInitialized, state.gasOracle])

  // Get estimated time
  /*
  const getEstimatedTime = useCallback( async () => {
    const endpoint = `${explorer.endpoints[chainId]}?module=gastracker&action=gasestimate&gasprice=${state.transaction?.transaction?.gasPrice}`
    const estimatedTime = await makeEtherscanApiRequest(endpoint, explorer.keys)
    dispatch({type: 'SET_ESTIMATED_TIME', payload: parseInt(estimatedTime)})
  }, [state.transaction, explorer, chainId])
  */

  // Estimate gas fees
  const estimateGasFee = useCallback( async (contractSendMethod: ContractSendMethod, sendOptions?: SendOptions): Promise<BigNumber | null> => {
    if (!account || !web3 || !state.gasPrice || !state.tokenPriceUsd) return null
    const gasLimit = await estimateGasLimit(contractSendMethod, sendOptions)
    return fixTokenDecimals(BNify(gasLimit).times(BNify(state.gasPrice).times(1e09)), 18)
  }, [account, web3, state.gasPrice, state.tokenPriceUsd])

  // Send transaction
  const sendTransactionTest = useCallback(
    async (contractSendMethod: ContractSendMethod) => {
      if (!account || !web3) return null

      const sendOptions: SendOptions = {
        from: account?.address
      }
      const gas = await estimateGasLimit(contractSendMethod, sendOptions)

      if (gas) {
        sendOptions.gas = gas
        sendOptions.gasPrice = (+state.gasPrice+100).toString()
      }

      dispatch({type: 'CREATE', payload: contractSendMethod})

      setTimeout(() => {
        const hash = '0x7af6ac0d4f21beca905bca30be1a3d73b7634e8635c13edca5a4e74aa276c9c2'
        dispatch({type: 'SET_HASH', payload: hash})
        dispatch({type: 'SET_STATUS', payload: "pending"})

        ;(async() => {
          const transaction = await web3.eth.getTransaction(hash)
          if (transaction) {
            dispatch({type: 'SET_TRANSACTION', payload: transaction})

            setTimeout(() => {
              ;(async() => {
                const receipt: TransactionReceipt = await web3.eth.getTransactionReceipt(hash)
                console.log('receipt', receipt)
                if (receipt) {
                  dispatch({type: 'SET_RECEIPT', payload: receipt})

                  setTimeout(() => {
                    // receipt.status = 'success'
                    console.log('confirmation')
                    dispatch({type: 'INCREASE_CONFIRMATION_COUNT', payload: null})
                    // if (receipt.status) {
                    //   dispatch({type: 'SET_STATUS', payload: "success"})
                    // } else if (!receipt.status) {
                      dispatch({type: 'SET_STATUS', payload: "success"})
                      // dispatch({type: 'SET_STATUS', payload: "failed"})
                    // }
                  }, 2000)
                }
              })()
            }, 5000)
          }
        })()
      }, 2000)
    }
  , [account, web3, state.gasPrice])

  // Reset transaction
  const cleanTransaction = useCallback(() => {
    dispatch({type: 'RESET', payload: null})
  }, [dispatch])

  // Send transaction
  const sendTransaction = useCallback(
    async (contractSendMethod: ContractSendMethod) => {
      if (!account || !web3) return null

      const sendOptions: SendOptions = {
        from: account?.address
      }
      const gas = await estimateGasLimit(contractSendMethod, sendOptions)

      if (gas) {
        sendOptions.gas = gas
        sendOptions.gasPrice = (+state.gasPrice+100).toString()
      }

      console.log('sendOptions', sendOptions)

      dispatch({type: 'CREATE', payload: contractSendMethod})

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
            dispatch({type: 'INCREMENT_TRANSACTIONS_COUNT', payload: null})
          } else if (!receipt.status) {
            dispatch({type: 'SET_STATUS', payload: "failed"})
          }
        })
        .on("error", (error: ErrnoException) => {
          console.log('error', error)
          dispatch({type: 'SET_ERROR', payload: error})
          dispatch({type: 'SET_STATUS', payload: 'failed'})
        });
    }
  , [account, web3, state.gasPrice])

  // Send again the transaction
  const retry = useCallback(() => {
    console.log('retry', state.transaction.contractSendMethod)
    if (!state.transaction.contractSendMethod) return
    sendTransaction(state.transaction.contractSendMethod)
  }, [sendTransaction, state.transaction.contractSendMethod])

  const setTransactionSpeed = useCallback((transactionSpeed: TransactionSpeed) => {
    dispatch({type: 'SET_TRANSACTION_SPEED', payload: transactionSpeed})
  }, [dispatch])

  return (
    <TransactionManagerContext.Provider value={{ state, sendTransaction, sendTransactionTest, retry, estimateGasFee, cleanTransaction, setTransactionSpeed }}>
      {children}
    </TransactionManagerContext.Provider>
  )
}