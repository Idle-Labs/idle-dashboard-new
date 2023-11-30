import { BNify } from 'helpers/'
import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import { STAKING_CHAINID } from 'constants/'
import { Amount } from 'components/Amount/Amount'
import { selectUnderlyingToken } from 'selectors/'
import { MdArrowForwardIos } from "react-icons/md"
// import { useModalProvider } from 'contexts/ModalProvider'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { Stake } from 'components/OperativeComponent/Stake'
import { useWalletProvider } from 'contexts/WalletProvider'
import type { GeneralDataField } from 'constants/strategies'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import type { /*ModalProps, */Transaction } from 'constants/types'
import { Unstake } from 'components/OperativeComponent/Unstake'
import { Approve } from 'components/OperativeComponent/Approve'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { Translation } from 'components/Translation/Translation'
import { PROTOCOL_TOKEN, SECONDS_IN_YEAR } from 'constants/vars'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { FeeDiscountTable } from 'components/FeeDiscountTable/FeeDiscountTable'
import { TransactionButton } from 'components/TransactionButton/TransactionButton'
import { DiscountedFeesTable } from 'components/DiscountedFeesTable/DiscountedFeesTable'
// import { AnnouncementBanner } from 'components/AnnouncementBanner/AnnouncementBanner'
import { InteractiveComponent } from 'components/InteractiveComponent/InteractiveComponent'
import { AssetGeneralDataField, AssetGeneralData } from 'components/AssetGeneralData/AssetGeneralData'
import { SimpleGrid, Box, Stack, VStack, HStack, Heading, Text, Image, Link, LinkProps } from '@chakra-ui/react'

type howItWorksStep = {
  image: string
  translation: string
  link?: string
  props: any
}

