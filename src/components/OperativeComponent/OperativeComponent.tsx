import BigNumber from 'bignumber.js'
import { TransactionSpeed } from 'constants/'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import type { VaultMessages } from 'constants/vaults'
import { TILDE, MAX_ALLOWANCE } from 'constants/vars'
import { Card, CardProps } from 'components/Card/Card'
import { useWalletProvider } from 'contexts/WalletProvider'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { ChakraCarousel } from 'components/ChakraCarousel/ChakraCarousel'
import type { Asset, ReducerActionTypes, AssetId } from 'constants/types'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { TranslationProps, Translation } from 'components/Translation/Translation'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import React, { useState, useRef, useEffect, useCallback, useMemo, useReducer, useContext, createContext } from 'react'
import { BNify, getAllowance, getVaultAllowanceOwner, estimateGasLimit, formatTime, abbreviateNumber, getExplorerTxUrl, apr2apy } from 'helpers/'
import { MdOutlineAccountBalanceWallet, MdOutlineLocalGasStation, MdKeyboardArrowLeft, MdOutlineLockOpen, MdOutlineRefresh, MdOutlineDone, MdOutlineClose } from 'react-icons/md'
import { TextProps, BoxProps, useTheme, Switch, Center, Box, Flex, VStack, HStack, SkeletonText, Text, Radio, Button, ButtonProps, Tabs, TabList, Tab, Input, CircularProgress, CircularProgressLabel, SimpleGrid, Spinner, Link, LinkProps } from '@chakra-ui/react'

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

