import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { TbPlugConnectedX } from 'react-icons/tb'
import { Translation } from 'components/Translation/Translation'
import { VStack, Flex, BoxProps, Button, HStack, Image, Link, Box, Checkbox } from '@chakra-ui/react'
import { AssetId } from 'constants/'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { openWindow } from 'helpers'
import { useWalletProvider } from 'contexts/WalletProvider'
import { ConnectWalletButton } from 'components/ConnectWalletButton/ConnectWalletButton'
import { Card } from 'components/Card/Card'
import { checkSignatureV2, getSignatureByName, saveSignatureV2 } from 'helpers/apiv2'
import { useWeb3Provider } from 'contexts/Web3Provider'
import { VscVerifiedFilled } from "react-icons/vsc";
import { useThemeProvider } from 'contexts/ThemeProvider'


type VaultKycCheckProps = {
  assetId?: AssetId
} & BoxProps

export const VaultKycCheck: React.FC<VaultKycCheckProps> = ({
  assetId,
  children
}) => {
  const { web3 } = useWeb3Provider()
  const { theme } = useThemeProvider()
  const { account } = useWalletProvider()
  const [ sending, setSending ] = useState<boolean>(false)
  const [ signature, setSignature ] = useState<any>(undefined)
  const [ signatureVerified, setSignatureVerified ] = useState<boolean>(false)
  const [ documentsAccepted, setDocumentsAccepted ] = useState<boolean>(false)
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const checkWalletAllowed = useMemo(() => {
    const vault = selectVaultById(assetId)
    return vault && ("kycRequired" in vault) && !!vault.kycRequired
  }, [assetId, selectVaultById])

  const loadSignature = useCallback(async () => {
    if (signature){
      return
    }
    const signatureData = await getSignatureByName('CREDIT_VAULTS_ACCEPTANCE')
    if (signatureData && (!signature || signatureData._id !== signature._id)){
      setSignature(signatureData)
    }
  }, [signature, setSignature])

  const checkSignature = useCallback(async () => {
    if (!account?.address || !signature){
      return
    }
    const signatureCheck = await checkSignatureV2(signature._id, account.address)
    console.log('signatureCheck', signatureCheck)
    if (signatureCheck){
      setSignatureVerified(true)
    }
  }, [signature, account, setSignatureVerified])

  const signAndSend = useCallback(async () => {
    if (!account?.address || !web3 || !signature){
      return;
    }
    setSending(true)
    try {
      const hash = await web3.eth.personal.sign(atob(signature.message), account.address, '', () => {})
      if (hash){
        const proof = await saveSignatureV2(signature._id, account.address, hash)
        if (proof){
          await checkSignature()
        }
      }
    } catch (err){
    } finally {
      setSending(false)
    }
  }, [web3, account, signature, setSending, checkSignature])

  useEffect(() => {
    loadSignature()
  }, [loadSignature])


  useEffect(() => {
    checkSignature()
  }, [checkSignature])

  const isWalletAllowed = useMemo(() => (!checkWalletAllowed || (!!asset?.walletAllowed && account?.address)), [checkWalletAllowed, asset, account])

  const fallbackComponent = (
    <React.Fragment>
      {children}
    </React.Fragment>
  )

  if (!asset || !checkWalletAllowed){
    return fallbackComponent
  }
  
  return (!isWalletAllowed || !signatureVerified) ? (
    <VStack
      mt={8}
      flex={1}
      spacing={4}
      width={'100%'}
      alignItems={'flex-start'}
      justifyContent={'flex-start'}
    >
      <Card.Dark
        p={2}
        border={0}
      >
        <Translation textStyle={'captionSmall'} translation={'strategies.credit.verification'} textAlign={'center'} />
      </Card.Dark>
      <VStack
        py={2}
        px={3}
        spacing={2}
        width={'full'}
        borderRadius={8}
        border={'1px solid'}
        borderColor={isWalletAllowed ? 'brightGreen' : 'divider'}
        alignItems={'flex-start'}
      >
        <HStack
          width={'full'}
          alignItems={'center'}
          justifyContent={'space-between'}
        >
          <Translation textStyle={'tableCell'} translation={'strategies.credit.kyc.title'} prefix={'1. '} />
          {
            isWalletAllowed && (
              <VscVerifiedFilled size={24} color={theme.colors.brightGreen} />
            )
          }
        </HStack>
        {
          !isWalletAllowed && (
            <VStack
              pt={2}
              pl={3}
              spacing={3}
              width={'full'}
              borderTop={'1px solid'}
              borderColor={'divider'}
            >
              <HStack
                width={'full'}
                justifyContent={'space-between'}
              >
                <Translation translation={`strategies.credit.kyc.${ isWalletAllowed ? 'completed' : 'complete' }`} textStyle={'captionSmall'} />
                <Translation size={'sm'} py={2} px={6} component={Button} translation={'strategies.credit.kyc.cta'} variant={'ctaFull'} width={'auto'} height={'auto'} onClick={() => openWindow('https://app.keyring.network/connect') } />
              </HStack>
            </VStack>
          )
        }
      </VStack>
      <VStack
        py={2}
        px={3}
        spacing={2}
        width={'full'}
        borderRadius={8}
        border={'1px solid'}
        borderColor={ signatureVerified ? 'brightGreen' : 'divider'}
        alignItems={'flex-start'}
      >
        <HStack
          width={'full'}
          alignItems={'center'}
          justifyContent={'space-between'}
        >
          <Translation textStyle={'tableCell'} translation={'strategies.credit.signatures.title'} prefix={'2. '} />
          {
            signatureVerified && (
              <VscVerifiedFilled size={24} color={theme.colors.brightGreen} />
            )
          }
        </HStack>
        <VStack
          py={2}
          pl={3}
          spacing={3}
          width={'full'}
          borderTop={'1px solid'}
          borderColor={'divider'}
        >
          <HStack
            pb={2}
            width={'full'}
            justifyContent={'space-between'}
            borderBottom={'1px solid'}
            borderColor={'divider'}
          >
            <Translation translation={'strategies.credit.signatures.documents.MLA'} textStyle={'captionSmall'} />
            <Translation size={'sm'} py={2} px={6} component={Button} translation={'strategies.credit.signatures.read'} variant={'ctaFull'} width={'auto'} height={'auto'} onClick={() => openWindow('https://app.keyring.network/connect') } />
          </HStack>
          <HStack
            pb={2}
            width={'full'}
            justifyContent={'space-between'}
            borderBottom={'1px solid'}
            borderColor={'divider'}
          >
            <Translation translation={'strategies.credit.signatures.documents.TS'} textStyle={'captionSmall'} />
            <Translation size={'sm'} py={2} px={6} component={Button} translation={'strategies.credit.signatures.read'} variant={'ctaFull'} width={'auto'} height={'auto'} onClick={() => openWindow('https://app.keyring.network/connect') } />
          </HStack>
          <HStack
            width={'full'}
            pb={signatureVerified ? 0 : 2}
            justifyContent={'space-between'}
            borderBottom={signatureVerified ? 0 : '1px solid'}
            borderColor={'divider'}
          >
            <Translation translation={'strategies.credit.signatures.documents.SA'} textStyle={'captionSmall'} />
            <Translation size={'sm'} py={2} px={6} component={Button} translation={'strategies.credit.signatures.read'} variant={'ctaFull'} width={'auto'} height={'auto'} onClick={() => openWindow('https://app.keyring.network/connect') } />
          </HStack>
          {
            !signatureVerified && (
              <VStack
                spacing={3}
                width={'full'}
              >
                <Checkbox alignItems={'baseline'} isChecked={documentsAccepted} onChange={ (e) => setDocumentsAccepted(e.target.checked) } >
                  <Translation translation={`strategies.credit.signatures.acceptance`} textStyle={'captionSmall'} />
                </Checkbox>
                <Translation component={Button} translation={'strategies.credit.signatures.cta'} variant={'ctaFull'} onClick={() => signAndSend() } isDisabled={!documentsAccepted} />
              </VStack>
            )
          }
        </VStack>
      </VStack>
    </VStack>
  ) : fallbackComponent
}