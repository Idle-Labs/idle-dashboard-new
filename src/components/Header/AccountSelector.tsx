import { shortenHash } from 'helpers'
import { MenuItemType } from 'constants/menu'
import React, { useState, useEffect } from 'react'
import { Menu } from '@chakra-ui/react'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { useWalletProvider } from 'contexts/WalletProvider'
import { MenuItemExpandable } from './Menu/MenuItemExpandable'
import { MdOutlineChangeCircle, MdClose } from 'react-icons/md'
import { ConnectWalletButton } from 'components/ConnectWalletButton/ConnectWalletButton'

export const AccountSelector: React.FC = () => {
  const { screenSize } = useThemeProvider()
  const [ menuItem, setMenuItem ] = useState<MenuItemType | null>(null)
  const { wallet, account, connecting, connect, disconnect } = useWalletProvider()

  // console.log('wallet', wallet, account);

  useEffect(() => {
    if (menuItem && !wallet){
      setMenuItem(null)
    }
  }, [wallet, menuItem])

  useEffect(() => {
    if (!wallet || !account || connecting) {
      return
    }

    const menuItem = {
      icon: wallet.icon,
      label: shortenHash(account.address),
      children: [
        {
          onClick: connect,
          icon: MdOutlineChangeCircle,
          label:'Switch wallet provider'
        },
        {
          onClick: disconnect,
          icon: MdClose,
          label:'Disconnect',
          labelProps: {
            color:'orange'
          },
          iconProps: {
            color:'orange'
          },
        }
      ]
    }

    setMenuItem(menuItem)
  }, [wallet, account, connecting, connect, disconnect])

  return menuItem ? (
    <Menu>
      {({ isOpen }) => (
        <>
          <MenuItemExpandable isMobile={screenSize==='sm'} isOpen={isOpen} menuItem={menuItem} />
        </>
      )}
    </Menu>
  ) : (
    <ConnectWalletButton variant={'cta'} width={'auto'} px={[3, 'auto']} />
  )
}