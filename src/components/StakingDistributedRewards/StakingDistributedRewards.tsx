import { Column, Row } from 'react-table'
import { Card } from 'components/Card/Card'
import { useTranslate } from 'react-polyglot'
import { selectUnderlyingToken } from 'selectors/'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { ReactTable } from 'components/ReactTable/ReactTable'
import React, { useState, useMemo, useCallback } from 'react'
import { PROTOCOL_TOKEN, STAKING_CHAINID } from 'constants/vars'
import { Translation } from 'components/Translation/Translation'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { MdArrowBackIosNew, MdArrowForwardIos } from 'react-icons/md'
import { TransactionItem } from 'components/TransactionItem/TransactionItem'
import { TransactionLink } from 'components/TransactionLink/TransactionLink'
import type { Transaction, EtherscanTransaction, NumberType } from 'constants/types'
import { useTheme, SkeletonText, Text, Flex, VStack, HStack, Button } from '@chakra-ui/react'
import { openWindow, getExplorerTxUrl, sortAlpha, sortNumeric, formatDate, fixTokenDecimals, BNify } from 'helpers/'

type RowProps = Row<EtherscanTransaction>

export const StakingDistributedRewards: React.FC = () => {
  const theme = useTheme()
  const translate = useTranslate()
  const { isMobile } = useThemeProvider()
  const [ page, setPage ] = useState<number>(1)
  const { stakingData } = usePortfolioProvider()

  const onRowClick = useCallback((row: RowProps) => {
    const explorerTxUrl = getExplorerTxUrl(STAKING_CHAINID, row.original.hash)
    return openWindow(explorerTxUrl)
  }, [])

  const protocolToken = useMemo(() => {
    return selectUnderlyingToken(STAKING_CHAINID, PROTOCOL_TOKEN)
  }, [])

  const rowsPerPage = 5

  const data = useMemo(() => {
    if (!stakingData) return []
    return stakingData.rewards
  }, [stakingData])

  const maxPages = useMemo(() => {
    return Math.max(1, Math.ceil(data.length/rowsPerPage))
  }, [data])

  const columns: Column<EtherscanTransaction>[] = useMemo(() => ([
    {
      id:'date',
      accessor:'timeStamp',
      Header:translate('transactionRow.date'),
      Cell: ({ value/*, row*/ }: { value: string/*; row: RowProps*/ }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <Text textStyle={'tableCell'}>{formatDate(+value*1000, 'YYYY/MM/DD HH:mm', true)}</Text>
          </SkeletonText>
        )
      },
      sortType: sortNumeric
    },
    {
      id:'amount',
      accessor:'value',
      Header:translate('transactionRow.amount'),
      Cell: ({ value }: { value: NumberType }) => {
        const amount = fixTokenDecimals(value, protocolToken?.decimals)
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <TokenAmount assetId={protocolToken?.address} amount={amount} size={'xs'} textStyle={'tableCell'} />
          </SkeletonText>
        )
      },
      sortType: sortNumeric
    },
    {
      id:'hash',
      accessor:'hash',
      Header:translate('transactionRow.hash'),
      Cell: ({ value }: { value: string }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <TransactionLink chainId={STAKING_CHAINID} hash={value} />
          </SkeletonText>
        )
      },
      sortType: sortAlpha
    },
  ]), [translate, protocolToken])

  const initialState = {
    sortBy: [
      {
        id: 'date',
        desc: false
      }
    ]
  }

  return (
    <VStack
      spacing={4}
      width={'full'}
    >
      {
        isMobile ? (
          <VStack
            spacing={0}
            width={'full'}
            alignItems={'flex-start'}
          >
            <Translation textAlign={'left'} translation={'staking.distributedRewards'} component={Card.Heading} />
            <Card>
            {
              data.slice(rowsPerPage*(page-1), rowsPerPage*page).map( (etherscanTransaction: EtherscanTransaction) => {
                const transaction: Transaction = {
                  ...etherscanTransaction,
                  idlePrice: BNify(1),
                  action: 'distributed',
                  assetId: protocolToken?.address as string,
                  idleAmount: fixTokenDecimals(etherscanTransaction.value, protocolToken?.decimals),
                  underlyingAmount: fixTokenDecimals(etherscanTransaction.value, protocolToken?.decimals)
                }
                return (
                  <TransactionItem key={`tx_${transaction.hash}`} transaction={transaction} />
                )
              })
            }
            </Card>
          </VStack>
        ) : (
          <Card mt={10}>
            <Translation translation={'staking.distributedRewards'} fontSize={'lg'} component={Card.Heading} />
            <ReactTable columns={columns} data={data} page={page} rowsPerPage={rowsPerPage} initialState={initialState} onRowClick={onRowClick} />
          </Card>
        )
      }
      <Flex
        width={'100%'}
        alignItems={'center'}
        justifyContent={'flex-end'}
      >
        <HStack
          spacing={2}
        >
          <Button variant={'link'} minW={'auto'} onClick={() => { setPage( currentPage => Math.max(1, currentPage-1) ) }}>
            <MdArrowBackIosNew color={page === 1 ? theme.colors.ctaDisabled : theme.colors.primary} />
          </Button>
          <Text textStyle={'ctaStatic'}>{page}/{maxPages}</Text>
          <Button variant={'link'} minW={'auto'} onClick={() => { setPage( currentPage => Math.min(maxPages, currentPage+1) ) }}>
            <MdArrowForwardIos color={page === maxPages ? theme.colors.ctaDisabled : theme.colors.primary} />
          </Button>
        </HStack>
      </Flex>
    </VStack>
  )
}