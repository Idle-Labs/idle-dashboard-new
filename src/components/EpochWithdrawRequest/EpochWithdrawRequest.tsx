import { HStack, Stack, VStack, Text, Tag } from "@chakra-ui/react"
import { Amount } from "components/Amount/Amount"
import { AssetLabel } from "components/AssetLabel/AssetLabel"
import { AssetProvider, useAssetProvider } from "components/AssetProvider/AssetProvider"
import { Card } from "components/Card/Card"
import { TableWithPagination } from "components/TableWithPagination/TableWithPagination"
import { TokenAmount } from "components/TokenAmount/TokenAmount"
import { TransactionButton } from "components/TransactionButton/TransactionButton"
import { Translation } from "components/Translation/Translation"
import { AssetId, CreditVaultWithdrawRequest, DATETIME_FORMAT, vaultsStatusSchemes } from "constants/"
import { usePortfolioProvider } from "contexts/PortfolioProvider"
import { useThemeProvider } from "contexts/ThemeProvider"
import { useWalletProvider } from "contexts/WalletProvider"
import { bnOrZero, fixTokenDecimals, formatDate, isEmpty, sortNumeric, toDayjs } from "helpers"
import { useCallback, useMemo } from "react"
import Countdown from "react-countdown"
import { useTranslate } from "react-polyglot"
import { Row } from "react-table"
import { CreditVault } from "vaults/CreditVault"

type EpochWithdrawRequestArgs = {
  assetId: AssetId
  sortEnabled?: boolean
}

type RowProps = Row<CreditVaultWithdrawRequest>

