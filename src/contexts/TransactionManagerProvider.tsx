import BigNumber from 'bignumber.js'
import { ChainlinkHelper } from 'classes/'
import { selectUnderlyingToken } from 'selectors/'
import { chains, TransactionSpeed } from 'constants/'
import { useWeb3Provider } from 'contexts/Web3Provider'
import type { ProviderProps } from 'contexts/common/types'
import { useWalletProvider } from 'contexts/WalletProvider'
import type { Transaction, TransactionReceipt } from 'web3-core'
import { ContractSendMethod, SendOptions } from 'web3-eth-contract'
import type { ReducerActionTypes, ErrnoException, AssetId } from 'constants/types'
import React, { createContext, useContext, useMemo, useReducer, useCallback, useEffect } from 'react'
import { BNify, estimateGasLimit, getBlock, getBlockBaseFeePerGas, makeEtherscanApiRequest, fixTokenDecimals, asyncReduce } from 'helpers/'

type GasOracle = {
  FastGasPrice: string
  LastBlock: string
  ProposeGasPrice: string
  SafeGasPrice: string
  gasUsedRatio: string
  suggestBaseFee: string
}

type GasPrices = Record<TransactionSpeed, string>

export type TransactionStatus = {
  hash: string | null
  status: string | null
  amount: string | null
  assetId: AssetId | null
  vaultId: AssetId | null
  created: number | null
  timestamp: number | null
  actionType: string | null
  confirmationCount: number
  lastUpdated: number | null
  estimatedTime: number | null
  error: ErrnoException | null
  transaction: Transaction | null
  receipt: TransactionReceipt | null
  contractSendMethod: ContractSendMethod | null
}

type StateProps = {
  block: any | null
  gasPrice: string | null
  gasLimit: number | null
  transactionsCount: number
  gasOracle: GasOracle | null
  gasPrices: GasPrices | null
  transaction: TransactionStatus
  tokenPriceUsd: BigNumber | null
  estimatedFees: GasPrices | null
  estimatedTimes: GasPrices | null
  estimatedFeesUsd: GasPrices | null
  transactionSpeed: TransactionSpeed
  lastTransaction: TransactionStatus | null
}

type ContextProps = {
  retry: Function
  state: StateProps
  setGasLimit: Function
  estimateGasFee: Function
  sendTransaction: Function
  updateGasPrices: Function
  cleanTransaction: Function
  sendTransactionTest: Function
  setTransactionSpeed: Function
}

