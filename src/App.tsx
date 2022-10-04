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
  config: {
    initialColorMode: 'dark'
  },
  colors: {
    cta:'#CDD0D6',
    white:'#FFFFFF',
    menu: {
      bg:'#202A3E',
      item: {
        bg:'#404F6A'
      }
    },
    button:{
      bg:'#404F6A',
      bgHover:'#293243',
      colorHover:'#CDD0D6'
    },
    orange:'#FF9859',
    cardBg:'#202A3E',
    primary:'#FFFFFF',
    buttonBg:'#404F6A',
    secondary:'#0C48A4',
    tertiary:'#2272C8',
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
        // color: '#6AE4FF',
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
    cta: {
      color:'cta',
      fontSize:'md',
      fontWeight:700,
      cursor:'pointer',
      fontFamily:`'Open Sans', sans-serif`,
      _hover: {
        color:'white'
      }
    }
  },
  // Create components styles
  components: {
    Button: {
      variants: {
        cta:{
          borderRadius:8,
          backgroundColor:'button.bg',
          _hover: {
            color:'button.colorHover',
            backgroundColor:'button.bgHover',
          }
        }
      }
    },
    Menu: {
      baseStyle: {
        list: {
          px:4,
          py:3,
          border:0,
          borderRadius:8,
          minWidth:'auto',
          backgroundColor:'menu.bg'
        },
        item: {
          p:2,
          my:1,
          color:'cta',
          borderRadius:8,
          textStyle:'cta',
          backgroundColor:'menu.bg',
          _focus: {
            color:'white',
            backgroundColor:'menu.item.bg'
          },
          _hover: {
            color:'white',
            backgroundColor:'menu.item.bg'
          }
        }
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
