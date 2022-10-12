import * as React from "react"
import { strategies } from 'constants/'
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
    table:{
      arrow:'#555B67',
      header:'#323D53',
      headerHover:'#404F6A'
    },
    orange:'#FF9859',
    cardBg:'#202A3E',
    divider:'#555B67',
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
    xl:'20px',
    '2xl':'36px',
    '3xl':'36px',
    '4xl':'36px',
    '5xl':'36px',
    '6xl':'36px',
    '7xl':'36px',
    '8xl':'36px',
    '9xl':'36px',
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
      '.earn-best-yield': {
        background:`url(${strategies.BY.bg}) no-repeat top right`,
        backgroundSize:'100% auto'
      },
      '.earn-protected-yield': {
        background:`url(${strategies.AA.bg}) no-repeat top right`,
        backgroundSize:'100% auto'
      },
      '.earn-boosted-yield': {
        background:`url(${strategies.BB.bg}) no-repeat top right`,
        backgroundSize:'100% auto'
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
    tableRow: {
      _hover:{
        bg:'table.header'
      }
    },
    tableHeader: {
      p:1,
      pl:4,
      minH:'38px',
      color:'cta',
      fontSize:'sm',
      borderRadius:8,
      cursor:'pointer',
      fontFamily: 'body',
      textTransform:'initial',
      backgroundColor:'table.header',
      _hover:{
        backgroundColor:'table.headerHover'
      }
    },
    card: {
      p:8,
      borderRadius:8,
      backgroundColor:'cardBg'
    }
  },
  // Group different text styles
  textStyles: {
    base: {
      fontSize:'sm',
      fontWeight: 500,
      // fontFamily:`"Source Sans Pro", sans-serif`
    },
    tableCell: {
      fontSize:'md',
      fontWeight: 600,
      fontFamily: 'body'
    },
    bodyTitle: {
      fontWeight: 600,
      color: 'primary'
      // fontFamily:`"Source Sans Pro", sans-serif`
    },
    cta: {
      color:'cta',
      fontSize:'md',
      fontWeight:700,
      cursor:'pointer',
      fontFamily: 'heading',
      // fontFamily:`'Open Sans', sans-serif`,
      _hover: {
        color:'white'
      }
    }
  },
  // Create components styles
  components: {
    Skeleton: {
      baseStyle: {
        height: '20px'
      }
    },
    Heading: {
      baseStyle:{
        fontWeight:600
      }
    },
    Tooltip:{
      baseStyle:{
        borderRadius:4,
        color:'primary',
        fontWeight: 500,
        bg:'table.header',
        fontFamily:'body'
      },
      defaultProps:{
        placement:'top'
      }
    },
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
        groupTitle: {
          mx:0,
          mt:0,
          mb:4,
          fontSize:'lg',
          color:'primary',
          textStyle:'cta',
        },
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
      },
      variants: {
        notifications: {
          groupTitle: {
            m:0,
            px:6,
            pt:6,
            pb:4,
            fontSize:'lg',
            color:'primary',
            textStyle:'cta',
          },
          item: {
            m:0,
            pt:2,
            pb:2,
            pr:6,
            pl:6,
            borderRadius:0,
            borderBottom:'1px solid',
            borderBottomColor:'divider'
          },
          list: {
            p:0,
            width:'sm',
            overflow:'hidden'
          }
        }
      }
    }
  }
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
