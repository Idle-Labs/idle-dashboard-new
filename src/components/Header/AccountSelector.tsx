import { shortenHash } from 'helpers'
import { MenuItemType } from 'constants/menu'
import React, { useState, useEffect } from 'react'
import { Menu, Spinner, Button } from '@chakra-ui/react'
import { useWalletProvider } from 'contexts/WalletProvider'
import { MenuItemExpandable } from './Menu/MenuItemExpandable'
import { MdOutlineChangeCircle, MdClose } from 'react-icons/md'

export const AccountSelector: React.FC = () => {

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
          <MenuItemExpandable isOpen={isOpen} menuItem={menuItem} />
        </>
      )}
    </Menu>
  ) : connecting ? (
    <Button variant={'cta'}><Spinner size={'sm'} /></Button>
  ) : (
    <Button variant={'cta'} onClick={() => connect()}>Connect wallet</Button>
  )
}