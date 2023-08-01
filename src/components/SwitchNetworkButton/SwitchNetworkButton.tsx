import React from 'react'
import { Button } from '@chakra-ui/react'
import { networks } from 'constants/networks'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'

type SwitchNetworkButtonProps = {
  chainId: number
}

export const SwitchNetworkButton: React.FC<SwitchNetworkButtonProps> = ({
  chainId
}) => {
  const { setChainId } = useWalletProvider()
  return (
    <Translation component={Button} translation={`network.switchTo`} params={{network: networks[chainId].name}} onClick={() => setChainId(chainId)} variant={'ctaPrimary'} width={['full', 'auto']} px={10} py={2} />
  )
}