import { Card } from 'components/Card/Card'
import { MdCheckCircle } from 'react-icons/md'
import { useTheme, Stack, Image } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'

type AnnouncementBannerProps = {
  text: string
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ text }) => {
  const theme = useTheme()
  return (
    <Card.Dark
      p={[3, 5]}
      borderColor={'darkGreen'}
    >
      <Stack
        width={'full'}
        spacing={[2, 3]}
        alignItems={'center'}
        justifyContent={'center'}
        direction={['column','row']}
      >
        <MdCheckCircle size={24} color={theme.colors.darkGreen} />
        <Translation textAlign={'center'} translation={text} isHtml={true} textStyle={'caption'} />
      </Stack>
    </Card.Dark>
  )
}