export const EpochWithdrawRequest: React.FC<EpochWithdrawRequestArgs> = ({
  assetId,
  sortEnabled = true
}) => {
  const translate = useTranslate()
  const { account } = useWalletProvider()
  const { vaultsAccountData, selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(assetId)
  }, [selectVaultById, assetId])

  const withdrawRequests = useMemo(() => {
    return vaultsAccountData?.creditVaultsWithdrawRequests?.[asset?.id]
  }, [asset, vaultsAccountData])

  const epochData = useMemo(() => {
    return asset?.epochData
  }, [asset])

  const getRequestClaimDeadline = useCallback((withdrawRequest: CreditVaultWithdrawRequest) => {
    if (!epochData || !("instantWithdrawDeadline" in epochData)) return null

    // Instant
    if (!!withdrawRequest.isInstant){
      return toDayjs(epochData?.instantWithdrawDeadline*1000)
    }

    // Standard
    if (epochData.count-withdrawRequest.epochNumber < 2){
      // Wait and of epoch
      if (epochData.isEpochRunning){
        return toDayjs(epochData?.epochEndDate)
      }
      // Wait for next epoch end
      return toDayjs(bnOrZero(epochData?.epochEndDate).plus(bnOrZero(epochData.epochDuration).times(1000)).plus(bnOrZero(epochData?.bufferPeriod).times(1000)).toNumber())
    }

    return null
  }, [epochData])

  const getRequestStatus = useCallback((withdrawRequest: CreditVaultWithdrawRequest) => {
    const claimDeadline = getRequestClaimDeadline(withdrawRequest)

    if (withdrawRequest.isInstant){
      if (!epochData.allowInstantWithdraw){
        return 'pending'
      }
    } else {
      if (epochData.count-withdrawRequest.epochNumber < 2){
        return 'pending'
      }
    }
  
    return !claimDeadline || claimDeadline.isSameOrBefore(toDayjs()) ? 'claimable' : 'pending'
  }, [epochData, getRequestClaimDeadline])

  const getRequestCountdown = useCallback((withdrawRequest: CreditVaultWithdrawRequest) => {
    const status = getRequestStatus(withdrawRequest)
    if (status === 'claimable'){
      return null
    }
    const claimDeadline = getRequestClaimDeadline(withdrawRequest)

    console.log('getRequestCountdown', status, claimDeadline)

    return claimDeadline ? <Countdown date={claimDeadline.toDate()} /> : null
  }, [getRequestStatus, getRequestClaimDeadline])

  const getContractSendMethod = useCallback((withdrawRequest: CreditVaultWithdrawRequest) => {
    if (withdrawRequest.isInstant){
      if (!vault || !("getClaimInstantContractSendMethod" in vault)) return null
      return vault?.getClaimInstantContractSendMethod()
    }
    if (!vault || !("getClaimContractSendMethod" in vault)) return null
    return vault?.getClaimContractSendMethod()
  }, [vault])

  // @ts-ignore
  const columns: Column<CreditVaultWithdrawRequest>[] = useMemo(() => ([
    {
      width: '16%',
      id:'epochNumber',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.epochNumber'),
      Cell: ({ value }: { value: CreditVaultWithdrawRequest["epochNumber"] }) => {
        return (
          <Amount.Int fontSize={'h4'} textStyle={'heading'} value={value} />
        )
      },
    },
    {
      id:'type',
      width: '16%',
      accessor:'isInstant',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('common.type'),
      Cell: ({ value }: { value: CreditVaultWithdrawRequest["isInstant"] }) => {
        return (
          <Translation translation={`assets.status.epoch.${value ? 'instant' : 'standard'}`} fontSize={'h4'} textStyle={'heading'} />
        )
      },
    },
    {
      id:'amount',
      width: '22%',
      accessor:'amount',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('transactionRow.amount'),
      Cell: ({ value }: { value: CreditVaultWithdrawRequest["isInstant"] }) => {
        const amount = fixTokenDecimals(value, (vault?.underlyingToken?.decimals || 18))
        return (
          <TokenAmount assetId={asset?.underlyingId} amount={amount} decimals={2} textStyle={'heading'} fontSize={'h4'} />
        )
      },
      sortType: sortNumeric
    },
    {
      id:'status',
      width: '20%',
      accessor:'isInstant',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('defi.status'),
      Cell: ({ row }: { row: RowProps }) => {
        const status = getRequestStatus(row.original)
        const countdown = getRequestCountdown(row.original)
        return status === 'claimable' ? (
          <Tag variant={'solid'} colorScheme={vaultsStatusSchemes[status]} color={'primary'} fontWeight={700}>
            {translate(`transactionRow.${status}`)}
          </Tag>
        ) : (
          <VStack
            spacing={0}
            width={'full'}
            alignItems={'flex-start'}
          >
            <Translation translation={`assets.assetCards.rewards.claimableIn`} textStyle={'captionSmaller'} />
            {countdown}
          </VStack>
        )
      },
    },
    {
      id:'claim',
      width: '30%',
      accessor:'amount',
      disableSortBy: true,
      defaultCanSort: false,
      Header:translate('epochs.table.claim'),
      Cell: ({ value, row }: { value: CreditVaultWithdrawRequest["amount"], row: RowProps }) => {
        const status = getRequestStatus(row.original)
        const contractSendMethod = getContractSendMethod(row.original)
        const amount = fixTokenDecimals(value, (vault?.underlyingToken?.decimals || 18))
        const isDisabled = status !== 'claimable'
        return (
          <TransactionButton size={'xs'} text={'defi.claim'} vaultId={asset.id as string} assetId={asset.id as string} contractSendMethod={contractSendMethod} actionType={'claim'} amount={amount.toFixed(2)} width={'100%'} disabled={isDisabled} />
        )
      },
    }
  ]), [asset, translate, sortEnabled, vault, getRequestStatus, getRequestCountdown, getContractSendMethod])

  if (!account?.address || !asset || !vault || !(vault instanceof CreditVault) || !("getClaimContractSendMethod" in vault) || isEmpty(withdrawRequests)){
    return null
  }

  return (
    <AssetProvider
      assetId={asset?.id}
      wrapFlex={false}
    >
      <VStack
        spacing={6}
        width={'100%'}
        id={'vault-rewards'}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.withdrawRequests'} component={Text} textStyle={'heading'} fontSize={'h3'} />
        <Card
        >
          <TableWithPagination<CreditVaultWithdrawRequest> columns={columns} data={withdrawRequests || []} />
        </Card>
      </VStack>
    </AssetProvider>
  )
}