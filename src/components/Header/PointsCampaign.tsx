import { useCallback } from "react";
import { ModalProps } from "constants/";
import { Flex, HStack, Text } from "@chakra-ui/react";
import { useModalProvider } from "contexts/ModalProvider";
import { Translation } from "components/Translation/Translation";
import { AssetProvider } from "components/AssetProvider/AssetProvider";

export function PointsCampaignBadge(){
  const { openModal } = useModalProvider()

  const onClick = useCallback(() => {
    const modalProps = {
      cta: 'defi.modals.pointsCampaign.cta',
      subtitle: 'defi.modals.pointsCampaign.title',
      body: (
        <Translation translation={'defi.modals.pointsCampaign.body'} isHtml />
      ),
    }
    return openModal(modalProps as ModalProps, '2xl')
  }, [openModal])

  return (
    <Flex
      py={1}
      px={2}
      width={'auto'}
      borderRadius={8}
      onClick={onClick}
      border={'1px solid'}
      borderColor={'card.bg'}
      justifyContent={'center'}
      backgroundColor={'card.bgLight'}
    >
      <AssetProvider assetId={"0x0000000000000000000000000000000000000001"}>
        <HStack spacing={0} width={"100%"} alignItems={"center"}>
          <AssetProvider.Icon size={"xs"} mr={2} />
          <Text textStyle={'cta'} fontSize={'xs'}>Earn Points</Text>
        </HStack>
      </AssetProvider>
    </Flex>
  )
}