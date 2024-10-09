import React, { useMemo } from 'react'
import { TbPlugConnectedX } from 'react-icons/tb'
import { Translation } from 'components/Translation/Translation'
import { VStack, Text, Center, BoxProps, Button, HStack, Image, Link } from '@chakra-ui/react'
import { AssetId } from 'constants/'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { openWindow } from 'helpers'
import { useWalletProvider } from 'contexts/WalletProvider'
import { ConnectWalletButton } from 'components/ConnectWalletButton/ConnectWalletButton'

type VaultKycCheckProps = {
  assetId?: AssetId
} & BoxProps

export const VaultKycCheck: React.FC<VaultKycCheckProps> = ({
  assetId,
  children
}) => {
  const { account } = useWalletProvider()
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const checkWalletAllowed = useMemo(() => {
    const vault = selectVaultById(assetId)
    return vault && ("kycRequired" in vault) && !!vault.kycRequired
  }, [assetId, selectVaultById])

  const isWalletAllowed = useMemo(() => (!checkWalletAllowed || (!!asset?.walletAllowed && account?.address)), [checkWalletAllowed, asset, account])

  const fallbackComponent = (
    <React.Fragment>
      {children}
    </React.Fragment>
  )

  if (!asset || !checkWalletAllowed){
    return fallbackComponent
  }

  return !isWalletAllowed ? (
    <VStack
      flex={1}
      width={'100%'}
      justifyContent={'space-between'}
    >
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
            <Translation component={Text} translation={"strategies.credit.kyc.required"} textStyle={'heading'} fontSize={'h3'} textAlign={'center'} />
            <Translation component={Text} translation={`strategies.credit.kyc.complete`} textStyle={'captionSmall'} textAlign={'center'} />
            {
              account?.address ? (
                <Translation component={Button} translation={'strategies.credit.kyc.cta'} variant={'ctaFull'} onClick={() => openWindow('https://app.keyring.network/connect') } />
              ) : (
                <ConnectWalletButton variant={'ctaFull'} />
              )
            }
          </VStack>
        </VStack>
      </Center>
      <HStack
        spacing={2}
        alignItems={'center'}
        justifyContent={'center'}
      >
        <Translation component={Text} translation={`strategies.credit.kyc.providedBy`} textStyle={'captionSmaller'} textAlign={'center'} />
        <Link display={'flex'} justifyContent={'center'} href={'https://app.keyring.network/connect'} isExternal>
          <Image src={'images/partners/keyring.svg'} height={'10px'} />
        </Link>
      </HStack>
    </VStack>
  ) : fallbackComponent
}