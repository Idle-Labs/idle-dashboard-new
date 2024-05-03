import { sendCustomEvent } from 'helpers/'
import { Menu, Spinner } from '@chakra-ui/react'
import React, { useState, useEffect } from 'react'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { useWalletProvider } from 'contexts/WalletProvider'
import { MenuItemExpandable } from './Menu/MenuItemExpandable'
import { chains, networks, MenuItemType, MenuListType } from 'constants/'

export const NetworkSelector: React.FC = () => {
  const { screenSize } = useThemeProvider()
  const { chainId, setChainId, network } = useWalletProvider()
  const [ menuItem, setMenuItem ] = useState<MenuItemType | null>(null)

  useEffect(() => {
    if (!chainId || !network) return
    const menuItem = {
      icon: network.icon,
      label: network.name,
      color: chains[chainId] ? 'brightGreen' : 'red',
      children: Object.keys(chains).filter( cId => cId !== chainId.toString() ).map( (cId: string): MenuListType => {
        const icon = networks[parseInt(cId)].icon || undefined
        return {
          icon,
          onClick: () => {
            setChainId(cId)
            sendCustomEvent('select_chain', {chainId: cId})
          },
          label: networks[parseInt(cId)].name
        }
      })
    }

    setMenuItem(menuItem)
  }, [chainId, network, setChainId])

  return menuItem ? (
    <Menu>
      {({ isOpen }) => (
        <>
          <MenuItemExpandable isMobile={screenSize==='sm'} isOpen={isOpen} menuItem={menuItem} />
        </>
      )}
    </Menu>
  ) : (
    <Spinner size={'sm'} />
  )
}