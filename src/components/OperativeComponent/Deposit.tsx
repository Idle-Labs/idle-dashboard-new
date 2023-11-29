import BigNumber from 'bignumber.js'
import { Card } from 'components/Card/Card'
import { imageFolder } from 'constants/folders'
import { sendBeginCheckout } from 'helpers/analytics'
import { ZERO_ADDRESS, VAULT_LIMIT_MAX } from 'constants/'
import { useWalletProvider } from 'contexts/WalletProvider'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Translation } from 'components/Translation/Translation'
import { AddressLink } from 'components/AddressLink/AddressLink'
import { InputAmount } from 'components/InputAmount/InputAmount'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useAssetPageProvider } from 'components/AssetPage/AssetPage'
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { EstimatedGasFees } from 'components/OperativeComponent/EstimatedGasFees'
import { useOperativeComponent, ActionComponentArgs } from './OperativeComponent'
import { Spinner, Image, Box, VStack, HStack, Text, Button } from '@chakra-ui/react'
import { FeeDiscountToggler } from 'components/OperativeComponent/FeeDiscountToggler'
import { DynamicActionFields } from 'components/OperativeComponent/DynamicActionFields'
import { ConnectWalletButton } from 'components/ConnectWalletButton/ConnectWalletButton'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { BNify, bnOrZero, checkAddress, getVaultAllowanceOwner, getAllowance, fixTokenDecimals, estimateGasLimit } from 'helpers/'

