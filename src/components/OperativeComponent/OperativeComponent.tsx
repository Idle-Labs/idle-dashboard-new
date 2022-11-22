import { Card } from 'components/Card/Card'
import { TransactionSpeed } from 'constants/'
import { Amount } from 'components/Amount/Amount'
import { TILDE, MAX_ALLOWANCE } from 'constants/vars'
import { useWalletProvider } from 'contexts/WalletProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { ChakraCarousel } from 'components/ChakraCarousel/ChakraCarousel'
import type { ReducerActionTypes, AssetId } from 'constants/types'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { TranslationProps, Translation } from 'components/Translation/Translation'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import React, { useState, useEffect, useCallback, useMemo, useReducer, useContext, createContext } from 'react'
import { BNify, getAllowance, getVaultAllowanceOwner, estimateGasLimit, formatTime, abbreviateNumber, getExplorerTxUrl } from 'helpers/'
import { MdOutlineAccountBalanceWallet, MdOutlineLocalGasStation, MdKeyboardArrowLeft, MdOutlineLockOpen, MdOutlineRefresh, MdOutlineDone, MdOutlineClose } from 'react-icons/md'
import { BoxProps, useTheme, Switch, Center, Box, Flex, VStack, HStack, SkeletonText, Text, Radio, Button, ButtonProps, Tabs, TabList, Tab, Input, CircularProgress, CircularProgressLabel, SimpleGrid, Spinner, Link, LinkProps } from '@chakra-ui/react'

type InputAmountArgs = {
  amount?: string
  setAmount: Function
  inputHeight?: number
}

const InputAmount: React.FC<InputAmountArgs> = ({ inputHeight, amount, setAmount }) => {
  const { asset, underlyingAsset } = useAssetProvider()
  const [ amountUsd, setAmountUsd ] = useState<number>(0)
  const { selectors: { selectAssetPriceUsd, selectVaultPrice } } = usePortfolioProvider()
  
  const handleAmountChange = ({target: { value }}: { target: {value: string} }) => {
    setAmount(Math.max(0, parseFloat(value)).toString())
  }

  useEffect(() => {
    if (!selectAssetPriceUsd || !selectVaultPrice || !underlyingAsset || !asset) return
    const assetPriceUsd = selectAssetPriceUsd(underlyingAsset.id)
    const vaultPrice = selectVaultPrice(asset.id)

    if (asset.type === 'underlying') {
      const amountUsd = parseFloat(BNify(amount).times(assetPriceUsd).toString()) || 0
      setAmountUsd(amountUsd)
    } else {
      const amountUsd = parseFloat(BNify(amount).times(assetPriceUsd).times(vaultPrice).toString()) || 0
      setAmountUsd(amountUsd)
    }
  }, [asset, underlyingAsset, amount, selectVaultPrice, selectAssetPriceUsd])

  // console.log('InputAmount', asset)

  return (
    <HStack
      width={'100%'}
      justifyContent={'space-between'}
    >
      <Input height={inputHeight} flex={1} type={'number'} placeholder={'0'} variant={'balance'} value={amount} onChange={handleAmountChange} />
      <Amount.Usd abbreviateThresold={10000} textStyle={'captionSmall'} color={'brightGreen'} prefix={'≈ $'} value={amountUsd} />
    </HStack>
  )
}

type ActionComponentArgs = {
  itemIndex: number
  goBack?: Function
} & BoxProps

