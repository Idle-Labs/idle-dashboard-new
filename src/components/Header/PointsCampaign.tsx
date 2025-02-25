import { useCallback } from "react";
import { ModalProps } from "constants/";
import { Flex, HStack, keyframes, List, ListIcon, ListItem, OrderedList, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VStack } from "@chakra-ui/react";
import { useModalProvider } from "contexts/ModalProvider";
import { AssetProvider } from "components/AssetProvider/AssetProvider";
import { MdAddCircle, MdCheckCircle } from "react-icons/md";
import { BsRocketTakeoffFill } from "react-icons/bs";

export function PointsCampaignBadge(){
  const { openModal } = useModalProvider()

  const onClick = useCallback(() => {
    const modalProps = {
      cta: 'defi.modals.pointsCampaign.cta',
      subtitle: 'defi.modals.pointsCampaign.title',
      body: (
        <VStack
          spacing={3}
          width={'full'}
          alignItems={'flex-start'}
        >
          <Text>
            The rules are simple:
          </Text>
          <List spacing={1}>
            <ListItem>
              <ListIcon as={MdCheckCircle} color='brightGreen' />Receive 30 EP per day for every $1 deposited in any Credit Vault
            </ListItem>
            <ListItem>
              <ListIcon as={MdAddCircle} color='violet' />Earn an additional 60 EP per $1 for every day your deposit stays in the queue
            </ListItem>
            <ListItem>
              <ListIcon as={BsRocketTakeoffFill} color='orange' />Get up to 3x multiplier by locking your deposits for 6 months
            </ListItem>
          </List>
          <Text>
            Here's some scenarios for a $1000 worth position:
          </Text>
          <TableContainer
            width={'full'}
          >
            <Table variant={'striped'}>
              <Thead>
                <Tr>
                  <Th>EP / day</Th>
                  <Th>Locking period</Th>
                  <Th>Multiplier</Th>
                  <Th>Queue points</Th>
                  <Th>Total points</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>30,000</Td>
                  <Td>1 Month</Td>
                  <Td>1x</Td>
                  <Td>0</Td>
                  <Td>900,000 EP</Td>
                </Tr>
                <Tr>
                  <Td>30,000</Td>
                  <Td>3 months + (5 queue days)</Td>
                  <Td>1.5x</Td>
                  <Td>300,000</Td>
                  <Td>4,350,000 EP</Td>
                </Tr>
                <Tr>
                  <Td>30,000</Td>
                  <Td>6 months + (10 queue days)</Td>
                  <Td>3x</Td>
                  <Td>600,000</Td>
                  <Td>16,800,000 EP</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </VStack>
      ),
    }
    return openModal(modalProps as ModalProps, '3xl')
  }, [openModal])

  const frames = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  `

  const animation = `${frames} 10s linear infinite`

  return (
    <Flex
      py={1}
      px={2}
      width={'auto'}
      borderRadius={16}
      onClick={onClick}
      border={'1px solid'}
      animation={animation}
      borderColor={'card.bg'}
      layerStyle={'bgRainbow'}
      justifyContent={'center'}
    >
      <AssetProvider assetId={"0x0000000000000000000000000000000000000001"}>
        <HStack spacing={0} width={"100%"} alignItems={"center"}>
          <AssetProvider.Icon size={"xs"} mr={2} />
          <Text textStyle={'cta'} color={'white'} fontSize={'sm'}>Earn EP</Text>
        </HStack>
      </AssetProvider>
    </Flex>
  )
}