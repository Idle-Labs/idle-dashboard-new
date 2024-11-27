import BigNumber from 'bignumber.js'
import { Card } from 'components/Card/Card'
import { Amount } from 'components/Amount/Amount'
import { BestYieldVault } from 'vaults/BestYieldVault'
import type { IdleTokenProtocol } from 'constants/vaults'
import { useWalletProvider } from 'contexts/WalletProvider'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Translation } from 'components/Translation/Translation'
import { InputAmount } from 'components/InputAmount/InputAmount'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useAssetPageProvider } from 'components/AssetPage/AssetPage'
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { getDecodedError, bnOrZero, BNify, estimateGasLimit, getAllowance } from 'helpers/'
import { useOperativeComponent, ActionComponentArgs } from './OperativeComponent'
import { EstimatedGasFees } from 'components/OperativeComponent/EstimatedGasFees'
import { EpochVaultMessage } from 'components/OperativeComponent/EpochVaultMessage'
import { DynamicActionFields } from 'components/OperativeComponent/DynamicActionFields'
import { SwitchNetworkButton } from 'components/SwitchNetworkButton/SwitchNetworkButton'
import { ConnectWalletButton } from 'components/ConnectWalletButton/ConnectWalletButton'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { Spinner, Box, VStack, HStack, Text, Button, Checkbox, Image } from '@chakra-ui/react'
import { CreditVault } from 'vaults/CreditVault'
import type { NumberType } from 'constants/'

