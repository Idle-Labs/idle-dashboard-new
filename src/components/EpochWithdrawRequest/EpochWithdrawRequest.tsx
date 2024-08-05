import { HStack, Stack, VStack } from "@chakra-ui/react"
import { Amount } from "components/Amount/Amount"
import { AssetLabel } from "components/AssetLabel/AssetLabel"
import { AssetProvider, useAssetProvider } from "components/AssetProvider/AssetProvider"
import { Card } from "components/Card/Card"
import { TokenAmount } from "components/TokenAmount/TokenAmount"
import { TransactionButton } from "components/TransactionButton/TransactionButton"
import { Translation } from "components/Translation/Translation"
import { useThemeProvider } from "contexts/ThemeProvider"
import { useWalletProvider } from "contexts/WalletProvider"

export const EpochWithdrawRequest: React.FC = () => {
  const { isMobile } = useThemeProvider()
  const { account } = useWalletProvider()
  const { asset, vault } = useAssetProvider()

  if (!account?.address || !asset || !vault || !("getClaimContractSendMethod" in vault)){
    return null
  }

  const contractSendMethod = vault.getClaimContractSendMethod(account.address)

  if (!contractSendMethod){
    return null
  }

  return isMobile ? (
    <Card
      p={6}
    >
      <VStack
        spacing={4}
        width={'100%'}
        alignItems={'flex-start'}
      >
        <HStack
          width={'full'}
          justifyContent={'space-between'}
        >
          <AssetLabel assetId={asset?.underlyingId} />
        </HStack>
        <HStack
          width={'full'}
          justifyContent={'space-between'}
        >
          <VStack
            spacing={1}
            alignItems={'flex-start'}
          >
            <Translation component={Text} translation={'defi.realizedApy'} textStyle={'captionSmall'} />
            <HStack
              spacing={1}
              justifyContent={'flex-start'}
            >
              <Amount.Percentage value={0} textStyle={'heading'} fontSize={'h3'} />
            </HStack>
          </VStack>
          <VStack
            spacing={1}
            alignItems={'flex-end'}
          >
            <Translation component={Text} translation={'defi.claimable'} textStyle={'captionSmall'} />
            <TokenAmount assetId={asset?.id} showIcon={false} amount={0} decimals={2} textStyle={'heading'} fontSize={'h3'} />
          </VStack>
        </HStack>
        <TransactionButton text={'defi.claim'} vaultId={asset.id as string} assetId={asset.id as string} contractSendMethod={contractSendMethod} actionType={'claim'} amount={'0'} width={'100%'} disabled={false} />
      </VStack>
    </Card>
  ) : (
    <Card
      p={6}
      px={8}
      width={'100%'}
    >
      <Stack
        width={'100%'}
        spacing={[0, 6]}
        direction={['column', 'row']}
        flexWrap={['wrap', 'nowrap']}
        justifyContent={['flex-start', 'space-between']}
      >
        <AssetLabel assetId={asset?.underlyingId} />

        <VStack
          pb={[2, 0]}
          spacing={[1, 2]}
          width={['50%','auto']}
          alignItems={'flex-start'}
          justifyContent={'flex-start'}
        >
          <Translation component={Text} translation={'defi.realizedApy'} textStyle={'captionSmall'} />
          <Amount.Percentage value={0} fontSize={'h3'} textStyle={'heading'} />
        </VStack>

        <VStack
          pb={[2, 0]}
          spacing={[1, 2]}
          width={['50%','auto']}
          alignItems={'flex-start'}
          justifyContent={'flex-start'}
        >
          <Translation component={Text} translation={'defi.claimable'} textStyle={'captionSmall'} />
          <TokenAmount assetId={asset?.underlyingId} showIcon={false} amount={0} decimals={2} textStyle={'heading'} fontSize={'h3'} />
        </VStack>

        <TransactionButton text={'defi.claim'} vaultId={asset.id as string} assetId={asset.id as string} contractSendMethod={contractSendMethod} actionType={'claim'} amount={'0'} width={['100%', '150px']} disabled={false} />
      </Stack>
    </Card>
  )
}