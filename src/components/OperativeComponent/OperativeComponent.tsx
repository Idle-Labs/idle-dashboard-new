import { Card } from 'components/Card/Card'
import { MAX_ALLOWANCE } from 'constants/vars'
import { Amount } from 'components/Amount/Amount'
import type { ReducerActionTypes } from 'constants/types'
import { useWalletProvider } from 'contexts/WalletProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { ChakraCarousel } from 'components/ChakraCarousel/ChakraCarousel'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { TranslationProps, Translation } from 'components/Translation/Translation'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import React, { useState, useEffect, useCallback, useMemo, useReducer, useContext, createContext } from 'react'
import { BNify, isBigNumberNaN, getAllowance, getVaultAllowanceOwner, abbreviateNumber, getExplorerTxUrl } from 'helpers/'
import { MdOutlineAccountBalanceWallet, MdOutlineLocalGasStation, MdKeyboardArrowLeft, MdOutlineLockOpen, MdOutlineRefresh, MdOutlineDone, MdOutlineClose } from 'react-icons/md'
import { BoxProps, useTheme, Switch, Center, Box, Flex, VStack, HStack, Text, Button, ButtonProps, Tabs, TabList, Tab, Input, CircularProgress, CircularProgressLabel, Spinner, Link, LinkProps } from '@chakra-ui/react'

type InputAmountArgs = {
  amount?: string
  setAmount: Function
  inputHeight?: number
}

const InputAmount: React.FC<InputAmountArgs> = ({ inputHeight, amount, setAmount }) => {
  const { asset, underlyingAsset } = useAssetProvider()
  const [ amountUsd, setAmountUsd ] = useState<number>(0)
  const { selectors: { selectAssetPriceUsd } } = usePortfolioProvider()
  
  const handleAmountChange = ({target: { value }}: { target: {value: string} }) => {
    setAmount(Math.max(0, parseFloat(value)).toString())
  }

  useEffect(() => {
    if (!selectAssetPriceUsd || !underlyingAsset) return
    const assetPriceUsd = selectAssetPriceUsd(underlyingAsset.id)
    const amountUsd = parseFloat(BNify(amount).times(assetPriceUsd).toString()) || 0
    setAmountUsd(amountUsd)
  }, [underlyingAsset, amount, selectAssetPriceUsd])

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
  const { sendTransaction } = useTransactionManager()
  const { amount: defaultAmount } = useOperativeComponent()
  const [ amount, setAmount ] = useState<string>(defaultAmount)
  const { underlyingAsset, vault, translate, theme } = useAssetProvider()
  const [ allowanceModeExact, setAllowanceModeExact ] = useState<boolean>(false)

  useEffect(() => {
    setAmount(defaultAmount)
  }, [defaultAmount])

  const amountToApprove = useMemo((): string => {
    return !allowanceModeExact ? MAX_ALLOWANCE : amount
  }, [allowanceModeExact, amount])

  const approve = useCallback(() => {
    if (!vault || !("getAllowanceContractSendMethod" in vault) || !("getAllowanceParams" in vault)) return
    const allowanceParams = vault.getAllowanceParams(amountToApprove)
    const allowanceContractSendMethod = vault.getAllowanceContractSendMethod(allowanceParams)
    console.log('allowanceParams', allowanceParams, allowanceContractSendMethod)
    if (!allowanceContractSendMethod) return
    sendTransaction(allowanceContractSendMethod)
  }, [amountToApprove, vault, sendTransaction])

  return (
    <VStack
      flex={1}
      alignItems={'flex-start'}
    >
      <NavBar goBack={goBack} translation={"modals.approve.header"} params={{asset: underlyingAsset?.name}} />
      <Center
        p={14}
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
      </Center>
    </VStack>
  )
}

const ConnectWalletButton: React.FC<ButtonProps> = ({...props}) => {
  const { account, connect, connecting } = useWalletProvider()
  return connecting ? (
    <Button disabled={true} variant={'ctaFull'}>
      <Spinner size={'sm'} />
    </Button>
  ) : (
    <Translation component={Button} translation={"common.connectWallet"} onClick={() => connect()} variant={'ctaFull'} {...props} />
  )
}

