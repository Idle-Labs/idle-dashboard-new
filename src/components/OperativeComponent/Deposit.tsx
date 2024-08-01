import BigNumber from 'bignumber.js'
import { Card } from 'components/Card/Card'
import { MdDiscount } from "react-icons/md"
import { VAULT_LIMIT_MAX } from 'constants/'
import { imageFolder } from 'constants/folders'
import { sendBeginCheckout } from 'helpers/analytics'
import { useWalletProvider } from 'contexts/WalletProvider'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Translation } from 'components/Translation/Translation'
import { InputAmount } from 'components/InputAmount/InputAmount'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
// import { AddressLink } from 'components/AddressLink/AddressLink'
import { useAssetPageProvider } from 'components/AssetPage/AssetPage'
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { EstimatedGasFees } from 'components/OperativeComponent/EstimatedGasFees'
import { useOperativeComponent, ActionComponentArgs } from './OperativeComponent'
import { EpochVaultMessage } from 'components/OperativeComponent/EpochVaultMessage'
import { FeeDiscountToggler } from 'components/OperativeComponent/FeeDiscountToggler'
import { DynamicActionFields } from 'components/OperativeComponent/DynamicActionFields'
import { SwitchNetworkButton } from 'components/SwitchNetworkButton/SwitchNetworkButton'
import { ConnectWalletButton } from 'components/ConnectWalletButton/ConnectWalletButton'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { Spinner, Image, Box, VStack, HStack, Text, Button, Link } from '@chakra-ui/react'
import { BNify, bnOrZero, getVaultAllowanceOwner, getAllowance, fixTokenDecimals, estimateGasLimit, capitalize } from 'helpers/'
import { VaultKycCheck } from './VaultKycCheck'

