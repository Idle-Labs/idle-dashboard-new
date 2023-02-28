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
  title?: string
  emptyText?: string
  assetIds?: AssetId[]
  transactions?: Transaction[]
  showTitleOnMobile?: boolean
  fullHeightOnMobile?: boolean
} & CardProps

export const TransactionList: React.FC<TransactionListArgs> = ({ assetIds, showTitleOnMobile = false, fullHeightOnMobile = false, title, transactions, emptyText, ...cardProps }) => {
  const { account } = useWalletProvider()
  const [ ref, dimensions ] = useBoundingRect()
  const { isPortfolioLoaded, isVaultsPositionsLoaded, selectors: { selectVaultTransactions, selectVaultGauge } } = usePortfolioProvider()

  const assetsTransactions: Transaction[] = useMemo(() => {
    if (transactions) return transactions
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

  }, [transactions, account, assetIds, selectVaultTransactions, selectVaultGauge])

  const isLoaded = useMemo(() => {
    return isPortfolioLoaded && (!account || isVaultsPositionsLoaded)
  }, [isPortfolioLoaded, account, isVaultsPositionsLoaded])

  const transactionsList = useMemo(() => {
    return isLoaded ?
      assetsTransactions.length>0 ? 
        sortArrayByKey(assetsTransactions, 'timeStamp', 'desc').map( (transaction: Transaction, txIndex: number) => (
          <TransactionItem key={`tx_${transaction.hash}_${txIndex}`} transaction={transaction} />
        ))
      : (
        <Flex
          flex={1}
          minH={250}
          width={'100%'}
          alignItems={'center'}
          justifyContent={'center'}
        >
          <Translation component={Text} translation={emptyText || 'assets.assetDetails.assetHistory.emptyTransactions'} />
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
  }, [isLoaded, assetsTransactions, emptyText])

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
        <Translation display={showTitleOnMobile ? 'block' : ['none', 'block']} component={Card.Heading} fontSize={'lg'} translation={title || 'assets.assetDetails.assetHistory.transactionHistory'} />
        <Scrollable maxH={[fullHeightOnMobile ? '100%' : 280, Math.max(dimensions?.height || 400)]}>
          {transactionsList}
        </Scrollable>
      </VStack>
    </Card>
  )
}