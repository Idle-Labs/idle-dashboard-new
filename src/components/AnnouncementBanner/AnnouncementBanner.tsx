import { Card } from 'components/Card/Card'
import { Stack, Image } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'

type AnnouncementBannerProps = {
  text: string
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ text }) => {
  return (
    <Card.Dark
      p={[3, 5]}
      borderColor={'yellow'}
    >
      <Stack
        width={'full'}
        spacing={[2, 3]}
        alignItems={'center'}
        justifyContent={'center'}
        direction={['column','row']}
      >
        <Image src={`images/vaults/deprecated.png`} width={6} />
        <Translation textAlign={'center'} translation={text} isHtml={true} textStyle={'caption'} />
        <Image display={['none', 'block']} src={`images/vaults/deprecated.png`} width={6} />
      </Stack>
    </Card.Dark>
  )
}