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
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    blue: {
      50: '#EBEFFE',
      100: '#B5C4FC',
      200: '#7F99FB',
      300: '#5F80FA',
      400: '#486FF9',
      500: '#3761F9',
      600: '#2D4EC9',
      700: '#243EA1',
      800: '#1C317E',
      900: '#15255F',
    },
    gray: {
      900: '#171923',
      850: '#191d28',
      825: '#191e2a',
      815: '#1a1f2b',
      800: '#181c27',
      785: '#1A202C',
      750: '#212631',
      700: '#2D3748',
      600: '#4A5568',
      500: '#718096',
      400: '#A0AEC0',
      300: '#CDD0D6',
      200: '#E2E8F0',
      100: '#EDF2F7',
      50: '#F7FAFC',
    },
    green: {
      900: '#004F3A',
      800: '#00684D',
      700: '#008562',
      600: '#00A67B',
      500: '#00CD98',
      400: '#16D1A1',
      300: '#33D7AD',
      200: '#5CDFBD',
      100: '#A1ECD9',
      50: '#E6FAF5',
    },
    red: {
      50: '#FFF5F5',
      100: '#FFF8F8',
      200: '#FDE3E3',
      300: '#FAC1C0',
      400: '#F5918F',
      500: '#EF5350',
      600: '#DD4D4A',
      700: '#C74543',
      800: '#AE3C3B',
      900: '#923231',
    },
    darkTeal: {
      500: '#144241',
      300: '#3F6D6C',
    },
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
    card:{
      bg:'#202A3E',
      bgDark:'#1B1E27',
      borderColor:'#555B67'
    },
    chart:{
      axis:'#555B67',
      stroke:'#6AE4FF',
      loadingBg:'#555B67',
      loadingLine:'#293243'
    },
    table:{
      arrow:'#555B67',
      header:'#323D53',
      headerHover:'#404F6A'
    },
    orange:'#FF9859',
    divider:'#555B67',
    primary:'#FFFFFF',
    buttonBg:'#404F6A',
    secondary:'#0C48A4',
    tertiary:'#2272C8',
  },
  fontSizes: {
    xxs:'11px',
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
      borderBottomWidth:'1px',
      borderBottomStyle:'solid',
      borderBottomColor:'divider',
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
      backgroundColor:'card.bg'
    },
    cardDark: {
      p:8,
      borderRadius:8,
      borderWidth:'1px',
      borderStyle:'solid',
      backgroundColor:'card.bgDark',
      borderColor:'card.borderColor',
    }
  },
  // Group different text styles
  textStyles: {
    base: {
      fontSize:'sm',
      fontWeight: 500,
      // fontFamily:`"Source Sans Pro", sans-serif`
    },
    earnings: {
      color:'cta',
      fontWeight:400,
      fontSize:'sm',
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