export const Withdraw: React.FC<ActionComponentArgs> = ({ itemIndex }) => {
  const [ amount, setAmount ] = useState('0')
  const [ error, setError ] = useState<string>('')
  const [ amountUsd, setAmountUsd ] = useState<number>(0)
  const [ inputDisabled, setInputDisabled ] = useState<boolean>(false)
  const [ gasEstimateError, setGasEstimateError ] = useState<string | null>(null)
  const [ redeemInterestBearing, setRedeemInterestBearing ] = useState<boolean>(false)

  const { account } = useWalletProvider()
  const { searchParams } = useBrowserRouter()
  const { isNetworkCorrect } = useAssetPageProvider()
  const { dispatch, activeItem, activeStep } = useOperativeComponent()
  const { asset, vault, underlyingAsset, translate } = useAssetProvider()
  const { sendTransaction, setGasLimit, state: { transaction } } = useTransactionManager()
  const { selectors: { selectAssetPriceUsd, selectVaultPrice, selectAssetBalance, selectVaultGauge, selectAssetById } } = usePortfolioProvider()

  const [ , setSearchParams ] = useMemo(() => searchParams, [searchParams])

  const isEpochVault = useMemo(() => {
    return asset && !!asset.epochData
  }, [asset])

  const epochVaultDefaulted = useMemo(() => {
    if (isEpochVault && asset?.epochData && ("defaulted" in asset.epochData)){
      return !!asset.epochData.defaulted
    }
    return false
  }, [isEpochVault, asset])

  const withdrawQueueAvailable = useMemo(() => {
    return vault && ("withdrawQueueContract" in vault) && !!vault.withdrawQueueContract
  }, [vault])

  const epochVaultLocked = useMemo(() => {
    if (epochVaultDefaulted){
      return true
    }
    if (asset?.epochData && ("isEpochRunning" in asset.epochData)){
      return !withdrawQueueAvailable && !!asset.epochData.isEpochRunning
    }
    return asset && isEpochVault && asset.vaultIsOpen === false
  }, [asset, withdrawQueueAvailable, isEpochVault, epochVaultDefaulted])

  const withdrawQueueEnabled = useMemo(() => {
    const isEpochRunning = asset?.epochData && ("isEpochRunning" in asset.epochData) && !!asset.epochData.isEpochRunning
    return isEpochVault && withdrawQueueAvailable && isEpochRunning
  }, [asset, isEpochVault, withdrawQueueAvailable])

  const toggleRedeemInterestBearing = useCallback(() => {
    return setRedeemInterestBearing( prevState => !prevState )
  }, [setRedeemInterestBearing])

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

  const redeemInterestBearingEnabled = useMemo(() => {
    return vault && ("getWithdrawInterestBearingContractSendMethod" in vault) && asset?.status === 'paused' && (!("flags" in vault) || vault?.flags?.redeemInterestBearingEnabled === undefined || !!vault?.flags?.redeemInterestBearingEnabled)
  }, [vault, asset])

  const withdrawFunction = useMemo(() => {
    if (redeemInterestBearingEnabled && redeemInterestBearing){
      return 'getWithdrawInterestBearing'
    }
    return 'getWithdraw'
  }, [redeemInterestBearingEnabled, redeemInterestBearing])

  const withdrawParamsFunction = useMemo(() => `${withdrawFunction}Params`, [withdrawFunction])
  const withdrawSendMethodFunction = useMemo(() => `${withdrawFunction}ContractSendMethod`, [withdrawFunction])

  const assetBalance = useMemo(() => {
    if (!selectAssetBalance) return BNify(0)
    const balance = selectAssetBalance(vault?.id)
    const vaultPrice = selectVaultPrice(vault?.id)
    // console.log('assetBalance', balance.toString(), vaultPrice.toString(), balance.times(vaultPrice).toString())
    return balance.times(vaultPrice)
  }, [selectAssetBalance, selectVaultPrice, vault?.id])
  
  // Set max balance function
  const setMaxBalance = useCallback(() => {
    if (!assetBalance) return
    setAmount(assetBalance.toString())
  }, [assetBalance])

  // Disable input and set max balance
  useEffect(() => {
    if (redeemInterestBearingEnabled && redeemInterestBearing){
      setMaxBalance()
      setInputDisabled(true)
    } else {
      setInputDisabled(false)
    }
  }, [setMaxBalance, setInputDisabled, redeemInterestBearingEnabled, redeemInterestBearing])

  const disabled = useMemo(() => {
    setError('')
    if (BNify(amount).isNaN() || BNify(amount).lte(0) || epochVaultLocked) return true
    // if (BNify(assetBalance).lte(0)) return true
    if (BNify(amount).gt(assetBalance)){
      setError(translate('trade.errors.insufficientFundsForAmount', {symbol: underlyingAsset?.name}))
      return true
    }

    // Transaction is started, disable button
    if (transaction.status === 'started') return true

    return false
  }, [amount, transaction, assetBalance, underlyingAsset, translate, epochVaultLocked])

  const getWithdrawSendMethod = useCallback(async (amountToWithdraw: NumberType) => {
    if (!account || disabled) return
    if (!vault || !(withdrawSendMethodFunction in vault) || !(withdrawParamsFunction in vault)) return

    if (withdrawQueueEnabled && "getAllowanceContract" in vault && vault instanceof CreditVault){
      const spenderAddress = vault.vaultConfig.withdrawQueue?.address
      if (!spenderAddress) return
      return vault.getRequestWithdrawSendMethod(amountToWithdraw)
    } else {
      // @ts-ignore
      const withdrawParams = vault[withdrawParamsFunction](amountToWithdraw)

      // @ts-ignore
      return vault[withdrawSendMethodFunction](withdrawParams)
    }
  }, [account, disabled, vault, withdrawQueueEnabled, withdrawParamsFunction, withdrawSendMethodFunction])

  const getWithdrawAllowance = useCallback(async () => {
    if (account && vault && withdrawQueueEnabled && "getAllowanceContract" in vault && vault instanceof CreditVault){
      const spenderAddress = vault.vaultConfig.withdrawQueue?.address
      if (!spenderAddress) return BNify(0)
      return await getAllowance(vault.tokenContract, account.address, spenderAddress)
    }
    return BNify(vaultBalance)
  }, [vault, withdrawQueueEnabled, account, vaultBalance])

  // Withdraw
  const withdraw = useCallback(async () => {
    if (!vault) return
    const vaultPrice = selectVaultPrice(vault.id)
    const amountToWithdraw = BigNumber.minimum(vaultBalance, BNify(amount).div(vaultPrice))
    const allowance = await getWithdrawAllowance()
    if (allowance.lt(amountToWithdraw)){
      return dispatch({type: 'SET_ACTIVE_STEP', payload: 1})
    }

    const withdrawContractSendMethod = await getWithdrawSendMethod(amountToWithdraw)
    if (!vault || !withdrawContractSendMethod) return
    sendTransaction(vault.id, vault.id, withdrawContractSendMethod)
  }, [vault, getWithdrawSendMethod, amount, dispatch, sendTransaction, getWithdrawAllowance, vaultBalance, selectVaultPrice])

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

    // Estimate gas with new amount

  }, [underlyingAsset, vault, amount, selectVaultPrice, selectAssetPriceUsd, dispatch])

  const getDefaultGasLimit = useCallback(async () => {
    if (!vault) return

    const allowance = await getWithdrawAllowance()

    const defaultGasLimit = "getMethodDefaultGasLimit" in vault ? vault.getMethodDefaultGasLimit('withdraw') : 0
    if (!account || vaultBalance.lte(0) || allowance.lte(0)){
      return defaultGasLimit
    }

    const vaultPrice = selectVaultPrice(vault?.id)

    const sendOptions = {
      from: account?.address
    }

    const amountToWithdraw = bnOrZero(amount).gt(0) ? BigNumber.minimum(allowance, vaultBalance, BNify(amount).div(vaultPrice)) : vaultBalance

    const withdrawContractSendMethod = await getWithdrawSendMethod(amountToWithdraw)
    
    const estimatedGasLimit = await estimateGasLimit(withdrawContractSendMethod, sendOptions) || defaultGasLimit
    
    return estimatedGasLimit
  }, [account, amount, vaultBalance, vault, selectVaultPrice, getWithdrawSendMethod, getWithdrawAllowance])

  // Update gas fees
  useEffect(() => {
    setGasEstimateError(null)
    if (activeItem !== itemIndex || epochVaultLocked) return
    ;(async () => {
      try {
        const defaultGasLimit = await getDefaultGasLimit()
        setGasLimit(defaultGasLimit)
      } catch (error: any) {
        const errorHeader = error.message ? error.message.toString().split("\n")[0] : ''
        const decodedError = getDecodedError(error)
        const errorMessage = decodedError || errorHeader
        const translatedError = translate(`trade.actions.withdraw.messages.decoded.${errorMessage}`)
        const errorToShow = translatedError !== `trade.actions.withdraw.messages.decoded.${errorMessage}` ? translatedError : errorMessage
        setGasEstimateError(errorToShow)
      }
    })()
  }, [activeItem, amount, translate, itemIndex, getDefaultGasLimit, setGasLimit, setGasEstimateError, epochVaultLocked])

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
    if (!isNetworkCorrect && asset){
      return (
        <SwitchNetworkButton chainId={asset.chainId as number} width={'full'} />
      )
    }

    if (!account){
      return (<ConnectWalletButton variant={'ctaFull'} />)
    }

    const label = vault instanceof CreditVault ? 'trade.actions.withdraw.requestWithdraw' : (redeemInterestBearing ? "common.withdrawInterestBearing" : "common.withdraw")
    
    return (
      <Translation component={Button} translation={label} disabled={disabled} onClick={withdraw} variant={'ctaFull'}>
        {
          transaction.status === 'started' && (
            <Spinner size={'sm'} />
          )
        }
      </Translation>
    )
  }, [account, disabled, transaction, withdraw, isNetworkCorrect, vault, asset, redeemInterestBearing])

  const vaultMessages = useMemo(() => {
    return vault && ("messages" in vault) ? vault.messages : undefined
  }, [vault])

  const vaultMessage = useMemo(() => {
    return gasEstimateError ? (
      <Card.Dark
        p={2}
        border={0}
      >
        <Translation textStyle={'captionSmaller'} translation={'trade.actions.withdraw.messages.gasEstimateError'} params={{supportLink:'<a href="https://discord.com/channels/606071749657755668/606073687799627776">Discord channel</a>', error: gasEstimateError}} isHtml={true} textAlign={'center'} />
      </Card.Dark>
    ) : isEpochVault ? (
      <AssetProvider
        width={'full'}
        wrapFlex={false}
        assetId={asset?.id}
      >
        <EpochVaultMessage action={'withdraw'} />
      </AssetProvider>
    ) : /*assetBalance.gt(0) && */vaultMessages?.withdraw ? (
      <Card.Dark
        p={2}
        border={0}
      >
        <Translation textStyle={'captionSmaller'} translation={vaultMessages.withdraw} isHtml={true} textAlign={'center'} />
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
  }, [asset, vaultMessages, gasEstimateError/*, assetBalance*/, assetGauge, isEpochVault, setSearchParams])

  const withdrawInterestBearingToken = useMemo(() => {
    if (!redeemInterestBearingEnabled || vaultBalance.lte(0)) return null
    return (
      <Card.Dark
        px={2}
        py={3}
        border={0}
      >
        <VStack
          spacing={2}
          width={'full'}
          justifyContent={'center'}
        >
          <Image src={`images/vaults/deprecated.png`} width={6} height={6} />
          <Translation textAlign={'center'} textStyle={'captionSmaller'} translation={'trade.actions.redeemInterestBearing.description'} />
          <Translation component={Checkbox} size={'md'} sx={{'>span':{fontSize:'sm'}}} translation={'trade.actions.redeemInterestBearing.label'} isChecked={redeemInterestBearing} onChange={() => toggleRedeemInterestBearing()} />
        </VStack>
      </Card.Dark>
    )
  }, [vaultBalance, redeemInterestBearing, toggleRedeemInterestBearing, redeemInterestBearingEnabled])

  const interestBearingTokens = useMemo(() => {
    if (!asset?.interestBearingTokens || !asset?.vaultPosition || !vault || !(vault instanceof BestYieldVault)) return null
    return (
      <VStack
        spacing={2}
        width={'100%'}
        alignItems={'flex-start'}
      >
        <Translation mb={1} component={Text} translation={`dynamicActionFields.stkIDLE`} suffix={':'} textStyle={'titleSmall'} />
        {
          Object.keys(asset?.interestBearingTokens).map( (tokenAddress: string) => {
            const protocolAsset = selectAssetById(tokenAddress) || vault.tokenConfig.protocols.find( (p: IdleTokenProtocol) => p.address === tokenAddress )
            const interestBearingTotalBalance = bnOrZero(asset?.interestBearingTokens?.[tokenAddress])
            const shareAmount = interestBearingTotalBalance.times(bnOrZero(asset?.vaultPosition?.poolShare))
            return (
              <HStack
                pb={2}
                px={4}
                width={'100%'}
                alignItems={'center'}
                borderBottom={`1px solid`}
                borderBottomColor={'divider'}
                justifyContent={'space-between'}
                key={`assetField_${tokenAddress}`}
              >
                <Text textStyle={'captionSmall'}>{protocolAsset?.token}</Text>
                <Amount value={shareAmount} textStyle={'titleSmall'} color={'primary'} />
              </HStack>
            )
          })
        }
      </VStack>
    )
  }, [asset, vault, selectAssetById])

  const showDynamicFields = useMemo(() => !epochVaultLocked, [epochVaultLocked])

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
                  <InputAmount amount={amount} amountUsd={amountUsd} setAmount={setAmount} isDisabled={inputDisabled} />
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
          {vaultMessage}
          {
            redeemInterestBearingEnabled && redeemInterestBearing ?
              interestBearingTokens
            : showDynamicFields && (
              <DynamicActionFields assetId={asset?.id} action={'withdraw'} amount={amount} amountUsd={amountUsd} />
            )
          }
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
          {withdrawInterestBearingToken}
          <EstimatedGasFees />
          {withdrawButton}
        </VStack>
      </VStack>
    </AssetProvider>
  )
}