import { shortenHash } from '../../helpers'
import { MenuItemType } from '../../constants'
import React, { useState, useEffect } from 'react'
import { Menu, Spinner, Button } from '@chakra-ui/react'
import { MenuItemExpandable } from './MenuItemExpandable'
import { MdOutlineChangeCircle, MdClose } from 'react-icons/md'
import { useWalletProvider } from '../../contexts/WalletProvider'

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
  }, [wallet, account, connecting, disconnect])

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