export const Approve: React.FC<ActionComponentArgs> = ({ goBack, itemIndex, children }) => {
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
    const estimatedGasLimit = await estimateGasLimit(allowanceContractSendMethod, sendOptions)
    // console.log('APPROVE - estimatedGasLimit', estimatedGasLimit)
    return estimatedGasLimit
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

type DynamicActionFieldsProps = {
  action: string
  amount: string
  amountUsd: number
  assetId: AssetId | undefined
}

type DynamicActionFieldProps = {
  field: string
} & TextProps & DynamicActionFieldsProps

export const DynamicActionField: React.FC<DynamicActionFieldProps> = ({ assetId, field, action, amount, amountUsd, ...textProps }) => {
  const { helpers: { vaultFunctionsHelper }, selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return assetId && selectAssetById && selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const vault = useMemo(() => {
    return assetId && selectVaultById && selectVaultById(assetId)
  }, [assetId, selectVaultById])


  const newTrancheTvl = useMemo(() => BNify(asset.tvl).plus(amount), [asset, amount])
  const newApr = useMemo(() => vaultFunctionsHelper?.getVaultNewApr(asset, vault, BNify(amount)) || asset?.apr, [asset, vault, amount, vaultFunctionsHelper])
  const newApy = useMemo(() => apr2apy(BNify(newApr).div(100)).times(100), [newApr])
  // console.log('newApy', amount, newApr.toString(), newApy.toString())

  const amountIsValid = BNify(amountUsd).gt(0)

  switch (field){
    case 'boost':
      const apyBoost = newApy && asset?.baseApr?.gt(0) ? newApy.div(asset?.baseApr) : BNify(0)
      return <Text {...textProps} textStyle={'titleSmall'} color={'primary'}>{apyBoost.toFixed(2)}x</Text>
    case 'overperformance':
      const basePerformance = BNify(amountUsd).times(BNify(asset?.baseApr).div(100))
      const tranchePerformance = BNify(amountUsd).times(BNify(asset?.apy).div(100))
      const overperformance = amountIsValid ? tranchePerformance.minus(basePerformance) : null
      return <Amount.Usd textStyle={'titleSmall'} color={'primary'} {...textProps} value={overperformance} suffix={'/year'} />
    case 'newApy':
      return <Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={amountIsValid ? newApy : null} />
    case 'coverage':
      const bbTranche = selectAssetById(vault?.vaultConfig.Tranches.BB.address)
      const coverageAmount = bbTranche.tvl && newTrancheTvl ? bbTranche.tvl.div(newTrancheTvl).times(100) : 0;
      return <Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={amountIsValid ? coverageAmount : null} />
    default:
      return null
  }
}

export const DynamicActionFields: React.FC<DynamicActionFieldsProps> = (props) => {
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const { assetId, action, amount, amountUsd } = props

  const vault = useMemo(() => {
    return assetId && selectVaultById && selectVaultById(assetId)
  }, [assetId, selectVaultById])

  const strategy = useMemo(() => {
    return vault?.type && strategies[vault.type]
  }, [vault])

  if (!strategy?.dynamicActionFields?.[action]) return null

  const dynamicActionFields = strategy?.dynamicActionFields[action]

  return (
    <VStack
      spacing={2}
      width={'100%'}
    >
      {
        dynamicActionFields.map( (dynamicField: string) => (
          <HStack
            pb={2}
            px={4}
            width={'100%'}
            alignItems={'center'}
            borderBottom={`1px solid`}
            borderBottomColor={'divider'}
            justifyContent={'space-between'}
            key={`dynamicField_${dynamicField}`}
          >
            <Translation component={Text} translation={`dynamicActionFields.${dynamicField}`} textStyle={'captionSmall'} />
            <DynamicActionField {...props} field={dynamicField} />
          </HStack>
        ))
      }
    </VStack>
  )
}

export const Deposit: React.FC<ActionComponentArgs> = ({ itemIndex }) => {
  const [ error, setError ] = useState<string>('')
  const [ amount, setAmount ] = useState<string>('0')
  const [ amountUsd, setAmountUsd ] = useState<number>(0)

  const { account } = useWalletProvider()
  const { dispatch, activeItem, executeAction } = useOperativeComponent()
  const { sendTransaction, setGasLimit, state: { transaction } } = useTransactionManager()
  const { selectors: { selectAssetPriceUsd, selectAssetBalance } } = usePortfolioProvider()
  const { asset, vault, underlyingAsset, underlyingAssetVault, translate } = useAssetProvider()

  const assetBalance = useMemo(() => {
    if (!selectAssetBalance) return BNify(0)
    return selectAssetBalance(underlyingAsset?.id)
  }, [selectAssetBalance, underlyingAsset?.id])


  const disabled = useMemo(() => {
    setError('')
    if (BNify(amount).isNaN() || BNify(amount).lte(0)) return true
    // if (BNify(assetBalance).lte(0)) return true
    if (BNify(amount).gt(assetBalance)){
      setError(translate('trade.errors.insufficientFundsForAmount', {symbol: underlyingAsset?.name}))
      return true
    }
    return false
  }, [amount, assetBalance, underlyingAsset, translate])

  // console.log('assetBalance', amount, assetBalance.toString(), disabled)

  // Deposit
  const deposit = useCallback((checkAllowance: boolean = true) => {
    if (!account || disabled) return
    if (!vault || !("getDepositContractSendMethod" in vault) || !("getDepositParams" in vault)) return
    if (!vault || !("getAllowanceContract" in vault)) return
    // if (!underlyingAssetVault || !("contract" in underlyingAssetVault) || !underlyingAssetVault.contract) return

    ;(async() => {
      // if (!underlyingAssetVault.contract) return
      const allowanceContract = vault.getAllowanceContract()
      if (!allowanceContract) return

      const vaultOwner = getVaultAllowanceOwner(vault)
      const allowance = checkAllowance ? await getAllowance(allowanceContract, account.address, vaultOwner) : BNify(amount)
      
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
  }, [account, disabled, amount, vault, dispatch, sendTransaction/*, sendTransactionTest*/])

  // Update amount USD and disabled
  useEffect(() => {
    if (!selectAssetPriceUsd || !underlyingAsset) return
    const assetPriceUsd = selectAssetPriceUsd(underlyingAsset.id)
    const amountUsd = parseFloat(BNify(amount).times(assetPriceUsd).toString()) || 0
    setAmountUsd(amountUsd)
  }, [underlyingAsset, amount, selectAssetPriceUsd, dispatch])

  // Reset amount on transaction succeeded
  useEffect(() => {
    if (transaction.status === 'success'){
      setAmount('')
    }
  }, [transaction.status])

  // Set max balance function
  const setMaxBalance = useCallback(() => {
    if (!underlyingAsset?.balance) return
    setAmount(underlyingAsset.balance.toString())
  }, [underlyingAsset])

  const getDefaultGasLimit = useCallback(async () => {
    if (!vault || !("getDepositContractSendMethod" in vault) || !("getDepositParams" in vault)) return
    const defaultGasLimit = vault.getMethodDefaultGasLimit('deposit')

    // console.log('getDefaultGasLimit', underlyingAsset, assetBalance.toFixed())
    if (!account || assetBalance.lte(0)){
      return defaultGasLimit
    }

    const sendOptions = {
      from: account?.address
    }
    const depositParams = vault.getDepositParams(assetBalance.toFixed())
    const depositContractSendMethod = vault.getDepositContractSendMethod(depositParams)

    const estimatedGasLimit = await estimateGasLimit(depositContractSendMethod, sendOptions) || defaultGasLimit
    // console.log('DEPOSIT - estimatedGasLimit', assetBalance.toFixed(), depositParams, estimatedGasLimit)
    return estimatedGasLimit
  }, [account, vault, assetBalance])

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
    dispatch({type: 'SET_ASSET', payload: underlyingAsset})

    // console.log('executeAction', executeAction)
    if (executeAction) {
      deposit(false)
      dispatch({type: 'SET_EXECUTE_ACTION', payload: false})
    }

  }, [amount, activeItem, underlyingAsset, itemIndex, dispatch, executeAction, deposit])

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
        pt={8}
        flex={1}
        spacing={6}
        height={'100%'}
        id={'deposit-container'}
        alignItems={'space-between'}
        justifyContent={'flex-start'}
      >
        <VStack
          flex={1}
          spacing={8}
          width={'100%'}
          alignItems={'flex-start'}
        >
          <HStack
            spacing={4}
            width={'100%'}
            alignItems={'flex-start'}
          >
            <Box
              pt={8}
            >
              <AssetLabel assetId={asset?.id} />
            </Box>
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
          <DynamicActionFields assetId={asset?.id} action={'deposit'} amount={amount} amountUsd={amountUsd} />
        </VStack>
        <VStack
          spacing={4}
          id={'footer'}
          alignItems={'flex-start'}
        >
          {
            /*
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
            */
          }
          <EstimatedGasFees />
          {depositButton}
        </VStack>
      </VStack>
    </AssetProvider>
  )
}
export const Withdraw: React.FC<ActionComponentArgs> = ({ itemIndex }) => {
  const [ amount, setAmount ] = useState('0')
  const [ error, setError ] = useState<string>('')
  const [ amountUsd, setAmountUsd ] = useState<number>(0)

  const { account } = useWalletProvider()
  const { dispatch, activeItem, executeAction } = useOperativeComponent()
  const { asset, vault, underlyingAsset, translate } = useAssetProvider()
  const { sendTransaction, setGasLimit, state: { transaction } } = useTransactionManager()
  const { selectors: { selectAssetPriceUsd, selectVaultPrice, selectAssetBalance } } = usePortfolioProvider()

  const vaultBalance = useMemo(() => {
    if (!selectAssetBalance) return BNify(0)
    return selectAssetBalance(vault?.id)
  }, [selectAssetBalance, vault?.id])

  const assetBalance = useMemo(() => {
    if (!selectAssetBalance) return BNify(0)
    const balance = selectAssetBalance(vault?.id)
    const vaultPrice = selectVaultPrice(vault?.id)
    return balance.times(vaultPrice)
  }, [selectAssetBalance, selectVaultPrice, vault?.id])

  const disabled = useMemo(() => {
    setError('')
    if (BNify(amount).isNaN() || BNify(amount).lte(0)) return true
    // if (BNify(assetBalance).lte(0)) return true
    if (BNify(amount).gt(assetBalance)){
      setError(translate('trade.errors.insufficientFundsForAmount', {symbol: underlyingAsset?.name}))
      return true
    }
    return false
  }, [amount, assetBalance, underlyingAsset, translate])

  // Withdraw
  const withdraw = useCallback(() => {
    if (!account || disabled) return
    if (!vault || !("getWithdrawContractSendMethod" in vault) || !("getWithdrawParams" in vault)) return

    ;(async() => {
      const vaultPrice = selectVaultPrice(vault.id)
      const amountToWithdraw = BigNumber.minimum(vaultBalance, BNify(amount).div(vaultPrice))
      const withdrawParams = vault.getWithdrawParams(amountToWithdraw)
      const withdrawContractSendMethod = vault.getWithdrawContractSendMethod(withdrawParams)
      console.log('withdrawParams', withdrawParams, withdrawContractSendMethod)
      sendTransaction(vault.id, withdrawContractSendMethod)
      // sendTransactionTest(withdrawContractSendMethod)
    })()
  }, [account, disabled, amount, vault, vaultBalance, selectVaultPrice, sendTransaction])

  // Reset amount on transaction succeeded
  useEffect(() => {
    if (transaction.status === 'success'){
      setAmount('')
    }
  }, [transaction.status])

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
    if (!assetBalance) return
    setAmount(assetBalance.toString())
  }, [assetBalance])

  const getDefaultGasLimit = useCallback(async () => {
    if (!vault || !("getWithdrawContractSendMethod" in vault) || !("getWithdrawParams" in vault)) return
    
    const defaultGasLimit = vault.getMethodDefaultGasLimit('withdraw')
    if (!account || vaultBalance.lte(0)){
      return defaultGasLimit
    }

    const sendOptions = {
      from: account?.address
    }
    const withdrawParams = vault.getWithdrawParams(vaultBalance.toFixed())
    const withdrawContractSendMethod = vault.getWithdrawContractSendMethod(withdrawParams)

    const estimatedGasLimit = await estimateGasLimit(withdrawContractSendMethod, sendOptions) || defaultGasLimit
    // console.log('WITHDRAW - estimatedGasLimit', assetBalance.toFixed(), estimatedGasLimit)
    return estimatedGasLimit
  }, [account, vaultBalance, vault])

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
    dispatch({type: 'SET_ASSET', payload: asset})

    if (!selectVaultPrice || !vault) return
    const vaultPrice = selectVaultPrice(vault.id)
    dispatch({type: 'SET_AMOUNT', payload: BNify(amount).toString()})
    dispatch({type: 'SET_DEFAULT_AMOUNT', payload: BNify(amount).toString()})
  }, [vault, asset, amount, selectVaultPrice, activeItem, itemIndex, dispatch, executeAction, withdraw])

  const withdrawButton = useMemo(() => {
    return account ? (
      <Translation component={Button} translation={"common.withdraw"} disabled={disabled} onClick={withdraw} variant={'ctaFull'} />
    ) : (
      <ConnectWalletButton />
    )
  }, [account, disabled, withdraw])

  const vaultMessages = useMemo((): VaultMessages | undefined => {
    return vault && ("messages" in vault) ? vault.messages : undefined
  }, [vault])

  return (
    <AssetProvider
      flex={1}
      assetId={asset?.id}
    >
      <VStack
        pt={8}
        flex={1}
        spacing={6}
        width={'100%'}
        height={'100%'}
        id={'withdraw-container'}
        alignItems={'space-between'}
        justifyContent={'flex-start'}
      >
        {
          vaultMessages?.withdraw ? (
            <Card.Dark
              p={2}
              border={0}
            >
              <Translation textStyle={'captionSmaller'} translation={vaultMessages.withdraw} textAlign={'center'} />
            </Card.Dark>
          ) : null
        }
        <HStack
          flex={1}
          spacing={4}
          width={'100%'}
          alignItems={'flex-start'}
        >
          <Box
            pt={8}
          >
            <AssetLabel assetId={asset?.id} />
          </Box>
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
                    <AssetProvider.VaultBalance abbreviate={false} decimals={4} textStyle={'captionSmaller'} color={'primary'} />
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
          {
            /*
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
            */
          }
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
  const countTimeoutId = useRef<any>(null)
  const { chainId, explorer } = useWalletProvider()
  const [ progressValue, setProgressValue ] = useState<number>(0)
  const { underlyingAsset, theme, translate } = useAssetProvider()
  // const [ countTimeoutId, setCountTimeoutId ] = useState<any>(null)
  const [ progressMaxValue, setProgressMaxValue ] = useState<number>(1)
  const [ remainingTime, setRemainingTime ] = useState<number | null>(null)
  const [ targetTimestamp, setTargetTimestamp ] = useState<number | null>(null)
  const { amount, actionType, baseActionType, activeStep, activeItem } = useOperativeComponent()
  const { state: { transaction: transactionState }, retry, cleanTransaction } = useTransactionManager()

  const startCountDown = useCallback((targetTimestamp: number) => {
    // console.log('TransactionStatus - startCountDown', targetTimestamp, transactionState.status, transactionState)
    if (!targetTimestamp || !transactionState.status || transactionState.status!=='pending') return

    const newRemainingTime = Math.max(0, Math.ceil((targetTimestamp-Date.now())/1000))
    if (!remainingTime || newRemainingTime > remainingTime) {
      setRemainingTime(newRemainingTime)
    }

    if (newRemainingTime<=0) return
    countTimeoutId.current = setTimeout(() => {
      startCountDown(targetTimestamp)
    }, 1000)
    // setCountTimeoutId(timeoutId)
  }, [remainingTime, transactionState])

  // Handle transaction succeded or failed
  useEffect(() => {
    // console.log('transactionState.status', transactionState.status, progressValue, progressMaxValue)
    if (!transactionState.status || !['success','failed'].includes(transactionState.status)) return
    if (countTimeoutId.current) {
      clearTimeout(countTimeoutId.current)
    }
    setRemainingTime(0)
    countTimeoutId.current = null
    setProgressValue(progressMaxValue)
  // eslint-disable-next-line
  }, [transactionState?.status, setProgressValue, progressMaxValue])

  // Set progress max value
  useEffect(() => {
    if (!transactionState?.estimatedTime || !transactionState?.timestamp || transactionState?.status !== 'pending' || targetTimestamp) return

    const progressMaxValue = (transactionState?.estimatedTime*1000)
    const newTargetTimestamp = +transactionState?.timestamp+(transactionState?.estimatedTime*1000)
    setTargetTimestamp(newTargetTimestamp)
    setProgressMaxValue(progressMaxValue)

    // This will start the circular progress
    setProgressValue(progressMaxValue)

    startCountDown(newTargetTimestamp)
    // console.log('START COUNTDOWN', newTargetTimestamp, transactionState)
  }, [transactionState, targetTimestamp, startCountDown])

  const resetAndGoBack = useCallback((resetStep: boolean = false) => {
    if (transactionState?.status === 'pending') return
    cleanTransaction()
    setProgressValue(0)
    setRemainingTime(null)
    setProgressMaxValue(1)
    // setCountTimeoutId(null)
    setTargetTimestamp(null)

    if (countTimeoutId.current) {
      clearTimeout(countTimeoutId.current)
    }
    countTimeoutId.current = null

    return goBack(resetStep)
  }, [transactionState?.status, cleanTransaction, goBack])

  // Handle transaction reset from another component
  useEffect(() => {
    // console.log('goBackAndReset?', activeItem, transactionState?.status, !transactionState?.status)
    if (!transactionState?.status && activeItem){
      resetAndGoBack(false)
    }
  }, [transactionState?.status, activeItem, resetAndGoBack])

  const body = useMemo(() => {
    switch (transactionState?.status) {
      case 'pending':
        return (
          <Translation component={Text} translation={remainingTime===0 ? `modals.status.body.long` : `modals.${actionType}.status.pending`} textStyle={['heading', 'h3']} textAlign={'center'} />
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
                <Translation component={Button} translation={`trade.actions.${actionType}.status.success.button`} onClick={() => resetAndGoBack()} variant={'ctaFull'} />
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
  }, [transactionState?.status, remainingTime, translate, underlyingAsset, amount, activeStep, actionType, baseActionType, resetAndGoBack, retry])

  const isLongTransaction = useMemo(() => {
    return !!transactionState?.estimatedTime && transactionState?.status === 'pending' && remainingTime===0
  }, [transactionState?.estimatedTime, transactionState?.status, remainingTime])

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
          <CircularProgress
            top={'-10px'}
            left={'-10px'}
            size={145}
            thickness={'5px'}
            position={'absolute'}
            value={progressValue}
            max={progressMaxValue}
            trackColor={'card.bgLight'}
            color={circularProgressColor}
            isIndeterminate={isIndeterminate}
            sx={{
              ".chakra-progress__indicator": {
                transitionTimingFunction: 'ease',
                transitionProperty: 'stroke-dasharray',
                transitionDuration: transactionState?.status === 'pending' && transactionState?.estimatedTime ? `${transactionState?.estimatedTime}s` : '0.6s'
              }
            }}
          >
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

export type ActionStep = {
  type: string
  label: string
  component: any
}

export type OperativeComponentAction = ActionStep & {
  steps: ActionStep[]
}

/*
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
*/

interface OperativeComponentContextProps {
  amount: string
  activeStep: number
  dispatch: Function
  actionType: string
  activeItem: number
  asset: Asset | null
  defaultAmount: string
  executeAction: boolean
  baseActionType: string
}

const initialState: OperativeComponentContextProps = {
  amount: '',
  asset: null,
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
    case 'SET_ASSET':
      return {...state, asset: action.payload}
    case 'SET_EXECUTE_ACTION':
      // console.log('SET_EXECUTE_ACTION', action.payload)
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
  actions: OperativeComponentAction[]
} & CardProps

export const OperativeComponent: React.FC<OperativeComponentArgs> = ({
  assetId,
  actions,
  ...cardProps
}) => {
  const [ activeItem, setActiveItem ] = useState<number>(0)
  const [ actionIndex, setActionIndex ] = useState<number>(0)
  const [ transactionSpeedSelectorOpened, setTransactionSpeedSelectorOpened ] = useState<boolean>(false)

  const { underlyingAsset, translate } = useAssetProvider()
  const [ state, dispatch ] = useReducer(reducer, initialState)
  const { state: { gasPrice, transaction: transactionState }, retry } = useTransactionManager()

  const handleActionChange = (index: number) => {
    setActionIndex(index)
  }

  const activeAction = useMemo(() => actions[actionIndex], [actions, actionIndex])
  const activeStep = useMemo(() => !state.activeStep ? activeAction : activeAction.steps[state.activeStep-1], [activeAction, state.activeStep])
  const ActionComponent = useMemo((): React.FC<ActionComponentArgs> | null => actions[actionIndex].component, [actions, actionIndex])

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
      case 'pending':
        return setActiveItem(firstProcessIndex+1)
      case 'failed':
        switch (transactionState.error?.code) {
          case 4001:
            return setActiveItem(state.activeStep)
          default:
            return setActiveItem(firstProcessIndex+1)
        }
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
          overflow={'hidden'}
          minHeight={'590px'}
          direction={'column'}
          position={'relative'}
          alignItems={'flex-start'}
          id={'operative-component'}
          {...cardProps}
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
              width={'100%'}
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
                      <Amount textStyle={'bold'} value={amountToDisplay} minPrecision={parseFloat(amountToDisplay)<1 ? 5 : 3} suffix={` ${state.asset?.name}`}></Amount>
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