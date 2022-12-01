import React from 'react'
import { MenuNavItem } from './MenuNavItem'
import { MdOutlineClose } from 'react-icons/md'
import { menu, MenuItemType } from 'constants/menu'
import { Translation } from 'components/Translation/Translation'
import { Container, Image, VStack, HStack, Box } from '@chakra-ui/react'

type MobileMenuProps = {
  isOpen: boolean
  close: Function
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  close
}) => {
  return (
    <Container
      p={6}
      zIndex={999999}
      id={'mobile-menu'}
      bg={'card.bgDark'}
      layerStyle={'overlay'}
      left={isOpen ? '0' : '-100vw'}
      sx={{
        transition:'left 0.3s ease-in-out'
      }}
    >
      <VStack
        spacing={6}
        width={'100%'}
      >
        <HStack
          width={'100%'}
          justifyContent={'space-between'}
        >
          <Image src={'images/icon.svg'} height={[8, 10]} width={[8, 10]} />
          <MdOutlineClose
            size={32}
            onClick={() => close()}
            style={{cursor: 'pointer'}}
          />
        </HStack>
        <VStack
          spacing={0}
          width={'100%'}
        >
        {
          menu.map( (menuItem: MenuItemType, index: number) => {
            return (
              <VStack
                py={4}
                width={'100%'}
                borderTop={'1px solid'}
                key={`menuItem_${index}`}
                alignItems={'flex-start'}
                borderTopColor={'divider'}
              >
                {
                  !menuItem.children?.length ? (
                    <MenuNavItem
                      {...menuItem}
                    />
                  ) : (
                    <VStack
                      py={6}
                      spacing={6}
                      alignItems={'flex-start'}
                    >
                      <Translation translation={menuItem.label} textStyle={'cta'} color={'ctaDisabled'} />
                      <VStack
                        pl={4}
                        spacing={6}
                        alignItems={'flex-start'}
                      >
                      {
                        menuItem.children.map( (menuChildItem: MenuItemType, index: number) => (
                          <MenuNavItem
                            key={`menuChildItem_${index}`}
                            {...menuChildItem}
                          />
                        ))
                      }
                      </VStack>
                    </VStack>
                  )
                }
              </VStack>
            )
          })
        }
        </VStack>
      </VStack>
    </Container>
  )
}