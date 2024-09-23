import React, { useMemo } from 'react'
import { BNify, bnOrZero, dateToLocale, fixTokenDecimals, normalizeTokenAmount } from 'helpers/'
import { Card } from 'components/Card/Card'
import { Box, HStack } from '@chakra-ui/react'
import { useI18nProvider } from 'contexts/I18nProvider'
import { Translation } from 'components/Translation/Translation'
import { BsFillUnlockFill, BsFillShieldLockFill } from "react-icons/bs"
import { useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { MdOutlineRemoveCircle } from 'react-icons/md'
import { TransactionButton } from 'components/TransactionButton/TransactionButton'
import BigNumber from 'bignumber.js'
import { CreditVault } from 'vaults/CreditVault'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'

type EpochWithdrawInterestArgs = {
  amount: BigNumber
  trancheTokens: BigNumber
}
const EpochWithdrawInterest: React.FC<EpochWithdrawInterestArgs> = ({
  amount,
  trancheTokens
}) => {
  const { asset, underlyingAsset, vault } = useAssetProvider()

  const contractSendMethod = useMemo(() => {
    if (!(vault instanceof CreditVault)) return
    const params = vault.getWithdrawParams(trancheTokens)
    return vault.getWithdrawContractSendMethod(params)
  }, [vault, trancheTokens])

  if (!contractSendMethod || !asset?.id){
    return null
  }

  return (
    <HStack
      pl={1}
      spacing={3}
      width={'full'}
    >
      <Translation isHtml={true} textStyle={'captionSmaller'} translation={'trade.actions.withdraw.messages.epoch.withdrawInterestsOnly'} params={{ amount: amount.toFixed(4), token: underlyingAsset?.token || '' }} textAlign={'left'} />
      <TransactionButton variant={'ctaPrimary'} textProps={{color:'nearBlack', fontSize: 'xs'}} assetId={asset.id} vaultId={asset.id} contractSendMethod={contractSendMethod} text={`common.request`} fontSize={'xs'} height={'auto'} width={'auto'} py={3} px={7} />
    </HStack>
  )
}

type EpochVaultMessageArgs = {
  action?: string
}
export const EpochVaultMessage: React.FC<EpochVaultMessageArgs> = ({action}) => {
  const { locale } = useI18nProvider()
  const { vaultsAccountData } = usePortfolioProvider()
  const { asset, underlyingAsset, vault } = useAssetProvider()

  const isEpochVault = useMemo(() => {
    return asset && !!asset.epochData
  }, [asset])

  const epochData = useMemo(() => {
    return asset?.epochData
  }, [asset])

  const status = useMemo(() => {
    if (!isEpochVault || !asset) return null
    if (epochData && ("status" in epochData)){
      return epochData.status
    }
    return asset.vaultIsOpen === false ? 'open' : 'running'
  }, [asset, isEpochVault, epochData])

  const epochVaultLocked = useMemo(() => {
    return status && ['default', 'running'].includes(status)
  }, [status])

  const nextEpochTokensToWithdraw = useMemo(() => {
    if (!(vault instanceof CreditVault) || !asset?.id || bnOrZero(asset.balance).lte(0)) return BNify(0)
    const maxWithdrawable = bnOrZero(vaultsAccountData?.maxWithdrawable?.[asset.id])
    return vault.getNextEpochInterests(bnOrZero(asset.balance), bnOrZero(asset.vaultPrice), maxWithdrawable)
  }, [vaultsAccountData, vault, asset])

  const nextEpochProfit = useMemo(() => {
    return nextEpochTokensToWithdraw.times(bnOrZero(asset?.vaultPrice))
  }, [asset, nextEpochTokensToWithdraw])

  if (!status || !asset?.id) return null

  console.log('asset.balance', bnOrZero(asset?.balance).toString())
  console.log('epochProfit', nextEpochProfit.toString())
  console.log('nextEpochTokensToWithdraw', normalizeTokenAmount(nextEpochTokensToWithdraw, 18))

  return (
    <Card.Dark
      p={2}
      border={0}
    >
      {
        action === 'withdraw' && status === 'open' && nextEpochProfit.gt(0) ? (
          <EpochWithdrawInterest amount={nextEpochProfit} trancheTokens={nextEpochTokensToWithdraw} />
        ) : (
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
                ) : epochVaultLocked ? (
                  <BsFillShieldLockFill size={24} />
                ) : (
                  <BsFillUnlockFill size={24} />
                )
              }
            </Box>
            <Translation textStyle={'captionSmaller'} translation={`trade.actions.${action}.messages.epoch.${status}`} isHtml params={{epochStart: dateToLocale(asset?.epochData?.epochStartDate || 0, locale), epochEnd: dateToLocale(asset?.epochData?.epochEndDate || 0, locale)}} textAlign={'left'} />
          </HStack>
        )
      }
    </Card.Dark>
  )
}