import React from 'react'
import { Box, BoxProps } from '@chakra-ui/react'

type TooltipContentProps = {
  children: React.ReactNode;
} & BoxProps

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(({ children, ...rest }, ref) => (
  <Box
    ref={ref}
    {...rest}
  >
    {children}
  </Box>
));