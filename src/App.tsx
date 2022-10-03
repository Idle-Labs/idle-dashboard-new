import * as React from "react"
// import { Logo } from "./Logo"
import { HashRouter } from "react-router-dom";
import { Web3Provider } from './contexts/Web3Provider'
import { I18nProvider } from './contexts/I18nProvider'
// import { ColorModeSwitcher } from "./ColorModeSwitcher"
import { WalletProvider } from './contexts/WalletProvider'
import { ChakraProvider, extendTheme } from "@chakra-ui/react"
import { PortfolioProvider } from './contexts/PortfolioProvider'
import { BrowserRouterProvider } from './contexts/BrowserRouterProvider'

const theme = extendTheme({
  config:{
    initialColorMode: 'dark'
  },
  colors: {
    primary:'#04117B',
    secondary:'#0C48A4',
    tertiary:'#2272C8',
    cta:'#CDD0D6',
    white:'#FFFFFF',
  },
  fontSizes: {
    xs:'12px',
    sm:'14px',
    md:'16px',
    lg:'20px',
    xl:'36px'
  },
  fonts: {
    heading: `'Open Sans', sans-serif`,
    body: `"Source Sans Pro", sans-serif`,
  },
  styles: {
    global: {
      // styles for the `body`
      body: {
        bg: '#1B1E27',
        color: 'white',
      },
      // styles for the `a`
      a: {
        color: '#6AE4FF',
        _hover: {
          textDecoration: 'none',
        },
      },
    },
  },
  // Group different layer styles
  layerStyles: {

  },
  // Group different text styles
  textStyles: {
    cta:{
      color:'cta',
      fontSize:'md',
      fontWeight:700,
      _hover:{
        color:'white'
      }
    }
  },
  // Create components variants
  components: {
    Text:{
      variants:{
        
      }
    }
  },
})


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
