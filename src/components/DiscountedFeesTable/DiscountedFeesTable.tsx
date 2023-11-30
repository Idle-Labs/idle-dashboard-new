import { BigNumber } from 'bignumber.js'
import { Column, Row } from 'react-table'
import { useTranslate } from 'react-polyglot'
import { TABLE_ROWS_PER_PAGE } from 'constants/' 
import { Card, CardProps } from 'components/Card/Card'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { AssetId, DistributedReward } from 'constants/types'
import { ReactTable } from 'components/ReactTable/ReactTable'
import { TableField } from 'components/TableField/TableField'
import React, { useMemo, useState, useCallback } from 'react'
import { Pagination } from 'components/Pagination/Pagination'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { HStack, SkeletonText, Text, VStack } from '@chakra-ui/react'
import { TransactionLink } from 'components/TransactionLink/TransactionLink'
import { sortNumeric, isEmpty, sortArrayByKey, formatDate, uniqueValues, getExplorerTxUrl, openWindow } from 'helpers/'

type RowProps = Row<DistributedReward>

type DiscountedFeesTableArgs = {
  showHeader?: boolean
} & CardProps

export const DiscountedFeesTable: React.FC<DiscountedFeesTableArgs> = ({
  showHeader = true,
  ...cardProps
}) => {
  const translate = useTranslate()
  const { theme } = useThemeProvider()
  const [ page, setPage ] = useState<number>(1)
  const { /*stakingData, */isPortfolioLoaded, discountedFees } = usePortfolioProvider()

  const data: DistributedReward[] = useMemo(() => {
    if (isEmpty(discountedFees)) return []
    return sortArrayByKey(uniqueValues(Object.values(discountedFees).flat(), 'hash'), 'timeStamp', 'desc')
  }, [discountedFees])

  const totalPages = useMemo(() => {
    return Math.ceil(data.length/TABLE_ROWS_PER_PAGE)
  }, [data])

  const goBack = useCallback(() => {
    if (!page) return false
    setPage( (prevPage: number) => {
      return Math.max(1, prevPage-1)
    })
    return true
  }, [setPage, page])

  const goNext = useCallback(() => {
    if (page===totalPages) return false
    setPage( (prevPage: number) => {
      return Math.min(totalPages, prevPage+1)
    })
  }, [setPage, page, totalPages])

  const initialState = useMemo(() => ({
    sortBy: [
      {
        id: 'tier',
        desc: true
      }
    ]
  }), [])

  const discountedFeesColumns: Column<DistributedReward>[] = useMemo(() => [
    {
      id: 'id',
      Header: '#',
      accessor: 'hash',
      display: 'none'
    },
    {
      id: 'asset',
      accessor: 'assetId',
      Header:translate('defi.asset'),
      Cell: ({ value: assetId }: { value: AssetId }) => {
        return (
          <HStack
            spacing={2}
            width={'full'}
            alignItems={'center'}
            justifyContent={'space-between'}
          >
            <TableField field={'asset'} value={isPortfolioLoaded} assetId={assetId} />
            <TableField field={'productTagWithRisk'} value={isPortfolioLoaded} assetId={assetId} />
          </HStack>
        )
      }
    },
    {
      accessor:'value',
      Header:translate('transactionRow.amount'),
      Cell: ({ value, row }: { value: BigNumber | undefined; row: RowProps }) => {
        return (
          <SkeletonText noOfLines={2} isLoaded={!!value}>
            <TokenAmount assetId={row.original.assetId} amount={value} showIcon={false} textStyle={'tableCell'} />
          </SkeletonText>
        )
      },
      sortType: sortNumeric
    },
    {
      accessor:'timeStamp',
      Header:translate('transactionRow.date'),
      Cell: ({ value }: { value: number | undefined }) => {
        return (
          <Text textStyle={'tableCell'}>{formatDate(value as number, 'YYYY/MM/DD HH:mm', true)}</Text>
        )
      },
      sortType: sortNumeric
    },
    {
      id: 'hash',
      accessor:'hash',
      Header:translate('transactionRow.hash'),
      Cell: ({ value, row }: { value: string; row: RowProps }) => {
        return (
          <HStack
            width={'full'}
            justifyContent={'flex-start'}
          >
            <TransactionLink hash={value} chainId={row.original.chainId} />
          </HStack>
        )
      },
      sortType: sortNumeric
    },
  ], [translate, isPortfolioLoaded])

  if (!data.length) return null

  return (
    <Card
      p={0}
      {...cardProps}
    >
      {
        showHeader && (
          <Translation translation={'defi.discountedFees'} fontSize={'lg'} component={Card.Heading} />
        )
      }
      {
        isEmpty(data) ? (
          <VStack
            py={6}
            width={'full'}
            alignItems={'center'}
            justifyContent={'center'}
          >
            <Translation textAlign={'center'} translation={'feeDiscount.table.stakingEmpty'} color={'cta'} isHtml />
          </VStack>
        ) : (
          <ReactTable columns={discountedFeesColumns} data={data} page={page} rowsPerPage={TABLE_ROWS_PER_PAGE} initialState={initialState} onRowClick={ (row) => openWindow(getExplorerTxUrl(row.original.chainId as number, row.original.hash)) } />
        )
      }
      {
        totalPages>1 && (
          <Pagination
            activePage={page}
            pages={totalPages}
            justifyContent={'center'}
            onPrevArrowClick={() => { if (page) goBack() }}
            onNextArrowClick={() => { if (page<totalPages) goNext()}}
            prevArrowColor={page === 1 ? theme.colors.ctaDisabled : theme.colors.primary}
            nextArrowColor={page === totalPages ? theme.colors.ctaDisabled : theme.colors.primary}
          />
        )
      }
    </Card>
  )
}