export const Deposit: React.FC<ActionComponentArgs> = ({ itemIndex }) => {
  const [ error, setError ] = useState<string>('')
  const [ amount, setAmount ] = useState<string>('0')
  const [ amountUsd, setAmountUsd ] = useState<number>(0)
  const { stakingEnabled, setStakingEnabled, referral, isNetworkCorrect } = useAssetPageProvider()

  const { account } = useWalletProvider()
  const { asset, vault, underlyingAsset, translate } = useAssetProvider()
  const { sendTransaction, setGasLimit, state: { transaction } } = useTransactionManager()
  const { selectors: { selectAssetPriceUsd, selectAssetBalance } } = usePortfolioProvider()
  const { dispatch, activeItem, activeStep, executeAction, setActionIndex, depositAmount } = useOperativeComponent()

  const depositsDisabled = useMemo(() => (vault && ("flags" in vault) && vault.flags?.depositsDisabled), [vault])

  const assetBalance = useMemo(() => {
    if (!selectAssetBalance) return BNify(0)
    return selectAssetBalance(underlyingAsset?.id)
  }, [selectAssetBalance, underlyingAsset?.id])

  const positionReferral = useMemo(() => {
    return referral || asset?.vaultPosition?.referral
  }, [asset, referral])

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

  const isEpochVault = useMemo(() => {
    return asset && !!asset.epochData
  }, [asset])

  const epochVaultLocked = useMemo(() => {
    return asset && isEpochVault && asset.vaultIsOpen === false
  }, [asset, isEpochVault])

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

    if (limitCapReached || !vaultEnabled || depositsDisabled || asset?.status === 'paused' || epochVaultLocked) return true

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
  }, [asset, amount, vaultLimitCap, limitCapReached, epochVaultLocked, vaultEnabled, transaction, depositsDisabled, assetBalance, underlyingAsset, translate])

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

        // @ts-ignore
        const depositParams = vault.getDepositParams(amountToDeposit, referral)
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
  }, [account, disabled, referral, amount, amountUsd, assetBalance, vault, asset, underlyingAsset, stakingEnabled, dispatch, setActionIndex, getDepositAllowance, sendTransaction])

  // Set max balance function
  const setMaxBalance = useCallback(() => {
    if (!underlyingAsset?.balance) return
    setAmount(underlyingAsset.balance.toString())
  }, [underlyingAsset])

  const getDefaultGasLimit = useCallback(async (): Promise<number|undefined> => {
    if (!vault || !("getDepositContractSendMethod" in vault) || !("getDepositParams" in vault)) return
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

    // @ts-ignore
    const depositParams = vault.getDepositParams(amount, referral)

    const depositContractSendMethod = vault.getDepositContractSendMethod(depositParams)

    const estimatedGasLimit = await estimateGasLimit(depositContractSendMethod, sendOptions) || defaultGasLimit
    // console.log('DEPOSIT - estimatedGasLimit', allowance.toString(), assetBalance.toFixed(), depositParams, estimatedGasLimit)
    return estimatedGasLimit
  }, [account, vault, referral, getDepositAllowance, assetBalance])

  // Update gas fees
  useEffect(() => {
    if (activeItem !== itemIndex || epochVaultLocked) return
    ;(async () => {
      const defaultGasLimit = await getDefaultGasLimit()
      if (defaultGasLimit){
        setGasLimit(defaultGasLimit)
      }
    })()
  }, [activeItem, itemIndex, getDefaultGasLimit, setGasLimit, epochVaultLocked])

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
    return !isNetworkCorrect && asset ? (
      <SwitchNetworkButton chainId={asset.chainId as number} width={'full'} />
    ) : account ? (
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
  }, [account, disabled, transaction, deposit, isNetworkCorrect, asset, stakingEnabled])

  const feeDiscountOnReferral = useMemo(() => vault && ("flags" in vault) && vault.flags?.feeDiscountOnReferral ? bnOrZero(vault.flags?.feeDiscountOnReferral) : BNify(0), [vault])

  const referralMessage = useMemo(() => {
    if (!asset || !positionReferral || feeDiscountOnReferral.lte(0)) return null
    return (
      <Card.Dark
        py={2}
        pl={3}
        pr={2}
        border={0}
      >
        <HStack
          spacing={3}
          width={'full'}
          justifyContent={'flex-start'}
        >
          <Box
            pl={2}
          >
            <MdDiscount size={24} />
          </Box>
          <Translation textStyle={'captionSmaller'} translation={`defi.feeDiscountReferral`} isHtml={true} params={{performanceFee: feeDiscountOnReferral.times(100), protocol: capitalize(asset.protocol as string)}} />
        </HStack>
      </Card.Dark>
    )
  }, [asset, positionReferral, feeDiscountOnReferral])

  const vaultMessages = useMemo(() => {
    return vault && ("messages" in vault) ? vault.messages : undefined
  }, [vault])

  const vaultMessage = useMemo(() => {
    return !vaultEnabled ? (
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
          <Translation textStyle={'captionSmaller'} translation={asset?.status && asset.status !== 'production' ? `trade.actions.deposit.messages.${asset?.status}` : `trade.vaults.${asset?.type}.disabled`} textAlign={'left'} />
          {
            assetBalance.gt(0) && (
              <Translation component={Button} translation={`trade.vaults.${asset?.type}.disabledCta`} fontSize={'xs'} height={'auto'} width={'auto'} py={3} px={7} onClick={ () => setActionIndex(1) } />
            )
          }
        </HStack>
      </Card.Dark>
    ) : isEpochVault ? (
      <AssetProvider
        width={'full'}
        wrapFlex={false}
        assetId={asset?.id}
      >
        <EpochVaultMessage action={'deposit'} />
      </AssetProvider>
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
    ) : vaultMessages?.deposit ? (
      <Card.Dark
        p={2}
        border={0}
      >
        <Translation textStyle={'captionSmaller'} translation={vaultMessages.deposit} isHtml={true} textAlign={'center'} />
      </Card.Dark>
    ) : vaultMessages?.buyLink && (
      <Card.Dark
        p={2}
        border={'1px solid'}
        borderColor={'card.bgLight'}
      >
        <HStack
          spacing={3}
          width={'full'}
          alignItems={'center'}
          justifyContent={'space-between'}
        >
          <HStack
            pl={2}
            spacing={3}
            alignItems={'center'}
          >
            <Image src={`${imageFolder}vaults/information.png`} width={6} height={6} />
            <Translation textStyle={'captionSmall'} translation={`trade.actions.deposit.messages.buy`} params={{asset: underlyingAsset?.name}} textAlign={'left'} />
          </HStack>
          <Link display={'flex'} justifyContent={'center'} href={vaultMessages.buyLink} sx={{textDecoration:'none !important'}} isExternal>
            <Translation component={Button} variant={'ctaBlue'} translation={`trade.actions.deposit.messages.buyCta`} params={{asset: underlyingAsset?.name}} fontSize={'xs'} height={'auto'} width={'auto'} py={3} px={7} />
          </Link>
        </HStack>
      </Card.Dark>
    )
  }, [asset, isEpochVault, limitCapReached, vaultLimitCap, underlyingAsset, vaultEnabled, assetBalance, vaultMessages, setActionIndex])

  return (
    <VaultKycCheck
      assetId={asset?.id}
    >
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
            <VStack
              spacing={3}
              width={'full'}
            >
              {referralMessage}
              {vaultMessage}
            </VStack>
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
    </VaultKycCheck>
  )
}