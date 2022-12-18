import { useWalletProvider } from 'contexts/WalletProvider'
import { Button, ButtonProps, Spinner } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'

export const ConnectWalletButton: React.FC<ButtonProps> = ({...props}) => {
  const { connect, walletInitialized, connecting } = useWalletProvider()
  return walletInitialized && connecting ? (
    <Button disabled={true} {...props}>
      <Spinner size={'sm'} />
    </Button>
  ) : (
    <Translation component={Button} translation={"common.connectWallet"} onClick={() => connect()} {...props} />
  )
}