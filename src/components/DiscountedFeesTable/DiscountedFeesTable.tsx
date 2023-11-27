import React, { useMemo } from 'react'
import { BigNumber } from 'bignumber.js'
import { Column, Row } from 'react-table'
import { useTranslate } from 'react-polyglot'
import { Card, CardProps } from 'components/Card/Card'
import { AssetId, DistributedReward } from 'constants/types'
import { ReactTable } from 'components/ReactTable/ReactTable'
import { TableField } from 'components/TableField/TableField'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { HStack, SkeletonText, Text, VStack } from '@chakra-ui/react'
import { sortNumeric, isEmpty, sortArrayByKey, formatDate, uniqueValues } from 'helpers/'

type RowProps = Row<DistributedReward>

type DiscountedFeesTableArgs = {
  showHeader?: boolean
} & CardProps

export const DiscountedFeesTable: React.FC<DiscountedFeesTableArgs> = ({
  showHeader = true,
  ...cardProps
}) => {
  const translate = useTranslate()
  const { isPortfolioLoaded, discountedFees } = usePortfolioProvider()

  const data: DistributedReward[] = useMemo(() => {
    if (isEmpty(discountedFees)) return []
    return sortArrayByKey(uniqueValues(Object.values(discountedFees).flat(), 'hash'), 'timeStamp', 'desc')
  }, [discountedFees])

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
      Header: '#',
      accessor: 'hash',
      display: 'none'
    },
    {
      accessor: 'assetId',
      id: 'assetWithStatus',
      Header:translate('defi.assetWithStatus'),
      Cell: ({ value: assetId }: { value: AssetId }) => {
        return (
          <HStack
            spacing={2}
            width={'full'}
            alignItems={'center'}
            justifyContent={'space-between'}
          >
            <TableField field={'assetWithStatus'} value={isPortfolioLoaded} assetId={assetId} />
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
  ], [translate, isPortfolioLoaded])

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
          <ReactTable columns={discountedFeesColumns} data={data} page={1} rowsPerPage={data.length} initialState={initialState} />
        )
      }
    </Card>
  )
}