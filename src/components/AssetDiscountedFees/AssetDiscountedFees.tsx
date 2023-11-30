import { Card } from 'components/Card/Card'
import { DATETIME_FORMAT } from 'constants/vars'
import { Amount } from 'components/Amount/Amount'
import React, { useMemo, useCallback } from 'react'
import { useModalProvider } from 'contexts/ModalProvider'
import { Scrollable } from 'components/Scrollable/Scrollable'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { VStack, Heading, SimpleGrid, Text } from '@chakra-ui/react'
import { BNify, sortArrayByKey, isEmpty, formatDate } from 'helpers/'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { TransactionItem } from 'components/TransactionItem/TransactionItem'
import { FeeDiscountTable } from 'components/FeeDiscountTable/FeeDiscountTable'
import type { AssetId, BigNumber, DistributedReward, ModalProps, Transaction } from 'constants/'

type AssetDiscountedFeesProps = {
  assetId?: AssetId
}

export const AssetDiscountedFees: React.FC<AssetDiscountedFeesProps> = ({assetId}) => {
  const { openModal } = useModalProvider()
  const { stakingData, selectors: { selectAssetById/*, selectAssetBalance*/ } } = usePortfolioProvider()
  
  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  /*
  const assetBalance = useMemo(() => {
    if (!selectAssetBalance) return BNify(0)
    return selectAssetBalance(asset?.id)
  }, [selectAssetBalance, asset?.id])
  */

  const openHowItWorksModal = useCallback(() => {
    const modalProps = {
      cta: 'defi.modals.feeDiscount.cta',
      body: (
        <VStack
          spacing={2}
          width={'full'}
        >
          <Translation translation={'defi.modals.feeDiscount.body'} isHtml />
          <FeeDiscountTable showHeader={false} sortEnabled={false} />
        </VStack>
      ),
      subtitle: 'defi.modals.feeDiscount.title'
    }
    return openModal(modalProps as ModalProps, '2xl')
  }, [openModal])

  const rewardsHistory = useMemo(() => {
    if (isEmpty(asset?.discountedFees)) return null
    return (
      <Scrollable maxH={400}>
        {
          sortArrayByKey(asset?.discountedFees, 'timeStamp', 'desc').map( (distributedReward: DistributedReward) => {
            const transaction: Transaction = {
              ...distributedReward.tx,
              action: 'feeDiscount',
              idlePrice: BNify(0),
              idleAmount: BNify(0),
              chainId: distributedReward.chainId,
              assetId: distributedReward.assetId,
              underlyingAmount: distributedReward.value
            }
            return (
              <TransactionItem key={`tx_${transaction.hash}`} transaction={transaction} />
            )
          })
        }
      </Scrollable>
    )
  }, [asset?.discountedFees])

  const openRewardsHistoryModal = useCallback(() => {
    const modalProps = {
      cta: 'common.close',
      body: rewardsHistory,
      subtitle: 'common.discountsHistory',
    }
    return openModal(modalProps as ModalProps, '2xl')
  }, [openModal, rewardsHistory])

  const totalAmount = useMemo(() => {
    if (!asset || isEmpty(asset.discountedFees)) return BNify(0)
    return asset.discountedFees.reduce( (totalAmount: BigNumber, feeDistribution: DistributedReward) => {
      return totalAmount.plus(feeDistribution.value)
    }, BNify(0))
  }, [asset])

  const latestDistribution = useMemo(() => {
    return !isEmpty(asset?.discountedFees) ? sortArrayByKey(asset.discountedFees, 'timeStamp', 'desc')[0] : null
  }, [asset])

  const discountedFeesEnabled = useMemo(() => {
    return asset && "flags" in asset && !!asset.flags?.feeDiscountEnabled
  }, [asset])

  if (!asset || !asset.underlyingId || !discountedFeesEnabled/* || assetBalance.lte(0)*/) return null

  return (
    <VStack
      spacing={6}
      width={'full'}
      alignItems={'flex-start'}
    >
      <Translation component={Heading} as={'h3'} fontSize={'h3'} translation={'defi.discountedFees'} />
      <VStack
        spacing={4}
        width={'full'}
        alignItems={'flex-start'}
      >
        <Card
          py={6}
          px={8}
          width={'full'}
        >
          <AssetProvider assetId={asset.underlyingId}>
            <SimpleGrid
              width={'full'}
              spacing={[3, 0]}
              columns={[2, 4]}
              justifyContent={'center'}
              alignItems={'space-between'}
            >
              <TokenAmount assetId={asset.underlyingId} size={'sm'} spacing={3} amount={totalAmount} showIcon={true} textStyle={'heading'} fontSize={'h3'} />
              <VStack
                spacing={1}
                alignItems={'flex-start'}
                justifyContent={'flex-start'}
              >
                <Translation component={Text} translation={'defi.feeDiscount'} textStyle={'titleSmall'} />
                <Amount.Percentage value={stakingData?.feeDiscount} textStyle={'tableCell'} />
              </VStack>
              <VStack
                spacing={1}
                alignItems={'flex-start'}
                justifyContent={'flex-start'}
              >
                <Translation component={Text} translation={'common.lastDistribution'} textStyle={'titleSmall'} />
                {
                  latestDistribution ? (
                    <Text textStyle={'tableCell'}>{formatDate(latestDistribution.timeStamp, DATETIME_FORMAT)}</Text>
                  ) : (
                    <Text textStyle={'tableCell'}>-</Text>
                  )
                }
              </VStack>
              <VStack
                justifyContent={'center'}
                alignItems={'flex-end'}
              >
                {
                  latestDistribution ? (
                    <Translation translation={`assets.assetDetails.assetHistory.discountsHistory`} textStyle={'linkBlue'} fontSize={'md'} fontWeight={700} onClick={() => openRewardsHistoryModal()} />
                  ) : (
                    <Translation translation={`common.howItWorks`} textStyle={'linkBlue'} fontSize={'md'} fontWeight={700} onClick={() => openHowItWorksModal()} />
                  )
                }
              </VStack>
            </SimpleGrid>
          </AssetProvider>
        </Card>
      </VStack>
    </VStack>
  )
}