import React from 'react'
import { Card } from 'components/Card/Card'
import { ContainerProps } from '@chakra-ui/react'

export const Dashboard: React.FC<ContainerProps> = ({ children, ...rest }) => {
  return (
    <>
      <Card>
        <Card.Heading>Titolo Card</Card.Heading>
      </Card>
    </>
  )
}
