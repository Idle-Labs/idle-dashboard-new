import { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import { useSetChain } from '@web3-onboard/react'
import { selectChainByHexId } from 'constants/chains'
import { Stack, Image, Button } from '@chakra-ui/react'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'

export const WrongNetworkBanner: React.FC = () => {
  const [ { connectedChain }, setChain ] = useSetChain()
  const { wallet, chainIdHex, network } = useWalletProvider()

  const selectedChain = useMemo(() => connectedChain?.id ? selectChainByHexId(connectedChain.id) : null, [connectedChain])

  if (!connectedChain || !wallet || !network || !chainIdHex) return null

  return (
    <Card.Light
      left={0}
      p={[3, 5]}
      bottom={0}
      zIndex={11}
      width={'full'}
      borderRadius={0}
      position={'fixed'}
    >
      <Stack
        width={'full'}
        spacing={[2, 3]}
        alignItems={'center'}
        justifyContent={'center'}
        direction={['column','row']}
      >
        <Image w={8} h={8} src={`images/vaults/warning.png`} />
        <Translation textAlign={'center'} translation={'network.wrongNetwork'} params={{wallet: wallet?.label, currentNetwork: selectedChain?.label, correctNetwork: network?.chainName}} isHtml={true} textStyle={'caption'} />
        <Translation component={Button} size={'sm'} translation={`common.switchNetwork`} onClick={() => setChain({ chainId: chainIdHex as string })} variant={'ctaPrimary'} maxH={10} />
      </Stack>
    </Card.Light>
  )
}