import { Card } from 'components/Card/Card'
import { BNify, isBigNumberNaN } from 'helpers/'
import { Amount } from 'components/Amount/Amount'
import { MdOutlineLocalGasStation } from 'react-icons/md'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { useTheme, Box, Flex, VStack, HStack, Text, Button, Tabs, TabList, Tab, Input } from '@chakra-ui/react'

const Deposit: React.FC = () => {

  const theme = useTheme()
  const [ amount, setAmount ] = useState('0')
  const [ error, setError ] = useState<string>('')
  const [ amountUsd, setAmountUsd ] = useState<number>(0)

  const { asset, underlyingAsset, translate } = useAssetProvider()
  const { selectors: { selectAssetPriceUsd } } = usePortfolioProvider()

  // console.log('DepositWithdraw', asset, underlyingAsset)

  const handleAmountChange = ({target: { value }}: { target: {value: string} }) => setAmount(value)

  useEffect(() => {
    // if (!underlyingAsset?.priceUsd) return
    if (!selectAssetPriceUsd || !underlyingAsset) return
    const assetPriceUsd = selectAssetPriceUsd(underlyingAsset.id)
    const amountUsd = parseFloat(BNify(amount).times(assetPriceUsd).toString()) || 0
    setAmountUsd(amountUsd)
  }, [underlyingAsset, amount, selectAssetPriceUsd])

  const setMaxBalance = useCallback(() => {
    if (!underlyingAsset?.balance) return
    setAmount(underlyingAsset.balance.toString())
  }, [underlyingAsset])

  return (
    <AssetProvider
      flex={1}
      direction={'column'}
      assetId={underlyingAsset?.id}
    >
      <VStack
        flex={1}
        height={'100%'}
        id={'deposit-container'}
        alignItems={'space-between'}
        justifyContent={'flex-start'}
      >
        <HStack
          mt={10}
          flex={1}
          spacing={4}
          alignItems={'flex-start'}
        >
          <HStack
            pt={8}
            alignItems={'center'}
          >
            <AssetProvider.Icon size={'sm'} />
            <AssetProvider.Name textStyle={['heading','h3']} />
          </HStack>
          <VStack
            spacing={1}
            width={'100%'}
            alignItems={'flex-start'}
          >
            <Card
              px={4}
              py={2}
              layerStyle={'cardLight'}
            >
              <VStack
                spacing={2}
                alignItems={'flex-start'}
              >
                <HStack
                  width={'100%'}
                  justifyContent={'space-between'}
                >
                  <Input flex={1} type={'number'} placeholder={'0'} variant={'balance'} value={amount} onChange={handleAmountChange} />
                  <Amount.Usd abbreviateThresold={10000} textStyle={'captionSmall'} color={'brightGreen'} prefix={'≈ $'} value={amountUsd} />
                </HStack>
                <HStack
                  width={'100%'}
                  justifyContent={'space-between'}
                >
                  <HStack
                    spacing={1}
                  >
                    <Translation component={Text} translation={'common.balance'} textStyle={'captionSmaller'} />
                    <AssetProvider.Balance abbreviate={false} decimals={4} textStyle={'captionSmaller'} color={'primary'} />
                  </HStack>
                  <Button variant={'selector'} onClick={setMaxBalance}>MAX</Button>
                </HStack>
              </VStack>
            </Card>
            {
              error && <Text textStyle={'captionSmaller'} color={'orange'}>You can't deposit more that your balance</Text>
            }
          </VStack>
        </HStack>
        <VStack
          spacing={4}
          id={'footer'}
          alignItems={'flex-start'}
        >
          <Card.Outline px={4} py={2}>
            <HStack
              spacing={1}
            >
              <Translation translation={'assets.assetDetails.generalData.performanceFee'} textStyle={'captionSmaller'} />
              <AssetProvider
                assetId={asset?.id}
              >
                <AssetProvider.PerformanceFee textStyle={['captionSmaller', 'semiBold']} color={'primary'} />
              </AssetProvider>
            </HStack>
          </Card.Outline>
          <HStack
            spacing={1}
          >
            <MdOutlineLocalGasStation color={theme.colors.ctaDisabled} size={24} />
            <Translation translation={'trade.estimatedGasFee'} suffix={':'} textStyle={'captionSmaller'} />
          </HStack>
          <Button
            variant={'ctaFull'}
          >
            Deposit
          </Button>
        </VStack>
      </VStack>
    </AssetProvider>
  )
}

const actions = [
  {
    label: 'common.deposit',
    component: Deposit
  },
  {
    label: 'common.withdraw',
    component: null
  }
]

export const OperativeComponent: React.FC = () => {
  const { asset, underlyingAsset } = useAssetProvider()

  const [ actionIndex, setActionIndex ] = useState<number>(0)

  const handleActionChange = (index: number) => {
    setActionIndex(index)
  }

  const ActionComponent = useMemo((): React.FC | null => actions[actionIndex].component, [actionIndex])

  return (
    <VStack
      p={4}
      width={'100%'}
      bg={'card.bg'}
      minHeight={'590px'}
      alignItems={'flex-start'}
      id={'operative-component'}
    >
      <HStack
        alignItems={'center'}
        justifyContent={'space-between'}
        id={'operative-component-header'}
      >
        <Tabs
          defaultIndex={0}
          variant={'button'}
          onChange={handleActionChange}
        >
          <TabList>
            {
              actions.map( (action, index) => (
                <Translation key={`action_${index}`} mr={2} component={Tab} translation={action.label} />
              ))
            }
          </TabList>
        </Tabs>
      </HStack>
      {ActionComponent && <ActionComponent />}
    </VStack>
  )
}