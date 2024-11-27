import { Card } from 'components/Card/Card'
import { BNify, estimateGasLimit, getVaultAllowanceOwner } from 'helpers/'
import { MAX_ALLOWANCE } from 'constants/vars'
import type { NumberType } from 'constants/types'
import { MdOutlineLockOpen } from 'react-icons/md'
import { useWalletProvider } from 'contexts/WalletProvider'
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Translation } from 'components/Translation/Translation'
import { InputAmount } from 'components/InputAmount/InputAmount'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { Flex, VStack, HStack, Text, Button, Switch } from '@chakra-ui/react'
import { EstimatedGasFees } from 'components/OperativeComponent/EstimatedGasFees'
import { useOperativeComponent, ActionComponentArgs } from './OperativeComponent'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { CreditVault } from 'vaults/CreditVault'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'

type ApproveArgs = {
  amountUsd?: NumberType | null
} & ActionComponentArgs

export const Approve: React.FC<ApproveArgs> = ({
  amountUsd,
  itemIndex
}) => {
  const { account } = useWalletProvider()
  const { selectors: { selectVaultPrice } } = usePortfolioProvider()
  const { defaultAmount, dispatch, activeItem, baseActionType } = useOperativeComponent()
  const [ amount, setAmount ] = useState<string>(defaultAmount)
  const { underlyingAsset, asset, vault, translate, theme } = useAssetProvider()
  const [ allowanceModeExact, setAllowanceModeExact ] = useState<boolean>(true)
  const [ amountToApprove, setAmountToApprove ] = useState<string>(defaultAmount)
  const { sendTransaction/*, sendTransactionTest*/, setGasLimit } = useTransactionManager()

  useEffect(() => {
    setAmount(defaultAmount)
  }, [defaultAmount])

  const isEpochVault = useMemo(() => {
    return asset && !!asset.epochData
  }, [asset])

  const depositQueueAvailable = useMemo(() => {
    return vault && ("depositQueueContract" in vault) && !!vault.depositQueueContract
  }, [vault])

  const withdrawQueueAvailable = useMemo(() => {
    return vault && ("withdrawQueueContract" in vault) && !!vault.withdrawQueueContract
  }, [vault])

  const epochVaultDefaulted = useMemo(() => {
    if (isEpochVault && asset?.epochData && ("defaulted" in asset.epochData)){
      return !!asset.epochData.defaulted
    }
    return false
  }, [isEpochVault, asset])

  const epochVaultLocked = useMemo(() => {
    if (epochVaultDefaulted){
      return true
    }
    if (asset?.epochData && ("isEpochRunning" in asset.epochData)){
      return !depositQueueAvailable && !!asset.epochData.isEpochRunning
    }
    return asset && isEpochVault && asset.vaultIsOpen === false
  }, [asset, isEpochVault, epochVaultDefaulted, depositQueueAvailable])

  const depositQueueEnabled = useMemo(() => {
    const isEpochRunning = asset?.epochData && ("isEpochRunning" in asset.epochData) && !!asset.epochData.isEpochRunning
    return isEpochVault && depositQueueAvailable && isEpochRunning
  }, [asset, isEpochVault, depositQueueAvailable])

  const withdrawQueueEnabled = useMemo(() => {
    const isEpochRunning = asset?.epochData && ("isEpochRunning" in asset.epochData) && !!asset.epochData.isEpochRunning
    return isEpochVault && withdrawQueueAvailable && isEpochRunning
  }, [asset, isEpochVault, withdrawQueueAvailable])

  const getAllowanceContract = useCallback(() => {
    if (!vault) return
    if (baseActionType === 'withdraw' && withdrawQueueEnabled && vault instanceof CreditVault){
      return vault.tokenContract
    }
    return "getAllowanceContract" in vault ? vault.getAllowanceContract() : undefined
  }, [vault, withdrawQueueEnabled, baseActionType])

  const getAllowanceOwner = useCallback(() => {
    if (!vault) return

    console.log('getAllowanceOwner', {baseActionType, depositQueueEnabled, withdrawQueueEnabled})

    if (baseActionType === 'deposit' && depositQueueEnabled && vault instanceof CreditVault && vault.vaultConfig.depositQueue){
      return vault.vaultConfig.depositQueue.address
    }
    if (baseActionType === 'withdraw' && withdrawQueueEnabled && vault instanceof CreditVault && vault.vaultConfig.withdrawQueue){
      return vault.vaultConfig.withdrawQueue.address
    }
    return getVaultAllowanceOwner(vault)
  }, [vault, depositQueueEnabled, withdrawQueueEnabled, baseActionType])

  const isLpToken = useMemo(() => {
    const allowanceContract = getAllowanceContract()
    return vault && ("tokenContract" in vault && allowanceContract?.options.address === vault.tokenContract.options.address)
  }, [vault, getAllowanceContract])

  const getAllowanceParams = useCallback((amount: NumberType) => {
    if (!vault || !("getAllowanceParams" in vault)) return
    const owner = getAllowanceOwner()
    console.log('owner', owner)

    // Use 18 decimals for LP token
    if (isLpToken){
      const vaultPrice = selectVaultPrice(vault?.id)
      const amountToApprove = BNify(amount).div(vaultPrice)
      return vault.getAllowanceParams(amountToApprove, owner, 18)
    }

    return vault.getAllowanceParams(amount, owner)
  }, [vault, getAllowanceOwner, selectVaultPrice, isLpToken])

  const getAllowanceContractSendMethod = useCallback((params: any) => {
    const allowanceContract = getAllowanceContract();
    console.log('allowanceContract', allowanceContract)
    return allowanceContract?.methods.approve(...params);
  }, [getAllowanceContract])

  const getDefaultGasLimit = useCallback(async () => {
    if (!vault) return
    const sendOptions = {
      from: account?.address
    }
    const allowanceParams = getAllowanceParams(MAX_ALLOWANCE)
    if (!allowanceParams) return
    const allowanceContractSendMethod = getAllowanceContractSendMethod(allowanceParams)
    if (!allowanceContractSendMethod) return
    const estimatedGasLimit = await estimateGasLimit(allowanceContractSendMethod, sendOptions)
    // console.log('APPROVE - estimatedGasLimit', estimatedGasLimit)
    return estimatedGasLimit
  }, [account, vault, getAllowanceParams, getAllowanceContractSendMethod])

  const approve = useCallback(() => {
    if (!vault) return
    const allowanceParams = getAllowanceParams(amountToApprove)
    console.log('getAllowanceParams', amountToApprove, allowanceParams)
    if (!allowanceParams) return
    const allowanceContractSendMethod = getAllowanceContractSendMethod(allowanceParams)
    if (!allowanceContractSendMethod) return
    sendTransaction(vault.id, underlyingAsset?.id, allowanceContractSendMethod)
  }, [amountToApprove, vault, underlyingAsset, sendTransaction, getAllowanceParams, getAllowanceContractSendMethod])

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

  return (
    <VStack
      flex={1}
      width={'full'}
      alignItems={'flex-start'}
    >
      <Flex
        p={14}
        pt={20}
        flex={1}
      >
        <VStack
          spacing={6}
        >
          <MdOutlineLockOpen size={72} />
          <Translation component={Text} prefix={`${translate("modals.approve.routerName")} `} translation={"modals.approve.body"} params={{asset: underlyingAsset?.name}} textStyle={'heading'} fontSize={'h3'} textAlign={'center'} />
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
                <Translation component={Text} translation={"trade.unlimited"} textStyle={['captionSmall', 'clickable']} fontWeight={700} color={!allowanceModeExact ? 'primary' : 'ctaDisabled'} onClick={ () => setAllowanceModeExact(false) } />
                <Switch size={'sm'} isChecked={allowanceModeExact} onChange={ (e) => setAllowanceModeExact(e.target.checked) } />
                <Translation component={Text} translation={"trade.exact"} textStyle={['captionSmall', 'clickable']} fontWeight={700} color={allowanceModeExact ? 'primary' : 'ctaDisabled'} onClick={ () => setAllowanceModeExact(true) } />
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
                    <InputAmount inputHeight={6} amount={amount} amountUsd={amountUsd} setAmount={setAmount} />
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