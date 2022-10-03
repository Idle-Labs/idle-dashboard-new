import * as React from "react"
// import { Logo } from "./Logo"
import { HashRouter } from "react-router-dom";
import { Web3Provider } from './contexts/Web3Provider'
import { I18nProvider } from './contexts/I18nProvider'
// import { ColorModeSwitcher } from "./ColorModeSwitcher"
import { ChakraProvider, theme } from "@chakra-ui/react"
import { WalletProvider } from './contexts/WalletProvider'
import { PortfolioProvider } from './contexts/PortfolioProvider'
import { BrowserRouterProvider } from './contexts/BrowserRouterProvider'

export const App = () => (
  <HashRouter>
    <ChakraProvider theme={theme}>
      <I18nProvider>
        <WalletProvider>
          <Web3Provider>
            <PortfolioProvider>
              <BrowserRouterProvider />
            </PortfolioProvider>
          </Web3Provider>
        </WalletProvider>
      </I18nProvider>
    </ChakraProvider>
  </HashRouter>
)
