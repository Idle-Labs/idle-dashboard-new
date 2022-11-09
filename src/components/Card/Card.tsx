import React from 'react'
import { Heading, Box, BoxProps, ThemingProps } from '@chakra-ui/react'

// type HeadingProps = {
//   title:string
//   [x: string]: any
// }

export type CardProps = BoxProps & ThemingProps

const HeadingTitle = (props: CardProps) => {
  const { children, ...rest } = props
  return (
    <Heading as={'h3'} size={'md'} mb={6} {...rest}>{children}</Heading>
  )
}

export const Card = (props: CardProps) => {
  const { children, layerStyle, ...rest } = props
  return (
    <Box
      width={'100%'}
      layerStyle={layerStyle || 'card'}
      {...rest}
    >
      {children}
    </Box>
  )
}

export const Dark = (props: CardProps) => {
  const { children, ...rest } = props
  return (
    <Card {...rest} layerStyle={'cardDark'}>{children}</Card>
  )
}

export const Outline = (props: CardProps) => {
  const { children, ...rest } = props
  return (
    <Card {...rest} layerStyle={'cardOutline'}>{children}</Card>
  )
}

Card.Dark = Dark
Card.Outline = Outline
Card.Heading = HeadingTitle