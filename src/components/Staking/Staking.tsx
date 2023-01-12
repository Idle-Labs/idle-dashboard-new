import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { toDayjs, BNify } from 'helpers/'
import { Card } from 'components/Card/Card'
import { defaultChainId } from 'constants/'
import { Amount } from 'components/Amount/Amount'
import type { Transaction } from 'constants/types'
import { selectUnderlyingToken } from 'selectors/'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { Stake } from 'components/OperativeComponent/Stake'
import { useWalletProvider } from 'contexts/WalletProvider'
import type { GeneralDataField } from 'constants/strategies'
import { AssetLabel } from 'components/AssetLabel/AssetLabel'
import { Unstake } from 'components/OperativeComponent/Unstake'
import { Approve } from 'components/OperativeComponent/Approve'
import { Translation } from 'components/Translation/Translation'
import { PROTOCOL_TOKEN, SECONDS_IN_YEAR } from 'constants/vars'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { TransactionButton } from 'components/TransactionButton/TransactionButton'
import { SimpleGrid, Box, Stack, VStack, HStack, Heading, Text } from '@chakra-ui/react'
import { InteractiveComponent } from 'components/InteractiveComponent/InteractiveComponent'
import { AssetGeneralDataField, AssetGeneralData } from 'components/AssetGeneralData/AssetGeneralData'
import { StakingDistributedRewards } from 'components/StakingDistributedRewards/StakingDistributedRewards'

export const Staking: React.FC = () => {
  const { account } = useWalletProvider()
  const { isMobile } = useThemeProvider()
  const { isVaultsPositionsLoaded, stakingData, selectors: { selectVaultsByType, selectAssetById, selectVaultTransactions } } = usePortfolioProvider()

  const protocolToken = useMemo(() => {
    if (!selectAssetById) return
    const underlyingToken = selectUnderlyingToken(defaultChainId, PROTOCOL_TOKEN)
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
        label:'assets.assetDetails.generalData.totalIDLEStaked',
      },
      {
        field:'stkIDLEBalance',
        props:{
          fontSize:'h3',
          textStyle:'heading',
        },
        label:'assets.assetDetails.generalData.stkIDLEBalance',
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
    if (!account || !stakingData || stakingData.position.deposited.lte(0) || !stakedIdleVault) return null

    const contractSendMethod = stakedIdleVault.getClaimRewardsContractSendMethod()

    return isMobile ? (
      <AssetProvider
        wrapFlex={false}
        assetId={protocolToken.id}
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
              <AssetLabel assetId={protocolToken.id} />
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
                <HStack
                  spacing={1}
                  justifyContent={'flex-end'}
                >
                  <Amount value={stakingData.position.claimable} decimals={3} textStyle={'heading'} fontSize={'h3'} />
                  <AssetProvider.Name textStyle={'heading'} fontSize={'h3'} />
                </HStack>
              </VStack>
            </HStack>
            <TransactionButton text={'defi.claim'} vaultId={stakedIdleVault.id} assetId={stakedIdleVault.id} contractSendMethod={contractSendMethod} actionType={'claim'} amount={stakingData.position.claimable.toString()} width={'100%'} disabled={stakingData.position.claimable.lte(0)} />
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
          <AssetLabel assetId={protocolToken.id} />

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
            <Amount value={stakingData.position.claimable} suffix={` ${PROTOCOL_TOKEN}`} fontSize={'h3'} textStyle={'heading'} />
          </VStack>

          <TransactionButton text={'defi.claim'} vaultId={stakedIdleVault.id} assetId={stakedIdleVault.id} contractSendMethod={contractSendMethod} actionType={'claim'} amount={stakingData.position.claimable.toString()} width={['100%', '150px']} disabled={stakingData.position.claimable.lte(0)} />
        </Stack>
      </Card>
    )
  }, [account, isMobile, stakingData, protocolToken, realizedApy, stakedIdleVault])

  return (
    <Box
      width={'100%'}
    >
      <VStack
        spacing={6}
        my={[10, 16]}
        width={'100%'}
        direction={['column', 'row']}
        justifyContent={'flex-start'}
        alignItems={['center','flex-start']}
      >
        <Translation translation={'navBar.stakeIDLE'} component={Heading} as={'h2'} size={'3xl'} />
        <Translation isHtml={true} translation={'strategies.staking.description'} textAlign={['left', 'center']} component={Text} />
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
            {stakingPosition}
            {claimableIDLE}
            <VStack
              spacing={6}
              width={'full'}
              alignItems={'flex-start'}
            >
              <Translation translation={'staking.globalstkIDLE'} component={Text} textStyle={'heading'} fontSize={'h3'} />
              <AssetGeneralData assetId={stakedIdleAsset?.id} />
            </VStack>
            <StakingDistributedRewards />
          </VStack>
        </Stack>
        <InteractiveComponent vaultId={stakedIdleAsset?.id} assetId={stakedIdleVault?.id} actions={actions} />
      </HStack>
    </Box>
  )
}