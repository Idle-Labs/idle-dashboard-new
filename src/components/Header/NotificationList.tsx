import { IconType } from 'constants/types'
import { Icon } from 'components/Icon/Icon'
import { useTranslate } from 'react-polyglot'
import React, { useState, useEffect } from 'react'
import { MdOutlineNotificationsNone } from 'react-icons/md'
import { Scrollable } from 'components/Scrollable/Scrollable'
// import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { Menu, MenuGroup, MenuButton, MenuList, MenuItem, IconButton, Text, Flex } from '@chakra-ui/react'

type NotificationType = {
  title: string
  text: string
  date: string
  icon: IconType
}

export const Notification: React.FC<NotificationType> = (props) => {
  return (
    <MenuItem>
      <Flex
        width={'100%'}
        direction={'column'}
      >
        <Flex
          mb={2}
          width={'100%'}
          direction={'row'}
          justifyContent={'space-between'}
        >
          <Flex
            direction={'row'}
            alignItems={'center'}
          >
            <Icon IconComponent={props.icon} width={24} height={24} size={24} />
            <Text ml={3} textStyle={'bodyTitle'} whiteSpace={'nowrap'} overflow={'hidden'} textOverflow={'ellipsis'} maxW={200}>{props.title}</Text>
          </Flex>
          <Text fontWeight={600}>{props.date}</Text>
        </Flex>
        <Text maxH={45} overflow={'hidden'}>
          {props.text}
        </Text>
      </Flex>
    </MenuItem>
  )
}

export const NotificationList: React.FC = () => {
  const translate = useTranslate()
  const [ notifications, setNotifications ] = useState<NotificationType[]>([])

  useEffect(() => {
    setNotifications([
      // {
      //   icon:MdWbSunny,
      //   date:'05/10/2022',
      //   title:'Notifica di prova, Notifica di prova, Notifica di prova',
      //   text:'Testo di prova per la notifica, Testo di prova per la notifica, Testo di prova per la notifica, Testo di prova per la notifica, Testo di prova per la notifica'
      // },
      // {
      //   icon:MdWbSunny,
      //   date:'05/10/2022',
      //   title:'Notifica di prova',
      //   text:'Testo di prova per la notifica, Testo di prova per la notifica, Testo di prova per la notifica, Testo di prova per la notifica, Testo di prova per la notifica'
      // },
      // {
      //   icon:MdWbSunny,
      //   date:'05/10/2022',
      //   title:'Notifica di prova',
      //   text:'Testo di prova per la notifica, Testo di prova per la notifica, Testo di prova per la notifica, Testo di prova per la notifica, Testo di prova per la notifica'
      // }
    ])
  }, [])

  return (
    <Menu variant={'notifications'}>
      {() => (
        <>
          <MenuButton as={IconButton} variant={'cta'} aria-label={'Notifications'} icon={<MdOutlineNotificationsNone size={24} />} />
          <MenuList zIndex={9999999}>
            <MenuGroup title={translate('navBar.notifications.title')}>
              <Scrollable maxH={240}>
              {
                notifications && notifications.length ? notifications.map( (notification, index) => (
                  <Notification key={`notification_${index}`} {...notification}></Notification>
                )) : (
                  <MenuItem
                    minH={240}
                    borderBottom={0}
                    alignItems={'center'}
                    justifyContent={'center'}
                    backgroundColor={'transparent !important'}
                  >
                    {translate('navBar.notifications.empty')}
                  </MenuItem>
                )
              }
              </Scrollable>
            </MenuGroup>
          </MenuList>
        </>
      )}
    </Menu>
  )
}