const Deposit: React.FC<ActionComponentArgs> = () => {

  const theme = useTheme()
  const [ amount, setAmount ] = useState('0')
  const [ error, setError ] = useState<string>('')
  const [ amountUsd, setAmountUsd ] = useState<number>(0)

  const { dispatch } = useOperativeComponent()
  const { account } = useWalletProvider()
  const { transaction, sendTransaction } = useTransactionManager()
  const { selectors: { selectAssetPriceUsd, selectAssetBalance } } = usePortfolioProvider()
  const { asset, vault, underlyingAsset, underlyingAssetVault, translate } = useAssetProvider()

  const handleAmountChange = ({target: { value }}: { target: {value: string} }) => setAmount(value)

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
  const deposit = useCallback(() => {
    if (!account || disabled) return
    if (!underlyingAssetVault || !("contract" in underlyingAssetVault)) return
    if (!vault || !("getDepositContractSendMethod" in vault) || !("getDepositParams" in vault)) return

    ;(async() => {
      // console.log('underlyingAssetVault', underlyingAssetVault)

      const vaultOwner = getVaultAllowanceOwner(vault)
      const allowance = await getAllowance(underlyingAssetVault.contract, account.address, vaultOwner)
      
      console.log('allowance', vaultOwner, account.address, allowance)

      if (allowance.gte(amount)){
        const depositParams = vault.getDepositParams(amount)
        const depositContractSendMethod = vault.getDepositContractSendMethod(depositParams)
        console.log('depositParams', depositParams, depositContractSendMethod)
        sendTransaction(depositContractSendMethod)
      } else {
        // Approve amount
        dispatch({type: 'SET_ACTIVE_STEP', payload: 1})
      }
    })()

  }, [account, disabled, amount, vault, underlyingAssetVault, dispatch, sendTransaction])

  // Update amount USD and disabled
  useEffect(() => {
    if (!selectAssetPriceUsd || !underlyingAsset) return
    const assetPriceUsd = selectAssetPriceUsd(underlyingAsset.id)
    const amountUsd = parseFloat(BNify(amount).times(assetPriceUsd).toString()) || 0
    setAmountUsd(amountUsd)
    dispatch({type:'SET_AMOUNT', payload: amount})
  }, [underlyingAsset, amount, selectAssetPriceUsd, dispatch])

  // Set max balance function
  const setMaxBalance = useCallback(() => {
    if (!underlyingAsset?.balance) return
    setAmount(underlyingAsset.balance.toString())
  }, [underlyingAsset])

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
          <HStack
            spacing={1}
          >
            <MdOutlineLocalGasStation color={theme.colors.ctaDisabled} size={24} />
            <Translation translation={'trade.estimatedGasFee'} suffix={':'} textStyle={'captionSmaller'} />
          </HStack>
          {depositButton}
        </VStack>
      </VStack>
    </AssetProvider>
  )
}

type NavBarProps = {
  goBack?: Function
} & TranslationProps

const NavBar: React.FC<NavBarProps> = ({ goBack, ...props }) => {
  return (
    <HStack
      height={'24px'}
      width={'100%'}
      position={'relative'}
      alignItems={'center'}
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
        position={'absolute'}
        justifyContent={'center'}
      >
        <Translation component={Text} textStyle={'ctaStatic'} aria-selected={true} {...props} />
      </Flex>
    </HStack>
  )
}

type TransactionStatusProps = {
  goBack: Function
}

