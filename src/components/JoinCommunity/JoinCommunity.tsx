import React from 'react'
import { Card } from 'components/Card/Card'
import { HiChatAlt2 } from 'react-icons/hi'
import { AiOutlineMediumWorkmark } from 'react-icons/ai'
import { SiMedium, SiTwitter, SiDiscord } from 'react-icons/si'
import { Translation } from 'components/Translation/Translation'
import { HStack, SimpleGrid, Button, Text, Link } from '@chakra-ui/react'

export const JoinCommunity: React.FC = () => {
  return (
    <Card.Outline
      py={4}
      px={5}
      mt={20}
    >
      <HStack
        spacing={10}
        width={'100%'}
        justifyContent={'space-between'}
      >
        <Translation translation={'footer.joinCommunity'} component={Text} textStyle={['heading', 'h3']} />
        <SimpleGrid
          flex={1}
          spacing={4}
          columns={4}
        >
          <Link href={"https://medium.com/idle-finance"} isExternal>
            <Button width={'100%'} height={14} variant={'cta'} leftIcon={<SiMedium size={24} />}><AiOutlineMediumWorkmark size={72} /></Button>
          </Link>
          <Link href={"https://twitter.com/idlefinance"} isExternal>
            <Button width={'100%'} height={14} variant={'cta'} leftIcon={<SiTwitter size={24} />}>@idlefinance</Button>
          </Link>
          <Link href={"https://discord.gg/mpySAJp"} isExternal>
            <Button width={'100%'} height={14} variant={'cta'} leftIcon={<SiDiscord size={24} />}>IdleDAO Server</Button>
          </Link>
          <Link href={"https://gov.idle.finance/"} isExternal>
            <Button width={'100%'} height={14} variant={'cta'} leftIcon={<HiChatAlt2 size={24} />}>Governance Forum</Button>
          </Link>
        </SimpleGrid>
      </HStack>
    </Card.Outline>
  )
}