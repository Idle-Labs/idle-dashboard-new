import React, { useMemo } from 'react'
import { Icon } from 'components/Icon/Icon'
import { Card } from 'components/Card/Card'
import { DATETIME_FORMAT } from 'constants/vars'
import { Amount } from 'components/Amount/Amount'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Scrollable } from 'components/Scrollable/Scrollable'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { formatDate, shortenHash, sortArrayByKey } from 'helpers/'
import type { AssetId, IconType, Transaction } from 'constants/types'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { TransactionLink } from 'components/TransactionLink/TransactionLink'
import { VStack, HStack, Flex, Link, Text, Skeleton, SkeletonText } from '@chakra-ui/react'

type TransactionItemArgs = {
  transaction: Transaction
}

const TransactionItem: React.FC<TransactionItemArgs> = ({ transaction }) => {

  return (
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
  )
}

type TransactionListArgs = {
  assetId?: AssetId
}

export const TransactionList: React.FC<TransactionListArgs> = ({ assetId }) => {
  const { account } = useWalletProvider()
  const { isPortfolioLoaded, isVaultsPositionsLoaded, selectors: { selectVaultTransactions } } = usePortfolioProvider()

  const transactions: Transaction[] = useMemo(() => {
    if (!account || !assetId || !selectVaultTransactions) return
    return selectVaultTransactions(assetId)
  }, [account, assetId, selectVaultTransactions])

  // console.log('transactions', assetId, transactions)

  const isLoaded = useMemo(() => {
    return isPortfolioLoaded && (!account || isVaultsPositionsLoaded)
  }, [isPortfolioLoaded, account, isVaultsPositionsLoaded])

  const transactionsList = useMemo(() => {
    return isLoaded ?
      transactions && transactions.length>0 ? 
        sortArrayByKey(transactions, 'timeStamp', 'desc').map( (transaction: Transaction) => (
          <TransactionItem key={`tx_${transaction.hash}`} transaction={transaction} />
        ))
      : (
        <Flex
          flex={1}
          minH={250}
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
    <AssetProvider
      wrapFlex={false}
      assetId={assetId}
    >
      <Card
        flex={1}
      >
        <VStack
          flex={1}
          spacing={0}
          height={'100%'}
          alignItems={'flex-start'}
          justifyContent={'flex-start'}
        >
          <Translation component={Card.Heading} translation={'assets.assetDetails.assetHistory.transactionHistory'} />
          <Scrollable maxH={400}>
            {transactionsList}
          </Scrollable>
        </VStack>
      </Card>
    </AssetProvider>
  )
}