import React, { useCallback } from 'react'
import { networks } from 'constants/networks'
import { useSetChain } from '@web3-onboard/react'
import { selectChainById } from 'constants/chains'
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
  const [ , setChain ] = useSetChain()
  const { chainId: selectedChainId, setChainId } = useWalletProvider()

  const onClick = useCallback(() => {
    // Change provider chain
    if (+selectedChainId === +chainId){
      const chainConfig = selectChainById(chainId)
      if (chainConfig){
        return setChain({ chainId: chainConfig.id as string })
      }
    } else {
      return setChainId(chainId)
    }
  }, [chainId, selectedChainId, setChain, setChainId])

  return (
    <Translation component={Button} translation={`network.switchTo`} params={{network: networks[chainId].name}} onClick={() => onClick()} variant={'ctaPrimary'} width={['full', 'auto']} px={10} py={2} {...props} />
  )
}