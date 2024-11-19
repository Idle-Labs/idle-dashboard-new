import React, { useMemo } from 'react'
import { BNify, bnOrZero, dateToLocale, fixTokenDecimals, getEpochVaultInstantWithdrawEnabled, sortArrayByKey, toDayjs } from 'helpers/'
import { Card } from 'components/Card/Card'
import { Box, ButtonProps, HStack, VStack } from '@chakra-ui/react'
import { useI18nProvider } from 'contexts/I18nProvider'
import { Translation } from 'components/Translation/Translation'
import { BsFillUnlockFill, BsFillShieldLockFill } from "react-icons/bs"
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { MdLockClock, MdOutlineRemoveCircle } from 'react-icons/md'
import { CreditVault } from 'vaults/CreditVault'
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

  const nextEpochTokensToWithdraw = useMemo(() => {
    if (!epochData || !(vault instanceof CreditVault) || !asset?.id || bnOrZero(asset.balance).lte(0)) return BNify(0)
    const maxWithdrawable = bnOrZero(vaultsAccountData?.maxWithdrawable?.[asset.id])
    return vault.getNextEpochInterests(epochData as CreditVaultEpoch, bnOrZero(asset.balance), bnOrZero(asset.vaultPrice), maxWithdrawable, allowInstantWithdraw)
  }, [vaultsAccountData, vault, asset, epochData, allowInstantWithdraw])

  const nextEpochProfit = useMemo(() => {
    return nextEpochTokensToWithdraw.times(bnOrZero(asset?.vaultPrice))
  }, [asset, nextEpochTokensToWithdraw])

  const contractSendMethod = useMemo(() => {
    if (!(vault instanceof CreditVault)) return
    const params = vault.getWithdrawParams(nextEpochTokensToWithdraw)
    return vault.getWithdrawContractSendMethod(params)
  }, [vault, nextEpochTokensToWithdraw])

  const isDisabled = useMemo(() => epochData.status !== 'open' || nextEpochProfit.lt(fixTokenDecimals(1, underlyingAsset?.decimals)) || expectedInterestAlreadyWithdrawn, [epochData, underlyingAsset, nextEpochProfit, expectedInterestAlreadyWithdrawn] )

  if (!contractSendMethod || !asset?.id){
    return null
  }


  return expectedInterestAlreadyWithdrawn ? (
    <Translation translation={'common.alreadyRequested'} textStyle={'captionSmaller'} />
  ) : (
    <VStack
      spacing={1}
      width={'full'}
    >
      <TransactionButton assetId={asset.id} vaultId={asset.id} contractSendMethod={contractSendMethod} actionType={'request'} amount={nextEpochProfit.toFixed(8)} text={label || `common.request`} width={'auto'} height={'auto'} disabled={isDisabled} {...props} />
      <AssetProvider.EpochInfo field={'claimPeriod'} textStyle={'captionSmaller'} />
    </VStack>
  )
}

type EpochVaultMessageArgs = {
  action?: string
}
export const EpochVaultMessage: React.FC<EpochVaultMessageArgs> = ({action}) => {
  const { locale } = useI18nProvider()
  const { asset, vault, underlyingAsset } = useAssetProvider()
  const { vaultsAccountData, selectors: { selectVaultTransactions } } = usePortfolioProvider()

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

  const status = useMemo(() => {
    if (!isEpochVault || !asset) return null
    if (epochData && ("status" in epochData)){
      const status = epochData.status
      // Deposit queue
      if (action === 'deposit' && status === 'running' && depositQueueEnabled){
        return 'depositQueue'
      }
      
      return status
    }

    if (asset.vaultIsOpen === false){
      return 'open'
    }

    return 'running'
  }, [asset, isEpochVault, epochData, action, depositQueueEnabled])

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
            ) : status === 'depositQueue' ? (
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