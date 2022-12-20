import trezorModule from '@web3-onboard/trezor'
import ledgerModule from '@web3-onboard/ledger'
import gnosisModule from '@web3-onboard/gnosis'
import { chains, DASHBORD_URL } from 'constants/'
import { translations } from 'constants/translations'
import coinbaseWalletModule from '@web3-onboard/coinbase'
import injectedModule from '@web3-onboard/injected-wallets'
import walletConnectModule from '@web3-onboard/walletconnect'

const gnosis = gnosisModule()
const trezor = trezorModule({
  email: '<EMAIL_CONTACT>',
  appUrl: DASHBORD_URL
})
const ledger = ledgerModule()
const injected = injectedModule()
const walletConnect = walletConnectModule({
  bridge: "https://bridge.walletconnect.org",
  qrcodeModalOptions: {
    mobileLinks: ['rainbow', 'metamask', 'argent', 'trust', 'imtoken', 'pillar']
  },
  connectFirstChainId: true
});
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