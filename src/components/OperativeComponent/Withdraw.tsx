import BigNumber from 'bignumber.js'
import { Card } from 'components/Card/Card'
import { BNify, estimateGasLimit } from 'helpers/'
import type { VaultMessages } from 'constants/vaults'
import { useWalletProvider } from 'contexts/WalletProvider'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Translation } from 'components/Translation/Translation'
import { InputAmount } from 'components/InputAmount/InputAmount'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { Box, VStack, HStack, Text, Button } from '@chakra-ui/react'
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { useOperativeComponent, ActionComponentArgs } from './OperativeComponent'
import { EstimatedGasFees } from 'components/OperativeComponent/EstimatedGasFees'
import { DynamicActionFields } from 'components/OperativeComponent/DynamicActionFields'
import { ConnectWalletButton } from 'components/ConnectWalletButton/ConnectWalletButton'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'

export const Withdraw: React.FC<ActionComponentArgs> = ({ itemIndex }) => {
  const [ amount, setAmount ] = useState('0')
  const [ error, setError ] = useState<string>('')
  const [ amountUsd, setAmountUsd ] = useState<number>(0)

  const { account } = useWalletProvider()
  const { searchParams } = useBrowserRouter()
  const { dispatch, activeItem, activeStep } = useOperativeComponent()
  const { asset, vault, underlyingAsset, translate } = useAssetProvider()
  const { sendTransaction, setGasLimit, state: { transaction } } = useTransactionManager()
  const { selectors: { selectAssetPriceUsd, selectVaultPrice, selectAssetBalance, selectVaultGauge, selectAssetById } } = usePortfolioProvider()

  const [ , setSearchParams ] = useMemo(() => searchParams, [searchParams])
  // console.log('asset', asset)

  const vaultBalance = useMemo(() => {
    if (!selectAssetBalance) return BNify(0)
    return selectAssetBalance(vault?.id)
  }, [selectAssetBalance, vault?.id])

  const vaultGauge = useMemo(() => {
    return asset?.id && selectVaultGauge && selectVaultGauge(asset.id)
  }, [selectVaultGauge, asset?.id])

  const assetGauge = useMemo(() => {
    return vaultGauge && selectAssetById && selectAssetById(vaultGauge.id)
  }, [selectAssetById, vaultGauge])

  const assetBalance = useMemo(() => {
    if (!selectAssetBalance) return BNify(0)
    const balance = selectAssetBalance(vault?.id)
    const vaultPrice = selectVaultPrice(vault?.id)
    // console.log('assetBalance', balance.toString(), vaultPrice.toString())
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
      // console.log('withdrawParams', withdrawParams, withdrawContractSendMethod)
      sendTransaction(vault.id, vault.id, withdrawContractSendMethod)
    })()
  }, [account, disabled, amount, vault, vaultBalance, selectVaultPrice, sendTransaction])

  // Reset amount on transaction succeeded
  useEffect(() => {
    if (activeStep === itemIndex && transaction.status === 'success'){
      setAmount('')
    }
  }, [transaction.status, activeStep, itemIndex])

  // Update amount USD and disabled
  useEffect(() => {
    if (!selectAssetPriceUsd || !selectVaultPrice || !underlyingAsset || !vault) return
    const assetPriceUsd = selectAssetPriceUsd(underlyingAsset.id)
    // const vaultPrice = selectVaultPrice(vault.id)
    const amountUsd = parseFloat(BNify(amount).times(assetPriceUsd).toString()) || 0
    // console.log('withdraw', BNify(amount).toString(), BNify(assetPriceUsd).toString(), BNify(vaultPrice).toString(), amountUsd.toString())
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
    // console.log('WITHDRAW - estimatedGasLimit', estimatedGasLimit)
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
    // const vaultPrice = selectVaultPrice(vault.id)
    dispatch({type: 'SET_AMOUNT', payload: BNify(amount).toString()})
    dispatch({type: 'SET_DEFAULT_AMOUNT', payload: BNify(amount).toString()})
  }, [vault, asset, amount, selectVaultPrice, activeItem, itemIndex, dispatch, withdraw])

  const withdrawButton = useMemo(() => {
    return account ? (
      <Translation component={Button} translation={"common.withdraw"} disabled={disabled} onClick={withdraw} variant={'ctaFull'} />
    ) : (
      <ConnectWalletButton variant={'ctaFull'} />
    )
  }, [account, disabled, withdraw])

  const vaultMessages = useMemo((): VaultMessages | undefined => {
    return vault && ("messages" in vault) ? vault.messages : undefined
  }, [vault])

  return (
    <AssetProvider
      flex={1}
      width={'100%'}
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
                      <AssetProvider.VaultBalance abbreviate={true} decimals={4} textStyle={'captionSmaller'} color={'primary'} />
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
            assetBalance.gt(0) && vaultMessages?.withdraw ? (
              <Card.Dark
                p={2}
                border={0}
              >
                <Translation textStyle={'captionSmaller'} translation={vaultMessages.withdraw} textAlign={'center'} />
              </Card.Dark>
            ) : BNify(assetGauge?.balance).gt(0) && (
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
                  <Translation textStyle={'captionSmaller'} translation={'trade.actions.withdraw.messages.unstakeFromGauge'} textAlign={'left'} />
                  <Translation component={Button} translation={`common.unstake`} fontSize={'xs'} height={'auto'} width={'auto'} py={3} px={7} onClick={ () => setSearchParams(`?tab=gauge`) } />
                </HStack>
              </Card.Dark>
            )
          }
          <DynamicActionFields assetId={asset?.id} action={'withdraw'} amount={amount} amountUsd={amountUsd} />
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
          {withdrawButton}
        </VStack>
      </VStack>
    </AssetProvider>
  )
}