const TransactionSuccess: React.FC<TransactionStatusProps> = ({ goBack }) => {
  const { transaction } = useTransactionManager()
  const { underlyingAsset, theme } = useAssetProvider()
  const { amount, actionType } = useOperativeComponent()

  return (
    <>
      <NavBar translation={`modals.status.header.success`} />
      <Center
        p={14}
        flex={1}
        width={'100%'}
      >
        <VStack
          spacing={4}
        >
          <Center
            width={'120px'}
            height={'120px'}
            bg={'card.bgLight'}
            borderRadius={'120px'}
          >
            <MdOutlineDone size={50} color={theme.colors.green['400']} />
          </Center>
          <Translation component={Text} translation={`modals.${actionType}.status.success`} params={{asset: underlyingAsset?.name, amount: abbreviateNumber(amount, 8) }} textStyle={['heading', 'h3']} textAlign={'center'} />
        </VStack>
      </Center>
    </>
  )
}

const TransactionFailed: React.FC<TransactionStatusProps> = ({ goBack }) => {
  const { transaction, retry } = useTransactionManager()
  const { underlyingAsset, theme } = useAssetProvider()
  const { amount, actionType } = useOperativeComponent()

  return (
    <>
      <NavBar translation={`modals.status.header.failed`} />
      <Center
        p={14}
        flex={1}
        width={'100%'}
      >
        <VStack
          spacing={4}
        >
          <Center
            width={'120px'}
            height={'120px'}
            bg={'card.bgLight'}
            borderRadius={'120px'}
          >
            <MdOutlineClose size={50} color={theme.colors.red['400']} />
          </Center>
          <Translation component={Text} translation={`modals.${actionType}.status.failed`} params={{asset: underlyingAsset?.name, amount: abbreviateNumber(amount, 8) }} textStyle={['heading', 'h3']} textAlign={'center'} />
          <Translation component={Text} translation={`modals.status.body.failed`} params={{asset: underlyingAsset?.name, amount: abbreviateNumber(amount, 8) }} textStyle={'captionSmall'} textAlign={'center'} />
          <Translation component={Button} translation={"common.retry"} leftIcon={<MdOutlineRefresh size={24} />} onClick={() => retry} variant={'ctaFull'} />
          <Translation component={Text} translation={`common.cancel`} textStyle={['cta', 'link']} onClick={() => goBack()} />
        </VStack>
      </Center>
    </>
  )
}

const actions = [
  {
    type: 'deposit',
    component: Deposit,
    label: 'common.deposit',
    steps: [
      {
        type: 'approve',
        component: Approve,
        label:'modals.approve.header'
      }
    ]
  },
  {
    label: 'common.withdraw',
    component: null,
    steps: []
  }
]

interface OperativeComponentContextProps {
  amount: string
  actionType: string
  activeStep: number
  dispatch: Function
}

const initialState: OperativeComponentContextProps = {
  amount: '',
  activeStep: 0,
  actionType: '',
  dispatch: () => {}
}

const reducer = (state: OperativeComponentContextProps, action: ReducerActionTypes) => {
  switch (action.type){
    case 'SET_AMOUNT':
      return {...state, amount: action.payload}
    case 'SET_ACTION_TYPE':
      return {...state, actionType: action.payload}
    case 'SET_ACTIVE_STEP':
      return {...state, activeStep: action.payload}
    default:
      return {...state}
  }
}

const OperativeComponentContext = createContext<OperativeComponentContextProps>(initialState)
const useOperativeComponent = () => useContext(OperativeComponentContext)

