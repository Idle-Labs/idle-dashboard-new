import { Asset } from "constants/"
import { Box, Center, Flex, Heading, Image, SkeletonText, Stack, VStack } from "@chakra-ui/react"
import { Translation } from "components/Translation/Translation"
import { VaultCard } from "components/VaultCard/VaultCard"
import { usePortfolioProvider } from "contexts/PortfolioProvider"
import { useCallback, useMemo } from "react"
import { useThemeProvider } from "contexts/ThemeProvider"
import { abbreviateNumber, bnOrZero, isEmpty } from "helpers"
import { useNavigate } from "react-router"
import { Card } from "components/Card/Card"

export const CreditVaults: React.FC = () => {
  const navigate = useNavigate()
  const { theme } = useThemeProvider()
  const {
    protocolData,
    isVaultsLoaded,
    isPortfolioLoaded,
    selectors: {
      selectVaultsAssetsByType,
    }
  } = usePortfolioProvider()

  const creditVaults = useMemo(() => {
    return selectVaultsAssetsByType('CR')
  }, [selectVaultsAssetsByType])

  const heading = useMemo(() => {
    return (
      <VStack
        mb={20}
        width={'full'}
        spacing={8}
      >
        {/*<AnnouncementBanner text={'feeDiscount.announcement'} image={'images/vaults/discount.png'} />*/}
        <Box
          left={0}
          zIndex={1}
          width={'full'}
          height={['20em', '11.5em']}
          position={'absolute'}
          background={`radial-gradient(circle, ${theme.colors.card.bg}AA 40%, ${theme.colors.card.bg}50 100%)`}
          backgroundPosition={'top left'}
          backgroundSize={'300%'}
        />
        <Stack
          zIndex={2}
          width={'full'}
          spacing={[8, 0]}
          position={'relative'}
          direction={['column', 'row']}
          alignItems={['center', 'center']}
          justifyContent={'space-between'}
        >
          <VStack
            pr={[0, 0]}
            spacing={4}
            width={'full'}
            direction={'column'}
            alignItems={['center', 'flex-start']}
          >
            <Translation isHtml={true} translation={'strategies.credit.explore'} component={Heading} fontFamily={'body'} as={'h2'} size={'3xl'} fontWeight={'bold'} lineHeight={'normal'} />
            <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded}>
              <Translation translation={'stats.protocolOverviewCredit'} fontSize={['md', 'h4']} isHtml={true} params={{ tvlUsd: abbreviateNumber(protocolData.totalTvlUsd, 2), avgApy: bnOrZero(protocolData.totalAvgApy).toFixed(2), chains: `${protocolData.uniqueChains} ${protocolData.uniqueChains === 1 ? 'chain' : 'chains'}`, vaults: `${protocolData.uniqueVaults} ${protocolData.uniqueVaults === 1 ? 'vault' : 'vaults'}` }} />
            </SkeletonText>
          </VStack>
        </Stack>
      </VStack>
    )
  }, [theme, protocolData, isPortfolioLoaded])

  const onVaultClick = useCallback((asset: Asset) => {
    return navigate(`/credit/${asset.id}`)
  }, [navigate])

  return isEmpty(creditVaults) ? (
    <Center width={'full'} pt={10} mt={10} flex={1}>
      <Card maxW={'52em'}>
        <VStack
          py={10}
          spacing={4}
          width={'full'}
          alignItems={'center'}
          justifyContent={'center'}
        >
          <Image src={'images/vaults/information.png'} width={8} />
          <Translation textAlign={'center'} translation={'defi.empty.vaults.body'} color={'cta'} isHtml />
        </VStack>
      </Card>
    </Center>
  ) : (
    <Flex
      mt={10}
      width={'100%'}
      direction={'column'}
      alignItems={'center'}
    >
      {heading}
      <VStack
        mt={10}
        width={'full'}
        spacing={6}
        alignItems={'flex-start'}
      >
        <VStack
          spacing={4}
          width={['full', '50%']}
          alignItems={'flex-start'}
        >
          <Translation translation={'strategies.credit.title'} component={Heading} as={'h3'} fontSize={'3xl'} />
          <Translation translation={'strategies.credit.description'} />
        </VStack>
        <Stack
          spacing={10}
          width={'full'}
          direction={['column', 'row']}
        >
          {
            creditVaults.map((asset: Asset, index: number) => (<VaultCard.Credit assetId={asset.id as string} key={`index_${index}`} onClick={() => onVaultClick(asset)} />))
          }
        </Stack>
      </VStack>
    </Flex>
  )
}