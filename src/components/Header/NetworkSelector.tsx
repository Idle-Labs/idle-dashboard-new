import { Menu, Spinner } from '@chakra-ui/react'
import React, { useState, useEffect } from 'react'
import { useWalletProvider } from 'contexts/WalletProvider'
import { MenuItemExpandable } from './Menu/MenuItemExpandable'
import { chains, networks, MenuItemType, MenuListType } from 'constants/'

export const NetworkSelector: React.FC = () => {

  const { chainId, setChainId } = useWalletProvider()
  const [ menuItem, setMenuItem ] = useState<MenuItemType | null>(null)

  useEffect(() => {
    if (!chainId) return
    const menuItem = {
      icon: networks[chainId].icon,
      label: networks[chainId].name,
      children: Object.keys(chains).filter( cId => cId !== chainId.toString() ).map( (cId: string): MenuListType => {
        const icon = networks[parseInt(cId)].icon || undefined
        return {
          icon,
          onClick: () => setChainId(cId),
          label: networks[parseInt(cId)].name
        }
      })
    }

    setMenuItem(menuItem)
  }, [chainId, setChainId])

  return menuItem ? (
    <Menu>
      {({ isOpen }) => (
        <>
          <MenuItemExpandable isOpen={isOpen} menuItem={menuItem} />
        </>
      )}
    </Menu>
  ) : (
    <Spinner size={'sm'} />
  )
}