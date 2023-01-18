import BigNumber from 'bignumber.js'
import { Card } from 'components/Card/Card'
import { imageFolder } from 'constants/folders'
import { sendBeginCheckout } from 'helpers/analytics'
import { useWalletProvider } from 'contexts/WalletProvider'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Translation } from 'components/Translation/Translation'
import { InputAmount } from 'components/InputAmount/InputAmount'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { Image, Box, VStack, HStack, Text, Button } from '@chakra-ui/react'
import { EstimatedGasFees } from 'components/OperativeComponent/EstimatedGasFees'
import { useOperativeComponent, ActionComponentArgs } from './OperativeComponent'
import { DynamicActionFields } from 'components/OperativeComponent/DynamicActionFields'
import { ConnectWalletButton } from 'components/ConnectWalletButton/ConnectWalletButton'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { BNify, getVaultAllowanceOwner, getAllowance, fixTokenDecimals, estimateGasLimit } from 'helpers/'

export const Deposit: React.FC<ActionComponentArgs> = ({ itemIndex }) => {
  const [ error, setError ] = useState<string>('')
  const [ amount, setAmount ] = useState<string>('0')
  const [ amountUsd, setAmountUsd ] = useState<number>(0)

  const { account } = useWalletProvider()
  const { sendTransaction, setGasLimit, state: { transaction } } = useTransactionManager()
  const { selectors: { selectAssetPriceUsd, selectAssetBalance } } = usePortfolioProvider()
  const { asset, vault, underlyingAsset/*, underlyingAssetVault*/, translate } = useAssetProvider()
  const { dispatch, activeItem, activeStep, executeAction, setActionIndex } = useOperativeComponent()

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
    return vault && (!("enabled" in vault) || vault.enabled)
  }, [vault])

  const disabled = useMemo(() => {
    setError('')
    if (!vaultEnabled) return true
    if (BNify(amount).isNaN() || BNify(amount).lte(0)) return true
    // if (BNify(assetBalance).lte(0)) return true
    if (BNify(amount).gt(assetBalance)){
      setError(translate('trade.errors.insufficientFundsForAmount', {symbol: underlyingAsset?.name}))
      return true
    }
    return false
  }, [amount, vaultEnabled, assetBalance, underlyingAsset, translate])

  // console.log('vaultEnabled', vault, vaultEnabled)
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
  const deposit = useCallback((checkAllowance = true) => {
    if (!account || disabled) return
    if (!vault || !("getDepositContractSendMethod" in vault) || !("getDepositParams" in vault)) return
    // if (!underlyingAssetVault || !("contract" in underlyingAssetVault) || !underlyingAssetVault.contract) return

    ;(async() => {
      // if (!underlyingAssetVault.contract) return

      const allowance = checkAllowance ? await getDepositAllowance() : BNify(amount)
      
      // console.log('allowance', vaultOwner, account.address, allowance)

      if (allowance.gte(amount)){
        const depositParams = vault.getDepositParams(amount)
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
  }, [account, disabled, amount, amountUsd, vault, asset, underlyingAsset, dispatch, getDepositAllowance, sendTransaction])

  // Set max balance function
  const setMaxBalance = useCallback(() => {
    if (!underlyingAsset?.balance) return
    setAmount(underlyingAsset.balance.toString())
  }, [underlyingAsset])

  const getDefaultGasLimit = useCallback(async () => {
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
    const depositParams = vault.getDepositParams(balanceToDeposit.toFixed())
    const depositContractSendMethod = vault.getDepositContractSendMethod(depositParams)

    const estimatedGasLimit = await estimateGasLimit(depositContractSendMethod, sendOptions) || defaultGasLimit
    // console.log('DEPOSIT - estimatedGasLimit', allowance.toString(), assetBalance.toFixed(), depositParams, estimatedGasLimit)
    return estimatedGasLimit
  }, [account, vault, getDepositAllowance, assetBalance])

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

    // console.log('Deposit - executeAction', executeAction)
    if (executeAction) {
      // console.log('Deposit - execute deposit')
      deposit(false)
      dispatch({type: 'SET_EXECUTE_ACTION', payload: false})
    }

  }, [amount, activeItem, underlyingAsset, itemIndex, dispatch, executeAction, deposit])

  const depositButton = useMemo(() => {
    return account ? (
      <Translation component={Button} translation={"common.deposit"} disabled={disabled} onClick={deposit} variant={'ctaFull'} />
    ) : (
      <ConnectWalletButton variant={'ctaFull'} />
    )
  }, [account, disabled, deposit])

  return (
    <AssetProvider
      flex={1}
      width={'100%'}
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
          {
            !vaultEnabled ? (
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
            ) : vault && ("status" in vault) && vault.status && (
              <Card.Dark
                p={2}
                border={0}
              >
                <Translation textStyle={'captionSmaller'} translation={`trade.actions.deposit.messages.${vault?.status}`} textAlign={'center'} />
              </Card.Dark>
            )
          }
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