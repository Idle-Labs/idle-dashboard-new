import React, { useMemo } from 'react'
import { BNify, bnOrZero, dateToLocale, fixTokenDecimals, getEpochVaultInstantWithdrawEnabled, sortArrayByKey, toDayjs } from 'helpers/'
import { Card } from 'components/Card/Card'
import { Box, ButtonProps, HStack, VStack } from '@chakra-ui/react'
import { useI18nProvider } from 'contexts/I18nProvider'
import { Translation } from 'components/Translation/Translation'
import { BsFillUnlockFill, BsFillShieldLockFill } from "react-icons/bs"
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { MdLockClock, MdOutlineRemoveCircle } from 'react-icons/md'
import { CreditVault, CreditVaultExpectedInterest } from 'vaults/CreditVault'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { CreditVaultEpoch, Transaction } from 'constants/'
import { TransactionButton } from 'components/TransactionButton/TransactionButton'

type EpochWithdrawInterestButtonArgs = {
  label?: string
} & ButtonProps

export const EpochWithdrawInterestButton: React.FC<EpochWithdrawInterestButtonArgs> = ({
  label,
  ...props
}) => {
  const { asset, underlyingAsset, vault } = useAssetProvider()
  const { vaultsAccountData, selectors: { selectVaultTransactions } } = usePortfolioProvider()

  const epochData: CreditVaultEpoch = useMemo(() => {
    return asset?.epochData as CreditVaultEpoch
  }, [asset])

  const lastEpoch = useMemo(() => {
    return epochData && ("epochs" in epochData) && epochData.epochs ? sortArrayByKey(epochData.epochs.filter( epoch => epoch.status === 'FINISHED' ), 'count', 'desc')[0] : undefined
  }, [epochData])

  const lastWithdrawTx = useMemo(() => {
    if (!asset?.id) return
    const transactions = selectVaultTransactions(asset.id)
    return sortArrayByKey(transactions, 'timeStamp', 'desc').find( (tx: Transaction) => tx.action === 'redeem' )
  }, [asset, selectVaultTransactions])

  const expectedInterestAlreadyWithdrawn = useMemo(() => {
    if (!lastWithdrawTx || !lastEpoch) return false
    return toDayjs(+lastWithdrawTx.timeStamp*1000).isAfter(toDayjs(lastEpoch.endDate))
  }, [lastWithdrawTx, lastEpoch])

  const allowInstantWithdraw = useMemo(() => {
    if (!epochData || !("disableInstantWithdraw" in epochData)) return false
    return getEpochVaultInstantWithdrawEnabled(epochData)
  }, [epochData])

  const nextEpochExpectedInterestInfo = useMemo((): CreditVaultExpectedInterest | undefined => {
    if (!epochData || !(vault instanceof CreditVault) || !asset?.id || bnOrZero(asset.balance).lte(0)) return
    const maxWithdrawable = bnOrZero(vaultsAccountData?.maxWithdrawable?.[asset.id])
    return vault.getNextEpochInterests(epochData as CreditVaultEpoch, bnOrZero(asset.balance), bnOrZero(asset.vaultPrice), maxWithdrawable, allowInstantWithdraw)
  }, [vaultsAccountData, vault, asset, epochData, allowInstantWithdraw])

  const nextEpochProfit = useMemo(() => {
    return bnOrZero(nextEpochExpectedInterestInfo?.interest)
  }, [nextEpochExpectedInterestInfo])

  const contractSendMethod = useMemo(() => {
    if (!(vault instanceof CreditVault) || !nextEpochExpectedInterestInfo) return
    const params = vault.getWithdrawParams(nextEpochExpectedInterestInfo?.trancheTokens)
    return vault.getWithdrawContractSendMethod(params)
  }, [vault, nextEpochExpectedInterestInfo])

  const notEnoughBalance = useMemo(() => nextEpochProfit.lt(fixTokenDecimals(1, underlyingAsset?.decimals)), [nextEpochProfit, underlyingAsset] )

  const isDisabled = useMemo(() => epochData.status !== 'open' || notEnoughBalance || expectedInterestAlreadyWithdrawn, [epochData, expectedInterestAlreadyWithdrawn, notEnoughBalance] )

  if (!contractSendMethod || !asset?.id){
    return null
  }

  return notEnoughBalance ? (
    <Translation translation={'common.notEnoughBalance'} textStyle={'captionSmaller'} />
  ) : expectedInterestAlreadyWithdrawn ? (
    <Translation translation={'common.alreadyRequested'} textStyle={'captionSmaller'} />
  ) : (
    <VStack
      spacing={1}
      width={'full'}
    >
      <TransactionButton assetId={asset.id} vaultId={asset.id} contractSendMethod={contractSendMethod} actionType={'request'} amount={nextEpochProfit.toFixed(8)} text={label || `common.request`} width={'auto'} height={'auto'} disabled={isDisabled} {...props} />
      <AssetProvider.EpochInfo field={'claimPeriodShort'} textStyle={'captionSmaller'} />
    </VStack>
  )
}

type EpochVaultMessageArgs = {
  action?: string
}
export const EpochVaultMessage: React.FC<EpochVaultMessageArgs> = ({action}) => {
  const { locale } = useI18nProvider()
  const { asset, vault } = useAssetProvider()

  const isEpochVault = useMemo(() => {
    return asset && !!asset.epochData
  }, [asset])

  const epochData = useMemo(() => {
    return asset?.epochData
  }, [asset])

  // console.log('epochData', epochData)

  const depositQueueEnabled = useMemo(() => {
    return vault && ("depositQueueContract" in vault) && !!vault.depositQueueContract
  }, [vault])

  const withdrawQueueEnabled = useMemo(() => {
    return vault && ("withdrawQueueContract" in vault) && !!vault.withdrawQueueContract
  }, [vault])

  const status = useMemo(() => {
    if (!isEpochVault || !asset) return null
    if (epochData && ("status" in epochData)){
      const status = epochData.status
      // Deposit queue
      if (action === 'deposit' && status === 'running' && depositQueueEnabled){
        return 'depositQueue'
      }

      // Withdraw queue
      if (action === 'withdraw' && status === 'running' && withdrawQueueEnabled){
        return 'withdrawQueue'
      }
      
      return status
    }

    if (asset.vaultIsOpen === false){
      return 'open'
    }

    return 'running'
  }, [asset, isEpochVault, epochData, action, depositQueueEnabled, withdrawQueueEnabled])

  const epochVaultLocked = useMemo(() => {
    return status && ['default', 'running'].includes(status)
  }, [status])

  if (!status || !asset?.id) return null

  return (
    <Card.Dark
      p={2}
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
          {
            status === 'default' ? (
              <MdOutlineRemoveCircle size={24} />
            ) : ['depositQueue', 'withdrawQueue'].includes(status) ? (
              <MdLockClock size={24} />
            ) : epochVaultLocked ? (
              <BsFillShieldLockFill size={24} />
            ) : (
              <BsFillUnlockFill size={24} />
            )
          }
        </Box>
        <Translation textStyle={'captionSmaller'} translation={`trade.actions.${action}.messages.epoch.${status}`} isHtml params={{epochStart: dateToLocale(asset?.epochData?.epochStartDate || 0, locale), epochEnd: dateToLocale(asset?.epochData?.epochEndDate || 0, locale)}} textAlign={'left'} />
      </HStack>
    </Card.Dark>
  )
}