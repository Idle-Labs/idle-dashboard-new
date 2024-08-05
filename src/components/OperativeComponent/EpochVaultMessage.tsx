import React, { useMemo } from 'react'
import { dateToLocale } from 'helpers/'
import { Card } from 'components/Card/Card'
import { Box, HStack } from '@chakra-ui/react'
import { useI18nProvider } from 'contexts/I18nProvider'
import { Translation } from 'components/Translation/Translation'
import { BsFillUnlockFill, BsFillShieldLockFill } from "react-icons/bs"
import { useAssetProvider } from 'components/AssetProvider/AssetProvider'

type Args = {
  action?: string
}

export const EpochVaultMessage: React.FC<Args> = ({action}) => {
  const { asset } = useAssetProvider()
  const { locale } = useI18nProvider()

  const isEpochVault = useMemo(() => {
    return asset && !!asset.epochData
  }, [asset])

  const status = useMemo(() => {
    if (!isEpochVault || !asset) return null
    if (asset?.epochData && ("status" in asset.epochData)){
      return asset?.epochData.status
    }
    return asset.vaultIsOpen === false ? 'open' : 'running'
  }, [asset, isEpochVault])

  const epochVaultLocked = useMemo(() => {
    return status && ['default', 'running'].includes(status)
  }, [status])

  if (!status) return null

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
            epochVaultLocked ? (
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