import React, { useMemo } from 'react'
import { Column, Row } from 'react-table'
import { Card } from 'components/Card/Card'
import { NumberType } from 'constants/types'
import { useTranslate } from 'react-polyglot'
import { Amount } from 'components/Amount/Amount'
import { sortAlpha, sortNumeric } from 'helpers/'
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
}

export const FeeDiscountTable: React.FC<FeeDiscountTableArgs> = ({
  showHeader = true
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
      Header:translate('feeDiscount.table.columns.feeDiscount'),
      Cell: ({ value }: { value: NumberType }) => {
        return (
          <Amount.Percentage textStyle={'tableCell'} value={value} />
        )
      },
      sortType: sortNumeric
    },
  ]), [translate])

  const initialState = {
    sortBy: [
      {
        id: 'tier',
        desc: true
      }
    ]
  }

  return (
    <Card mt={10}>
      {
        showHeader && (
          <Translation translation={'feeDiscount.table.header'} fontSize={'lg'} component={Card.Heading} />
        )
      }
      <ReactTable columns={columns} data={data} page={1} rowsPerPage={data.length} initialState={initialState} />
    </Card>
  )
}