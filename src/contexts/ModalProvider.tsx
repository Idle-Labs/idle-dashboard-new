import { useTranslate } from 'react-polyglot'
import type { ModalProps } from 'constants/types'
import type { ProviderProps } from './common/types'
import React, { useCallback, useState, useContext } from 'react'
import { useDisclosure, Text, Button, Flex, Heading } from "@chakra-ui/react"

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react'

type ContextProps = {
  openModal: Function
  closeModal: Function
}

const initialState: ContextProps = {
  openModal: () => {},
  closeModal: () => {}
}

type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'

const ModalContext = React.createContext<ContextProps>(initialState)
export const useModalProvider = () => useContext(ModalContext)

export function ModalProvider({ children }: ProviderProps) {
  const translate = useTranslate()
  const [ size, setSize ] = useState<ModalSize>('lg')
  const [ modalProps, setModalProps ] = useState<ModalProps>({
    cta:'',
    text:'',
    title:'',
    subtitle:'',
    body: null
  })

  const { isOpen, onOpen, onClose } = useDisclosure()

  const openModal = useCallback((props: ModalProps, size: ModalSize = 'lg', translateProps: boolean = true) => {

    const modalProps = translateProps ? (Object.keys(props) as Array<keyof ModalProps>).reduce( (modalProps: ModalProps, prop: keyof ModalProps) => {
      modalProps[prop] = typeof props[prop] === 'string' ? translate(props[prop]) : props[prop]
      return modalProps
    }, {
      cta:'',
      text:'',
      title:'',
      subtitle:'',
      body: null
    }) : props

    setSize(size)
    setModalProps(modalProps)
    onOpen()
  }, [onOpen, setModalProps, translate])

  return (
    <ModalContext.Provider value={{ openModal, closeModal: onClose}}>
      {children}
      <Modal
        isCentered
        size={size}
        isOpen={isOpen}
        onClose={onClose}
        blockScrollOnMount={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader textStyle={'heading'} fontSize={'md'} color={'cta'}>{modalProps.title}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {
              modalProps.subtitle.length>0 && (
                <Heading as={'h3'} fontSize={'lg'} mb={6}>
                  {modalProps.subtitle}
                </Heading>
              )
            }
            {
              modalProps.body || (
                <Text color={'cta'} dangerouslySetInnerHTML={{__html: modalProps.text}} />
              )
            }
          </ModalBody>
          {
            modalProps.cta.length>0 && (
              <ModalFooter>
                <Flex
                  width={'full'}
                  justifyContent={'center'}
                >
                  <Button variant={'ctaPrimary'} px={10} onClick={onClose}>
                    {modalProps.cta}
                  </Button>
                </Flex>
              </ModalFooter>
            )
          }
        </ModalContent>
      </Modal>
    </ModalContext.Provider>
  )
}