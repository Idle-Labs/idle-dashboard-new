import React from 'react'
import { Card } from 'components/Card/Card'
import { HiChatAlt2 } from 'react-icons/hi'
import { AiOutlineMediumWorkmark } from 'react-icons/ai'
import { SiMedium, SiTwitter, SiDiscord } from 'react-icons/si'
import { Translation } from 'components/Translation/Translation'
import { Stack, SimpleGrid, Button, Text, Link } from '@chakra-ui/react'

export const JoinCommunity: React.FC = () => {
  return (
    <Card.Outline
      px={5}
      pb={4}
      mt={20}
      pt={[10, 4]}
    >
      <Stack
        spacing={10}
        width={'100%'}
        alignItems={'center'}
        direction={['column', 'row']}
        justifyContent={'space-between'}
      >
        <Translation translation={'footer.joinCommunity'} component={Text} textStyle={'heading'} fontSize={'lg'} />
        <SimpleGrid
          flex={1}
          spacing={4}
          width={'100%'}
          columns={[1, 4]}
        >
          <Link href={"https://medium.com/idle-finance"} isExternal textDecoration={'none !important'}>
            <Button width={'100%'} height={14} variant={'cta'} leftIcon={<SiMedium size={24} />}><AiOutlineMediumWorkmark size={72} /></Button>
          </Link>
          <Link href={"https://twitter.com/idlefinance"} isExternal textDecoration={'none !important'}>
            <Button width={'100%'} height={14} variant={'cta'} leftIcon={<SiTwitter size={24} />}>@idlefinance</Button>
          </Link>
          <Link href={"https://discord.gg/mpySAJp"} isExternal textDecoration={'none !important'}>
            <Button width={'100%'} height={14} variant={'cta'} leftIcon={<SiDiscord size={24} />}>IdleDAO Server</Button>
          </Link>
          <Link href={"https://gov.idle.finance/"} isExternal textDecoration={'none !important'}>
            <Button width={'100%'} height={14} variant={'cta'} leftIcon={<HiChatAlt2 size={24} />}>Governance Forum</Button>
          </Link>
        </SimpleGrid>
      </Stack>
    </Card.Outline>
  )
}