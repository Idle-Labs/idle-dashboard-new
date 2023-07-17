import { MdSearch } from 'react-icons/md'
import { useTranslate } from 'react-polyglot'
import React, { useEffect, useState } from 'react'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { HStack, InputGroup, Input, InputRightElement } from '@chakra-ui/react'

type SearchBarProps = {
  placeholder?: string
  handleSearchChange: Function
}

export const SearchBar: React.FC<SearchBarProps> = ({ placeholder, handleSearchChange }) => {
  const { theme } = useThemeProvider()
  const translate = useTranslate()
  const [ searchText, setSearchText ] = useState<string>('')

  useEffect(() => {
    handleSearchChange(searchText)
  }, [searchText, handleSearchChange])

  return (
    <HStack>
      <InputGroup>
        <Input type={'text'} placeholder={translate(placeholder)} variant={'search'} onChange={(e) => setSearchText(e.target.value)} />
        <InputRightElement children={<MdSearch size={24} color={theme.colors.cta} />} />
      </InputGroup>
    </HStack>
  )
}