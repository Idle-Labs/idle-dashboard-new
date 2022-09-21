import * as React from "react"
import {
  ChakraProvider,
  Box,
  Text,
  VStack,
  Code,
  Grid,
  theme,
} from "@chakra-ui/react"
import { Logo } from "./Logo"
import { TestConsumer } from './TestConsumer'
import { Web3Provider } from './contexts/Web3Provider'
import { ColorModeSwitcher } from "./ColorModeSwitcher"
import { WalletProvider } from './contexts/WalletProvider'
import { PortfolioProvider } from './contexts/PortfolioProvider'

export const App = () => (
  <ChakraProvider theme={theme}>
    <WalletProvider>
      <Web3Provider>
        <PortfolioProvider>
          <Box textAlign="center" fontSize="xl">
            <Grid minH="100vh" p={3}>
              <ColorModeSwitcher justifySelf="flex-end" />
              <VStack spacing={8}>
                <Logo h="40vmin" pointerEvents="none" />
                <Text>
                  Edit <Code fontSize="xl">src/App.tsx</Code> and save to reload.
                </Text>
                <TestConsumer />
              </VStack>
            </Grid>
          </Box>
        </PortfolioProvider>
      </Web3Provider>
    </WalletProvider>
  </ChakraProvider>
)
