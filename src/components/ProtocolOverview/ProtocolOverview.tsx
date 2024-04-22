import BigNumber from 'bignumber.js'
import { useMemo, useState } from 'react'
import { BNify, bnOrZero } from 'helpers/'
import { Amount } from 'components/Amount/Amount'
import { strategies } from 'constants/strategies'
import type { Asset, Balances } from 'constants/types'
import { Translation } from 'components/Translation/Translation'
import { DonutChartData } from 'components/DonutChart/DonutChart'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { SimpleGrid, VStack, HStack, SkeletonText, Button, TextProps } from '@chakra-ui/react'

type ProtocolOverviewProps = {
  showHeader?: boolean
  showLoading?: boolean
  textProps?: TextProps
}

export const ProtocolOverview: React.FC<ProtocolOverviewProps> = ({
  textProps,
  showHeader = true,
  showLoading = true,
}) => {

  const { isPortfolioLoaded, assetsData } = usePortfolioProvider()
  const visibleAssets = useMemo(() => Object.values(assetsData).filter( (asset: Asset) => !!strategies[asset.type as string]?.visible ), [assetsData])
  const totalTvlUsd = useMemo(() => Object.values(visibleAssets).reduce( (totalTvlUsd: BigNumber, asset: Asset) => totalTvlUsd.plus(bnOrZero(asset?.tvlUsd)), BNify(0)) , [visibleAssets])
  const avgApy = useMemo(() => Object.values(visibleAssets).reduce( (avgApy: BigNumber, asset: Asset) => avgApy.plus(bnOrZero(asset?.tvlUsd).times(BigNumber.minimum(9999, bnOrZero(asset?.apy)))), BNify(0) ) , [visibleAssets]).div(totalTvlUsd)
  const vaultsNum = useMemo(() => visibleAssets.length, [visibleAssets])

  if (!showLoading && !isPortfolioLoaded) return null

  return (
    <VStack
      spacing={4}
      width={'full'}
      alignItems={'flex-start'}
    >
      {
        showHeader && (
          <HStack
            height={10}
            spacing={2}
          >
            <Translation translation={'defi.protocol'} textStyle={'heading'} color={'primary'} fontSize={'lg'} />
          </HStack>
        )
      }
      <SimpleGrid
        columns={3}
        width={'full'}
        spacing={[2, 10]}
      >
        <VStack
          spacing={2}
          alignItems={'flex-start'}
        >
          <Translation translation={'defi.tvl'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
          <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'100%'}>
            <Amount.Usd value={totalTvlUsd} textStyle={'ctaStatic'} fontSize={'xl'} lineHeight={'initial'} {...textProps} />
          </SkeletonText>
        </VStack>
        <VStack
          spacing={2}
          alignItems={'flex-start'}
        >
          <Translation translation={'defi.avgApy'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
          <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'100%'}>
            <Amount.Percentage value={avgApy} textStyle={'ctaStatic'} fontSize={'xl'} lineHeight={'initial'} {...textProps} />
          </SkeletonText>
        </VStack>
        <VStack
          spacing={2}
          alignItems={'flex-start'}
        >
          <Translation translation={'defi.vaults'} textStyle={'captionSmall'} fontSize={['xs', 'sm']} />
          <SkeletonText noOfLines={2} isLoaded={!!isPortfolioLoaded} minW={'100%'}>
            <Amount.Int value={vaultsNum} textStyle={'ctaStatic'} fontSize={'xl'} lineHeight={'initial'} {...textProps} />
          </SkeletonText>
        </VStack>
      </SimpleGrid>
    </VStack>
  )
}