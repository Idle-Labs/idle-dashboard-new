import { useTranslate } from 'react-polyglot'
import type { ModalProps } from 'constants/types'
import type { ProviderProps } from './common/types'
import { useThemeProvider } from 'contexts/ThemeProvider'
import React, { useCallback, useState, useContext } from 'react'
import { useDisclosure, Text, Button, Flex, Heading, ButtonProps, Stack } from "@chakra-ui/react"

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

type Cta = {
  text: string
  close?: boolean
  props?: ButtonProps
  function: ButtonProps["onClick"]
}

type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'

const ModalContext = React.createContext<ContextProps>(initialState)
export const useModalProvider = () => useContext(ModalContext)

export function ModalProvider({ children }: ProviderProps) {
  const translate = useTranslate()
  const { isMobile } = useThemeProvider()
  const [ ctas, setCtas ] = useState<Cta[]>([])
  const [ size, setSize ] = useState<ModalSize>('lg')
  const [ modalProps, setModalProps ] = useState<ModalProps>({
    cta:'',
    text:'',
    title:'',
    subtitle:'',
    body: null
  })

  const { isOpen, onOpen, onClose } = useDisclosure()

  const openModal = useCallback((
    props: ModalProps,
    size: ModalSize = 'lg',
    translateProps: boolean = true,
    params: Record<string, any> = {},
    ctas: Cta[] = []
  ) => {
    const modalProps = translateProps ? (Object.keys(props) as Array<keyof ModalProps>).reduce( (modalProps: ModalProps, prop: keyof ModalProps) => {
      modalProps[prop] = typeof props[prop] === 'string' ? translate(props[prop], params[prop]) : props[prop]
      return modalProps
    }, {
      cta:'',
      text:'',
      title:'',
      subtitle:'',
      body: null
    }) : props

    setSize(size)
    setCtas(ctas)
    setModalProps(modalProps)
    onOpen()
  }, [onOpen, setModalProps, translate])

  return (
    <ModalContext.Provider value={{ openModal, closeModal: onClose}}>
      {children}
      <Modal
        size={size}
        isOpen={isOpen}
        onClose={onClose}
        isCentered={!isMobile}
        blockScrollOnMount={false}
      >
        <ModalOverlay />
        <ModalContent>
          {
            modalProps.title && modalProps.title?.length>0 && (
              <ModalHeader textStyle={'heading'} fontSize={'md'} color={'cta'}>{modalProps.title}</ModalHeader>
            )
          }
          <ModalCloseButton zIndex={999} />
          <ModalBody>
            {
              modalProps.subtitle && modalProps.subtitle?.length>0 && (
                <Heading as={'h3'} fontSize={'lg'} mt={modalProps.title && modalProps.title?.length>0 ? 0 : 6} mb={6}>
                  {modalProps.subtitle}
                </Heading>
              )
            }
            {
              modalProps.body || (modalProps.text && (
                <Text color={'cta'} dangerouslySetInnerHTML={{__html: modalProps.text}} />
              ))
            }
          </ModalBody>
          {
            ctas.length>0 ? (
              <ModalFooter>
                <Stack
                  spacing={4}
                  width={'full'}
                  justifyContent={'center'}
                  direction={['column', 'row']}
                >
                  {
                    ctas.map( (cta: Cta) => {
                      const onClick = (e: any) => {
                        if (cta.function){
                          cta.function(e)
                        }
                        onClose()
                      }
                      return (
                        <Button
                          px={10}
                          key={Math.random()}
                          onClick={onClick}
                          {...cta.props}
                        >
                          {cta.text}
                        </Button>
                      )
                    })
                  }
                </Stack>
              </ModalFooter>
            ) : modalProps.cta && modalProps.cta.length>0 && (
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