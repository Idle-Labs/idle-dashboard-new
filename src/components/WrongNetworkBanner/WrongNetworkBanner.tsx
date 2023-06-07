import { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import { MdCheckCircle } from 'react-icons/md'
import { useSetChain } from '@web3-onboard/react'
import { TrancheVault } from 'vaults/TrancheVault'
import { selectChainByHexId } from 'constants/chains'
import { BestYieldVault } from 'vaults/BestYieldVault'
import { Stack, Image, Button } from '@chakra-ui/react'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'

export const WrongNetworkBanner: React.FC = () => {
  const { params } = useBrowserRouter()
  const [ { connectedChain }, setChain ] = useSetChain()
  const { walletInitialized, isNetworkCorrect, wallet, chainId, chainIdHex, network, setChainId } = useWalletProvider()

  const selectedChain = useMemo(() => connectedChain?.id ? selectChainByHexId(connectedChain.id) : null, [connectedChain])

  if (isNetworkCorrect || !connectedChain || !wallet || !network || !chainIdHex) return null

  return (
    <Card.Light
      left={0}
      p={[3, 5]}
      bottom={0}
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