const initialState: StateProps = {
  block: null,
  gasPrice: null,
  gasLimit: null,
  gasOracle: null,
  gasPrices: null,
  tokenPriceUsd: null,
  estimatedFees: null,
  estimatedTimes: null,
  transactionsCount: 0,
  lastTransaction: null,
  estimatedFeesUsd: null,
  transactionSpeed: TransactionSpeed.Fast,
  transaction: {
    hash: null,
    error: null,
    status: null,
    amount: null,
    assetId: null,
    vaultId: null,
    receipt: null,
    created: null,
    timestamp: null,
    actionType: null,
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
  setGasLimit: () => {},
  estimateGasFee: () => {},
  updateGasPrices: () => {},
  sendTransaction: () => {},
  cleanTransaction: () => {},
  sendTransactionTest: () => {},
  setTransactionSpeed: () => {},
}

// const initialStateMock = : StateProps = {
//   hash: '0x90ef32488e8fa4206d02b8acb411f1c49b092ba855efb158d27b751c93de7ad6',
//   error: null,
//   status: 'failed',
//   receipt: null,
//   created: null,
//   timestamp: null,
 //  lastTransaction: {
 //    hash: '0xe6a53859b5bc3dbbfae8e9d8dc81d7c672d2bd7aff04fb065fd8837741706209',
 //    error: null,
 //    status: null,
 //    assetId: '0x3a52fa30c33caf05faee0f9c5dfe5fd5fe8b3978',
 //    receipt: null,
 //    created: null,
 //    timestamp: null,
 //    transaction: null,
 //    lastUpdated: +Date.now()+100000,
 //    estimatedTime: null,
 //    confirmationCount: 0,
 //    contractSendMethod: null,
 //  },
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
  // console.log('dispatch', action.type, action.payload)
  const lastUpdated = Date.now()
  switch (action.type){
    case 'RESET':
      return {
        ...state,
        transaction: {
          ...initialState.transaction
        }
      }
    case 'SET_LAST_TRANSACTION':
      return {
        ...state,
        lastTransaction: state.transaction
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
    case 'SET_GAS_LIMIT':
      return {
        ...state,
        gasLimit: action.payload
      }
    case 'SET_GAS_PRICES':
      return {
        ...state,
        gasPrices: action.payload
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
          // assetId: action.payload.assetId,
          // contractSendMethod: action.payload.contractSendMethod,
          status: 'created',
          created: lastUpdated,
          lastUpdated,
          ...action.payload
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
    case 'SET_ESTIMATED_TIMES':
      return {
        ...state,
        estimatedTimes : action.payload
      }
    case 'SET_ESTIMATED_FEES':
      return {
        ...state,
        estimatedFees : action.payload
      }
    case 'SET_ESTIMATED_FEES_USD':
      return {
        ...state,
        estimatedFeesUsd : action.payload
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
    case 'SET_BLOCK':
      return {
        ...state,
        block: action.payload
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
  const { web3, web3Chains }  = useWeb3Provider()
  const [ state, dispatch ] = useReducer(reducer, initialState)
  const { account, chainId, prevChainId, explorer, network } = useWalletProvider()

  const networkChanged = useMemo(() => {
    return !!chainId && !!prevChainId && +chainId !== +prevChainId
  }, [chainId, prevChainId])

  // Get estimated time
  const getEstimatedTime = useCallback( async (gasPrice: string): Promise<string | null> => {
    if (!explorer || !chainId) return null
    if (+chainId !== 1) return '120'
    const endpoint = `${explorer.endpoints[chainId]}?module=gastracker&action=gasestimate&gasprice=${BNify(gasPrice).times(1e09).toString()}`
    return await makeEtherscanApiRequest(endpoint, explorer.keys)
  }, [explorer, chainId])

  // Estimate gas fees
  const estimateGasFee = useCallback( async (contractSendMethod: ContractSendMethod | null, sendOptions?: SendOptions, gasLimit?: number): Promise<BigNumber | null> => {
    if (!account || !web3 || !state.gasPrice || !state.tokenPriceUsd) return null
    if (!gasLimit && contractSendMethod) {
      gasLimit = await estimateGasLimit(contractSendMethod, sendOptions)
    }
    return fixTokenDecimals(BNify(gasLimit).times(BNify(state.gasPrice).times(1e09)), 18)
  }, [account, web3, state.gasPrice, state.tokenPriceUsd])

  const getLatestBlock = useCallback(async () => {
    if (!web3) return null
    return await getBlock(web3, 'latest')
  }, [web3])

  // Track transaction changed
  // useEffect(() => {
  //   if (!state.transaction) return
  //   console.log('Transaction CHANGED', state.transaction)
  // }, [state.transaction])

  const updateGasPrices = useCallback( async () => {
    if (!explorer || !chainId) return
    const endpoint = `${explorer.endpoints[chainId]}?module=gastracker&action=gasoracle`
    const gasOracle = await makeEtherscanApiRequest(endpoint, explorer.keys)
    if (gasOracle) {
      const gasPrices: GasPrices = {
        [TransactionSpeed.VeryFast]: (+gasOracle.FastGasPrice+2).toString(),
        [TransactionSpeed.Fast]: gasOracle.FastGasPrice,
        [TransactionSpeed.Average]: (+gasOracle.SafeGasPrice+1).toString(),
        [TransactionSpeed.Slow]: (+gasOracle.SafeGasPrice).toString()
      }

      const transactionSpeeds: TransactionSpeed[] = Object.keys(gasPrices) as TransactionSpeed[]
      const defaultEstimatedTimes = Object.keys(gasPrices).reduce( (gasPrices: Record<string, string>, transactionSpeed) => ({ ...gasPrices, [transactionSpeed]: '60' }), {}) as GasPrices
      const estimatedTimes = await asyncReduce<TransactionSpeed, GasPrices>(
        transactionSpeeds,
        async (transactionSpeed: TransactionSpeed): Promise<any> => {
          const gasPrice = gasPrices[transactionSpeed]
          const estimatedTime = transactionSpeed === TransactionSpeed.VeryFast ? '15' : await getEstimatedTime(gasPrice)
          return {
            [transactionSpeed]: estimatedTime
          }
        },
        (acc, val) => ({...acc, ...val}),
        defaultEstimatedTimes
      )

      // console.log('updateGasPrices', gasOracle, gasPrices, estimatedTimes)

      dispatch({type: 'SET_GAS_ORACLE', payload: gasOracle})
      dispatch({type: 'SET_GAS_PRICES', payload: gasPrices})
      dispatch({type: 'SET_ESTIMATED_TIMES', payload: estimatedTimes})
    }
  }, [explorer, chainId, getEstimatedTime])

  // Reset gas oracle on network change
  useEffect(() => {
    if (networkChanged){
      dispatch({type: 'SET_GAS_ORACLE', payload: null})
    }
  }, [networkChanged])

  // Set estimated time
  useEffect(() => {
    if (state.transaction?.status !== 'pending' || !state.transaction?.transaction?.gasPrice || !explorer || !chainId || state.transaction?.estimatedTime) return
    ;(async () => {
      // const endpoint = `${explorer.endpoints[chainId]}?module=gastracker&action=gasestimate&gasprice=${state.transaction?.transaction?.gasPrice}`
      // const estimatedTime = await makeEtherscanApiRequest(endpoint, explorer.keys)
      const estimatedTime = await getEstimatedTime(BNify(state.transaction?.transaction?.gasPrice).div(1e09).toString())
      if (estimatedTime){
        // console.log('Tx Estimated Time', state.transaction?.transaction?.gasPrice, estimatedTime)
        dispatch({type: 'SET_ESTIMATED_TIME', payload: +estimatedTime})
      }
    })()
  }, [state.transaction, explorer, chainId, getEstimatedTime])

  // Get chain token price
  useEffect(() => {
    if (!chainId || !web3 || !web3Chains) return
    ;(async () => {
      const chainToken = selectUnderlyingToken(1, chains[chainId].token)
      if (!chainToken || !chainToken.address) return
      
      const chainlinkHelper: ChainlinkHelper = new ChainlinkHelper(1, web3Chains[1])
      const chainTokenPriceUsd = await chainlinkHelper.getTokenPriceUsd(chainToken.address)

      if (!chainTokenPriceUsd) return
      dispatch({type: 'SET_TOKEN_PRICE', payload: chainTokenPriceUsd})
      // console.log('chainToken', chainToken, chainTokenPriceUsd)
    })()
  }, [chainId, web3, web3Chains])

  // Get latest block
  useEffect(() => {
    if (!chainId || !web3) return
    ;(async () => {
      const block = await getLatestBlock()
      if (block){
        dispatch({type: 'SET_BLOCK', payload: block})
      }
    })()
  }, [chainId, web3, getLatestBlock])

  // Get Gas Oracle
  useEffect(() => {
    if (!explorer || !chainId || state.gasOracle) return
    updateGasPrices()
  }, [explorer, chainId, state.gasOracle, updateGasPrices])

  // Update gas price based on selected transaction speed
  useEffect(() => {
    if (!state.gasPrices || !state.transactionSpeed) return
    dispatch({type: 'SET_GAS_PRICE', payload: state.gasPrices[state.transactionSpeed]})
  }, [dispatch, state.transactionSpeed, state.gasPrices])

  // Update estimated fees
  useEffect(() => {
    if (!state.gasLimit || !state.gasPrices) return
    const estimatedFees = (Object.keys(state.gasPrices) as Array<TransactionSpeed>).reduce( (estimatedFees: GasPrices, transactionSpeed: TransactionSpeed): GasPrices => {
      const gasPrice = state.gasPrices[transactionSpeed]
      const estimatedFee = fixTokenDecimals(BNify(state.gasLimit).times(BNify(gasPrice).times(1e09)), 18).toString()

      return {
        ...estimatedFees,
        [transactionSpeed]: estimatedFee
      }
    }, {} as GasPrices)
    dispatch({type: 'SET_ESTIMATED_FEES', payload: estimatedFees})

    if (!state.tokenPriceUsd) return

    const estimatedFeesUsd = (Object.keys(state.gasPrices) as Array<TransactionSpeed>).reduce( (estimatedFeesUsd: GasPrices, transactionSpeed: TransactionSpeed): GasPrices => {
      const estimatedFee = estimatedFees[transactionSpeed]
      const estimatedFeeUsd = BNify(estimatedFee).times(state.tokenPriceUsd).toString()

      return {
        ...estimatedFeesUsd,
        [transactionSpeed]: estimatedFeeUsd
      }
    }, {} as GasPrices)
    dispatch({type: 'SET_ESTIMATED_FEES_USD', payload: estimatedFeesUsd})

  }, [state.gasLimit, state.gasPrices, estimateGasFee, state.tokenPriceUsd])

  // Send transaction
  const sendTransactionTest = useCallback(
    async (vaultId: AssetId, assetId: AssetId, contractSendMethod: ContractSendMethod, actionType?: string, amount?: string) => {
      if (!account || !web3) return null

      const sendOptions: SendOptions = {
        from: account?.address
      }
      const gas = await estimateGasLimit(contractSendMethod, sendOptions)

      if (gas) {
        sendOptions.gas = gas
        sendOptions.gasPrice = (+state.gasPrice+100).toString()
      }

      dispatch({type: 'CREATE', payload: {
        amount,
        assetId,
        vaultId,
        actionType,
        contractSendMethod
      }})

      setTimeout(() => {
        const hash = '0xa8e9499cf134f381ac1b65a5b62c42929a56462e8dff8898a532dc1e933bc3b7'
        dispatch({type: 'SET_HASH', payload: hash})
        dispatch({type: 'SET_STATUS', payload: "pending"})

        ;(async() => {
          const transaction = await web3.eth.getTransaction(hash)
          // console.log('Test tx: transaction', transaction)
          if (transaction){
            dispatch({type: 'SET_TRANSACTION', payload: transaction})
            setTimeout(() => {
              (async() => {
                const receipt: TransactionReceipt = await web3.eth.getTransactionReceipt(hash)
                // console.log('Test tx: receipt', receipt)
                if (receipt) {
                  dispatch({type: 'SET_RECEIPT', payload: receipt})

                  setTimeout(() => {
                    // receipt.status = 'success'
                    // console.log('Test tx: confirmation')
                    dispatch({type: 'SET_STATUS', payload: "success"})
                    dispatch({type: 'INCREASE_CONFIRMATION_COUNT', payload: null})
                    dispatch({type: 'SET_LAST_TRANSACTION', payload: null})
                    // if (receipt.status) {
                    //   dispatch({type: 'SET_STATUS', payload: "success"})
                    // } else if (!receipt.status) {
                      // dispatch({type: 'SET_STATUS', payload: "failed"})
                    // }
                  }, 1000)
                }
              })()
            }, 3000)
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
    async (vaultId: AssetId, assetId: AssetId, contractSendMethod: ContractSendMethod, actionType?: string, amount?: string) => {
      if (!account || !web3 || !network) return null

      try {
        const sendOptions: SendOptions = {
          from: account?.address
        }
        const [
          gas,
          baseFeePerGas
        ] = await Promise.all([
          estimateGasLimit(contractSendMethod, sendOptions, 0, 5), // Add 5% to estimated gas limit
          getBlockBaseFeePerGas(web3)
        ])

        // console.log('gas', gas)
        // console.log('baseFeePerGas', baseFeePerGas)

        if (gas) {
          sendOptions.gas = gas
          if (network.supportEip1559 === undefined || network.supportEip1559){
            // @ts-ignore
            sendOptions.maxPriorityFeePerGas = 200000000
            if (baseFeePerGas){
              // @ts-ignore
              sendOptions.maxFeePerGas = BigNumber.maximum(baseFeePerGas, BNify(state.gasPrice).times(1e09).toFixed())
            }
          }
        }

        dispatch({type: 'CREATE', payload: {
          amount,
          assetId,
          vaultId,
          actionType,
          contractSendMethod
        }})

        // console.log('sendOptions', sendOptions)

        contractSendMethod.send(sendOptions)
          .on("transactionHash", async (hash: string) => {
            // console.log('transactionHash', hash)
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
            // console.log('receipt', receipt)
            dispatch({type: 'SET_RECEIPT', payload: receipt})
          })
          .once("confirmation", (confirmationNumber: number, receipt: TransactionReceipt) => {
            // console.log('confirmation', confirmationNumber, receipt)
            dispatch({type: 'INCREASE_CONFIRMATION_COUNT', payload: null})
            if (receipt.status) {
              dispatch({type: 'SET_STATUS', payload: "success"})
              dispatch({type: 'SET_LAST_TRANSACTION', payload: null})
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
      } catch (err) {
        console.log('error', err)
        dispatch({type: 'SET_ERROR', payload: err})
        dispatch({type: 'SET_STATUS', payload: 'failed'})
      }
    }
  , [account, web3, network, state.gasPrice])

  // Send again the transaction
  const retry = useCallback(() => {
    // console.log('retry', state.transaction.contractSendMethod)
    if (!state.transaction.contractSendMethod) return
    sendTransaction(state.transaction.vaultId, state.transaction.assetId, state.transaction.contractSendMethod, state.transaction.actionType, state.transaction.amount)
  }, [sendTransaction, state.transaction.vaultId, state.transaction.assetId, state.transaction.contractSendMethod, state.transaction.actionType, state.transaction.amount])

  const setTransactionSpeed = useCallback((transactionSpeed: TransactionSpeed) => {
    dispatch({type: 'SET_TRANSACTION_SPEED', payload: transactionSpeed})
  }, [dispatch])

  const setGasLimit = useCallback((gasLimit: number) => {
    // console.log('setGasLimit', gasLimit)
    dispatch({type: 'SET_GAS_LIMIT', payload: gasLimit})
  }, [dispatch])

  return (
    <TransactionManagerContext.Provider value={{ state, sendTransaction, sendTransactionTest, retry, estimateGasFee, cleanTransaction, setTransactionSpeed, setGasLimit, updateGasPrices }}>
      {children}
    </TransactionManagerContext.Provider>
  )
}