import React from 'react'
import { Image, Box } from '@chakra-ui/react'
import { IconType } from '../../constants/types'

type IconProps = {
  IconComponent:IconType
  [x: string]: any
}

export const Icon:React.FC<IconProps> = ({ IconComponent, ...props }) => {
  return typeof IconComponent === 'string' && /<([\w])/.test(IconComponent) ? (
    <Box dangerouslySetInnerHTML={{__html: IconComponent}} {...props}></Box>
  ) : typeof IconComponent === 'string' ? (
    <Image src={IconComponent} {...props} />
  ) : (
    <IconComponent {...props} />
  )
}