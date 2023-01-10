import React, { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import { PROTOCOL_TOKEN } from 'constants/vars'
import { Amount } from 'components/Amount/Amount'
import { Stake } from 'components/OperativeComponent/Stake'
import { useWalletProvider } from 'contexts/WalletProvider'
import type { GeneralDataField } from 'constants/strategies'
import { Unstake } from 'components/OperativeComponent/Unstake'
import { Approve } from 'components/OperativeComponent/Approve'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { Box, Stack, VStack, HStack, Heading, Text } from '@chakra-ui/react'
import { TransactionButton } from 'components/TransactionButton/TransactionButton'
import { InteractiveComponent } from 'components/InteractiveComponent/InteractiveComponent'
import { AssetGeneralDataField, AssetGeneralData } from 'components/AssetGeneralData/AssetGeneralData'

export const Staking: React.FC = () => {
  const { account } = useWalletProvider()
  const { stakingData, selectors: { selectVaultsByType, selectAssetById } } = usePortfolioProvider()

  const stakedIdleVault = useMemo(() => {
    return selectVaultsByType && selectVaultsByType('STK')?.[0]
  }, [selectVaultsByType])

  const stakedIdleAsset = useMemo(() => {
    return selectAssetById && stakedIdleVault && selectAssetById(stakedIdleVault.id)
  }, [selectAssetById, stakedIdleVault])

  const actions = [
    {
      type: 'stake',
      component: Stake,
      label: 'common.stake',
      steps: [
        {
          type: 'approve',
          component: Approve,
          label:'modals.approve.header',
        }
      ]
    },
    {
      type: 'unstake',
      label: 'common.unstake',
      component: Unstake,
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
        label:'assets.assetDetails.generalData.totalStaked',
      },
      {
        field:'stakingEndDate',
        props:{
          fontSize:'h3',
          textStyle:'heading',
        },
        tooltip:'assets.assetDetails.tooltips.lockEndDate',
        label:'assets.assetDetails.generalData.lockEndDate'
      },
    ]

    return (
      <HStack
        spacing={20}
        width={'100%'}
      >
        {
          fields.map( (generalData: GeneralDataField) => (
            <AssetGeneralDataField key={`field_${generalData.field}`} generalData={generalData} />
          ))
        }
      </HStack>
    )
  }, [account, stakingData])

  const claimableIDLE = useMemo(() => {
    if (!account || !stakingData || stakingData.position.deposited.lte(0) || !stakedIdleVault) return null

    const contractSendMethod = stakedIdleVault.getClaimRewardsContractSendMethod()

    return (
      <VStack
        spacing={6}
        width={'100%'}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.claimable'} suffix={` ${PROTOCOL_TOKEN}`} component={Text} textStyle={'heading'} fontSize={'h3'} />
        <Card
          p={6}
          px={8}
          width={'100%'}
        >
          <Stack
            width={'100%'}
            spacing={[4, 14]}
            alignItems={'center'}
            direction={['column', 'row']}
            justifyContent={'space-between'}
          >
            <HStack
              width={'100%'}
              spacing={[0, 6]}
              flexWrap={['wrap', 'nowrap']}
              justifyContent={['flex-start', 'space-between']}
            >
              <VStack
                pb={[2, 0]}
                spacing={[1, 2]}
                width={['50%', 'auto']}
                alignItems={'flex-start'}
                justifyContent={'flex-start'}
              >
                <Translation component={Text} translation={'staking.totalSupply'} textStyle={'captionSmall'} />
                <Amount value={stakingData.stkIDLE.totalSupply} suffix={` ${stakedIdleVault.stkIdleConfig.name}`} textStyle={'tableCell'} />
              </VStack>

              <VStack
                pb={[2, 0]}
                spacing={[1, 2]}
                width={['50%', 'auto']}
                alignItems={'flex-start'}
                justifyContent={'flex-start'}
              >
                <Translation component={Text} translation={'defi.balance'} textStyle={'captionSmall'} />
                <Amount value={stakingData.position.balance} suffix={` ${stakedIdleVault.stkIdleConfig.name}`} textStyle={'tableCell'} />
              </VStack>

              <VStack
                pb={[2, 0]}
                spacing={[1, 2]}
                width={['50%', 'auto']}
                alignItems={'flex-start'}
                justifyContent={'flex-start'}
              >
                <Translation component={Text} translation={'defi.share'} textStyle={'captionSmall'} />
                <Amount.Percentage value={stakingData.position.share} textStyle={'tableCell'} />
              </VStack>

              <VStack
                pb={[2, 0]}
                spacing={[1, 2]}
                width={['50%', 'auto']}
                alignItems={'flex-start'}
                justifyContent={'flex-start'}
              >
                <Translation component={Text} translation={'defi.claimable'} textStyle={'captionSmall'} />
                <Amount value={stakingData.position.claimable} suffix={` ${PROTOCOL_TOKEN}`} textStyle={'tableCell'} />
              </VStack>
            </HStack>
            <TransactionButton text={'defi.claim'} vaultId={stakedIdleVault.id} assetId={stakedIdleVault.id} contractSendMethod={contractSendMethod} actionType={'claim'} amount={stakingData.position.claimable.toString()} width={['100%', '150px']} disabled={stakingData.position.claimable.lte(0)} />
          </Stack>
        </Card>
      </VStack>
    )
  }, [account, stakingData, stakedIdleVault])

  return (
    <Box
      width={'100%'}
    >
      <Stack
        my={[10, 16]}
        width={'100%'}
        direction={['column', 'row']}
        justifyContent={'flex-start'}
        alignItems={['flex-start','center']}
      >
        <Translation translation={'navBar.stakeIDLE'} component={Heading} as={'h2'} size={'3xl'} />
      </Stack>
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
          >
            {stakingPosition}
            {claimableIDLE}
            <AssetGeneralData assetId={stakedIdleAsset?.id} />
          </VStack>
        </Stack>
        <InteractiveComponent vaultId={stakedIdleAsset?.id} assetId={stakedIdleVault?.id} actions={actions} />
      </HStack>
    </Box>
  )
}