import { useTranslate } from 'react-polyglot'
import { Amount } from 'components/Amount/Amount'
import { TILDE, MAX_ALLOWANCE } from 'constants/vars'
import { Card, CardProps } from 'components/Card/Card'
import { NavBar } from 'components/OperativeComponent/NavBar'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { selectUnderlyingToken } from 'selectors/selectUnderlyingToken'
import type { Asset, ReducerActionTypes, AssetId } from 'constants/types'
import { ChakraCarousel } from 'components/ChakraCarousel/ChakraCarousel'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
// import { VaultNetworkCheck } from 'components/OperativeComponent/VaultNetworkCheck'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { TransactionSpeed, STAKING_CHAINID, PROTOCOL_TOKEN, STAKING_FEE_DISCOUNTS } from 'constants/'
import React, { useState, useRef, useEffect, useCallback, useMemo, useReducer, useContext, createContext } from 'react'
import { MdOutlineAccountBalanceWallet, MdOutlineLocalGasStation, MdOutlineRefresh, MdOutlineDone, MdOutlineClose } from 'react-icons/md'
import { BoxProps, Center, Box, Flex, VStack, HStack, SkeletonText, Text, Radio, Button, Tabs, TabList, Tab, CircularProgress, CircularProgressLabel, SimpleGrid, Link, LinkProps } from '@chakra-ui/react'
import { BNify, bnOrZero, formatTime, abbreviateNumber, getExplorerTxUrl, sendCustomEvent, sendPurchase, getDecodedError, getStakingPower, getStkIDLE, getFeeDiscount, fixTokenDecimals, getExplorerByChainId } from 'helpers/'
import { useThemeProvider } from "contexts/ThemeProvider";
import { VaultKycCheck } from './VaultKycCheck'
import { useNavigate } from 'react-router'

export type ActionComponentArgs = {
  itemIndex: number
  goBack?: Function
  chainIds?: (string|number)[]
} & BoxProps


