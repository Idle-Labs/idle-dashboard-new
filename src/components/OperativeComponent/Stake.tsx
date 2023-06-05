import BigNumber from 'bignumber.js'
import { ManipulateType } from 'dayjs'
import { Card } from 'components/Card/Card'
import { MdLockOpen } from 'react-icons/md'
import { defaultChainId } from 'constants/chains'
import { TbPlugConnectedX } from 'react-icons/tb'
import { sendBeginCheckout } from 'helpers/analytics'
import { useWeb3Provider } from 'contexts/Web3Provider'
import { StakedIdleVault } from 'vaults/StakedIdleVault'
import { InputDate } from 'components/InputDate/InputDate'
import { useWalletProvider } from 'contexts/WalletProvider'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Translation } from 'components/Translation/Translation'
import { InputAmount } from 'components/InputAmount/InputAmount'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { useOperativeComponent, ActionComponentArgs } from './OperativeComponent'
import { EstimatedGasFees } from 'components/OperativeComponent/EstimatedGasFees'
import { DynamicActionFields } from 'components/OperativeComponent/DynamicActionFields'
import { ConnectWalletButton } from 'components/ConnectWalletButton/ConnectWalletButton'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { MIN_STAKING_INCREASE_SECONDS, MIN_STAKING_SECONDS, MAX_STAKING_SECONDS } from 'constants/vars'
import { Box, VStack, HStack, Text, Button, SimpleGrid, Center, Tabs, TabList, Tab } from '@chakra-ui/react'
import { BNify, getVaultAllowanceOwner, getAllowance, fixTokenDecimals, estimateGasLimit, toDayjs, bnOrZero, getBlock, formatDate, dayMax, dayMin, abbreviateNumber } from 'helpers/'

