import { Column } from 'react-table'
import { sortNumeric } from 'helpers/'
import React, { useMemo } from 'react'
import { NumberType } from 'constants/types'
import { useTranslate } from 'react-polyglot'
import { Amount } from 'components/Amount/Amount'
import { Card, CardProps } from 'components/Card/Card'
import { ReactTable } from 'components/ReactTable/ReactTable'
import { Translation } from 'components/Translation/Translation'
import { STAKING_FEE_DISCOUNTS } from 'constants/stakingFeeDiscounts'

type FeeStakingTier = {
  tier: NumberType
  amount: NumberType
  discount: NumberType
}

type FeeDiscountTableArgs = {
  showHeader?: boolean
  sortEnabled?: boolean
} & CardProps

export const FeeDiscountTable: React.FC<FeeDiscountTableArgs> = ({
  showHeader = true,
  sortEnabled = true,
  ...cardProps
}) => {
  const translate = useTranslate()

  const data: FeeStakingTier[] = useMemo(() => {
    return Object.keys(STAKING_FEE_DISCOUNTS).reduce( (feeDiscounts: FeeStakingTier[], tierAmount, tierIndex) => {
      feeDiscounts.push({
        tier: tierIndex+1,
        amount: tierAmount,
        discount: STAKING_FEE_DISCOUNTS[+tierAmount as number]
      })
      return feeDiscounts
    }, [])
  }, [])

  const columns: Column<FeeStakingTier>[] = useMemo(() => ([
    {
      id:'tier',
      accessor:'tier',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('feeDiscount.table.columns.tier'),
      Cell: ({ value }: { value: NumberType }) => {
        return (
          <Amount.Int textStyle={'tableCell'} value={value} />
        )
      },
      sortType: sortNumeric
    },
    {
      id:'amount',
      accessor:'amount',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('feeDiscount.table.columns.stkIDLE'),
      Cell: ({ value }: { value: NumberType }) => {
        return (
          <Amount textStyle={'tableCell'} prefix={'≥ '} value={value} />
        )
      },
      sortType: sortNumeric
    },
    {
      id:'discount',
      accessor:'discount',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('feeDiscount.table.columns.feeDiscount'),
      Cell: ({ value }: { value: NumberType }) => {
        return (
          <Amount.Percentage textStyle={'tableCell'} value={value} />
        )
      },
      sortType: sortNumeric
    },
  ]), [sortEnabled, translate])

  const initialState = {
    sortBy: [
      {
        id: 'tier',
        desc: true
      }
    ]
  }

  return (
    <Card
      p={0}
      {...cardProps}
    >
      {
        showHeader && (
          <Translation translation={'feeDiscount.table.header'} fontSize={'lg'} component={Card.Heading} />
        )
      }
      <ReactTable columns={columns} data={data} page={1} rowsPerPage={data.length} initialState={initialState} />
    </Card>
  )
}