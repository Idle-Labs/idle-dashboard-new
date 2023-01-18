import React from 'react'
import { useTranslate } from 'react-polyglot'
import { useTab, Button, HStack, Tooltip, Image, useMultiStyleConfig } from '@chakra-ui/react'

export const IconTab = React.forwardRef<HTMLDivElement, any>((props, ref) => {

  const translate = useTranslate()
  
  // 1. Reuse the `useTab` hook
  const tabProps = useTab({ ...props, ref })
  // const isSelected = !!tabProps['aria-selected']

  // 2. Hook into the Tabs `size`, `variant`, props
  const styles = useMultiStyleConfig('Tabs', {...tabProps, variant: 'unstyled'})

  return (
    <Button background={'transparent'} borderRadius={0} __css={styles.tab} {...tabProps}>
      <HStack
        spacing={2}
        width={'full'}
      >
        {tabProps.children}
        {
          props.icon && (
            <Tooltip
              hasArrow
              placement={'top'}
              label={props.icon.tooltip ? translate(props.icon.tooltip) : ''}
            >
              <Image src={props.icon.src} {...props.icon.props} />
            </Tooltip>
          )
        }
      </HStack>
    </Button>
  )
})