const Approve: React.FC<ActionComponentArgs> = ({ goBack, itemIndex, children }) => {
  const { account } = useWalletProvider()
  const { defaultAmount, dispatch, activeItem } = useOperativeComponent()
  const [ amount, setAmount ] = useState<string>(defaultAmount)
  const { underlyingAsset, vault, translate, theme } = useAssetProvider()
  const [ allowanceModeExact, setAllowanceModeExact ] = useState<boolean>(false)
  const [ amountToApprove, setAmountToApprove ] = useState<string>(defaultAmount)
  const { sendTransaction/*, sendTransactionTest*/, setGasLimit } = useTransactionManager()

  useEffect(() => {
    setAmount(defaultAmount)
  }, [defaultAmount])

  // const amountToApprove = useMemo((): string => {
  //   return !allowanceModeExact ? MAX_ALLOWANCE : amount
  // }, [allowanceModeExact, amount])

  const getDefaultGasLimit = useCallback(async () => {
    if (!vault || !("getAllowanceContractSendMethod" in vault) || !("getAllowanceParams" in vault)) return
    const sendOptions = {
      from: account?.address
    }
    const allowanceParams = vault.getAllowanceParams(MAX_ALLOWANCE)
    const allowanceContractSendMethod = vault.getAllowanceContractSendMethod(allowanceParams)
    if (!allowanceContractSendMethod) return
    return await estimateGasLimit(allowanceContractSendMethod, sendOptions)
  }, [account, vault])

  const approve = useCallback(() => {
    if (!vault || !("getAllowanceContractSendMethod" in vault) || !("getAllowanceParams" in vault)) return
    const allowanceParams = vault.getAllowanceParams(amountToApprove)
    const allowanceContractSendMethod = vault.getAllowanceContractSendMethod(allowanceParams)
    console.log('allowanceParams', allowanceParams, allowanceContractSendMethod)
    if (!allowanceContractSendMethod) return
    sendTransaction(vault.id, allowanceContractSendMethod)
    // sendTransactionTest(allowanceContractSendMethod)
  }, [amountToApprove, vault, sendTransaction])

  // Update amount to approve and parent amount
  useEffect(() => {
    const amountToApprove = !allowanceModeExact ? MAX_ALLOWANCE : amount
    // console.log('activeItem', activeItem, itemIndex, amountToApprove)
    setAmountToApprove(amountToApprove)
    if (activeItem !== itemIndex) return
    dispatch({type: 'SET_AMOUNT', payload: amountToApprove})
  }, [allowanceModeExact, amount, dispatch, activeItem, itemIndex])

  // Update gas fees
  useEffect(() => {
    if (activeItem !== itemIndex) return
    ;(async () => {
      const defaultGasLimit = await getDefaultGasLimit()
      setGasLimit(defaultGasLimit)
    })()
  }, [activeItem, itemIndex, getDefaultGasLimit, setGasLimit])

  // Update gas fees
  // useEffect(() => {
  //   ;(async () => {
  //     const defaultGasLimit = await getDefaultGasLimit()
  //     setGasLimit(defaultGasLimit)
  //   })()
  // }, [getDefaultGasLimit, setGasLimit])

  return (
    <VStack
      flex={1}
      alignItems={'flex-start'}
    >
      <NavBar goBack={goBack} translation={"modals.approve.header"} params={{asset: underlyingAsset?.name}} />
      <Flex
        p={14}
        pt={20}
        flex={1}
      >
        <VStack
          spacing={6}
        >
          <MdOutlineLockOpen size={72} />
          <Translation component={Text} prefix={`${translate("modals.approve.routerName")} `} translation={"modals.approve.body"} params={{asset: underlyingAsset?.name}} textStyle={['heading', 'h3']} textAlign={'center'} />
          <VStack
            width={'100%'}
            spacing={6}
          >
            <HStack
              py={2}
              width={'100%'}
              justifyContent={'space-between'}
              borderTop={`1px solid ${theme.colors.divider}`}
              borderBottom={`1px solid ${theme.colors.divider}`}
            >
              <Translation component={Text} translation={"trade.allowance"} textStyle={'captionSmall'} />
              <HStack
                spacing={1}
              >
                <Translation component={Text} translation={"trade.unlimited"} textStyle={['captionSmall', 'bold', 'clickable', !allowanceModeExact ? 'active' : 'inactive']} onClick={ (e: any) => setAllowanceModeExact(false) } />
                <Switch size={'sm'} isChecked={allowanceModeExact} onChange={ (e) => setAllowanceModeExact(e.target.checked) } />
                <Translation component={Text} translation={"trade.exact"} textStyle={['captionSmall', 'bold', 'clickable', allowanceModeExact ? 'active' : 'inactive']} onClick={ (e: any) => setAllowanceModeExact(true) } />
              </HStack>
            </HStack>
            {
              allowanceModeExact && (
                <HStack>
                  <AssetProvider.Icon size={'sm'} />
                  <Card
                    px={4}
                    py={2}
                    layerStyle={'cardLight'}
                  >
                    <InputAmount inputHeight={6} amount={amount} setAmount={setAmount} />
                  </Card>
                </HStack>
              )
            }
          </VStack>
          <Translation component={Button} translation={"common.approve"} onClick={approve} variant={'ctaFull'} />
        </VStack>
      </Flex>
      <EstimatedGasFees />
    </VStack>
  )
}

const ConnectWalletButton: React.FC<ButtonProps> = ({...props}) => {
  const { connect, connecting } = useWalletProvider()
  return connecting ? (
    <Button disabled={true} variant={'ctaFull'}>
      <Spinner size={'sm'} />
    </Button>
  ) : (
    <Translation component={Button} translation={"common.connectWallet"} onClick={() => connect()} variant={'ctaFull'} {...props} />
  )
}

const EstimatedGasFees: React.FC = () => {
  const theme = useTheme()
  const { chainToken } = useWalletProvider()
  const { state: { transactionSpeed, estimatedFees, estimatedFeesUsd } } = useTransactionManager()

  const gasFee = useMemo(() => {
    if (!estimatedFees) return null
    return estimatedFees[transactionSpeed]
  }, [estimatedFees, transactionSpeed])

  const gasFeeUsd = useMemo(() => {
    if (!estimatedFeesUsd) return null
    return estimatedFeesUsd[transactionSpeed]
  }, [estimatedFeesUsd, transactionSpeed])

  return (
    <HStack
      spacing={1}
      width={'100%'}
      alignItems={'center'}
    >
      <MdOutlineLocalGasStation color={theme.colors.ctaDisabled} size={24} />
      <Translation translation={'trade.estimatedGasFee'} suffix={':'} textStyle={'captionSmaller'} />
      <Amount.Usd textStyle={['captionSmaller', 'semiBold']} color={'primary'} prefix={TILDE} value={gasFeeUsd}></Amount.Usd>
      {
        gasFeeUsd && (
          <Amount textStyle={['captionSmaller', 'semiBold']} color={'primary'} prefix={`(`} suffix={`${chainToken?.symbol})`} value={gasFee} decimals={4}></Amount>
        )
      }
    </HStack>
  )
}

