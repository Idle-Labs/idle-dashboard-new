import { Card } from 'components/Card/Card'
// import { strategies } from 'constants/strategies'
import { HStack, Text, Progress, Box } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import React, { useMemo, useState, useEffect, useCallback } from 'react'

type StrategyAssetsCarouselArgs = {
  strategy: string
}

export const StrategyAssetsCarousel: React.FC<StrategyAssetsCarouselArgs> = ({ strategy }) => {
  const [ assetIndex, setAssetIndex ] = useState<number>(0)
  const [ progressValue, setProgressValue ] = useState<number>(0)
  const { isPortfolioLoaded,  selectors: { selectVaultsAssetsByType } } = usePortfolioProvider()

  const assets = useMemo(() => {
    if (!selectVaultsAssetsByType) return null
    return selectVaultsAssetsByType(strategy)
  }, [selectVaultsAssetsByType, strategy])

  const getNextAssetIndex = useCallback(() => {
    return assetIndex === assets.length-1 ? 0 : assetIndex+1
  }, [assets, assetIndex])

  useEffect(() => {
    if (!assets || !isPortfolioLoaded) return
    setTimeout(() => {
      setProgressValue(0)
      setAssetIndex(getNextAssetIndex())
    }, 4000)
  }, [assets, isPortfolioLoaded, getNextAssetIndex])

  useEffect(() => {
    if (!assets || !isPortfolioLoaded) return
    setTimeout(() => {
      setProgressValue(100)
    }, 10)
  }, [assets, isPortfolioLoaded, assetIndex])

  return (
    <Card.Light
      py={4}
      px={6}
      overflow={'hidden'}
      position={'relative'}
      width={['100%', '400px']}
    >
      <AssetProvider assetId={assets && assets[assetIndex]?.id}>
        <HStack
          spacing={10}
          width={'100%'}
          alignItems={'center'}
          justifyContent={'space-between'}
        >
          <AssetProvider.Icon width={10} height={10} />
          <HStack>
            <Translation component={Text} translation={'defi.tvl'} textStyle={'captionSmall'} />
            <AssetProvider.PoolUsd textStyle={['ctaStatic', 'h3']} />
          </HStack>
          <HStack>
            <Translation component={Text} translation={'defi.apy'} textStyle={'captionSmall'} />
            <AssetProvider.Apy textStyle={['ctaStatic', 'h3']} />
          </HStack>
        </HStack>
      </AssetProvider>
      <Box
        left={0}
        bottom={0}
        width={'100%'}
        position={'absolute'}
      >
        <Progress
          value={progressValue}
          size={'xs'}
          colorScheme={strategy}
          sx={{
            "& > div:first-child": {
              transitionDuration: !progressValue ? '0s' : '4s',
              transitionProperty: "width",
            },
          }}
        />
      </Box>
    </Card.Light>
  )
}