export const Stake: React.FC<ActionComponentArgs> = ({ itemIndex, chainIds=[] }) => {
  const [ error, setError ] = useState<string>('')
  const [ amount, setAmount ] = useState<string>('0')
  const [ errorDate, setErrorDate ] = useState<string>('')
  const [ increaseTab, setIncreaseTab ] = useState<number>(0)
  const [ lockEndDate, setLockEndDate ] = useState<any>(null)

  const { web3 } = useWeb3Provider()
  const { account, setChainId, checkChainEnabled } = useWalletProvider()
  const { asset, vault, underlyingAsset, translate } = useAssetProvider()
  const { sendTransaction, setGasLimit, state: { transaction, block } } = useTransactionManager()
  const { dispatch, activeItem, activeStep, executeAction, setActionIndex } = useOperativeComponent()
  const { stakingData, selectors: { selectAssetBalance, selectAssetPriceUsd } } = usePortfolioProvider()

  const isChainEnabled = useMemo(() => checkChainEnabled(chainIds), [chainIds, checkChainEnabled])

  const assetBalance = useMemo(() => {
    if (!selectAssetBalance) return BNify(0)
    return selectAssetBalance(underlyingAsset?.id)
  }, [selectAssetBalance, underlyingAsset?.id])

  // Update amount USD and disabled
  const amountUsd = useMemo(() => {
    if (!selectAssetPriceUsd || !underlyingAsset) return
    const assetPriceUsd = selectAssetPriceUsd(underlyingAsset.id)
    return bnOrZero(amount).times(assetPriceUsd)
  }, [underlyingAsset, amount, selectAssetPriceUsd])
  // console.log('asset', asset, 'underlyingAsset', underlyingAsset)

  const increaseOptions: {action: string, label: string, type: string}[] = useMemo(() => [
    {
      type:'amount',
      action:'increaseAmount',
      label:'staking.increaseAmount',
    },
    {
      type:'time',
      action:'increaseTime',
      label:'staking.increaseTime'
    }
  ], [])

  const lockExpired = useMemo(() => {
    if (!stakingData?.position?.lockEnd || !block) return false
    return toDayjs(stakingData?.position?.lockEnd).isSameOrBefore(toDayjs(block.timestamp*1000))
  }, [stakingData, block])

  const increaseEnabled = useMemo(() => {
    return stakingData?.position?.deposited.gt(0)
  }, [stakingData])

  const selectedIncreaseOption = useMemo(() => {
    return increaseEnabled ? increaseOptions[increaseTab] : null
  }, [increaseEnabled, increaseOptions, increaseTab])

  const selectedIncreaseType = useMemo(() => {
    return selectedIncreaseOption ? selectedIncreaseOption.type : null
  }, [selectedIncreaseOption])

  const selectedAction = useMemo(() => {
    return selectedIncreaseOption ? selectedIncreaseOption.action : 'stake'
  }, [selectedIncreaseOption])

  const minDate = useMemo(() => {
    return stakingData?.position?.lockEnd ? toDayjs(stakingData?.position?.lockEnd).add(MIN_STAKING_INCREASE_SECONDS, 'second') : toDayjs().add(MIN_STAKING_SECONDS, 'second')
  }, [stakingData])

  const maxDate = useMemo(() => {
    return toDayjs().add(MAX_STAKING_SECONDS, 'second')
  }, [])

  const lockEndTime = useMemo(() => {
    if (selectedIncreaseType === 'amount' && stakingData?.position?.lockEnd){
      return Math.round(stakingData.position.lockEnd/1000)
    }

    const now = toDayjs()
    const newLockEndDate = lockEndDate && lockEndDate.set('hour', now.hour()).set('minute', now.minute()).set('second', now.second())

    // console.log('newLockEndDate', newLockEndDate?.format('YYYY-MM-DD HH:mm:ss'))

    return newLockEndDate ? Math.round(newLockEndDate.toDate().getTime()/1000) : 0
  }, [selectedIncreaseType, stakingData, lockEndDate])

  const stakingPower = useMemo(() => {
    // Use lockEnd from staking position if user is incrementing his amount
    const stakingDurationSeconds = Math.max(0, lockEndTime-Math.round(Date.now()/1000))
    return BNify(stakingDurationSeconds).div(MAX_STAKING_SECONDS)
  }, [lockEndTime])

  // console.log('stakingPower', stakingPower.toFixed())

  const depositedAmount = useMemo(() => {
    return bnOrZero(stakingData?.position?.deposited)
  }, [stakingData])

  const stkIDLEAmount = useMemo(() => {
    if (selectedIncreaseType === 'time' && stakingData?.position){
      return stakingData?.position?.deposited.times(stakingPower)
    }
    const balance = bnOrZero(stakingData?.position?.balance)
    return balance.plus(bnOrZero(amount).times(stakingPower))
  }, [selectedIncreaseType, stakingData, stakingPower, amount])

  // Update lock end date if not set
  useEffect(() => {
    if (!stakingData?.position?.lockEnd || selectedIncreaseType !== 'time') return
    // console.log('minDate', minDate.format('YYYY-MM-DD'))
    setLockEndDate(minDate)
  }, [stakingData, setLockEndDate, selectedIncreaseType, minDate])

  const checkLockEndDate = useCallback(() => {
    return lockEndDate && lockEndDate.startOf('day').isSameOrAfter(minDate.startOf('day')) && lockEndDate.startOf('day').isSameOrBefore(maxDate.startOf('day'))
  }, [lockEndDate, minDate, maxDate])

  const quickOptions: { label: string, value: number, timeframe: ManipulateType }[] = useMemo(() => [
    {
      label:'staking.6months',
      value: 6,
      timeframe: 'month'
    },
    {
      label:'staking.1year',
      value: 1,
      timeframe: 'year'
    },
    {
      label:'staking.4years',
      value: MAX_STAKING_SECONDS,
      timeframe: 'second'
    }
  ], [])

  const disabled = useMemo(() => {
    // Reset errors
    setError('')
    setErrorDate('')

    if (!selectedIncreaseType || selectedIncreaseType === 'amount'){
      if (BNify(amount).isNaN() || BNify(amount).lte(0)) return true
      // if (BNify(assetBalance).lte(0)) return true
      if (BNify(amount).gt(assetBalance)){
        setError(translate('trade.errors.insufficientFundsForAmount', {symbol: underlyingAsset?.name}))
        return true
      }
    }

    if (!selectedIncreaseType || selectedIncreaseType === 'time'){
      if (!checkLockEndDate()){
        if (selectedIncreaseType === 'time'){
          setErrorDate(translate('trade.errors.stakingIncreaseLockEndDateNotCorrect'))
        } else {
          setErrorDate(translate('trade.errors.stakingLockEndDateNotCorrect'))
        }
        return true
      }
    }

    return false
  }, [amount, selectedIncreaseType, checkLockEndDate, assetBalance, underlyingAsset, translate])

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
    if (!vault || !("getDepositContractSendMethod" in vault) || !("getDepositParams" in vault) || !(vault instanceof StakedIdleVault)) return
    // if (!underlyingAssetVault || !("contract" in underlyingAssetVault) || !underlyingAssetVault.contract) return

    ;(async() => {
      // if (!underlyingAssetVault.contract) return

      // Approve and create lock
      if (!increaseEnabled){
        const allowance = checkAllowance ? await getDepositAllowance() : BNify(amount)
        // console.log('allowance', account.address, allowance)
        if (allowance.gte(amount)){

          // Check if max lockEndTime is selected
          let newLockEndTime = lockEndTime
          const maxStakeOption = [...quickOptions].pop()
          if (lockEndDate?.format('YYYY-MM-DD') === toDayjs().add(maxStakeOption!.value, maxStakeOption!.timeframe).format('YYYY-MM-DD')){
            const latestBlock = await getBlock(web3!)
            if (latestBlock){
              newLockEndTime = +latestBlock.timestamp+MAX_STAKING_SECONDS
            }
          }

          // Send analytics event
          sendBeginCheckout(asset, amountUsd)

          // console.log('newLockEndTime', newLockEndTime, toDayjs(newLockEndTime*1000).format('YYYY-MM-DD HH:mm:ss'))
          const depositParams = vault.getDepositParams(amount, newLockEndTime)
          // console.log('depositParams', depositParams)

          const depositContractSendMethod = vault.getDepositContractSendMethod(depositParams)
          sendTransaction(vault.id, underlyingAsset?.id, depositContractSendMethod, selectedAction)
        } else {
          // Go to approve section
          dispatch({type: 'SET_ACTIVE_STEP', payload: 1})
        }
      } else {
        switch (selectedIncreaseType){
          case 'amount':
            const allowance = checkAllowance ? await getDepositAllowance() : BNify(amount)
            if (allowance.gte(amount)){
              const increaseAmountParams = vault.getIncreaseAmountParams(amount)
              // console.log('increaseAmountParams', increaseAmountParams)
              const depositContractSendMethod = vault.getIncreaseAmountContractSendMethod(increaseAmountParams)
              sendTransaction(vault.id, underlyingAsset?.id, depositContractSendMethod, selectedAction)
            } else {
              // Go to approve section
              dispatch({type: 'SET_ACTIVE_STEP', payload: 1})
            }
          break;
          case 'time':
            // Check if max lockEndTime is selected
            let newLockEndTime = lockEndTime
            const maxStakeOption = [...quickOptions].pop()
            if (lockEndDate?.format('YYYY-MM-DD') === toDayjs().add(maxStakeOption!.value, maxStakeOption!.timeframe).format('YYYY-MM-DD')){
              const latestBlock = await getBlock(web3!)
              if (latestBlock){
                newLockEndTime = +latestBlock.timestamp+MAX_STAKING_SECONDS
              }
            }

            const increaseTimeParams = vault.getIncreaseTimeParams(newLockEndTime)
            // console.log('increaseTimeParams', increaseTimeParams)
            const depositContractSendMethod = vault.getIncreaseTimeContractSendMethod(increaseTimeParams)
            sendTransaction(vault.id, underlyingAsset?.id, depositContractSendMethod, selectedAction, formatDate(lockEndDate, 'YYYY-MM-DD HH:mm', true))
          break;
          default:
          break;
        }
      }

    })()
  }, [account, asset, increaseEnabled, selectedAction, selectedIncreaseType, disabled, amount, amountUsd, quickOptions, web3, lockEndDate, lockEndTime, vault, underlyingAsset, dispatch, getDepositAllowance, sendTransaction])

  // Reset amount on transaction succeeded
  useEffect(() => {
    if (!executeAction && activeStep === itemIndex && transaction.status === 'success'){
      setAmount('')
    }
  }, [executeAction, transaction.status, activeStep, itemIndex])

  // Set max balance function
  const setMaxBalance = useCallback(() => {
    if (!underlyingAsset?.balance) return
    setAmount(underlyingAsset.balance.toString())
  }, [underlyingAsset])

  const getDefaultGasLimit = useCallback(async () => {
    if (!vault || !("getDepositContractSendMethod" in vault) || !("getDepositParams" in vault) || !(vault instanceof StakedIdleVault)) return
    const defaultGasLimit = vault.getMethodDefaultGasLimit('stake')

    if (!account || assetBalance.lte(0) || !checkLockEndDate()){
      return defaultGasLimit
    }

    const allowance = await getDepositAllowance()

    if (allowance.lte(0)){
      return defaultGasLimit
    }

    const balanceToDeposit = BigNumber.minimum(assetBalance, allowance)

    // console.log('balanceToDeposit', assetBalance.toFixed(), allowance.toFixed(), balanceToDeposit.toFixed(), lockEndTime)

    const sendOptions = {
      from: account?.address
    }

    let depositContractSendMethod = null

    if (!increaseEnabled){
      const depositParams = vault.getDepositParams(balanceToDeposit.toFixed(), lockEndTime)
      depositContractSendMethod = vault.getDepositContractSendMethod(depositParams)
    } else if (selectedIncreaseType === 'amount'){
      const depositParams = vault.getIncreaseAmountParams(balanceToDeposit.toFixed())
      depositContractSendMethod = vault.getIncreaseAmountContractSendMethod(depositParams)
    } else if (selectedIncreaseType === 'time'){
      const depositParams = vault.getIncreaseTimeParams(lockEndTime)
      depositContractSendMethod = vault.getIncreaseTimeContractSendMethod(depositParams)
    }

    if (!depositContractSendMethod) return defaultGasLimit

    const estimatedGasLimit = await estimateGasLimit(depositContractSendMethod, sendOptions) || defaultGasLimit
    // console.log('DEPOSIT - estimatedGasLimit', allowance.toString(), assetBalance.toFixed(), depositParams, estimatedGasLimit)
    return estimatedGasLimit
  }, [account, increaseEnabled, selectedIncreaseType, vault, checkLockEndDate, lockEndTime, getDepositAllowance, assetBalance])

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
      <Translation component={Button} translation={`staking.${selectedAction}`} disabled={disabled} onClick={deposit} variant={'ctaFull'} />
    ) : (
      <ConnectWalletButton variant={'ctaFull'} />
    )
  }, [account, disabled, selectedAction, deposit])

  const selectQuickOption = useCallback((value: number, timeframe: ManipulateType) => {
    const newDate = dayMin(dayMax(toDayjs().add(value, timeframe), minDate), maxDate)
    setLockEndDate(newDate)
  }, [setLockEndDate, minDate, maxDate])

  const handleActionChange = useCallback((index: number) => {
    setIncreaseTab(index)
  }, [setIncreaseTab])

  const increaseAmount = useMemo(() => {
    if (increaseEnabled && selectedIncreaseType !== 'amount') return null
    return (
      <HStack
        width={'100%'}
        spacing={[3, 4]}
        alignItems={'flex-start'}
      >
        <Box
          pt={8}
          width={'110px'}
        >
          <AssetLabel assetId={asset?.id} />
        </Box>
        <VStack
          flex={1}
          spacing={1}
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
              <InputAmount amount={amount} amountUsd={null} setAmount={setAmount} />
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
    )
  }, [asset, amount, setAmount, error, setMaxBalance, increaseEnabled, selectedIncreaseType])

  const increaseTime = useMemo(() => {
    if (increaseEnabled && selectedIncreaseType !== 'time') return null
    return (
      <HStack
        spacing={4}
        width={'100%'}
        alignItems={'flex-start'}
      >
        <Box
          pt={8}
          width={'110px'}
        >
          <Translation translation={'staking.lockEnd'} textStyle={'titleSmall'} fontSize={'md'} color={'primary'} whiteSpace={'nowrap'}></Translation>
        </Box>
        <VStack
          flex={1}
          spacing={1}
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
              <InputDate value={lockEndDate?.format('YYYY-MM-DD')} setValue={setLockEndDate} min={minDate.format('YYYY-MM-DD')} max={maxDate.format('YYYY-MM-DD')} />
              <SimpleGrid
                spacing={1}
                width={'100%'}
                columns={quickOptions.length}
                justifyContent={'space-between'}
              >
                {
                  quickOptions.map( quickOption => {
                    const isSelected = lockEndDate?.format('YYYY-MM-DD') === toDayjs().add(quickOption.value, quickOption.timeframe).format('YYYY-MM-DD')
                    return (
                      <Translation key={`option_${quickOption.label}`} translation={quickOption.label} component={Button} variant={'selector'} aria-selected={isSelected} onClick={ () => selectQuickOption(quickOption.value, quickOption.timeframe) } />
                    )
                  })
                }
              </SimpleGrid>
            </VStack>
          </Card>
          {
            errorDate && <Text textStyle={'captionSmaller'} color={'orange'}>{errorDate}</Text>
          }
        </VStack>
      </HStack>
    ) 
  }, [increaseEnabled, selectedIncreaseType, lockEndDate, setLockEndDate, minDate, maxDate, quickOptions, selectQuickOption, errorDate])

  // console.log('minDate', minDate, 'maxDate', maxDate)

  return (
    <AssetProvider
      flex={1}
      width={'100%'}
      assetId={asset?.underlyingId}
    >
      {
        !isChainEnabled ? (
          <Center
            px={10}
            flex={1}
            width={'100%'}
          >
            <VStack
              spacing={6}
            >
              <TbPlugConnectedX size={72} />
              <VStack
                spacing={4}
              >
                <Translation component={Text} translation={"staking.networkNotSupported"} textStyle={'heading'} fontSize={'h3'} textAlign={'center'} />
                <Translation component={Text} translation={`staking.switchToMainnet`} textStyle={'captionSmall'} textAlign={'center'} />
                <Translation component={Button} translation={`common.switchNetwork`} onClick={() => setChainId(defaultChainId)} variant={'ctaPrimary'} px={10} />
              </VStack>
            </VStack>
          </Center>
        ) : lockExpired ? (
          <Center
            px={10}
            flex={1}
            width={'100%'}
          >
            <VStack
              spacing={6}
            >
              <MdLockOpen size={72} />
              <VStack
                spacing={4}
              >
                <Translation component={Text} translation={"staking.lockExpired"} textStyle={'heading'} fontSize={'h3'} textAlign={'center'} />
                <Translation component={Text} translation={`staking.canWithdrawLock`} params={{amount: abbreviateNumber(depositedAmount), asset: asset?.name}} textStyle={'captionSmall'} textAlign={'center'} />
                <Translation component={Button} translation={`common.unstake`} onClick={() => setActionIndex(1)} variant={'ctaPrimary'} px={10} />
              </VStack>
            </VStack>
          </Center>
        ) : (
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
              {
                increaseEnabled && (
                  <Tabs
                    width={'100%'}
                    defaultIndex={0}
                    variant={'buttonTertiary'}
                    onChange={handleActionChange}
                  >
                    <TabList
                      width={'100%'}
                    >
                      <SimpleGrid
                        spacing={2}
                        width={'100%'}
                        columns={increaseOptions.length}
                      >
                        {
                          increaseOptions.map( option => (
                            <Translation key={`option_${option.label}`} component={Tab} translation={option.label} />
                          ))
                        }
                      </SimpleGrid>
                    </TabList>
                  </Tabs>
                )
              }
              {increaseAmount}
              {increaseTime}
              {
                stkIDLEAmount.gt(0) && (
                  <DynamicActionFields assetId={asset?.id} action={selectedAction} amount={stkIDLEAmount.toFixed()} amountUsd={stkIDLEAmount.toFixed()} stakingPower={stakingPower} />
                )
              }
            </VStack>
            <VStack
              spacing={4}
              id={'footer'}
              alignItems={'flex-start'}
            >
              <EstimatedGasFees />
              {depositButton}
            </VStack>
          </VStack>
        )
      }
    </AssetProvider>
  )
}