const Deposit: React.FC<ActionComponentArgs> = ({ itemIndex }) => {
  const [ amount, setAmount ] = useState('0')
  const [ error, setError ] = useState<string>('')
  const [ amountUsd, setAmountUsd ] = useState<number>(0)

  const { account } = useWalletProvider()
  const { sendTransaction, setGasLimit } = useTransactionManager()
  const { dispatch, activeItem, executeAction } = useOperativeComponent()
  const { selectors: { selectAssetPriceUsd, selectAssetBalance } } = usePortfolioProvider()
  const { asset, vault, underlyingAsset, underlyingAssetVault, translate } = useAssetProvider()

  const disabled = useMemo(() => {
    if (BNify(amount).lte(0)) return true
    if (selectAssetBalance){
      const assetBalance = selectAssetBalance(underlyingAsset?.id)
      if (BNify(amount).gt(assetBalance)){
        setError(translate('trade.errors.insufficientFundsForAmount', {symbol: underlyingAsset?.name}))
        return true
      }
    }
    setError('')
    return false
  }, [amount, selectAssetBalance, underlyingAsset, translate])

  // Deposit
  const deposit = useCallback((checkAllowance: boolean = true) => {
    if (!account || disabled) return
    if (!vault || !("getDepositContractSendMethod" in vault) || !("getDepositParams" in vault)) return
    if (!underlyingAssetVault || !("contract" in underlyingAssetVault) || !underlyingAssetVault.contract) return

    ;(async() => {
      if (!underlyingAssetVault.contract) return
      const vaultOwner = getVaultAllowanceOwner(vault)
      const allowance = checkAllowance ? await getAllowance(underlyingAssetVault.contract, account.address, vaultOwner) : BNify(amount)
      
      console.log('allowance', vaultOwner, account.address, allowance)

      if (allowance.gte(amount)){
        const depositParams = vault.getDepositParams(amount)
        const depositContractSendMethod = vault.getDepositContractSendMethod(depositParams)
        console.log('depositParams', depositParams, depositContractSendMethod)
        // if (checkAllowance) return dispatch({type: 'SET_ACTIVE_STEP', payload: 1})

        sendTransaction(vault.id, depositContractSendMethod)
        // sendTransactionTest(depositContractSendMethod)
      } else {
        // Go to approve section
        dispatch({type: 'SET_ACTIVE_STEP', payload: 1})
      }
    })()
  }, [account, disabled, amount, vault, underlyingAssetVault, dispatch, sendTransaction/*, sendTransactionTest*/])

  // Update amount USD and disabled
  useEffect(() => {
    if (!selectAssetPriceUsd || !underlyingAsset) return
    const assetPriceUsd = selectAssetPriceUsd(underlyingAsset.id)
    const amountUsd = parseFloat(BNify(amount).times(assetPriceUsd).toString()) || 0
    setAmountUsd(amountUsd)
  }, [underlyingAsset, amount, selectAssetPriceUsd, dispatch])

  // Set max balance function
  const setMaxBalance = useCallback(() => {
    if (!underlyingAsset?.balance) return
    setAmount(underlyingAsset.balance.toString())
  }, [underlyingAsset])

  const getDefaultGasLimit = useCallback(async () => {
    if (!vault || !("getDepositContractSendMethod" in vault) || !("getDepositParams" in vault)) return
    const defaultGasLimit = vault.getMethodDefaultGasLimit('deposit')
    if (!account){
      return defaultGasLimit
    }

    const sendOptions = {
      from: account?.address
    }
    const depositParams = vault.getDepositParams('0.0000001')
    const depositContractSendMethod = vault.getDepositContractSendMethod(depositParams)
    return await estimateGasLimit(depositContractSendMethod, sendOptions) || defaultGasLimit
  }, [account, vault])

  // Update gas fees
  useEffect(() => {
    if (activeItem !== itemIndex) return
    ;(async () => {
      const defaultGasLimit = await getDefaultGasLimit()
      setGasLimit(defaultGasLimit)
    })()
  }, [activeItem, itemIndex, getDefaultGasLimit, setGasLimit])

  // Update parent amount
  useEffect(() => {
    if (activeItem !== itemIndex) return
    dispatch({type: 'SET_AMOUNT', payload: amount})
    dispatch({type: 'SET_DEFAULT_AMOUNT', payload: amount})

    // console.log('executeAction', executeAction)
    if (executeAction) {
      deposit(false)
      dispatch({type: 'SET_EXECUTE_ACTION', payload: false})
    }

  }, [amount, activeItem, itemIndex, dispatch, executeAction, deposit])

  const depositButton = useMemo(() => {
    return account ? (
      <Translation component={Button} translation={"common.deposit"} disabled={disabled} onClick={deposit} variant={'ctaFull'} />
    ) : (
      <ConnectWalletButton />
    )
  }, [account, disabled, deposit])

  return (
    <AssetProvider
      flex={1}
      assetId={asset?.underlyingId}
    >
      <VStack
        flex={1}
        height={'100%'}
        id={'deposit-container'}
        alignItems={'space-between'}
        justifyContent={'flex-start'}
      >
        <HStack
          mt={10}
          flex={1}
          spacing={4}
          alignItems={'flex-start'}
        >
          <HStack
            pt={8}
            alignItems={'center'}
          >
            <AssetProvider.Icon size={'sm'} />
            <AssetProvider.Name textStyle={['heading','h3']} />
          </HStack>
          <VStack
            spacing={1}
            width={'100%'}
            alignItems={'flex-start'}
          >
            <Card
              px={4}
              py={2}
              layerStyle={'cardLight'}
            >
              <VStack
                spacing={2}
                alignItems={'flex-start'}
              >
                <InputAmount amount={amount} setAmount={setAmount} />
                <HStack
                  width={'100%'}
                  justifyContent={'space-between'}
                >
                  <HStack
                    spacing={1}
                  >
                    <Translation component={Text} translation={'common.balance'} textStyle={'captionSmaller'} />
                    <AssetProvider.Balance abbreviate={false} decimals={4} textStyle={'captionSmaller'} color={'primary'} />
                  </HStack>
                  <Button variant={'selector'} onClick={setMaxBalance}>MAX</Button>
                </HStack>
              </VStack>
            </Card>
            {
              error && <Text textStyle={'captionSmaller'} color={'orange'}>{error}</Text>
            }
          </VStack>
        </HStack>
        <VStack
          spacing={4}
          id={'footer'}
          alignItems={'flex-start'}
        >
          <Card.Outline px={4} py={2}>
            <HStack
              spacing={1}
            >
              <Translation translation={'assets.assetDetails.generalData.performanceFee'} textStyle={'captionSmaller'} />
              <AssetProvider
                assetId={asset?.id}
              >
                <AssetProvider.PerformanceFee textStyle={['captionSmaller', 'semiBold']} color={'primary'} />
              </AssetProvider>
            </HStack>
          </Card.Outline>
          <EstimatedGasFees />
          {depositButton}
        </VStack>
      </VStack>
    </AssetProvider>
  )
}
const Withdraw: React.FC<ActionComponentArgs> = ({ itemIndex }) => {
  const [ amount, setAmount ] = useState('0')
  const [ error, setError ] = useState<string>('')
  const [ amountUsd, setAmountUsd ] = useState<number>(0)

  const { account } = useWalletProvider()
  const { sendTransaction, setGasLimit } = useTransactionManager()
  const { dispatch, activeItem, executeAction } = useOperativeComponent()
  const { asset, vault, underlyingAsset, translate } = useAssetProvider()
  const { selectors: { selectAssetPriceUsd, selectVaultPrice, selectAssetBalance } } = usePortfolioProvider()

  const disabled = useMemo(() => {
    setError('')
    if (BNify(amount).lte(0)) return true
    if (!selectAssetBalance) return
    const assetBalance = selectAssetBalance(vault?.id)
    if (BNify(amount).gt(assetBalance)){
      setError(translate('trade.errors.insufficientFundsForAmount', {symbol: underlyingAsset?.name}))
      return true
    }
    return false
  }, [amount, selectAssetBalance, vault, underlyingAsset, translate])

  // Withdraw
  const withdraw = useCallback(() => {
    if (!account || disabled) return
    if (!vault || !("getWithdrawContractSendMethod" in vault) || !("getWithdrawParams" in vault)) return

    ;(async() => {
      const withdrawParams = vault.getWithdrawParams(amount)
      const withdrawContractSendMethod = vault.getWithdrawContractSendMethod(withdrawParams)
      console.log('withdrawParams', withdrawParams, withdrawContractSendMethod)
      sendTransaction(vault.id, withdrawContractSendMethod)
      // sendTransactionTest(withdrawContractSendMethod)
    })()
  }, [account, disabled, amount, vault, sendTransaction])

  // Update amount USD and disabled
  useEffect(() => {
    if (!selectAssetPriceUsd || !selectVaultPrice || !underlyingAsset || !vault) return
    const assetPriceUsd = selectAssetPriceUsd(underlyingAsset.id)
    const vaultPrice = selectVaultPrice(vault.id)
    const amountUsd = parseFloat(BNify(amount).times(assetPriceUsd).times(vaultPrice).toString()) || 0
    setAmountUsd(amountUsd)
  }, [underlyingAsset, vault, amount, selectVaultPrice, selectAssetPriceUsd, dispatch])

  // Set max balance function
  const setMaxBalance = useCallback(() => {
    if (!asset?.balance) return
    setAmount(asset.balance.toString())
  }, [asset])

  const getDefaultGasLimit = useCallback(async () => {
    if (!vault || !("getWithdrawContractSendMethod" in vault) || !("getWithdrawParams" in vault)) return
    
    const defaultGasLimit = vault.getMethodDefaultGasLimit('withdraw')
    if (!account){
      return defaultGasLimit
    }

    const sendOptions = {
      from: account?.address
    }
    const withdrawParams = vault.getWithdrawParams('0.0000001')
    const withdrawContractSendMethod = vault.getWithdrawContractSendMethod(withdrawParams)

    return await estimateGasLimit(withdrawContractSendMethod, sendOptions) || defaultGasLimit
  }, [account, vault])

  // Update gas fees
  useEffect(() => {
    if (activeItem !== itemIndex) return
    ;(async () => {
      const defaultGasLimit = await getDefaultGasLimit()
      setGasLimit(defaultGasLimit)
    })()
  }, [activeItem, itemIndex, getDefaultGasLimit, setGasLimit])

  // Update parent amount
  useEffect(() => {
    if (activeItem !== itemIndex || !selectVaultPrice || !vault) return
    const vaultPrice = selectVaultPrice(vault.id)
    dispatch({type: 'SET_AMOUNT', payload: BNify(amount).times(vaultPrice).toString()})
    dispatch({type: 'SET_DEFAULT_AMOUNT', payload: BNify(amount).times(vaultPrice).toString()})
  }, [vault, amount, selectVaultPrice, activeItem, itemIndex, dispatch, executeAction, withdraw])

  const withdrawButton = useMemo(() => {
    return account ? (
      <Translation component={Button} translation={"common.withdraw"} disabled={disabled} onClick={withdraw} variant={'ctaFull'} />
    ) : (
      <ConnectWalletButton />
    )
  }, [account, disabled, withdraw])

  return (
    <AssetProvider
      flex={1}
      assetId={asset?.id}
    >
      <VStack
        flex={1}
        height={'100%'}
        id={'withdraw-container'}
        alignItems={'space-between'}
        justifyContent={'flex-start'}
      >
        <HStack
          mt={10}
          flex={1}
          spacing={4}
          alignItems={'flex-start'}
        >
          <HStack
            pt={8}
            alignItems={'center'}
          >
            <AssetProvider.Icon size={'sm'} />
            <AssetProvider.Name textStyle={['heading','h3']} />
          </HStack>
          <VStack
            spacing={1}
            width={'100%'}
            alignItems={'flex-start'}
          >
            <Card
              px={4}
              py={2}
              layerStyle={'cardLight'}
            >
              <VStack
                spacing={2}
                alignItems={'flex-start'}
              >
                <InputAmount amount={amount} setAmount={setAmount} />
                <HStack
                  width={'100%'}
                  justifyContent={'space-between'}
                >
                  <HStack
                    spacing={1}
                  >
                    <Translation component={Text} translation={'common.balance'} textStyle={'captionSmaller'} />
                    <AssetProvider.Balance abbreviate={false} decimals={4} textStyle={'captionSmaller'} color={'primary'} />
                  </HStack>
                  <Button variant={'selector'} onClick={setMaxBalance}>MAX</Button>
                </HStack>
              </VStack>
            </Card>
            {
              error && <Text textStyle={'captionSmaller'} color={'orange'}>{error}</Text>
            }
          </VStack>
        </HStack>
        <VStack
          spacing={4}
          id={'footer'}
          alignItems={'flex-start'}
        >
          <Card.Outline px={4} py={2}>
            <HStack
              spacing={1}
            >
              <Translation translation={'assets.assetDetails.generalData.performanceFee'} textStyle={'captionSmaller'} />
              <AssetProvider
                assetId={asset?.id}
              >
                <AssetProvider.PerformanceFee textStyle={['captionSmaller', 'semiBold']} color={'primary'} />
              </AssetProvider>
            </HStack>
          </Card.Outline>
          <EstimatedGasFees />
          {withdrawButton}
        </VStack>
      </VStack>
    </AssetProvider>
  )
}

