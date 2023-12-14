import React, { useMemo } from 'react'
import { dateToLocale } from 'helpers/'
import { Card } from 'components/Card/Card'
import { Box, HStack } from '@chakra-ui/react'
import { useI18nProvider } from 'contexts/I18nProvider'
import { Translation } from 'components/Translation/Translation'
import { BsFillUnlockFill, BsFillShieldLockFill } from "react-icons/bs"
import { useAssetProvider } from 'components/AssetProvider/AssetProvider'

export const EpochVaultMessage: React.FC = () => {
  const { asset } = useAssetProvider()
  const { locale } = useI18nProvider()

  const isEpochVault = useMemo(() => {
    return asset && !!asset.epochData
  }, [asset])

  const epochVaultLocked = useMemo(() => {
    return isEpochVault && asset && asset.vaultIsOpen === false
  }, [asset, isEpochVault])

  // const epochVaultOpen = useMemo(() => {
  //   return isEpochVault && asset && asset.vaultIsOpen === true
  // }, [asset, isEpochVault])

  if (!isEpochVault) return null

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
        <Translation textStyle={'captionSmaller'} translation={`trade.actions.deposit.messages.${epochVaultLocked ? 'vaultLocked' : 'vaultOpen'}`} isHtml params={{epochStart: dateToLocale(asset?.epochData?.start || 0, locale), epochEnd: dateToLocale(asset?.epochData?.end || 0, locale)}} textAlign={'left'} />
      </HStack>
    </Card.Dark>
  )
}