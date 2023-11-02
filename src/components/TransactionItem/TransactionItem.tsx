import { formatDate, BNify } from 'helpers/'
import { DATETIME_FORMAT } from 'constants/vars'
import { Amount } from 'components/Amount/Amount'
import type { Transaction } from 'constants/types'
import { VStack, HStack, Text } from '@chakra-ui/react'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { Translation } from 'components/Translation/Translation'
import { TransactionLink } from 'components/TransactionLink/TransactionLink'

type TransactionItemArgs = {
  transaction: Transaction
}

export const TransactionItem: React.FC<TransactionItemArgs> = ({ transaction }) => {
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
          <Translation component={Text} translation={`transactionRow.${transaction.action}`} textStyle={'captionSmall'} />
        </HStack>
        <Text textStyle={'captionSmall'}>{formatDate(+transaction.timeStamp*1000, DATETIME_FORMAT)}</Text>
      </HStack>
      <HStack
        width={'100%'}
        justifyContent={'space-between'}
      >
        <HStack
          spacing={1}
          alignItems={'center'}
        >
          <TokenAmount assetId={transaction.assetId} amount={transaction.underlyingAmount} size={'xs'} textStyle={'tableCell'} />
          {
            transaction.amountUsd && !BNify(transaction.amountUsd).eq(transaction.underlyingAmount) && (
              <Amount.Usd prefix={'~'} value={transaction.amountUsd} color={'cta'} fontSize={'xs'} />
            )
          }
        </HStack>
        <TransactionLink hash={transaction.hash} chainId={transaction.chainId} />
      </HStack>
    </VStack>
  )
}