type NavBarProps = {
  height?: string
  goBack?: Function
  close?: Function
} & TranslationProps

const NavBar: React.FC<NavBarProps> = ({ goBack, close, height, ...props }) => {
  return (
    <HStack
      width={'100%'}
      position={'relative'}
      alignItems={'center'}
      height={height || '24px'}
      justifyContent={'flex-start'}
    >
      {
        goBack && (
          <Flex
            zIndex={1}
            position={'relative'}
          >
            <MdKeyboardArrowLeft
              size={24}
              onClick={() => goBack()}
              style={{cursor:'pointer'}}
            />
          </Flex>
        )
      }
      <Flex
        zIndex={0}
        width={'100%'}
        justifyContent={'center'}
        position={goBack ? 'absolute' : 'relative'}
      >
        <Translation component={Text} textStyle={'ctaStatic'} aria-selected={true} {...props} />
      </Flex>
      {
        close && (
          <Flex
            top={0}
            right={0}
            zIndex={1}
            position={'absolute'}
          >
            <MdOutlineClose
              size={24}
              onClick={() => close()}
              style={{cursor: 'pointer'}}
            />
          </Flex>
        )
      }
    </HStack>
  )
}

type TransactionStatusProps = {
  goBack: Function
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({ goBack }) => {
  const { chainId, explorer } = useWalletProvider()
  const [ progressValue, setProgressValue ] = useState<number>(0)
  const { underlyingAsset, theme, translate } = useAssetProvider()
  const [ countTimeoutId, setCountTimeoutId ] = useState<any>(null)
  const [ progressMaxValue, setProgressMaxValue ] = useState<number>(1)
  const [ progressTimeoutId, setProgressTimeoutId ] = useState<any>(null)
  const [ remainingTime, setRemainingTime ] = useState<number | null>(null)
  const [ targetTimestamp, setTargetTimestamp ] = useState<number | null>(null)
  const { amount, actionType, baseActionType, activeStep } = useOperativeComponent()
  const { state: { transaction: transactionState }, retry, cleanTransaction } = useTransactionManager()

  const startCircularProgress = useCallback(() => {
    if (!progressMaxValue || !transactionState?.timestamp) return
    const progressValue = Math.min(progressMaxValue, Date.now()-transactionState?.timestamp)
    setProgressValue(progressValue)

    if (progressValue>=progressMaxValue) return
    const timeoutId = setTimeout(startCircularProgress, 100)
    setProgressTimeoutId(timeoutId)
    // console.log('PROGRESS!')
  }, [progressMaxValue, transactionState?.timestamp])

  const startCountDown = useCallback(() => {
    if (!targetTimestamp) return

    const newRemainingTime = Math.max(0, Math.ceil((targetTimestamp-Date.now())/1000))
    if (!remainingTime || newRemainingTime > remainingTime) {
      setRemainingTime(newRemainingTime)
    }

    if (newRemainingTime<=0) return
    const timeoutId = setTimeout(startCountDown, 1000)
    setCountTimeoutId(timeoutId)
    // console.log('COUNTDOWN!')
  }, [remainingTime, targetTimestamp])

  // Cancel timeouts
  useEffect(() => {
    if (transactionState?.status === 'pending' || !countTimeoutId || !progressTimeoutId) return
    clearTimeout(countTimeoutId)
    clearTimeout(progressTimeoutId)
  }, [transactionState.status, countTimeoutId, progressTimeoutId, progressMaxValue])

  // Handle transaction succeded or failed
  useEffect(() => {
    if (!transactionState.status || !['success','failed'].includes(transactionState.status)) return
    setRemainingTime(0)
    setProgressValue(progressMaxValue)
  }, [transactionState?.status, setProgressValue, progressMaxValue])

  // Set progress max value
  useEffect(() => {
    if (!transactionState?.estimatedTime || !transactionState?.timestamp || transactionState?.status !== 'pending') return
    const progressMaxValue = (transactionState?.estimatedTime*1000)
    const targetTimestamp = +transactionState?.timestamp+(transactionState?.estimatedTime*1000)
    setTargetTimestamp(targetTimestamp)
    setProgressMaxValue(progressMaxValue)

    startCountDown()
    startCircularProgress()
    // console.log('START COUNTDOWN')
  }, [transactionState, startCountDown, startCircularProgress])

  const resetAndGoBack = useCallback((resetStep: boolean = false) => {
    if (transactionState?.status === 'pending') return
    cleanTransaction()
    setProgressValue(0)
    setRemainingTime(null)
    setProgressMaxValue(1)
    setCountTimeoutId(null)
    setTargetTimestamp(null)
    setProgressTimeoutId(null)
    return goBack(resetStep)
  }, [transactionState?.status, cleanTransaction, goBack])

  const body = useMemo(() => {
    switch (transactionState?.status) {
      case 'pending':
        return (
          <Translation component={Text} translation={progressValue>=progressMaxValue ? `modals.status.body.long` : `modals.${actionType}.status.pending`} textStyle={['heading', 'h3']} textAlign={'center'} />
        )
      case 'success':
        const amountToDisplay = amount === MAX_ALLOWANCE ? translate('trade.unlimited') : abbreviateNumber(amount, 8)
        return (
          <>
            <Translation component={Text} translation={`modals.${actionType}.status.success`} params={{asset: underlyingAsset?.name, amount: amountToDisplay }} textStyle={['heading', 'h3']} textAlign={'center'} />
            {
              activeStep ? (
                <Translation component={Button} translation={`common.${baseActionType}`} onClick={() => resetAndGoBack(true)} variant={'ctaFull'} />
              ) : (
                <Translation component={Button} prefix={`New `} translation={`common.${actionType}`} onClick={() => resetAndGoBack()} variant={'ctaFull'} />
              )
            }
          </>
        )
      case 'failed':
        return (
          <>
            <Translation component={Text} translation={`modals.${actionType}.status.failed`} params={{asset: underlyingAsset?.name, amount: abbreviateNumber(amount, 8) }} textStyle={['heading', 'h3']} textAlign={'center'} />
            <Translation component={Text} translation={`modals.status.body.failed`} params={{asset: underlyingAsset?.name, amount: abbreviateNumber(amount, 8) }} textStyle={'captionSmall'} textAlign={'center'} />
            <Translation component={Button} translation={"common.retry"} leftIcon={<MdOutlineRefresh size={24} />} onClick={() => retry} variant={'ctaFull'} />
            <Translation component={Text} translation={`common.cancel`} textStyle={['cta', 'link']} onClick={() => resetAndGoBack()} />
          </>
        )
      default:
        return null
    }
  }, [transactionState?.status, progressValue, translate, progressMaxValue, underlyingAsset, amount, activeStep, actionType, baseActionType, resetAndGoBack, retry])

  const isLongTransaction = useMemo(() => {
    return !!transactionState?.estimatedTime && transactionState?.status === 'pending' && progressValue>=progressMaxValue
  }, [transactionState?.estimatedTime, transactionState?.status, progressValue, progressMaxValue])

  const isIndeterminate = useMemo(() => {
    if (transactionState?.status && ['success', 'failed'].includes(transactionState?.status)) return false
    return !transactionState?.estimatedTime || isLongTransaction
  }, [transactionState, isLongTransaction])

  const circularProgressColor = useMemo(() => {
    if (!transactionState?.status || isIndeterminate) return 'blue.400'
    return ['success', 'pending'].includes(transactionState?.status) ? 'green.400' : 'red.400'
  }, [transactionState?.status, isIndeterminate])


  const circularProgress = useMemo(() => {
    return (
      <>
        <Box
          height={5}
        >
          <Translation component={Text} translation={transactionState?.status === 'pending' ? (transactionState?.estimatedTime ? "modals.status.estimatedTime" : "modals.status.calculateEstimatedTime") : ''} textStyle={'captionSmaller'} textAlign={'center'} />
        </Box>
        <Box
          width={'125px'}
          height={'125px'}
          bg={'card.bgLight'}
          borderRadius={'50%'}
          position={'relative'}
        >
          <CircularProgress max={progressMaxValue} isIndeterminate={isIndeterminate} value={progressValue} size={145} color={circularProgressColor} trackColor={'card.bgLight'} thickness={'5px'} position={'absolute'} top={'-10px'} left={'-10px'} >
            {
              transactionState?.status === 'pending' ? 
                !!remainingTime && <CircularProgressLabel textStyle={['bold', 'h2']}>{remainingTime > 3600 ? `>1h` : ( remainingTime > 1800 ? `>30m` : `${remainingTime}s`)}</CircularProgressLabel>
              : transactionState?.status === 'success' ? (
                <CircularProgressLabel
                  display={'flex'}
                  alignItems={'center'}
                  justifyContent={'center'}
                >
                  <MdOutlineDone size={50} color={theme.colors.green['400']} />
                </CircularProgressLabel>
              ) : transactionState?.status === 'failed' && (
                <CircularProgressLabel
                  display={'flex'}
                  alignItems={'center'}
                  justifyContent={'center'}
                >
                  <MdOutlineClose size={50} color={theme.colors.red['400']} />
                </CircularProgressLabel>
              )
            }
          </CircularProgress>
        </Box>
      </>
    )
  }, [transactionState?.status, transactionState?.estimatedTime, isIndeterminate, circularProgressColor, progressMaxValue, remainingTime, progressValue, theme])

  const navBar = useMemo(() => {
    const goBack = transactionState?.status !== 'pending' && resetAndGoBack
    return (
      <NavBar goBack={goBack ? () => goBack() : undefined} translation={`modals.status.header.${transactionState?.status}`} />
    )
  }, [transactionState?.status, resetAndGoBack])

  return (
    <>
      {navBar}
      <Flex
        p={14}
        flex={1}
        width={'100%'}
      >
        <VStack
          spacing={4}
        >
          {circularProgress}
          {body}
        </VStack>
      </Flex>
      {
        transactionState?.hash && (
          <HStack
            spacing={1}
            width={'100%'}
            justifyContent={'center'}
          >
            <Translation<LinkProps> component={Link} translation={`defi.viewOnChain`} textStyle={['captionSmall', 'link', 'bold']} isExternal href={getExplorerTxUrl(chainId, explorer, transactionState.hash)} />
          </HStack>
        )
      }
    </>
  )
}

type TransactionSpeedSelectorProps = {
  save: Function
}

const TransactionSpeedSelector: React.FC<TransactionSpeedSelectorProps> = ({ save }) => {
  const { state: { estimatedFeesUsd, estimatedTimes, transactionSpeed: currentTransactionSpeed}, setTransactionSpeed } = useTransactionManager()
  return (
    <VStack
      p={4}
      flex={1}
      width={'100%'}
      justifyContent={'space-between'}
    >
      <NavBar height={'auto'} mb={10} translation={'common.transactionSpeed'} />
      <VStack
        p={0}
        flex={1}
        spacing={2}
        width={'100%'}
        justifyContent={'flex-start'}
      >
        {
          (Object.keys(TransactionSpeed) as Array<keyof typeof TransactionSpeed>).map( (transactionSpeedKey: keyof typeof TransactionSpeed) => {
            const transactionSpeed: TransactionSpeed = TransactionSpeed[transactionSpeedKey]
            const isActive = currentTransactionSpeed === transactionSpeed
            return (
              <Card.Outline
                px={4}
                py={4}
                style={{
                  cursor:'pointer'
                }}
                width={'100%'}
                aria-selected={isActive}
                layerStyle={['cardInteractive']}
                key={`transactionSpeed_${transactionSpeed}`} 
                bg={isActive ? 'card.bgLight' : 'transparent'}
                onClick={() => setTransactionSpeed(transactionSpeed)}
              >
                <SimpleGrid
                  columns={3}
                  spacing={4}
                  width={'100%'}
                  alignItems={'center'}
                >
                  <HStack
                    spacing={2}
                  >
                    <Radio colorScheme={'blue'} isChecked={isActive}></Radio>
                    <Translation component={Text} textStyle={['tableCell', 'primary']} translation={`modals.send.sendForm.${transactionSpeed}`} />
                  </HStack>
                  <VStack
                    spacing={2}
                    alignItems={'flex-start'}
                    justifyContent={'flex-start'}
                  >
                    <Translation component={Text} textStyle={'captionSmall'} translation={`common.gasFee`} />
                    <SkeletonText noOfLines={1} isLoaded={!!estimatedFeesUsd} width={'100%'}>
                      <Amount.Usd textStyle={['captionSmaller', 'semiBold']} color={'primary'} prefix={TILDE} value={estimatedFeesUsd?.[transactionSpeed]}></Amount.Usd>
                    </SkeletonText>
                  </VStack>
                  <VStack
                    spacing={2}
                    alignItems={'flex-start'}
                    justifyContent={'flex-start'}
                  >
                    <Translation component={Text} textStyle={'captionSmall'} translation={`modals.status.estimatedTime`} />
                    <SkeletonText noOfLines={1} isLoaded={!!estimatedTimes} width={'100%'}>
                      <Text textStyle={['captionSmaller', 'semiBold']} color={'primary'}>{formatTime(estimatedTimes?.[transactionSpeed])}</Text>
                    </SkeletonText>
                  </VStack>
                </SimpleGrid>
              </Card.Outline>
            )
          })
        }
      </VStack>
      <Translation component={Button} translation={"common.save"} onClick={() => save()} variant={'ctaFull'} />
    </VStack>
  )
}

type ActionStep = {
  type: string
  label: string
  component: any
}

type OperativeComponentAction = ActionStep & {
  steps: ActionStep[]
}

const actions: OperativeComponentAction[] = [
  {
    type: 'deposit',
    component: Deposit,
    label: 'common.deposit',
    steps: [
      {
        type: 'approve',
        component: Approve,
        label:'modals.approve.header',
      }
    ]
  },
  {
    type: 'withdraw',
    label: 'common.withdraw',
    component: Withdraw,
    steps: []
  }
]

interface OperativeComponentContextProps {
  amount: string
  activeStep: number
  dispatch: Function
  actionType: string
  activeItem: number
  defaultAmount: string
  executeAction: boolean
  baseActionType: string
}

const initialState: OperativeComponentContextProps = {
  amount: '',
  activeStep: 0,
  activeItem: 0,
  actionType: '',
  defaultAmount: '',
  baseActionType: '',
  dispatch: () => {},
  executeAction: false
}

const reducer = (state: OperativeComponentContextProps, action: ReducerActionTypes) => {
  switch (action.type){
    case 'SET_AMOUNT':
      return {...state, amount: action.payload}
    case 'SET_EXECUTE_ACTION':
      console.log('SET_EXECUTE_ACTION', action.payload)
      return {...state, executeAction: action.payload}
    case 'SET_DEFAULT_AMOUNT':
      return {...state, defaultAmount: action.payload}
    case 'SET_ACTION_TYPE':
      return {...state, actionType: action.payload}
    case 'SET_BASE_ACTION_TYPE':
      return {...state, baseActionType: action.payload}
    case 'SET_ACTIVE_STEP':
      return {...state, activeStep: action.payload}
    default:
      return {...state}
  }
}

const OperativeComponentContext = createContext<OperativeComponentContextProps>(initialState)
const useOperativeComponent = () => useContext(OperativeComponentContext)

type OperativeComponentArgs = {
  assetId?: AssetId
}

export const OperativeComponent: React.FC<OperativeComponentArgs> = ({ assetId }) => {
  const [ activeItem, setActiveItem ] = useState<number>(0)
  const [ actionIndex, setActionIndex ] = useState<number>(0)
  const [ transactionSpeedSelectorOpened, setTransactionSpeedSelectorOpened ] = useState<boolean>(false)

  const { underlyingAsset, translate } = useAssetProvider()
  const [ state, dispatch ] = useReducer(reducer, initialState)
  const { state: { gasPrice, transaction: transactionState }, retry } = useTransactionManager()

  const handleActionChange = (index: number) => {
    setActionIndex(index)
  }

  const activeAction = useMemo(() => actions[actionIndex], [actionIndex])
  const activeStep = useMemo(() => !state.activeStep ? activeAction : activeAction.steps[state.activeStep-1], [activeAction, state.activeStep])
  const ActionComponent = useMemo((): React.FC<ActionComponentArgs> | null => actions[actionIndex].component, [actionIndex])

  // console.log('actionIndex', actionIndex)

  useEffect(() => {
    setActiveItem(state.activeStep)
  }, [state.activeStep])

  useEffect(() => {
    const actionType = activeStep ? activeStep.type : activeAction.type
    dispatch({type:'SET_ACTION_TYPE', payload: actionType})
    dispatch({type:'SET_BASE_ACTION_TYPE', payload: activeAction.type})
  }, [activeAction, activeStep])

  const amountToDisplay = useMemo(() => {
    return state.amount === MAX_ALLOWANCE ? translate('trade.unlimited') : parseFloat(state.amount)
  }, [state.amount, translate])

  useEffect(() => {
    // console.log('TransactionProcess', transactionState)
    const firstProcessIndex = activeAction.steps.length+1
    switch (transactionState?.status) {
      case 'created':
        return setActiveItem(firstProcessIndex)
      break;
      case 'pending':
        return setActiveItem(firstProcessIndex+1)
      break;
      case 'failed':
        switch (transactionState.error?.code) {
          case 4001:
            return setActiveItem(state.activeStep)
          break;
          default:
            return setActiveItem(firstProcessIndex+1)
          break;
        }
      break;
      case 'success':
        setActiveItem(firstProcessIndex+1)
        // If internal step is active return to step 0
        if (state.activeStep) {
          // Automatically execute action after going back
          dispatch({type: 'SET_EXECUTE_ACTION', payload: true})
          // setTimeout(() => {
          //   dispatch({type:'SET_ACTIVE_STEP', payload: 0})
          // },2000)
        }
        // return activeAction.onComplete()
      break;
      default:
      break;
    }
  }, [transactionState, activeAction, state.activeStep])

  const transationSpeedToggler = useMemo(() => {
    if (activeItem > activeAction.steps.length) return null
    return transactionSpeedSelectorOpened ? (
      <Flex
        top={5}
        right={8}
        zIndex={11}
        position={'absolute'}
      >
        <MdOutlineClose
          size={24}
          style={{cursor: 'pointer'}}
          onClick={() => setTransactionSpeedSelectorOpened( prevValue => !prevValue )}
        />
      </Flex>
    ) :  (
      <Button
        p={2}
        right={4}
        zIndex={11}
        borderRadius={8}
        variant={'ctaBlue'}
        position={'absolute'}
        onClick={() => setTransactionSpeedSelectorOpened( prevValue => !prevValue )}
      >
        <HStack
          spacing={1}
        >
          <MdOutlineLocalGasStation color={'primary'} size={24} />
          <Amount abbreviate={false} textStyle={'titleSmall'} color={'primary'} value={gasPrice} />
        </HStack>
      </Button>
    )
  }, [activeAction, activeItem, gasPrice, transactionSpeedSelectorOpened, setTransactionSpeedSelectorOpened])

  const goBack = useCallback((resetStep: boolean = false) => {
    if (resetStep){
      return dispatch({type: 'SET_ACTIVE_STEP', payload: 0})
    }
    return setActiveItem(state.activeStep)
  }, [dispatch, setActiveItem, state.activeStep])

  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <OperativeComponentContext.Provider value={{...state, activeItem, dispatch}}>
        <Card.Flex
          p={4}
          width={'100%'}
          minHeight={'590px'}
          direction={'column'}
          position={'relative'}
          alignItems={'flex-start'}
          id={'operative-component'}
        >
          {transationSpeedToggler}
          {
            transactionSpeedSelectorOpened && (
              <VStack
                top={0}
                left={0}
                flex={1}
                zIndex={10}
                bg={'card.bg'}
                width={'100%'}
                height={'100%'}
                position={'absolute'}
                id={'transaction-speed-selector'}
              >
                <TransactionSpeedSelector save={() => setTransactionSpeedSelectorOpened(false)} />
              </VStack>
            )
          }
          <ChakraCarousel
            gap={0}
            activeItem={activeItem}
          >
            <Flex
              flex={1}
              direction={'column'}
              alignItems={'flex-start'}
            >
              <HStack
                alignItems={'center'}
                justifyContent={'space-between'}
                id={'operative-component-header'}
              >
                <Tabs
                  defaultIndex={0}
                  variant={'button'}
                  onChange={handleActionChange}
                >
                  <TabList>
                    {
                      actions.map( (action, index) => (
                        <Translation key={`action_${index}`} mr={2} component={Tab} translation={action.label} />
                      ))
                    }
                  </TabList>
                </Tabs>
              </HStack>
              <Flex
                flex={1}
                width={'100%'}
              >
                {!!ActionComponent && <ActionComponent itemIndex={0} />}
              </Flex>
            </Flex>
            {
              actions[actionIndex].steps.map((step, index) => {
                const StepComponent = step.component
                return (
                  <StepComponent key={`step_${index}`} itemIndex={index+1} goBack={() => dispatch({type:'SET_ACTIVE_STEP', payload: index})} />
                )
              })
            }
            <VStack
              flex={1}
              spacing={0}
              id={'confirm-on-wallet'}
              alignItems={'flex-start'}
            >
              <NavBar goBack={() => setActiveItem(state.activeStep) } translation={`modals.confirm.${state.actionType}.header`} />
              <Center
                p={14}
                flex={1}
                width={'100%'}
              >
                <VStack
                  spacing={6}
                >
                  <MdOutlineAccountBalanceWallet size={72} />
                  <Translation component={Text} translation={"trade.confirmTransactionWallet"} textStyle={['heading', 'h3']} textAlign={'center'} />
                  <VStack
                    spacing={1}
                  >
                    <Translation component={Text} translation={`modals.${state.actionType}.status.confirm`} params={{}} textStyle={'captionSmall'} textAlign={'center'} />
                    <HStack>
                      <Amount textStyle={'bold'} value={amountToDisplay} decimals={8} suffix={` ${underlyingAsset?.name}`}></Amount>
                    </HStack>
                  </VStack>
                </VStack>
              </Center>
              <HStack
                spacing={1}
                width={'100%'}
                justifyContent={'center'}
              >
                <Translation component={Text} translation={`trade.transactionDontAppear`} textStyle={'captionSmall'} />
                <Translation component={Text} translation={`common.retry`} textStyle={['captionSmall', 'link', 'bold']} onClick={() => retry()} />
              </HStack>
            </VStack>

            <VStack
              flex={1}
              spacing={0}
              alignItems={'flex-start'}
              id={'transaction-status'}
            >
              <TransactionStatus goBack={goBack} />
            </VStack>
          </ChakraCarousel>
        </Card.Flex>
      </OperativeComponentContext.Provider>
    </AssetProvider>
  )
}