type TransactionStatusProps = {
  goBack: Function
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({ goBack }) => {
  const translate = useTranslate()
  const countTimeoutId = useRef<any>(null)
  const { searchParams } = useBrowserRouter()
  const { underlyingAsset, theme, asset } = useAssetProvider()
  const [ progressValue, setProgressValue ] = useState<number>(0)
  // const [ countTimeoutId, setCountTimeoutId ] = useState<any>(null)
  const [ progressMaxValue, setProgressMaxValue ] = useState<number>(1)
  const [ remainingTime, setRemainingTime ] = useState<number | null>(null)
  const [ targetTimestamp, setTargetTimestamp ] = useState<number | null>(null)
  const [ purchaseEventSent, setPurchaseEventSent ] = useState<string | undefined | null>(null)
  const [ transactionEventSent, setTransactionEventSent ] = useState<string | undefined | null>(null)
  const { state: { transaction: transactionState }, retry, cleanTransaction } = useTransactionManager()
  const { amount, actionType, baseActionType, activeStep, activeItem, depositAmount } = useOperativeComponent()
  const { stakingData, selectors: { selectAssetById, selectAssetPriceUsd, selectVaultById, selectVaultGauge } } = usePortfolioProvider()

  const [ , setSearchParams ] = useMemo(() => searchParams, [searchParams])

  const vault = useMemo(() => {
    return asset?.id && selectVaultById && selectVaultById(asset.id)
  }, [selectVaultById, asset?.id])

  const vaultGauge = useMemo(() => {
    return asset?.id && selectVaultGauge && selectVaultGauge(asset.id)
  }, [selectVaultGauge, asset?.id])

  const txActionType = useMemo(() => {
    return transactionState.actionType || actionType
  }, [actionType, transactionState.actionType])

  const transactionAmount = useMemo(() => {
    return transactionState.amount ? bnOrZero(transactionState.amount) : bnOrZero(amount)
  }, [amount, transactionState.amount])

  const transactionAmountUsd = useMemo(() => {
    if (!underlyingAsset || !selectAssetPriceUsd) return BNify(0)
    const assetPriceUsd = selectAssetPriceUsd(underlyingAsset.id)
    return bnOrZero(transactionAmount).times(assetPriceUsd)
  }, [underlyingAsset, transactionAmount, selectAssetPriceUsd])

  const amountToDisplay = useMemo(() => {
    return transactionState.amount ? (BNify(transactionState.amount).isNaN() ? transactionState.amount : abbreviateNumber(bnOrZero(transactionState.amount), 8)) : (amount === MAX_ALLOWANCE ? translate('trade.unlimited') : abbreviateNumber(bnOrZero(amount), 8))
  }, [amount, translate, transactionState.amount])

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

    // Send purchase event for deposit and stake
    if (['deposit', 'stake'].includes(txActionType) && transactionState.status === 'success' && purchaseEventSent !== transactionState.transaction?.hash){
      sendPurchase(asset, transactionAmountUsd, transactionState.transaction)
      setPurchaseEventSent(transactionState.transaction?.hash)
    }

    // Send transaction event
    if (asset?.id && transactionEventSent !== transactionState.transaction?.hash){
      sendCustomEvent(txActionType, {
        asset: asset.id,
        transaction_id: transactionState.transaction?.hash,
        amountUsd: bnOrZero(transactionAmountUsd).toFixed(2)
      })
      setTransactionEventSent(transactionState.transaction?.hash)
    }

  // eslint-disable-next-line
  }, [asset, transactionState?.status, purchaseEventSent, transactionEventSent, transactionAmountUsd, setProgressValue, progressMaxValue])

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

  const resetAndGoBack = useCallback((resetStep = false, actionIndex: number | null = null) => {
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

    return goBack(resetStep, actionIndex)
  }, [transactionState?.status, cleanTransaction, goBack])

  // Handle transaction reset from another component
  useEffect(() => {
    // console.log('goBackAndReset?', activeItem, transactionState?.status, !transactionState?.status)
    if (!transactionState?.status && activeItem && !activeStep){
      resetAndGoBack(false)
    }
  }, [transactionState?.status, activeItem, activeStep, resetAndGoBack])

  // console.log('amountToDisplay', amountToDisplay)

  const assetToDisplay = useMemo(() => {
    // Don't show asset if amount is not a number
    if (transactionState.amount && BNify(transactionState.amount).isNaN()) return ''
    if (!selectAssetById) return underlyingAsset?.name
    const asset = selectAssetById(transactionState.assetId)
    return asset?.name || underlyingAsset?.name
  }, [selectAssetById, underlyingAsset?.name, transactionState.assetId, transactionState.amount])

  const stakingRecap = useMemo(() => {

    if (!transactionState?.contractSendMethod) return null

    // @ts-ignore
    const txArgs = transactionState.contractSendMethod.arguments

    const idleAmount = fixTokenDecimals(txArgs[0], 18)
    const lockEndTime = parseInt(txArgs[1])
    const stakingPower = getStakingPower(lockEndTime, BNify(transactionState.timestamp).div(1000))
    const stkIDLEAmount = getStkIDLE(idleAmount, stakingPower)
    const feeDiscount = getFeeDiscount(stkIDLEAmount)

    const underlyingToken = selectUnderlyingToken(STAKING_CHAINID, PROTOCOL_TOKEN)
    const idleTokenAsset = underlyingToken?.address && selectAssetById(underlyingToken.address)

    if (!idleTokenAsset) return null

    return (
      <VStack
        spacing={3}
        width={'full'}
      >
        {
          feeDiscount.gt(0) ? (
            <Card.Dark
              py={3}
              px={4}
              border={0}
            >
              <SimpleGrid
                p={0}
                columns={2}
              >
                <HStack
                  pr={2}
                  spacing={2}
                  justifyContent={'center'}
                  borderRight={'1px solid'}
                  borderColor={'divider'}
                >
                  <Translation translation={'defi.feeDiscount'} textStyle={'captionSmall'} />
                  <Amount.Percentage decimals={2} value={feeDiscount} textStyle={'tableCell'} />
                </HStack>
                <HStack
                  justifyContent={'center'}
                >
                  <TokenAmount assetId={stakingData?.stkIDLE.asset?.id} amount={stkIDLEAmount} textStyle={'tableCell'} size={'xs'} />
                </HStack>
              </SimpleGrid>
            </Card.Dark>
          ) : (
            <Card.Dark
              p={2}
              border={0}
            >
              <Translation textAlign={'center'} translation={'strategies.staking.op.feeDiscount'} params={{amount: `≥ ${Object.keys(STAKING_FEE_DISCOUNTS)[0]}`, discount: Object.values(STAKING_FEE_DISCOUNTS)[0]}} isHtml textStyle={'captionSmaller'} />
            </Card.Dark>
          )
        }
        {
          bnOrZero(depositAmount).gt(0) ? (
            <VStack
              spacing={3}
              width={'full'}
              alignItems={'center'}
            >
              {
                feeDiscount.gt(0) && (
                  <Translation textAlign={'center'} translation={'feeDiscount.op.success'} params={{minStakingAmount: Object.keys(STAKING_FEE_DISCOUNTS)[0]}} isHtml textStyle={'captionSmall'} />
                )
              }
              <Translation component={Button} translation={`common.deposit`} onClick={() => {resetAndGoBack(true, 0)} } variant={'ctaPrimary'} px={10} />
            </VStack>
          ) : (
            <Translation component={Button} translation={`trade.actions.${txActionType}.status.success.button`} onClick={() => resetAndGoBack()} variant={'ctaPrimary'} px={10} />
          )
        }
      </VStack>
    )
  }, [transactionState, selectAssetById, stakingData, depositAmount, resetAndGoBack, txActionType])

  const body = useMemo(() => {
    switch (transactionState?.status) {
      case 'pending':
        return (
          <Translation component={Text} translation={remainingTime===0 ? `modals.status.body.long` : `modals.${txActionType}.status.pending`} textStyle={'heading'} fontSize={'h3'} textAlign={'center'} />
        )
      case 'success':
        // const amountToDisplay = amount === MAX_ALLOWANCE ? translate('trade.unlimited') : abbreviateNumber(amount, 8)
        return (
          <VStack
            spacing={4}
          >
            {/*<Translation component={Text} translation={`modals.${txActionType}.status.success`} params={{asset: assetToDisplay, amount: amountToDisplay }} textStyle={'heading'} fontSize={'h3'} textAlign={'center'} />*/}
            <VStack
              spacing={1}
              width={'full'}
              justifyContent={'center'}
            >
              <Translation component={Text} translation={`trade.actions.${txActionType}.confirmed`} textStyle={'caption'} textAlign={'center'} />
              <Text textStyle={'ctaStatic'} fontSize={'h3'}>{amountToDisplay} {assetToDisplay}</Text>
            </VStack>
            {
              vault?.messages?.actions?.[txActionType] && (
                <Translation pb={2} translation={vault?.messages?.actions?.[txActionType]} textStyle={'captionSmall'} textAlign={'center'} />
              )
            }
            {
              txActionType === 'stake' ?
                stakingRecap
              : txActionType === 'deposit' && vaultGauge ? (
                <VStack
                  spacing={4}
                >
                  <Translation translation={'trade.depositGauge'} textAlign={'center'} />
                  <Translation component={Button} translation={`trade.actions.${txActionType}.status.success.buttonGauge`} onClick={() => { resetAndGoBack(); setTimeout(() => setSearchParams(`?tab=gauge`), 1000) }} variant={'ctaFull'} />
                  <Translation component={Button} translation={`trade.actions.${txActionType}.status.success.button`} onClick={() => { resetAndGoBack() }} variant={'ctaPrimaryOutline'} width={'full'} />
                  {/*<Translation<LinkProps> component={Link} translation={`trade.actions.${txActionType}.status.success.button`} textStyle={['captionSmall', 'link', 'bold']}  onClick={() => resetAndGoBack()} />*/}
                </VStack>
              ) : activeStep ? (
                <Translation component={Button} translation={`common.${baseActionType}`} onClick={() => resetAndGoBack(true)} variant={'ctaPrimary'} px={10} />
              ) : (
                <Translation component={Button} translation={`trade.actions.${txActionType}.status.success.button`} onClick={() => resetAndGoBack()} variant={'ctaPrimary'} px={10} />
              )
            }
          </VStack>
        )
      case 'failed':
        const errorHeader = transactionState?.error ? transactionState?.error?.message.toString().split("\n")[0] : null
        const decodedError = getDecodedError(transactionState?.error)
        const errorMessage = decodedError || errorHeader
        const translationKey = `trade.actions.${txActionType}.messages.decoded.${errorMessage}`
        const translatedError = errorMessage ? translate(translationKey) : null
        const errorToShow = translatedError && translatedError !== translationKey ? translatedError : errorMessage
        return (
          <>
            <Translation component={Text} translation={`modals.${txActionType}.status.failed`} params={{asset: assetToDisplay, amount: abbreviateNumber }} textStyle={'heading'} fontSize={'h3'} textAlign={'center'} />
            <Translation component={Text} isHtml={true} translation={`modals.status.body.failed`} params={{error: `"${errorToShow}"`, asset: assetToDisplay, amount: abbreviateNumber }} textStyle={'captionSmall'} textAlign={'center'} />
            <Translation component={Button} translation={"common.retry"} leftIcon={<MdOutlineRefresh size={24} />} onClick={() => { retry() }} variant={'ctaPrimary'} px={10} />
            <Translation component={Text} translation={`common.cancel`} textStyle={['cta', 'link']} onClick={() => resetAndGoBack()} />
          </>
        )
      default:
        return null
    }
  }, [transactionState, vault, translate, stakingRecap, txActionType, assetToDisplay, amountToDisplay, remainingTime, activeStep, baseActionType, resetAndGoBack, retry, setSearchParams, vaultGauge])

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
            size={145}
            top={'-10px'}
            left={'-10px'}
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

  const explorer = useMemo(() => {
    const explorer =  getExplorerByChainId(asset?.chainId)
    return explorer?.name || 'Chain'
  }, [asset])

  return (
    <>
      {navBar}
      <Flex
        px={3}
        py={14}
        flex={1}
        width={'full'}
        justifyContent={'center'}
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
            width={'full'}
            justifyContent={'center'}
          >
            <Translation<LinkProps> component={Link} translation={`defi.viewOnExplorer`} params={{explorer}} textStyle={'link'} fontSize={'sm'} fontWeight={700} isExternal href={getExplorerTxUrl(asset?.chainId, transactionState.hash)} />
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
  const { state: { estimatedFeesUsd, estimatedTimes, gasPrices, transactionSpeed: currentTransactionSpeed}, setTransactionSpeed } = useTransactionManager()
  return (
    <VStack
      p={4}
      flex={1}
      width={'full'}
      justifyContent={'space-between'}
    >
      <NavBar height={'auto'} mb={10} translation={'common.transactionSpeed'} />
      <VStack
        p={0}
        flex={1}
        spacing={2}
        width={'full'}
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
                width={'full'}
                aria-selected={isActive}
                layerStyle={['cardInteractive']}
                key={`transactionSpeed_${transactionSpeed}`} 
                bg={isActive ? 'card.bgLight' : 'transparent'}
                onClick={() => setTransactionSpeed(transactionSpeed)}
              >
                <HStack
                  spacing={4}
                  width={'full'}
                  alignItems={'center'}
                >
                  <HStack
                    spacing={2}
                    width={'40%'}
                    alignItems={'center'}
                  >
                    <Radio colorScheme={'blue'} isChecked={isActive}></Radio>
                    <HStack
                      flex={1}
                      spacing={1}
                      alignItems={'center'}
                    >
                      <Translation component={Text} whiteSpace={'nowrap'} textStyle={['tableCell', 'primary']} translation={`modals.send.sendForm.${transactionSpeed}`} />
                      <SkeletonText noOfLines={1} isLoaded={!!gasPrices} width={'full'}>
                        <Amount prefix={'('} suffix={')'} decimals={bnOrZero(gasPrices?.[transactionSpeed]).mod(1).gt(0) ? 2 : 0} textStyle={'captionSmaller'} fontWeight={'600'} color={'primary'} value={gasPrices?.[transactionSpeed]}></Amount>
                      </SkeletonText>
                    </HStack>
                  </HStack>
                  <VStack
                    spacing={2}
                    width={'25%'}
                    alignItems={'flex-start'}
                    justifyContent={'flex-start'}
                  >
                    <Translation component={Text} textStyle={'captionSmall'} translation={`common.gasFee`} />
                    <SkeletonText noOfLines={1} isLoaded={!!estimatedFeesUsd} width={'full'}>
                      <Amount.Usd textStyle={'captionSmaller'} fontWeight={'600'} color={'primary'} prefix={TILDE} value={estimatedFeesUsd?.[transactionSpeed]}></Amount.Usd>
                    </SkeletonText>
                  </VStack>
                  <VStack
                    spacing={2}
                    width={'35%'}
                    alignItems={'flex-start'}
                    justifyContent={'flex-start'}
                  >
                    <Translation component={Text} textStyle={'captionSmall'} translation={`modals.status.estimatedTime`} />
                    <SkeletonText noOfLines={1} isLoaded={!!estimatedTimes} width={'full'}>
                      <Text textStyle={'captionSmaller'} fontWeight={'600'} color={'primary'}>{formatTime(estimatedTimes?.[transactionSpeed])}</Text>
                    </SkeletonText>
                  </VStack>
                </HStack>
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
  props?: any
  chainIds?: (string|number)[]
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
  depositAmount: string
  executeAction: boolean
  baseActionType: string
  setActionIndex: Function
}

const initialState: OperativeComponentContextProps = {
  amount: '',
  asset: null,
  activeStep: 0,
  activeItem: 0,
  actionType: '',
  defaultAmount: '',
  depositAmount: '',
  baseActionType: '',
  dispatch: () => {},
  executeAction: false,
  setActionIndex: () => {}
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
    case 'SET_DEPOSIT_AMOUNT':
      return {...state, depositAmount: action.payload}
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

export const VaultNetworkSwitcher: React.FC<{
  assetId: string | undefined
}> = ({
  assetId
}) => {
  const {
    selectors: {
      selectAssetById,
      selectAllConnectedAssets
    }
  } = usePortfolioProvider()
  const navigate = useNavigate()
  
  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const assets = useMemo(() => selectAllConnectedAssets(asset), [asset, selectAllConnectedAssets])

  if (assets.length <= 1){
    return null
  }

  return (
    <Card
      pl={3}
      py={1}
      pr={1}
      border={'1px solid'}
      borderColor={'card.borderColor'}
      // bg={'tab.bgSelected'}
    >
      <HStack
        width={'full'}
        justifyContent={'space-between'}
      >
        <Translation textStyle={'titleSmall'} translation={'defi.alsoAvailableIn'} />
        <HStack
          spacing={3}
        >
          {
            assets.filter( (a: Asset) => a.id !== assetId ).map( (a: Asset) => (
              <Card.Flex
                p={2}
                layerStyle={['card','cardLightHover']}
                onClick={() => navigate(`/credit/${a.id}`)}
              >
                <AssetProvider
                  assetId={a.id}
                >
                  <HStack
                    spacing={1}
                  >
                    <AssetProvider.ChainIcon w={6} h={6} mr={1} />
                    <AssetProvider.NetApyWithFees textStyle={'captionSmall'} fontWeight={600} suffix={<Translation translation={'defi.apy'} textStyle={'captionSmall'} fontWeight={500} fontSize={'xs'} />} />
                  </HStack>
                </AssetProvider>
              </Card.Flex>
            ))
          }
        </HStack>
      </HStack>
    </Card>
  )
}

const OperativeComponentContext = createContext<OperativeComponentContextProps>(initialState)
export const useOperativeComponent = () => useContext(OperativeComponentContext)

type OperativeComponentArgs = {
  assetId?: AssetId
  defaultActiveIndex?: number
  actions: OperativeComponentAction[]
} & CardProps

export const OperativeComponent: React.FC<OperativeComponentArgs> = ({
  assetId,
  actions,
  defaultActiveIndex = 0,
  ...cardProps
}) => {
  const {theme} = useThemeProvider()
  const intervalId = useRef<any>(null)
  const translate = useTranslate()
  const [ activeItem, setActiveItem ] = useState<number>(0)
  const [ state, dispatch ] = useReducer(reducer, initialState)
  const [ actionIndex, setActionIndex ] = useState<number>(defaultActiveIndex)
  const [ transactionSpeedSelectorOpened, setTransactionSpeedSelectorOpened ] = useState<boolean>(false)

  const { isPortfolioLoaded, selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()
  const { state: { gasPrice, transaction: transactionState }, retry, cleanTransaction, updateGasPrices } = useTransactionManager()

  const handleActionChange = (index: number) => {
    setActionIndex(index)
  }

  const activeAction = useMemo(() => actions[actionIndex], [actions, actionIndex])
  const ActionComponent = useMemo((): React.FC<ActionComponentArgs> | null => (actions[actionIndex]?.component || null), [actions, actionIndex])
  const activeStep = useMemo(() => !state.activeStep ? activeAction : activeAction.steps[state.activeStep-1], [activeAction, state.activeStep])

  useEffect(() => {
    setActiveItem(state.activeStep)
  }, [state.activeStep])

  useEffect(() => {

    if (intervalId.current){
      clearInterval(intervalId.current)
      intervalId.current = null
    }

    // Update gas prices only when the user is not interacting
    if (!transactionState.status || ['success','failed'].includes(transactionState.status)){
      intervalId.current = setInterval(() => {
        updateGasPrices()
      }, 20000)
    }

    return () => {
      if (intervalId.current){
      clearInterval(intervalId.current)
      intervalId.current = null
    }
    }
  }, [transactionState, updateGasPrices])

  useEffect(() => {
    const actionType = activeStep ? activeStep.type : activeAction.type
    dispatch({type:'SET_ACTION_TYPE', payload: actionType})
    dispatch({type:'SET_BASE_ACTION_TYPE', payload: activeAction.type})
  }, [activeAction, activeStep])

  const actionType = useMemo(() => {
    return transactionState.actionType || state.actionType
  }, [state.actionType, transactionState.actionType])

  const assetToDisplay = useMemo(() => {
    if (!selectAssetById) return state.asset?.name
    const asset = selectAssetById(transactionState.assetId)
    return asset?.name || state.asset?.name
  }, [selectAssetById, state.asset, transactionState.assetId])

  const underlyingAsset = useMemo(() => {
    if (!selectAssetById || !state.asset?.underlyingId) return null
    return selectAssetById(state.asset.underlyingId)
  }, [state.asset, selectAssetById])

  const amountToDisplay = useMemo(() => {
    return transactionState.amount ? transactionState.amount : (state.amount === MAX_ALLOWANCE ? `${translate('trade.unlimited')} ${assetToDisplay}` : parseFloat(state.amount))
  }, [state.amount, assetToDisplay, translate, transactionState.amount])

  const txActionType = useMemo(() => {
    return transactionState.actionType || actionType
  }, [actionType, transactionState.actionType])

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
            cleanTransaction()
            return setActiveItem(state.activeStep)
          default:
            return setActiveItem(firstProcessIndex+1)
        }
      case 'success':
        setActiveItem(firstProcessIndex+1)
        // If internal step is active return to step 0
        if (state.activeStep || (txActionType === 'stake' && bnOrZero(state.depositAmount).gt(0))) {
          // Automatically execute action after going back
          // console.log('SET_EXECUTE_ACTION', true)
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
  }, [transactionState, cleanTransaction, activeAction, state.activeStep, txActionType, state.depositAmount])

  const kycVerificationStatus = useMemo(() => {
    if (activeItem > 0) return null
    if (!isPortfolioLoaded || transactionSpeedSelectorOpened) return null
    
    return (
      <Flex
        zIndex={11}
      >
        <AssetProvider
          assetId={assetId}
          wrapFlex={false}
        >
          <AssetProvider.KycVerificationBadge />
        </AssetProvider>
      </Flex>
    )
  }, [transactionSpeedSelectorOpened, isPortfolioLoaded, assetId, activeItem])

  const transationSpeedToggler = useMemo(() => {
    if (activeItem > 0) return null
    return transactionSpeedSelectorOpened ? (
      <Flex
        top={1}
        right={2}
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
        zIndex={11}
        borderRadius={8}
        variant={'ctaBlue'}
        onClick={() => setTransactionSpeedSelectorOpened( prevValue => !prevValue )}
      >
        <HStack
          spacing={1}
        >
          <MdOutlineLocalGasStation color={'primary'} size={24} />
          <Amount decimals={bnOrZero(gasPrice).lt(1) ? 4 : 0} abbreviate={false} textStyle={'titleSmall'} color={'primary'} value={gasPrice} />
        </HStack>
      </Button>
    )
  }, [activeItem, gasPrice, transactionSpeedSelectorOpened, setTransactionSpeedSelectorOpened])

  const goBack = useCallback((resetStep = false, actionIndex = null) => {
    if (resetStep){
      dispatch({type: 'SET_ACTIVE_STEP', payload: 0})
      if (actionIndex !== null){
        setTimeout(() => {
          setActionIndex(actionIndex)
        }, 300)
      }
      return
    }
    setActiveItem(state.activeStep)
    if (actionIndex !== null){
      setTimeout(() => {
        setActionIndex(actionIndex)
      }, 300)
    }
  }, [dispatch, setActiveItem, state.activeStep, setActionIndex])

  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <OperativeComponentContext.Provider value={{...state, activeItem, dispatch, setActionIndex}}>
        <Card.Flex
          p={4}
          width={'full'}
          overflow={'hidden'}
          minHeight={'590px'}
          direction={'column'}
          position={'relative'}
          alignItems={'flex-start'}
          id={'operative-component'}
          {...cardProps}
        >
          <HStack
            right={4}
            spacing={3}
            position={'absolute'}
          >
            {kycVerificationStatus}
            {transationSpeedToggler}
          </HStack>
          {
            transactionSpeedSelectorOpened && (
              <VStack
                top={0}
                left={0}
                flex={1}
                zIndex={10}
                bg={'card.bg'}
                width={'full'}
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
            <VStack
              flex={1}
              spacing={4}
              width={'full'}
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
                  index={actionIndex}
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
              <VaultNetworkSwitcher assetId={assetId} />
              <Flex
                flex={1}
                width={'full'}
              >
                <VaultKycCheck
                  assetId={assetId}
                >
                  {!!ActionComponent && <ActionComponent chainIds={activeAction.chainIds} itemIndex={0} />}
                </VaultKycCheck>
              </Flex>
            </VStack>
            {
              actions[actionIndex].steps.map((step, index) => {
                const StepComponent = step.component
                return (
                  <VStack
                    flex={1}
                    width={'full'}
                    key={`step_${index}`}
                    alignItems={'flex-start'}
                  >
                    <NavBar goBack={() => dispatch({type:'SET_ACTIVE_STEP', payload: index})} translation={step.label} params={{asset: underlyingAsset?.name}} />
                    <StepComponent itemIndex={index+1} {...step.props} />
                  </VStack>
                )
              })
            }
            <VStack
              flex={1}
              spacing={0}
              id={'confirm-on-wallet'}
              alignItems={'flex-start'}
            >
              <NavBar goBack={() => setActiveItem(state.activeStep) } translation={`modals.confirm.${actionType}.header`} />
              <Center
                p={14}
                flex={1}
                width={'full'}
              >
                <VStack
                  spacing={6}
                >
                  <MdOutlineAccountBalanceWallet size={72} />
                  <Translation component={Text} translation={"trade.confirmTransactionWallet"} textStyle={'heading'} fontSize={'h3'} textAlign={'center'} />
                  <VStack
                    spacing={1}
                  >
                    <Translation component={Text} translation={`modals.${actionType}.status.confirm`} params={{}} textStyle={'captionSmall'} textAlign={'center'} />
                    <HStack>
                      {
                        BNify(amountToDisplay).isNaN() ? (
                          <Text textStyle={'bold'}>{amountToDisplay}</Text>
                        ) : (
                          <Amount textStyle={'bold'} value={amountToDisplay} minPrecision={parseFloat(amountToDisplay as string)<1 ? 5 : 3} suffix={` ${assetToDisplay}`}></Amount>
                        )
                      }
                    </HStack>
                  </VStack>
                </VStack>
              </Center>
              <HStack
                spacing={1}
                width={'full'}
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