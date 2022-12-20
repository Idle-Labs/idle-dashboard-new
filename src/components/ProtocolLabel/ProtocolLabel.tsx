import { BsQuestion } from 'react-icons/bs'
import { selectProtocol } from 'selectors/selectProtocol'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { Avatar, AvatarProps, Text, HStack, TextProps } from '@chakra-ui/react'

type ProtocolIconProps = {
  protocolId: string
} & AvatarProps

const ProtocolIcon: React.FC<ProtocolIconProps> = ({children, protocolId, ...props}) => {
  const protocol = selectProtocol(protocolId)
  if (!protocol || !protocol.icon) return null
  return (
    <Avatar
      p={0}
      bg={'transparent'}
      src={protocol.icon}
      icon={<BsQuestion size={24} />}
      sx={{
        "> img": {
          objectFit: 'contain'
        }
      }}
      {...props}
    />
  )
}

type ProtocolLabelProps = {
  size?: string
  protocolId: string
} & TextProps

export const ProtocolLabel: React.FC<ProtocolLabelProps> = ({ protocolId, size = 'sm', ...textProps }) => {
  const protocol = selectProtocol(protocolId)
  if (!protocol) return null
  return (
    <HStack
      alignItems={'center'}
      justifyContent={'flex-start'}
    >
      <ProtocolIcon protocolId={protocolId} size={size} />
      <Text textStyle={'heading'} fontSize={'h3'} whiteSpace={'nowrap'} {...textProps}>{protocol.label}</Text>
    </HStack>
  )
}