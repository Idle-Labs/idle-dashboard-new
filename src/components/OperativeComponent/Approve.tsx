import { Card } from 'components/Card/Card'
import { estimateGasLimit } from 'helpers/'
import { MAX_ALLOWANCE } from 'constants/vars'
import type { NumberType } from 'constants/types'
import { MdOutlineLockOpen } from 'react-icons/md'
import { useWalletProvider } from 'contexts/WalletProvider'
import React, { useState, useCallback, useEffect } from 'react'
import { Translation } from 'components/Translation/Translation'
import { InputAmount } from 'components/InputAmount/InputAmount'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { Flex, VStack, HStack, Text, Button, Switch } from '@chakra-ui/react'
import { EstimatedGasFees } from 'components/OperativeComponent/EstimatedGasFees'
import { useOperativeComponent, ActionComponentArgs } from './OperativeComponent'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'

type ApproveArgs = {
  amountUsd?: NumberType | null
} & ActionComponentArgs

export const Approve: React.FC<ApproveArgs> = ({
  amountUsd,
  itemIndex
}) => {
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
    // console.log('allowanceParams', allowanceParams, allowanceContractSendMethod)
    if (!allowanceContractSendMethod) return
    sendTransaction(vault.id, underlyingAsset?.id, allowanceContractSendMethod)
  }, [amountToApprove, vault, underlyingAsset, sendTransaction])

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