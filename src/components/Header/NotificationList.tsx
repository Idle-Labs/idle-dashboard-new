import { IconType } from 'constants/types'
import { Icon } from 'components/Icon/Icon'
import React, { useState, useEffect } from 'react'
import { MdOutlineNotificationsNone/*, MdWbSunny*/ } from 'react-icons/md'
import { ContainerProps, Menu, MenuGroup, MenuButton, MenuList, MenuItem, IconButton, Text, Flex, Box } from '@chakra-ui/react'

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

const Scrollable: React.FC<ContainerProps> = ({children, ...props}) => {
  return (
    <Box
      {...props}
      overflow={'scroll'}
    >
      {children}
    </Box>
  )
}

export const NotificationList: React.FC = () => {

  const [ notifications, setNotifications ] = useState<NotificationType[] | null>(null)

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
      {({ isOpen }) => (
        <>
          <MenuButton as={IconButton} variant={'cta'} aria-label={'Notifications'} icon={<MdOutlineNotificationsNone size={24} />} />
          <MenuList>
            <MenuGroup title='Notifications'>
              <Scrollable maxH={240}>
              {
                notifications && notifications.length ? notifications.map( (notification, index) => (
                  <Notification key={`notification_${index}`} {...notification}></Notification>
                )) : (
                  <MenuItem
                    minH={240}
                    alignItems={'center'}
                    justifyContent={'center'}
                    backgroundColor={'transparent !important'}
                  >
                    You have no notifications
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