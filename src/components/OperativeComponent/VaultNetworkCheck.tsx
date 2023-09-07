import React, { useMemo } from 'react'
import { networks } from 'constants/networks'
import { TbPlugConnectedX } from 'react-icons/tb'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'
import { VStack, Text, Center, BoxProps } from '@chakra-ui/react'
import { useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { SwitchNetworkButton } from 'components/SwitchNetworkButton/SwitchNetworkButton'

export const VaultNetworkCheck: React.FC<BoxProps> = ({ children }) => {
  const { vault } = useAssetProvider()
  const { network, chainId, isNetworkCorrect } = useWalletProvider()
  const isVaultNetworkSelected = useMemo(() => (isNetworkCorrect && vault && +vault.chainId === +chainId) , [isNetworkCorrect, vault, chainId])

  return vault && !isVaultNetworkSelected ? (
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
          <Translation component={Text} translation={`modals.assets.vaultWrongNetwork`} params={{network: network?.chainName, correctNetwork: networks[vault?.chainId].chainName }} textStyle={'captionSmall'} textAlign={'center'} />
          <SwitchNetworkButton chainId={+vault?.chainId} width={'full'} />
        </VStack>
      </VStack>
    </Center>
  ) : (
    <React.Fragment>
      {children}
    </React.Fragment>
  )
}