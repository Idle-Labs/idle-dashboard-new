import { Icon } from 'components/Icon/Icon'
import React, { useMemo, useRef } from 'react'
import { DATETIME_FORMAT } from 'constants/vars'
import { Amount } from 'components/Amount/Amount'
import { formatDate, sortArrayByKey } from 'helpers/'
import { Card, CardProps } from 'components/Card/Card'
import { useWalletProvider } from 'contexts/WalletProvider'
import type { AssetId, Transaction } from 'constants/types'
import { Scrollable } from 'components/Scrollable/Scrollable'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import useBoundingRect from "hooks/useBoundingRect/useBoundingRect"
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { VStack, HStack, Flex, Text, Skeleton } from '@chakra-ui/react'
import { TransactionLink } from 'components/TransactionLink/TransactionLink'

type TransactionItemArgs = {
  transaction: Transaction
}

const TransactionItem: React.FC<TransactionItemArgs> = ({ transaction }) => {
  return (
    <AssetProvider
      wrapFlex={false}
      assetId={transaction.assetId}
    >
      <VStack
        mb={2}
        pb={4}
        spacing={4}
        width={'100%'}
        alignItems={'flex-start'}
        borderBottomWidth={'1px'}
        borderBottomColor={'divider'}
      >
        <HStack
          width={'100%'}
          justifyContent={'space-between'}
        >
          <HStack
            spacing={3}
            direction={'row'}
            alignItems={'center'}
          >
            {/*<Icon IconComponent={transaction.icon} width={24} height={24} size={24} />*/}
            <Translation component={Text} translation={`transactionRow.${transaction.action}`} textStyle={'captionSmall'} />
          </HStack>
          <Text textStyle={'captionSmall'}>{formatDate(+transaction.timeStamp*1000, DATETIME_FORMAT)}</Text>
        </HStack>
        <HStack
          width={'100%'}
          justifyContent={'space-between'}
        >
          <HStack
            spacing={2}
            alignItems={'center'}
          >
            <AssetProvider.Icon size={'xs'} />
            <HStack
              spacing={1}
              alignItems={'center'}
            >
              <Amount value={transaction.underlyingAmount} decimals={4} textStyle={'tableCell'} />
              <AssetProvider.Name textStyle={'tableCell'} />
            </HStack>
          </HStack>
          <TransactionLink hash={transaction.hash} />
        </HStack>
      </VStack>
    </AssetProvider>
  )
}

type TransactionListArgs = {
  assetIds?: AssetId[]
  showTitleOnMobile?: boolean
} & CardProps

export const TransactionList: React.FC<TransactionListArgs> = ({ assetIds, showTitleOnMobile = false, ...cardProps }) => {
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
        <Scrollable maxH={Math.max(dimensions?.height || 400)}>
          {transactionsList}
        </Scrollable>
      </VStack>
    </Card>
  )
}