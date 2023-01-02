import React, { useMemo } from 'react'
import { AssetId } from 'constants/types'
import { useNavigate } from 'react-router-dom'
import { CardProps, Card } from 'components/Card/Card'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { TextProps, AvatarProps, BoxProps, ThemingProps, VStack, SimpleGrid, HStack, Box, Text } from '@chakra-ui/react'

export type VaultCardProps = {
  assetId: AssetId
}

type VaultCardField = {
  label: string
  field: string
  props?: TextProps & AvatarProps & BoxProps & ThemingProps
}

export type VaultCardInlineProps = {
  fields: VaultCardField[]
  onClick?: Function
} & VaultCardProps & CardProps

const Inline = ({ assetId, fields, onClick, ...cardProps }: VaultCardInlineProps) => {
  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <Card
        py={2}
        px={[4, 6]}
        layerStyle={['card', 'cardHover']}
        onClick={onClick}
        {...cardProps}
      >
        <HStack
          width={'100%'}
          justifyContent={'space-between'}
        >
          <HStack
            spacing={3}
            width={'100%'}
            alignItems={'center'}
          >
            <AssetProvider.Icon size={'xs'} />
            {/*<AssetProvider.Name textStyle={'tableCell'} />*/}
            {
              fields.map( (fieldInfo: VaultCardField, index: number) => (
                <React.Fragment key={`field_${index}`}>
                  <Box
                    width={1}
                    height={1}
                    bg={'divider'}
                    borderRadius={'50%'}
                  />
                  <HStack
                    spacing={2}
                  >
                    <Translation translation={fieldInfo.label} component={Text} textStyle={'captionSmall'} />
                    <AssetProvider.GeneralData field={fieldInfo.field} textStyle={'tableCell'} {...fieldInfo.props} />
                  </HStack>
                </React.Fragment>
              ))
            }
          </HStack>
        </HStack>
      </Card>
    </AssetProvider>
  )
}

export const VaultCard = ({ assetId }: VaultCardProps) => {
  const navigate = useNavigate()
  const { location } = useBrowserRouter()
  const { selectors: { selectAssetById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    if (!selectAssetById) return
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const depositedOrRewards = useMemo(() => {
    return asset?.vaultPosition?.usd.deposited ? (
      <VStack
        spacing={1}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.deposited'} textStyle={'captionSmall'} />
        <AssetProvider.DepositedUsd textStyle={'tableCell'} />
      </VStack>
    ) : asset?.type === 'BY' ? (
      <VStack
        spacing={1}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.protocols'} textStyle={'captionSmall'} />
        <AssetProvider.Protocols iconMargin={-1} size={'xs'} />
      </VStack>
    ) : (
      <VStack
        spacing={1}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.rewards'} textStyle={'captionSmall'} />
        <AssetProvider.Rewards iconMargin={-1} size={'xs'} />
      </VStack>
    )
  }, [asset])

  return (
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <Card
        p={4}
        onClick={() => navigate(`${location?.pathname}/${assetId}`)}
      >
        <VStack
          spacing={3}
          alignItems={'flex-start'}
        >
          <AssetLabel assetId={assetId} size={'sm'} />
          <SimpleGrid
            pt={3}
            pl={4}
            columns={3}
            width={'100%'}
            borderTop={'1px solid'}
            borderTopColor={'divider'}
          >
            <VStack
              spacing={1}
              alignItems={'flex-start'}
            >
              <Translation translation={'defi.pool'} textStyle={'captionSmall'} />
              <AssetProvider.PoolUsd textStyle={'tableCell'} />
            </VStack>

            <VStack
              spacing={1}
              alignItems={'flex-start'}
            >
              <Translation translation={'defi.apy'} textStyle={'captionSmall'} />
              <AssetProvider.Apy textStyle={'tableCell'} />
            </VStack>
            {depositedOrRewards}
          </SimpleGrid>
        </VStack>
      </Card>
    </AssetProvider>
  )
}

VaultCard.Inline = Inline