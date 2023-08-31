import React from 'react'
import { HiChatAlt2 } from 'react-icons/hi'
import { Box, Stack, SimpleGrid, Link } from '@chakra-ui/react'
import { SiMedium, SiTwitter, SiDiscord } from 'react-icons/si'
import { Translation } from 'components/Translation/Translation'

export const Footer: React.FC = () => {

  const links: Record<string, string> = {
    terms: "https://idle.finance/terms-of-service",
    policy: "https://idle.finance/privacy-policy",
    faqs: "https://docs.idle.finance/other/faqs",
    support: "https://discord.gg/mpySAJp",
    docs: "https://docs.idle.finance/"
  }

  return (
    <Box
      pb={4}
      mt={[10, 20]}
      pt={[10, 4]}
      borderTop={'1px solid'}
      borderColor={'divider'}
    >
      <Stack
        spacing={10}
        width={'100%'}
        alignItems={'center'}
        direction={['column', 'row']}
        justifyContent={'space-between'}
      >
        <Stack
          spacing={6}
          width={['full', 'auto']}
          justifyContent={'flex-start'}
          alignItems={['center', 'flex-start']}
          direction={['column', 'row']}
        >
          {
            Object.keys(links).map( link => (
              <Translation key={`link_${link}`} component={Link} translation={`footer.links.${link}`} href={links[link]} isExternal className={'linkDark'} textDecoration={'none !important'} fontSize={['md', 'sm']} />
            ))
          }
        </Stack>
        <SimpleGrid
          spacing={6}
          columns={4}
          width={['full', 'auto']}
        >
          <Link display={'flex'} justifyContent={'center'} href={"https://medium.com/idle-finance"} isExternal>
            <SiMedium size={24} />
          </Link>
          <Link display={'flex'} justifyContent={'center'} href={"https://twitter.com/idlefinance"} isExternal>
            <SiTwitter size={24} />
          </Link>
          <Link display={'flex'} justifyContent={'center'} href={"https://discord.gg/mpySAJp"} isExternal>
            <SiDiscord size={24} />
          </Link>
          <Link display={'flex'} justifyContent={'center'} href={"https://gov.idle.finance/"} isExternal>
            <HiChatAlt2 size={24} />
          </Link>
        </SimpleGrid>
      </Stack>
    </Box>
  )
}