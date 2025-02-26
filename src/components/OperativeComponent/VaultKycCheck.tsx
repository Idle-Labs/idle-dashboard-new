import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { TbPlugConnectedX } from 'react-icons/tb'
import { Translation } from 'components/Translation/Translation'
import { VStack, Flex, BoxProps, Button, HStack, Image, Link, Box, Checkbox, ButtonProps, Center } from '@chakra-ui/react'
import { AssetId, CreditVaultSignatureDocument } from 'constants/'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { openWindow } from 'helpers'
import { useWalletProvider } from 'contexts/WalletProvider'
import { ConnectWalletButton } from 'components/ConnectWalletButton/ConnectWalletButton'
import { Card } from 'components/Card/Card'
import { checkSignatureV2, getSignatureByName, saveSignatureV2 } from 'helpers/apiv2'
import { useWeb3Provider } from 'contexts/Web3Provider'
import { VscVerifiedFilled } from "react-icons/vsc";
import { useThemeProvider } from 'contexts/ThemeProvider'
import { KeyringConnect } from '@keyringnetwork/keyring-connect-sdk'

type VaultKycVerifyButtonProps = {
  assetId?: AssetId
} & ButtonProps

export const VaultKycVerifyButton: React.FC<VaultKycVerifyButtonProps> = ({
  assetId,
  ...buttonProps
}) => {
  const { account } = useWalletProvider()
  const { selectors: { selectVaultById } } = usePortfolioProvider()

  const vault = useMemo(() => {
    return selectVaultById(assetId)
  }, [assetId, selectVaultById])

  const kycLink = useMemo(() => {
    return vault?.getFlag("kycLink") || 'https://app.keyring.network'
  }, [vault])

  const startKeyringVerification = useCallback(async () => {
    if (!vault || !vault.vaultConfig.keyringPolicyId){
      return openWindow(kycLink)
    }
    const extensionConfig = {
      name: 'Pareto',
      app_url: 'https://app.pareto.credit',
      logo_url: 'https://app.pareto.credit/images/protocols/pareto.svg',
      policy_id: vault.vaultConfig.keyringPolicyId,
    };
    
    try {
      const isInstalled = await KeyringConnect.isKeyringConnectInstalled();
    
      if (isInstalled) {
        await KeyringConnect.launchExtension(extensionConfig);
      } else {
        return openWindow(kycLink)
      }
    } catch (error) {
      console.error('Failed to launch Keyring Connect:', error);
    }
  }, [vault, kycLink])

  if (!account){
    return <ConnectWalletButton variant={'ctaFull'} width={40} height={'auto'} size={'md'} py={3} px={6} {...buttonProps} />
  }

  return (<Translation size={'sm'} py={2} px={6} component={Button} translation={'strategies.credit.kyc.cta'} variant={'ctaFull'} width={'auto'} height={'auto'} {...buttonProps} onClick={() => startKeyringVerification() } />)
}

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
  const [ signatureName, setSignatureName ] = useState<string | undefined>()
  const [ signatureVerified, setSignatureVerified ] = useState<boolean>(false)
  const [ documents, setDocuments ] = useState<CreditVaultSignatureDocument[]>([])
  const { isPortfolioAccountReady, selectors: { selectAssetById, selectVaultById, selectAssetsByParentId } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const vault = useMemo(() => {
    return selectVaultById(assetId)
  }, [assetId, selectVaultById])

  const assets = useMemo(() => {
    if (!asset){
      return []
    }
    if (asset.parentId){
      const parentAsset = selectAssetById(asset.parentId)
      const childrenAssets = selectAssetsByParentId(asset.parentId)
      return [
        parentAsset,
        ...childrenAssets
      ]
    } else {
      const childrenAssets = selectAssetsByParentId(asset.id)
      if (childrenAssets?.length){
        return [
          asset,
          ...childrenAssets
        ]
      }
    }
    return [asset]
  }, [asset, selectAssetById, selectAssetsByParentId])

  useEffect(() => {
    if (!vault) return
    if (!vault.signature || !vault.signature.documents.length){
      setSignatureVerified(true)
      return
    }
    setSignatureName(vault.signature.name)
    setDocuments(vault.signature.documents)

    return () => {
      setSignatureVerified(false)
    }
  }, [vault])

  const isKycRequired = useMemo(() => {
    return vault && ("kyc" in vault) && !!vault.kyc.required
  }, [vault])

  const loadSignature = useCallback(async () => {
    if (signature || !signatureName){
      return
    }
    const signatureData = await getSignatureByName(signatureName)
    if (signatureData && (!signature || signatureData._id !== signature._id)){
      setSignature(signatureData)
    }
  }, [signature, signatureName, setSignature])

  const checkSignature = useCallback(async () => {
    if (!account?.address || !signature){
      return
    }
    const signatureCheck = await checkSignatureV2(signature._id, account.address)
    if (signatureCheck){
      return setSignatureVerified(true)
    }
    setSignatureVerified(false)
  }, [signature, account, setSignatureVerified])

  const signAndSend = useCallback(async () => {
    if (!account?.address || !web3 || !signature){
      return;
    }
    setSending(true)
    try {
      const hash = await web3.eth.personal.sign(atob(signature.walletMessage), account.address, '', () => {})
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

  const setDocumentAccepted = useCallback( (documentIndex: number, isChecked: boolean) => {
    setDocuments(documents.map( (document, index) => index === documentIndex ? {
      ...document,
      isChecked
    } : document ))
  }, [documents, setDocuments])

  const skipWalletKyc = useMemo(() => !!vault?.kyc?.skipAddresses?.map( (addr: string) => addr.toLowerCase())?.includes(account?.address?.toLowerCase()), [vault, account] )
  const skipWalletSignature = useMemo(() => !!vault?.signature?.skipAddresses?.map( (addr: string) => addr.toLowerCase())?.includes(account?.address?.toLowerCase()), [vault, account] )

  const documentsAccepted = useMemo(() => {
    return documents.find( document => !document.isChecked ) === undefined
  }, [documents])

  const kycVerified = useMemo(() => skipWalletKyc || (account?.address && assets.find( asset => !!asset.walletAllowed )), [assets, account, skipWalletKyc])

  const isWalletAllowed = useMemo(() => (!isKycRequired || (kycVerified && (signatureVerified || skipWalletSignature))), [isKycRequired, kycVerified, signatureVerified, skipWalletSignature])

  useEffect(() => {
    if (!isKycRequired){
      return
    }
    loadSignature()
  }, [isKycRequired, loadSignature])

  useEffect(() => {
    if (!isKycRequired){
      return
    }
    checkSignature()
  }, [isKycRequired, checkSignature])

  const fallbackComponent = (
    <React.Fragment>
      {children}
    </React.Fragment>
  )

  const documentsVerificationRequired = useMemo(() => documents.length && !skipWalletSignature, [skipWalletSignature, documents])

  const bothVerificationRequired = useMemo(() => isKycRequired && documentsVerificationRequired, [isKycRequired, documentsVerificationRequired] )
  const isProtected = useMemo(() => vault && ("kyc" in vault) && !!vault.kyc.protected, [vault])
  const showProtectedData = useMemo(() => {
    return !isProtected || (isPortfolioAccountReady && (!isKycRequired || isWalletAllowed))
  }, [isPortfolioAccountReady, isProtected, isKycRequired, isWalletAllowed])

  if (showProtectedData && (!asset || !isKycRequired)){
    return fallbackComponent
  }

  if (!bothVerificationRequired && (!isWalletAllowed || !showProtectedData)){
    return (
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
            <TbPlugConnectedX size={64} />
            <VStack
              spacing={4}
            >
              <Translation translation={"strategies.credit.kyc.required"} textStyle={'heading'} fontSize={'h3'} textAlign={'center'} />
              <Translation translation={`strategies.credit.kyc.complete`} textStyle={'caption'} textAlign={'center'} />
              <VaultKycVerifyButton assetId={assetId} size={'lg'} fontSize={'md'} />
            </VStack>
          </VStack>
        </Center>
        <HStack
          spacing={2}
          alignItems={'center'}
          justifyContent={'center'}
        >
          <Translation translation={`strategies.credit.kyc.providedBy`} textStyle={'captionSmaller'} textAlign={'center'} />
          <Link display={'flex'} justifyContent={'center'} href={'https://app.keyring.network/connect'} isExternal>
            <Image src={'images/partners/keyring.svg'} height={'10px'} />
          </Link>
        </HStack>
      </VStack>
    )
  }
  
  return (!isWalletAllowed || !showProtectedData) ? (
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
        borderColor={kycVerified ? 'brightGreen' : 'divider'}
        alignItems={'flex-start'}
      >
        <HStack
          width={'full'}
          alignItems={'center'}
          justifyContent={'space-between'}
        >
          <Translation textStyle={'tableCell'} translation={'strategies.credit.kyc.title'} prefix={'1. '} />
          {
            kycVerified && (
              <VscVerifiedFilled size={24} color={theme.colors.brightGreen} />
            )
          }
        </HStack>
        {
          !kycVerified && (
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
                <Translation translation={`strategies.credit.kyc.${ kycVerified ? 'completed' : 'complete' }`} textStyle={'captionSmall'} />
                <VaultKycVerifyButton assetId={assetId} />
              </HStack>
            </VStack>
          )
        }
      </VStack>
      {
        documentsVerificationRequired && (
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
              {
                documents.map( (document, index) => (
                  <HStack
                    pb={2}
                    key={index}
                    width={'full'}
                    justifyContent={'space-between'}
                    borderBottom={ signatureVerified && index === documents.length -1 ? 'none' : '1px solid'}
                    borderColor={'divider'}
                  >
                    <Checkbox alignItems={'baseline'} isChecked={signatureVerified || document.isChecked} onChange={ (e) => signatureVerified ? true : setDocumentAccepted(index, e.target.checked) } >
                      <Translation translation={document.translation} textStyle={'captionSmall'} isHtml={true} />
                    </Checkbox>
                    <Translation size={'sm'} py={2} px={5} component={Button} translation={'strategies.credit.signatures.read'} variant={'ctaFull'} width={'auto'} height={'auto'} onClick={() => openWindow(document.url) } />
                  </HStack>
                ) )
              }
              {
                !signatureVerified && (
                  <VStack
                    spacing={3}
                    width={'full'}
                  >
                    {
                      !account ? (
                        <ConnectWalletButton variant={'ctaFull'} />
                      ) : (
                        <Translation component={Button} translation={'strategies.credit.signatures.cta'} variant={'ctaFull'} onClick={() => signAndSend() } isDisabled={sending || !documentsAccepted} />
                      )
                    }
                  </VStack>
                )
              }
            </VStack>
          </VStack>
        )
      }
    </VStack>
  ) : fallbackComponent
}