export const OperativeComponent: React.FC = () => {
  const { chainId, explorer } = useWalletProvider()
  const { transaction, retry } = useTransactionManager()
  const [ activeItem, setActiveItem ] = useState<number>(0)
  const [ actionIndex, setActionIndex ] = useState<number>(0)
  const { asset, underlyingAsset, theme } = useAssetProvider()
  const [ state, dispatch ] = useReducer(reducer, initialState)

  const handleActionChange = (index: number) => {
    setActionIndex(index)
  }

  const activeAction = useMemo(() => actions[actionIndex], [actionIndex])
  const activeStep = useMemo(() => !state.activeStep ? activeAction : activeAction.steps[state.activeStep-1], [activeAction, state.activeStep])
  const ActionComponent = useMemo((): React.FC<ActionComponentArgs> | null => actions[actionIndex].component, [actionIndex])

  // console.log('actionType', activeAction, state.activeStep, activeStep, actionType)

  const onComplete = useCallback(() => {}, [])

  useEffect(() => {
    setActiveItem(state.activeStep)
  }, [state.activeStep])

  useEffect(() => {
    const actionType = activeStep ? activeStep.type : activeAction.type
    dispatch({type:'SET_ACTION_TYPE', payload: actionType})
  }, [activeAction, activeStep])

  useEffect(() => {
    console.log('TransactionProcess', transaction)
    const firstProcessIndex = activeAction.steps.length+1
    switch (transaction?.status) {
      case 'created':
        return setActiveItem(firstProcessIndex)
      break;
      case 'pending':
        return setActiveItem(firstProcessIndex+1)
      break;
      case 'failed':
        switch (transaction.error?.code) {
          case 4001:
            return setActiveItem(state.activeStep)
          break;
          default:
            return setActiveItem(firstProcessIndex+2)
          break;
        }
      break;
      case 'success':
        setActiveItem(firstProcessIndex+2)
        return onComplete()
      break;
      default:
      break;
    }
  }, [transaction, onComplete, activeAction, state.activeStep])

  return (
    <OperativeComponentContext.Provider value={{...state, dispatch}}>
      <VStack
        p={4}
        width={'100%'}
        bg={'card.bg'}
        minHeight={'590px'}
        alignItems={'flex-start'}
        id={'operative-component'}
      >
        <ChakraCarousel
          gap={0}
          activeItem={activeItem}
        >
          <VStack
            flex={1}
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
              {ActionComponent && <ActionComponent itemIndex={0} />}
            </Flex>
          </VStack>
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
                    <Amount textStyle={'bold'} value={parseFloat(state.amount)} decimals={8} suffix={` ${underlyingAsset?.name}`}></Amount>
                  </HStack>
                </VStack>
                {/*<Translation component={Button} translation={"common.cancel"} onClick={() => setActiveItem(activeItem-1)} variant={'ctaFull'} />*/}
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
            alignItems={'flex-start'}
            id={'transaction-pending'}
          >
            <NavBar goBack={() => setActiveItem(state.activeStep) } translation={"modals.status.header.pending"} />
            <Center
              p={14}
              flex={1}
              width={'100%'}
            >
              <VStack
                spacing={4}
              >
                <Translation component={Text} translation={"modals.status.estimatedTime"} textStyle={'captionSmaller'} textAlign={'center'} />
                <CircularProgress value={30} size={145} color={'green.400'} thickness={'5px'}>
                  <CircularProgressLabel>30s</CircularProgressLabel>
                </CircularProgress>
                <Translation component={Text} translation={`modals.${state.actionType}.status.pending`} textStyle={['heading', 'h3']} textAlign={'center'} />
              </VStack>
            </Center>
            <HStack
              spacing={1}
              width={'100%'}
              justifyContent={'center'}
            >
              <Translation<LinkProps> component={Link} translation={`defi.viewOnChain`} textStyle={['captionSmall', 'link', 'bold']} isExternal href={"https://etherscan.io"} />
            </HStack>
          </VStack>


          <VStack
            flex={1}
            alignItems={'flex-start'}
            id={'transaction-completed'}
          >
            {
              transaction?.status === 'success' ? (
                <TransactionSuccess goBack={() => setActiveItem(state.activeStep) } />
              ) : (
                <TransactionFailed goBack={() => setActiveItem(state.activeStep) } />
              )
            }
            {
              transaction?.hash && (
                <HStack
                  spacing={1}
                  width={'100%'}
                  justifyContent={'center'}
                >
                  <Translation<LinkProps> component={Link} translation={`defi.viewOnChain`} textStyle={['captionSmall', 'link', 'bold']} isExternal href={getExplorerTxUrl(chainId, explorer, transaction.hash)} />
                </HStack>
              )
            }
          </VStack>
        </ChakraCarousel>
      </VStack>
    </OperativeComponentContext.Provider>
  )
}