import { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import { useTheme, Stack, Image } from '@chakra-ui/react'
import { MdCheckCircle, MdWarning } from 'react-icons/md'
import { TranslationProps, Translation } from 'components/Translation/Translation'

type AnnouncementBannerProps = {
  text: TranslationProps["translation"]
  mode?: 'none' | 'success' | 'alert',
  image?: string
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ text, mode = 'none', image }) => {
  const theme = useTheme()
  const color = useMemo(() => mode === 'success' ? theme.colors.darkGreen : (mode === 'alert' ? theme.colors.yellow : ''), [theme, mode])
  return (
    <Card.Dark
      p={[3, 5]}
      borderColor={color}
    >
      <Stack
        width={'full'}
        spacing={[2, 3]}
        alignItems={'center'}
        justifyContent={'center'}
        direction={['column','row']}
      >
        {
          image ? (
            <Image src={image} width={6} />
          ) : mode === 'success' ? (
            <MdCheckCircle size={24} color={color} />
          ) : mode === 'alert' && (
            <MdWarning size={24} color={color} />
          )
        }
        <Translation textAlign={'center'} translation={text} isHtml={true} textStyle={'caption'} />
      </Stack>
    </Card.Dark>
  )
}