export const Deposit: React.FC<ActionComponentArgs> = ({ itemIndex }) => {
  const [ error, setError ] = useState<string>('')
  const [ amount, setAmount ] = useState<string>('0')
  const [ amountUsd, setAmountUsd ] = useState<number>(0)
  const { stakingEnabled, setStakingEnabled } = useAssetPageProvider()

  const { searchParams } = useBrowserRouter()
  const { account, isNetworkCorrect } = useWalletProvider()
  const { sendTransaction, setGasLimit, state: { transaction } } = useTransactionManager()
  const { selectors: { selectAssetPriceUsd, selectAssetBalance } } = usePortfolioProvider()
  const { asset, vault, underlyingAsset/*, underlyingAssetVault*/, translate } = useAssetProvider()
  const { dispatch, activeItem, activeStep, executeAction, setActionIndex, depositAmount } = useOperativeComponent()

  const [ getSearchParams ] = useMemo(() => searchParams, [searchParams]) 

  const referralEnabled = useMemo(() => (vault && ("flags" in vault) && vault.flags?.referralEnabled), [vault])
  const depositsDisabled = useMemo(() => (vault && ("flags" in vault) && vault.flags?.depositsDisabled), [vault])

  // Get selected tab id from search params
  const _referral = useMemo((): string | undefined => {
    if (!referralEnabled) return
    const referral = getSearchParams.get('_referral')
    if (!checkAddress(referral) || referral === ZERO_ADDRESS) return
    return referral
  }, [referralEnabled, getSearchParams])

  const assetBalance = useMemo(() => {
    if (!selectAssetBalance) return BNify(0)
    return selectAssetBalance(underlyingAsset?.id)
  }, [selectAssetBalance, underlyingAsset?.id])

  // Update amount USD and disabled
  useEffect(() => {
    if (!selectAssetPriceUsd || !underlyingAsset) return
    const assetPriceUsd = selectAssetPriceUsd(underlyingAsset.id)
    const amountUsd = parseFloat(BNify(amount).times(assetPriceUsd).toString()) || 0
    setAmountUsd(amountUsd)
  }, [underlyingAsset, amount, selectAssetPriceUsd, dispatch])

  // Reset amount on transaction succeeded
  useEffect(() => {
    if (!executeAction && activeStep === itemIndex && transaction.status === 'success'){
      setAmount('')
    }
  }, [executeAction, transaction.status, activeStep, itemIndex])

  const vaultEnabled = useMemo(() => {
    return (vault && (!("enabled" in vault) || vault.enabled)) && (asset && asset?.status !== 'deprecated')
  }, [vault, asset])

  const vaultLimitCap = useMemo(() => {
    return bnOrZero(asset?.limit).lt(VAULT_LIMIT_MAX) ? bnOrZero(asset?.limit) : BNify(0)
  }, [asset])

  const limitCapReached = useMemo(() => {
    return vaultLimitCap.gt(0) ? BNify(asset?.totalTvl).gte(vaultLimitCap) : false
  }, [asset, vaultLimitCap])

  const disabled = useMemo(() => {
    setError('')

    if (limitCapReached || !vaultEnabled || depositsDisabled || asset?.status === 'paused') return true

    if (BNify(amount).isNaN() || BNify(amount).lte(0)) return true
    // if (BNify(assetBalance).lte(0)) return true
    if (BNify(amount).gt(assetBalance)){
      setError(translate('trade.errors.insufficientFundsForAmount', {symbol: underlyingAsset?.name}))
      return true
    }

    // Check vault limit cap
    if (vaultLimitCap.gt(0) && BNify(asset?.totalTvl).plus(amount).gt(vaultLimitCap)){
      const remainingAmount = vaultLimitCap.minus(BNify(asset?.totalTvl))
      setError(translate('trade.errors.limitCapReached', {limit: remainingAmount.toFixed(2), symbol: underlyingAsset?.name}))
      return true
    }

    // Transaction is started, disable button
    if (transaction.status === 'started') return true

    return false
  }, [asset, amount, vaultLimitCap, limitCapReached, vaultEnabled, transaction, depositsDisabled, assetBalance, underlyingAsset, translate])

  // console.log(Object.getOwnPropertyNames(vault))
  // console.log('vault', vault.status, asset.status)
  // console.log('assetBalance', amount, assetBalance.toString(), disabled)

  const getDepositAllowance = useCallback(async (): Promise<BigNumber> => {
    if (!underlyingAsset || !vault || !("getAllowanceContract" in vault)) return BNify(0)
    if (!account?.address) return BNify(0)

    const allowanceContract = vault.getAllowanceContract()
    if (!allowanceContract) return BNify(0)

    const vaultOwner = getVaultAllowanceOwner(vault)
    const allowance = await getAllowance(allowanceContract, account.address, vaultOwner)
    return fixTokenDecimals(allowance, underlyingAsset.decimals)
  }, [underlyingAsset, vault, account?.address])

  // Deposit
  const deposit = useCallback((checkAllowance: boolean = true, forceAmount?: string | number) => {
    const amountToDeposit = forceAmount || amount

    // console.log('DEPOSIT', account?.address, disabled, forceAmount, amountToDeposit, stakingEnabled)
    if (!account || (disabled && !forceAmount) || bnOrZero(amountToDeposit).gt(assetBalance)) return
    if (!vault || !("getDepositContractSendMethod" in vault) || !("getDepositParams" in vault)) return
    // if (!underlyingAssetVault || !("contract" in underlyingAssetVault) || !underlyingAssetVault.contract) return

    if (stakingEnabled && !forceAmount){
      dispatch({type: 'SET_DEPOSIT_AMOUNT', payload: amountToDeposit})
      dispatch({type: 'SET_ASSET', payload: underlyingAsset})
      return setActionIndex(2);
    }

    ;(async() => {
      // if (!underlyingAssetVault.contract) return

      const allowance = checkAllowance ? await getDepositAllowance() : BNify(amountToDeposit)
      
      // console.log('allowance', account.address, checkAllowance, BNify(allowance).toString(), BNify(amountToDeposit).toString())

      if (allowance.gte(amountToDeposit)){

        const depositParams = _referral && ("flags" in vault) && vault.flags?.referralEnabled ? vault.getDepositParams(amountToDeposit, _referral) : vault.getDepositParams(amountToDeposit)
        const depositContractSendMethod = vault.getDepositContractSendMethod(depositParams)
        // console.log('depositParams', depositParams, depositContractSendMethod)
        // if (checkAllowance) return dispatch({type: 'SET_ACTIVE_STEP', payload: 1})

        // Send analytics event
        sendBeginCheckout(asset, amountUsd)

        // Send transaction
        sendTransaction(vault.id, underlyingAsset?.id, depositContractSendMethod)
      } else {
        // Go to approve section
        dispatch({type: 'SET_ACTIVE_STEP', payload: 1})
      }
    })()
  }, [account, disabled, _referral, amount, amountUsd, assetBalance, vault, asset, underlyingAsset, stakingEnabled, dispatch, setActionIndex, getDepositAllowance, sendTransaction])

  // Set max balance function
  const setMaxBalance = useCallback(() => {
    if (!underlyingAsset?.balance) return
    setAmount(underlyingAsset.balance.toString())
  }, [underlyingAsset])

  const getDefaultGasLimit = useCallback(async (): Promise<number|undefined> => {
    if (!vault || !isNetworkCorrect || !("getDepositContractSendMethod" in vault) || !("getDepositParams" in vault)) return
    const defaultGasLimit = vault.getMethodDefaultGasLimit('deposit')

    const allowance = await getDepositAllowance()

    // console.log('getDefaultGasLimit', assetBalance.toFixed(), allowance.toFixed())
    if (!account || assetBalance.lte(0) || allowance.lte(0)){
      return defaultGasLimit
    }

    const balanceToDeposit = BigNumber.minimum(assetBalance, allowance)

    // console.log('balanceToDeposit', assetBalance.toFixed(), allowance.toFixed(), balanceToDeposit.toFixed())

    const sendOptions = {
      from: account?.address
    }
    // const depositParams = vault.getDepositParams(balanceToDeposit.toFixed())
    const amount = balanceToDeposit.toFixed()
    const depositParams = _referral && ("flags" in vault) && vault.flags?.referralEnabled ? vault.getDepositParams(amount, _referral) : vault.getDepositParams(amount)

    const depositContractSendMethod = vault.getDepositContractSendMethod(depositParams)

    const estimatedGasLimit = await estimateGasLimit(depositContractSendMethod, sendOptions) || defaultGasLimit
    // console.log('DEPOSIT - estimatedGasLimit', allowance.toString(), assetBalance.toFixed(), depositParams, estimatedGasLimit)
    return estimatedGasLimit
  }, [account, isNetworkCorrect, vault, _referral, getDepositAllowance, assetBalance])

  // Update gas fees
  useEffect(() => {
    if (activeItem !== itemIndex) return
    ;(async () => {
      const defaultGasLimit = await getDefaultGasLimit()
      if (defaultGasLimit){
        setGasLimit(defaultGasLimit)
      }
    })()
  }, [activeItem, itemIndex, getDefaultGasLimit, setGasLimit])

  useEffect(() => {
    // console.log('useEffect', activeItem, itemIndex, executeAction, stakingEnabled, depositAmount)
    if (activeItem !== itemIndex || !executeAction || !stakingEnabled || bnOrZero(depositAmount).lte(0)) return
    dispatch({type: 'SET_AMOUNT', payload: depositAmount})
    dispatch({type: 'SET_DEFAULT_AMOUNT', payload: depositAmount})
    dispatch({type: 'SET_ASSET', payload: underlyingAsset})

    // Set amount
    setAmount(depositAmount)

    // Disable staking
    setStakingEnabled(false)

    // console.log('Deposit - executeAction', executeAction)
    // console.log('Deposit - execute deposit')
    deposit(true, depositAmount)
    dispatch({type: 'SET_EXECUTE_ACTION', payload: false})
  }, [depositAmount, setAmount, activeItem, dispatch, deposit, itemIndex, underlyingAsset, stakingEnabled, setStakingEnabled, executeAction])

  // Update parent amount
  useEffect(() => {
    if (activeItem !== itemIndex) return
    dispatch({type: 'SET_AMOUNT', payload: amount})
    dispatch({type: 'SET_DEFAULT_AMOUNT', payload: amount})
    dispatch({type: 'SET_ASSET', payload: underlyingAsset})

    // console.log('Deposit - executeAction', executeAction)
    if (executeAction) {
      // console.log('Deposit - execute deposit')
      deposit(false)
      dispatch({type: 'SET_EXECUTE_ACTION', payload: false})
    }
  }, [amount, activeItem, underlyingAsset, itemIndex, dispatch, executeAction, deposit])

  const depositButton = useMemo(() => {
    return account ? (
      <Translation component={Button} translation={stakingEnabled ? "common.stakeDeposit" : "common.deposit"} disabled={disabled} onClick={() => deposit(true)} variant={'ctaFull'}>
        {
          transaction.status === 'started' && (
            <Spinner size={'sm'} />
          )
        }
      </Translation>
    ) : (
      <ConnectWalletButton variant={'ctaFull'} />
    )
  }, [account, disabled, transaction, deposit, stakingEnabled])

  const referralMessage = useMemo(() => {
    if (!_referral) return null
    return (
      <Card.Dark
        py={2}
        pl={3}
        pr={2}
        border={0}
      >
        <VStack
          spacing={1}
        >
          <Translation textStyle={'captionSmaller'} translation={`defi.depositWithReferral`} />
          <AddressLink address={_referral} text={_referral} fontSize={'sm'} />
        </VStack>
      </Card.Dark>
    )
  }, [_referral])

  const vaultMessages = useMemo(() => {
    return vault && ("messages" in vault) ? vault.messages : undefined
  }, [vault])

  const vaultMessage = useMemo(() => {
    return !vaultEnabled && assetBalance.gt(0) ? (
      <Card.Dark
        py={2}
        pl={3}
        pr={2}
        border={0}
      >
        <HStack
          spacing={3}
          width={'full'}
        >
          <Image src={`${imageFolder}vaults/deprecated.png`} width={6} height={6} />
          <Translation textStyle={'captionSmaller'} translation={`trade.vaults.${asset?.type}.disabled`} textAlign={'left'} />
          <Translation component={Button} translation={`trade.vaults.${asset?.type}.disabledCta`} fontSize={'xs'} height={'auto'} width={'auto'} py={3} px={7} onClick={ () => setActionIndex(1) } />
        </HStack>
      </Card.Dark>
    ) : (asset && asset?.status !== 'production') ? (
      <Card.Dark
        p={2}
        border={0}
      >
        <VStack
          spacing={2}
          width={'full'}
          justifyContent={'center'}
        >
          <Translation textStyle={'captionSmaller'} translation={`trade.actions.deposit.messages.${asset.status}`} textAlign={'center'} />
          {
            /*
            asset?.status === 'paused' && (
              <Translation component={Button} translation={`trade.vaults.${asset?.type}.disabledCta`} fontSize={'xs'} height={'auto'} width={'auto'} py={2} px={7} onClick={ () => setActionIndex(1) } />
            )
            */
          }
        </VStack>
      </Card.Dark>
    ) : limitCapReached ? (
      <Card.Dark
        py={2}
        pl={4}
        pr={2}
        border={0}
      >
        <HStack
          spacing={4}
          width={'full'}
        >
          <Image src={`${imageFolder}vaults/experimental.png`} width={7} height={7} />
          <Translation textStyle={'captionSmaller'} translation={`trade.actions.deposit.messages.limitCapReached`} isHtml params={{limit: `${vaultLimitCap.toFixed(0)} ${underlyingAsset?.token}`}} textAlign={'left'} />
        </HStack>
      </Card.Dark>
    ) : vaultMessages?.deposit && (
      <Card.Dark
        p={2}
        border={0}
      >
        <Translation textStyle={'captionSmaller'} translation={vaultMessages.deposit} isHtml={true} textAlign={'center'} />
      </Card.Dark>
    )
  }, [asset, limitCapReached, vaultLimitCap, underlyingAsset, vaultEnabled, assetBalance, vaultMessages, setActionIndex])

  return (
    <AssetProvider
      flex={1}
      width={'full'}
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
          spacing={6}
          width={'100%'}
          alignItems={'flex-start'}
        >
          <HStack
            width={'100%'}
            spacing={[3, 4]}
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
                  <InputAmount amount={amount} amountUsd={amountUsd} setAmount={setAmount} />
                  <HStack
                    width={'100%'}
                    justifyContent={'space-between'}
                  >
                    <HStack
                      spacing={1}
                    >
                      <Translation component={Text} translation={'common.balance'} textStyle={'captionSmaller'} />
                      <AssetProvider.Balance abbreviate={true} decimals={4} textStyle={'captionSmaller'} color={'primary'} />
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
          {referralMessage}
          {vaultMessage}
          <DynamicActionFields assetId={asset?.id} action={'deposit'} amount={amount} amountUsd={amountUsd} />
          <FeeDiscountToggler assetId={asset?.id} />
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
                  <AssetProvider.PerformanceFee textStyle={'captionSmaller'} fontWeight={'600'} color={'primary'} />
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