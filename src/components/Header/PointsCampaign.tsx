import { useCallback } from "react";
import { ModalProps, tokensFolder } from "constants/";
import { Flex, Heading, HStack, Image, keyframes, Link, List, ListItem, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr, VStack } from "@chakra-ui/react";
import { useModalProvider } from "contexts/ModalProvider";
import { AssetProvider } from "components/AssetProvider/AssetProvider";

export function PointsCampaignBadge(){
  const { openModal } = useModalProvider()

  const onClick = useCallback(() => {
    const modalProps = {
      cta: 'defi.modals.pointsCampaign.cta',
      subtitle: (
        <HStack
          spacing={2}
          width={'full'}
        >
          <Heading as={'h3'} fontSize={'lg'}>Want to join the Pareto's Efficiency Campaign?</Heading>
          <Image src={`${tokensFolder}EP.svg`} w={6} h={6} />
        </HStack>
      ),
      body: (
        <VStack
          spacing={3}
          width={'full'}
          alignItems={'flex-start'}
        >
          <Text>
            Season 1 of the Efficiency campaign is live! Read more in the <Link isExternal href={'https://paragraph.xyz/@pareto/pareto-efficiency-campaign'} color={'link'} textStyle={'tableCell'}>official blogpost</Link>
          </Text>
          <Text>
            To earn Efficiency Points the rules are simple:
          </Text>
          <List spacing={1}>
            <ListItem>
              <b>1. Deposit:</b> Receive 30 EP per day for every $1 deposited in any Vault
            </ListItem>
            <ListItem>
              <b>2. Queue:</b> Earn an additional 60 EP per $1 for every day your deposit stays in the deposit queue
            </ListItem>
            <ListItem>
              <b>3. Commit:</b> get up to 3x EP by committing your deposit up to 6 months
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
      justifyContent={'center'}
      backgroundSize={"400% 400%"}
      backgroundImage={"linear-gradient(-45deg,#0519d3,#ff70fa,#0519d3,#ff70fa)"}
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