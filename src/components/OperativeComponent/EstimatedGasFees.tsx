import React, { useMemo } from 'react'
import { TILDE }  from 'constants/vars'
import { Amount } from 'components/Amount/Amount'
import { HStack, useTheme } from '@chakra-ui/react'
import { MdOutlineLocalGasStation } from 'react-icons/md'
import { useWalletProvider } from 'contexts/WalletProvider'
import { Translation } from 'components/Translation/Translation'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'

export const EstimatedGasFees: React.FC = () => {
  const theme = useTheme()
  const { chainToken } = useWalletProvider()
  const { state: { transactionSpeed, estimatedFees, estimatedFeesUsd } } = useTransactionManager()

  const gasFee = useMemo(() => {
    if (!estimatedFees) return null
    return estimatedFees[transactionSpeed]
  }, [estimatedFees, transactionSpeed])

  const gasFeeUsd = useMemo(() => {
    if (!estimatedFeesUsd) return null
    return estimatedFeesUsd[transactionSpeed]
  }, [estimatedFeesUsd, transactionSpeed])

  return (
    <HStack
      spacing={1}
      width={'100%'}
      alignItems={'center'}
    >
      <MdOutlineLocalGasStation color={theme.colors.ctaDisabled} size={24} />
      <Translation translation={'trade.estimatedGasFee'} suffix={':'} textStyle={'captionSmaller'} />
      <Amount.Usd textStyle={'captionSmaller'} fontWeight={'600'} color={'primary'} prefix={TILDE} value={gasFeeUsd}></Amount.Usd>
      {
        gasFeeUsd && (
          <Amount textStyle={'captionSmaller'} fontWeight={'600'} color={'primary'} prefix={`(`} suffix={`${chainToken?.symbol})`} value={gasFee} decimals={4}></Amount>
        )
      }
    </HStack>
  )
}