export const Staking: React.FC = () => {
  const { account } = useWalletProvider()
  const { isMobile } = useThemeProvider()
  // const { openModal } = useModalProvider()
  const { isVaultsPositionsLoaded, stakingData, selectors: { selectVaultsByType, selectAssetById, selectVaultTransactions } } = usePortfolioProvider()

  const protocolToken = useMemo(() => {
    if (!selectAssetById) return
    const underlyingToken = selectUnderlyingToken(STAKING_CHAINID, PROTOCOL_TOKEN)
    return underlyingToken && selectAssetById(underlyingToken.address)
  }, [selectAssetById])

  const stakedIdleVault = useMemo(() => {
    return selectVaultsByType && selectVaultsByType('STK')?.[0]
  }, [selectVaultsByType])

  const stakedIdleAsset = useMemo(() => {
    return selectAssetById && stakedIdleVault && selectAssetById(stakedIdleVault.id)
  }, [selectAssetById, stakedIdleVault])

  const transactions = useMemo(() => {
    return isVaultsPositionsLoaded && stakedIdleVault && selectVaultTransactions(stakedIdleVault.id)
  }, [isVaultsPositionsLoaded, stakedIdleVault, selectVaultTransactions])

  // console.log('transactions', transactions)
  const startTimestamp = useMemo(() => {
    const result = transactions && transactions.reduce( (acc: {startTimestamp: string | null, totalDeposited: BigNumber}, tx: Transaction) => {
      switch (tx.action){
        case 'stake':
          acc.totalDeposited = acc.totalDeposited.plus(tx.underlyingAmount)
        break;
        case 'unstake':
          acc.totalDeposited = acc.totalDeposited.minus(tx.underlyingAmount)
        break;
        default:
        break;
      }

      if (acc.totalDeposited.lte(0)){
        acc.startTimestamp = null
      } else if (!acc.startTimestamp){
        acc.startTimestamp = tx.timeStamp
      }

      return acc
    }, {
      startTimestamp: null,
      totalDeposited: BNify(0)
    })

    return result.startTimestamp
  }, [transactions])

  const realizedApy = useMemo(() => {
    if (!startTimestamp || !stakingData) return null
    const elapsedTime = Math.round(Date.now()/1000)-startTimestamp
    const realizedApy = BNify(stakingData.position.claimable).div(stakingData.position.deposited).times(SECONDS_IN_YEAR).div(elapsedTime)
    // console.log('realizedApy', stakingData.position.claimable.toString(), stakingData.position.deposited.toString(), elapsedTime, realizedApy.toString())
    return realizedApy.times(100)
  }, [startTimestamp, stakingData])


  const actions = [
    {
      type: 'stake',
      component: Stake,
      label: 'common.stake',
      chainIds: [STAKING_CHAINID],
      steps: [
        {
          type: 'approve',
          component: Approve,
          props: {
            amountUsd: null
          },
          label:'modals.approve.header',
        }
      ]
    },
    {
      type: 'unstake',
      component: Unstake,
      label: 'common.unstake',
      chainIds: [STAKING_CHAINID],
      steps: []
    }
  ]

  const stakingPosition = useMemo(() => {
    if (!account || !stakingData || stakingData.position.deposited.lte(0)) return null

    const fields = [
      {
        field:'stakingDeposited',
        props:{
          fontSize:'h3',
          textStyle:'heading',
        },
        label:'assets.assetDetails.generalData.totalIDLEStaked',
        tooltip:'assets.assetDetails.tooltips.totalIDLEStaked'
      },
      {
        field:'stkIDLEBalance',
        props:{
          fontSize:'h3',
          textStyle:'heading',
        },
        label:'common.balance',
        tooltip:'assets.assetDetails.tooltips.stkIDLEBalance'
      },
      {
        field:'stakingEndDate',
        props:{
          fontSize:'h3',
          textStyle:'heading',
        },
        tooltip:'assets.assetDetails.tooltips.lockEndDate',
        label:'assets.assetDetails.generalData.lockedUntil'
      },
      {
        field:'stakingShare',
        props:{
          fontSize:'h3',
          textStyle:'heading',
        },
        tooltip:'assets.assetDetails.tooltips.stakingShare',
        label:'defi.share'
      },
    ]

    return (
      <VStack
        spacing={6}
        width={'full'}
        alignItems={'flex-start'}
      >
        <Translation translation={'staking.yourstkIDLE'} component={Text} textStyle={'heading'} fontSize={'h3'} />
        <SimpleGrid
          columns={[2, 4]}
          spacing={[6, 20]}
        >
          {
            fields.map( (generalData: GeneralDataField) => (
              <AssetGeneralDataField key={`field_${generalData.field}`} generalData={generalData} />
            ))
          }
        </SimpleGrid>
      </VStack>
    )
  }, [account, stakingData])

  const claimableIDLE = useMemo(() => {
    if (!account || !stakingData || stakingData.position.claimable.lte(0) || !stakedIdleVault) return null

    const contractSendMethod = stakedIdleVault.getClaimRewardsContractSendMethod()

    return isMobile ? (
      <AssetProvider
        wrapFlex={false}
        assetId={protocolToken?.id}
      >
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
              <AssetLabel assetId={protocolToken?.id} />
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
                  <Amount.Percentage value={realizedApy} textStyle={'heading'} fontSize={'h3'} />
                </HStack>
              </VStack>
              <VStack
                spacing={1}
                alignItems={'flex-end'}
              >
                <Translation component={Text} translation={'defi.claimable'} textStyle={'captionSmall'} />
                <TokenAmount assetId={stakingData?.IDLE.asset?.id} showIcon={false} amount={stakingData.position.claimable} decimals={2} textStyle={'heading'} fontSize={'h3'} />
              </VStack>
            </HStack>
            <TransactionButton text={'defi.claim'} vaultId={stakedIdleVault.id} assetId={stakedIdleVault.id} contractSendMethod={contractSendMethod} actionType={'claim'} amount={stakingData.position.claimable.toString()} width={'100%'} chainIds={[STAKING_CHAINID]} disabled={stakingData.position.claimable.lte(0)} />
          </VStack>
        </Card>
      </AssetProvider>
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
          <AssetLabel assetId={protocolToken?.id} />

          <VStack
            pb={[2, 0]}
            spacing={[1, 2]}
            width={['50%','auto']}
            alignItems={'flex-start'}
            justifyContent={'flex-start'}
          >
            <Translation component={Text} translation={'defi.realizedApy'} textStyle={'captionSmall'} />
            <Amount.Percentage value={realizedApy} fontSize={'h3'} textStyle={'heading'} />
          </VStack>

          <VStack
            pb={[2, 0]}
            spacing={[1, 2]}
            width={['50%','auto']}
            alignItems={'flex-start'}
            justifyContent={'flex-start'}
          >
            <Translation component={Text} translation={'defi.claimable'} textStyle={'captionSmall'} />
            <TokenAmount assetId={stakingData?.IDLE.asset?.id} showIcon={false} amount={stakingData.position.claimable} decimals={2} textStyle={'heading'} fontSize={'h3'} />
          </VStack>

          <TransactionButton text={'defi.claim'} vaultId={stakedIdleVault.id} assetId={stakedIdleVault.id} contractSendMethod={contractSendMethod} actionType={'claim'} amount={stakingData.position.claimable.toString()} width={['100%', '150px']} chainIds={[STAKING_CHAINID]} disabled={stakingData.position.claimable.lte(0)} />
        </Stack>
      </Card>
    )
  }, [account, isMobile, stakingData, protocolToken, realizedApy, stakedIdleVault])

  const howItWorks = useMemo(() => {

    const steps: howItWorksStep[] = [
      {
        image: 'images/staking/get-idle.png',
        translation: 'strategies.staking.howItWorks.steps.cta1',
        props: {
          justifyContent: 'flex-end'
        }
      },
      {
        image: 'images/staking/stake.png',
        translation: 'strategies.staking.howItWorks.steps.cta2',
        props: {
          justifyContent: 'center'
        }
      },
      {
        image: 'images/staking/fee-discount.png',
        translation: 'strategies.staking.howItWorks.steps.cta3',
        props: {
          justifyContent: 'flex-start'
        }
      }
    ]

    return (
      <VStack
        spacing={4}
        width={'full'}
        alignItems={'flex-start'}
      >
        <Translation translation={'strategies.staking.howItWorks.title'} textStyle={'ctaStatic'} />
        <Card.Flex
          py={6}
          px={10}
          width={'full'}
          alignItems={'center'}
          justifyContent={'center'}
        >
          <SimpleGrid
            columns={3}
            spacing={6}
            width={'fit-content'}
          >
            {
              steps.map( (step, index) => {
                /*
                const modalProps = {
                  cta: 'common.close',
                  subtitle: step.translation,
                  text: '',
                }
                */
                return (
                  <HStack
                    spacing={4}
                    {...step.props}
                    key={`step_${index}`}
                  >
                    <Image src={step.image} width={14} />
                    {
                      !!step.link ? (
                        <Translation<LinkProps> component={Link} translation={step.translation} textDecoration={'underline'} isExternal href={step.link} />
                      ) : (
                        <Translation translation={step.translation} /*onClick={() => openModal(modalProps as ModalProps, '2xl')}*/ />
                      )
                    }
                    {
                      index<steps.length-1 && (
                        <HStack pl={2}>
                          <MdArrowForwardIos size={16} />
                        </HStack>
                      )
                    }
                  </HStack>
                )
              })
            }
          </SimpleGrid>
        </Card.Flex>
      </VStack>
    )
  }, [])

  return (
    <Box
      width={'100%'}
    >
      <VStack
        spacing={6}
        my={[10, 14]}
        width={'100%'}
        direction={['column', 'row']}
        justifyContent={'flex-start'}
        alignItems={['center','flex-start']}
      >
        <Translation translation={'navBar.stakeIDLE'} component={Heading} as={'h2'} size={'3xl'} />
      </VStack>
      <HStack
        width={'100%'}
        spacing={[0, 10]}
        alignItems={'space-between'}
      >
        <Stack
          flex={1}
          mb={[20, 0]}
          spacing={10}
          width={['100%', 14/20]}
        >
          <VStack
            spacing={10}
            width={'100%'}
            alignItems={'flex-start'}
          >
            <Translation translation={'strategies.staking.description'} isHtml={true} />
            <VStack
              spacing={4}
              width={'full'}
              alignItems={'flex-start'}
            >
              {howItWorks}
              <AssetGeneralData assetId={stakedIdleAsset?.id} />
            </VStack>
            {stakingPosition}
            {claimableIDLE}
            <DiscountedFeesTable p={10} />
            <FeeDiscountTable p={10} />
          </VStack>
        </Stack>
        <InteractiveComponent vaultId={stakedIdleAsset?.id} assetId={stakedIdleVault?.id} actions={actions} />
      </HStack>
    </Box>
  )
}