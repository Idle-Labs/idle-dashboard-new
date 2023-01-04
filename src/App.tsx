import * as React from "react"
import { theme } from './theme'
// import { Logo } from "./Logo"
import dayjs from 'classes/dayjs'
import { HashRouter } from "react-router-dom"
import { ChakraProvider } from "@chakra-ui/react"
import { Web3Provider } from 'contexts/Web3Provider'
import { I18nProvider } from 'contexts/I18nProvider'
import { CacheProvider } from 'contexts/CacheProvider'
import { ThemeProvider } from 'contexts/ThemeProvider'
// import { ColorModeSwitcher } from "./ColorModeSwitcher"
import { WalletProvider } from 'contexts/WalletProvider'
import { PortfolioProvider } from 'contexts/PortfolioProvider'
import { BrowserRouterProvider } from 'contexts/BrowserRouterProvider'
import { TransactionManagerProvider } from 'contexts/TransactionManagerProvider'

export const App = () => (
  <HashRouter>
    <ChakraProvider theme={theme}>
      <ThemeProvider>
        <I18nProvider>
          <WalletProvider>
            <Web3Provider>
              <CacheProvider TTL={300}>
                <TransactionManagerProvider>
                  <PortfolioProvider>
                    <BrowserRouterProvider />
                  </PortfolioProvider>
                </TransactionManagerProvider>
              </CacheProvider>
            </Web3Provider>
          </WalletProvider>
        </I18nProvider>
      </ThemeProvider>
    </ChakraProvider>
  </HashRouter>
)
