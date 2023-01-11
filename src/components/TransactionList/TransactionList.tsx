import { sortArrayByKey } from 'helpers/'
import React, { useMemo, useRef } from 'react'
import { Card, CardProps } from 'components/Card/Card'
import { useWalletProvider } from 'contexts/WalletProvider'
import type { AssetId, Transaction } from 'constants/types'
import { Scrollable } from 'components/Scrollable/Scrollable'
import { VStack, Flex, Text, Skeleton } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import useBoundingRect from "hooks/useBoundingRect/useBoundingRect"
import { TransactionItem } from 'components/TransactionItem/TransactionItem'

type TransactionListArgs = {
  assetIds?: AssetId[]
  showTitleOnMobile?: boolean
  fullHeightOnMobile?: boolean
} & CardProps

export const TransactionList: React.FC<TransactionListArgs> = ({ assetIds, showTitleOnMobile = false, fullHeightOnMobile = false, ...cardProps }) => {
  const { account } = useWalletProvider()
  const [ ref, dimensions ] = useBoundingRect()
  const { isPortfolioLoaded, isVaultsPositionsLoaded, selectors: { selectVaultTransactions, selectVaultGauge } } = usePortfolioProvider()

  const transactions: Transaction[] = useMemo(() => {
    if (!account || !assetIds || !selectVaultTransactions || !selectVaultGauge) return []

    return assetIds.reduce( (transactions: Transaction[], assetId: AssetId) => {
      const gaugeVault = selectVaultGauge(assetId)
      const vaultTransactions: Transaction[] = selectVaultTransactions(assetId)
      const gaugeTransactions: Transaction[] = gaugeVault ? selectVaultTransactions(gaugeVault.id) : []
      return [
        ...transactions,
        ...vaultTransactions,
        ...gaugeTransactions
      ]
    }, [])

  }, [account, assetIds, selectVaultTransactions, selectVaultGauge])

  const isLoaded = useMemo(() => {
    return isPortfolioLoaded && (!account || isVaultsPositionsLoaded)
  }, [isPortfolioLoaded, account, isVaultsPositionsLoaded])

  const transactionsList = useMemo(() => {
    return isLoaded ?
      transactions.length>0 ? 
        sortArrayByKey(transactions, 'timeStamp', 'desc').map( (transaction: Transaction) => (
          <TransactionItem key={`tx_${transaction.hash}`} transaction={transaction} />
        ))
      : (
        <Flex
          flex={1}
          minH={250}
          width={'100%'}
          alignItems={'center'}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={'assets.assetDetails.assetHistory.emptyTransactions'} />
        </Flex>
      )
    : (
      <VStack
        spacing={4}
        width={'100%'}
      >
        <Skeleton width={'100%'} height={10} />
        <Skeleton width={'100%'} height={10} />
        <Skeleton width={'100%'} height={10} />
        <Skeleton width={'100%'} height={10} />
      </VStack>
    )
  }, [isLoaded, transactions])

  return (
    <Card
      flex={1}
      {...cardProps}
    >
      <VStack
        flex={1}
        spacing={0}
        height={'100%'}
        alignItems={'flex-start'}
        ref={ref as typeof useRef}
        justifyContent={'flex-start'}
      >
        <Translation display={showTitleOnMobile ? 'block' : ['none', 'block']} component={Card.Heading} translation={'assets.assetDetails.assetHistory.transactionHistory'} />
        <Scrollable maxH={[fullHeightOnMobile ? '100%' : 280, Math.max(dimensions?.height || 400)]}>
          {transactionsList}
        </Scrollable>
      </VStack>
    </Card>
  )
}