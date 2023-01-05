import React from 'react'
import { toDayjs } from 'helpers/'
import { HStack, Input, InputProps } from '@chakra-ui/react'

type InputDateArgs = {
  value?: string
  setValue: Function
  inputHeight?: number
} & InputProps

export const InputDate: React.FC<InputDateArgs> = ({ inputHeight, value, setValue, ...props }) => {
  const handleInputChange = ({target: { value }}: { target: {value: string} }) => {
    const date = toDayjs(value).isValid() ? toDayjs(value) : null
    setValue(date)
  }

  return (
    <HStack
      width={'100%'}
      justifyContent={'space-between'}
    >
      <Input type={"date"} height={inputHeight} flex={1} placeholder={''} variant={'balance'} value={value || ''} onChange={handleInputChange} {...props} />
    </HStack>
  )
}