// import { useTestContext } from './TestContext'
import { useWeb3Provider } from './contexts/Web3Provider'
import { useWalletProvider } from './contexts/WalletProvider'
export function TestConsumer(){
	const { web3 } = useWeb3Provider()
	const { wallet, connecting, connect, disconnect } = useWalletProvider()
	return (
		<>
			<button onClick={() => wallet ? disconnect() : connect() }>{ connecting ? 'Connecting' : (wallet ? 'Disconnect' : 'Connect') }</button>
			{
				web3 && wallet && (
					<button onClick={() => { web3.eth.sendTransaction({from: '0x442Aea0Fd2AFbd3391DAE768F7046f132F0a6300', to:'0x442Aea0Fd2AFbd3391DAE768F7046f132F0a6300', value: '10000000000000000'}) } }>Send Tx</button>
				)
			}
		</>
	)
}