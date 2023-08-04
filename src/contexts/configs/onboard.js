import trezorModule from '@web3-onboard/trezor'
import ledgerModule from '@web3-onboard/ledger'
import gnosisModule from '@web3-onboard/gnosis'
import { translations } from 'constants/translations'
import coinbaseWalletModule from '@web3-onboard/coinbase'
import injectedModule from '@web3-onboard/injected-wallets'
import walletConnectModule from '@web3-onboard/walletconnect'
import { defaultChainId, chains, DASHBORD_URL } from 'constants/'

const env = process.env;

const gnosis = gnosisModule()
const trezor = trezorModule({
  email: '<EMAIL_CONTACT>',
  appUrl: DASHBORD_URL
})
const ledger = ledgerModule()
const injected = injectedModule()

const walletConnectV2InitOptions = {
  version: 2,
  requiredChains: [defaultChainId],
  projectId: env.REACT_APP_WALLETCONNECT_KEY,
  optionalChains: Object.keys(chains).map( cId => +cId )
}

const walletConnect = walletConnectModule(walletConnectV2InitOptions);
const coinbaseWalletSdk = coinbaseWalletModule({ darkMode: true })

export const onboardInitParams = {
  wallets: [
    injected,
    walletConnect,
    coinbaseWalletSdk,
    gnosis,
    ledger,
    trezor
  ],
  chains: Object.values(chains),
  accountCenter: {
    desktop: {
      enabled: false
    },
    mobile: {
      enabled: false
    }
  },
  i18n: {
    en: translations.en.onboard
  },
  theme: 'dark',
  appMetadata:{
    explore: 'explore',
    name: 'Idle Finance',
    icon: '/images/icon.svg',
    logo: '/images/logo.svg',
    description: 'Idle Finance',
    recommendedInjectedWallets: [
      { name: 'Coinbase', url: 'https://wallet.coinbase.com/' },
      { name: 'MetaMask', url: 'https://metamask.io' }
    ]
  },
  notify: {
   enabled: true,
   position: 'bottomRight',
   transactionHandler: transaction => {
     // console.log('transaction', transaction)
     if (transaction.eventCode === 'txPool') {
       return {
         autoDismiss: 0,
         onClick: () =>
          window.open(`https://etherscan.io/tx/${transaction.hash}`)
       }
     }
   }
  }
}