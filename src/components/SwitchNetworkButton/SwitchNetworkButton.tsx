import React, { useCallback } from 'react'
import { networks } from 'constants/networks'
import { Button, ButtonProps } from '@chakra-ui/react'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'

type SwitchNetworkButtonProps = {
  chainId: number
} & ButtonProps

export const SwitchNetworkButton: React.FC<SwitchNetworkButtonProps> = ({
  chainId,
  ...props
}) => {
  const { chainId: selectedChainId, setChainId } = useWalletProvider()

  const onClick = useCallback(() => {
    if (!selectedChainId || +selectedChainId !== +chainId){
      return setChainId(chainId)
    }
  }, [chainId, selectedChainId, setChainId])

  return (
    <Translation component={Button} translation={`network.switchTo`} params={{network: networks[chainId].name}} onClick={() => onClick()} variant={'ctaPrimary'} width={['full', 'auto']} px={10} py={2} {...props} />
  )
}