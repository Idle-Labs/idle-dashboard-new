import { Card } from 'components/Card/Card'
import { Amount } from 'components/Amount/Amount'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { ChakraCarousel } from 'components/ChakraCarousel/ChakraCarousel'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { MdOutlineLocalGasStation, MdKeyboardArrowLeft } from 'react-icons/md'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { BNify, isBigNumberNaN, getAllowance, getVaultAllowanceOwner } from 'helpers/'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { BoxProps, useTheme, Center, Box, Flex, VStack, HStack, Text, Button, Tabs, TabList, Tab, Input } from '@chakra-ui/react'

type ActionComponentProps = {
  setActiveItem: Function
} & BoxProps

const Approve: React.FC<ActionComponentProps> = ({ children }) => {
  const { underlyingAsset, translate } = useAssetProvider()
  return (
    <Center
      p={14}
      flex={1}
    >
      <VStack
        spacing={6}
      >
        <Translation component={Text} prefix={`${translate("modals.approve.routerName")} `} translation={"modals.approve.body"} params={{asset: underlyingAsset?.name}} textStyle={['heading', 'h3']} textAlign={'center'} />
        <Translation component={Button} translation={"common.approve"} onClick={() => {}} variant={'ctaFull'} />
      </VStack>
    </Center>
  )
}

const Deposit: React.FC<ActionComponentProps> = ({ setActiveItem }) => {

  const theme = useTheme()
  const [ amount, setAmount ] = useState('0')
  const [ error, setError ] = useState<string>('')
  const [ amountUsd, setAmountUsd ] = useState<number>(0)

  const { account } = useWalletProvider()
  const { transaction, sendTransaction } = useTransactionManager()
  const { selectors: { selectAssetPriceUsd } } = usePortfolioProvider()
  const { asset, vault, underlyingAsset, underlyingAssetVault, translate } = useAssetProvider()

  // console.log('DepositWithdraw', asset, underlyingAsset)

  const handleAmountChange = ({target: { value }}: { target: {value: string} }) => setAmount(value)

  const deposit = useCallback(() => {
    if (!account) return
    if (!underlyingAssetVault || !("contract" in underlyingAssetVault)) return
    if (!vault || !("getDepositContractSendMethod" in vault) || !("getDepositParams" in vault)) return

    ;(async() => {
      const depositParams = vault.getDepositParams(amount)
      const contractSendMethod = vault.getDepositContractSendMethod(depositParams)
      
      console.log('depositParams', depositParams, contractSendMethod)
      // console.log('underlyingAssetVault', underlyingAssetVault)

      const vaultOwner = getVaultAllowanceOwner(vault)
      const allowance = await getAllowance(underlyingAssetVault.contract, account.address, vaultOwner)

      console.log('allowance', vaultOwner, account.address, allowance)

      setActiveItem(1)

      // sendTransaction(contractSendMethod)
    })()

  }, [account, amount, vault, underlyingAssetVault, setActiveItem])

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
      assetId={asset?.underlyingId}
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
          <Translation component={Button} translation={"common.deposit"} onClick={deposit} variant={'ctaFull'} />
        </VStack>
      </VStack>
    </AssetProvider>
  )
}

const actions = [
  {
    label: 'common.deposit',
    component: Deposit,
    steps: [
      {
        label:'modals.approve.header',
        component: Approve
      }
    ]
  },
  {
    label: 'common.withdraw',
    component: null,
    steps: []
  }
]

export const OperativeComponent: React.FC = () => {
  const { asset, underlyingAsset } = useAssetProvider()
  const [ activeItem, setActiveItem ] = useState<number>(0)
  const [ actionIndex, setActionIndex ] = useState<number>(0)

  const handleActionChange = (index: number) => {
    setActionIndex(index)
  }

  const ActionComponent = useMemo((): React.FC<ActionComponentProps> | null => actions[actionIndex].component, [actionIndex])

  return (
    <VStack
      p={4}
      width={'100%'}
      bg={'card.bg'}
      minHeight={'590px'}
      alignItems={'flex-start'}
      id={'operative-component'}
    >
      <ChakraCarousel
        gap={0}
        activeItem={activeItem}
      >
        <VStack
          flex={1}
          alignItems={'flex-start'}
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
          {ActionComponent && <ActionComponent setActiveItem={setActiveItem} />}
        </VStack>
        {
          actions[actionIndex].steps.map( (step, index) => {
            const StepComponent = step.component
            return (
              <VStack
                flex={1}
                key={`step_${index}`}
                alignItems={'flex-start'}
              >
                <HStack
                  width={'100%'}
                  position={'relative'}
                  alignItems={'center'}
                  justifyContent={'flex-start'}
                >
                  <Flex
                    zIndex={1}
                    position={'relative'}
                  >
                    <MdKeyboardArrowLeft
                      size={24}
                      style={{cursor:'pointer'}}
                      onClick={() => setActiveItem( prevActiveItem => prevActiveItem-1 )}
                    />
                  </Flex>
                  <Flex
                    zIndex={0}
                    width={'100%'}
                    position={'absolute'}
                    justifyContent={'center'}
                  >
                    <Translation component={Text} translation={step.label} params={{asset: underlyingAsset?.name}} textStyle={'ctaStatic'} aria-selected={true} />
                  </Flex>
                </HStack>
                <StepComponent setActiveItem={setActiveItem} />
              </VStack>
            )
          })
        }
      </ChakraCarousel>
    </VStack>
  )
}