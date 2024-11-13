import { HStack, Stack, VStack, Text, Tag } from "@chakra-ui/react"
import { Amount } from "components/Amount/Amount"
import { AssetLabel } from "components/AssetLabel/AssetLabel"
import { AssetProvider, useAssetProvider } from "components/AssetProvider/AssetProvider"
import { Card } from "components/Card/Card"
import { TableWithPagination } from "components/TableWithPagination/TableWithPagination"
import { TokenAmount } from "components/TokenAmount/TokenAmount"
import { TransactionButton } from "components/TransactionButton/TransactionButton"
import { Translation } from "components/Translation/Translation"
import { AssetId, CreditVaultWithdrawRequest, DATETIME_FORMAT, NumberType, VaultBlockRequest, vaultsStatusSchemes } from "constants/"
import { usePortfolioProvider } from "contexts/PortfolioProvider"
import { useThemeProvider } from "contexts/ThemeProvider"
import { useWalletProvider } from "contexts/WalletProvider"
import { BNify, bnOrZero, cmpAddrs, fixTokenDecimals, formatDate, isEmpty, sortNumeric, toDayjs } from "helpers"
import { useCallback, useMemo } from "react"
import Countdown from "react-countdown"
import { useTranslate } from "react-polyglot"
import { Row } from "react-table"
import { CreditVault } from "vaults/CreditVault"

type EpochWithdrawRequestArgs = {
  assetId: AssetId
  sortEnabled?: boolean
}

interface WalletRequest {
  type: "QUEUE" | "INSTANT" | "STANDARD"
  action: "DEPOSIT" | "WITHDRAW";
  amount: NumberType;
  requestedOn?: string;
  status: "PENDING" | "WAITING" | "CLAIMABLE";
  epochNumber?: number;
  countdown?: React.ReactNode
}

type RowProps = Row<WalletRequest>

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
    if (epochData.epochNumber <= withdrawRequest.epochNumber){
      // Wait and of epoch
      if (epochData.isEpochRunning){
        return toDayjs(epochData?.epochEndDate)
      }
      // Wait for next epoch end
      return toDayjs(bnOrZero(epochData?.epochEndDate).plus(bnOrZero(epochData.epochDuration).times(1000)).plus(bnOrZero(epochData?.bufferPeriod).times(1000)).toNumber())
    }

    return null
  }, [epochData])

  const getRequestStatus = useCallback((withdrawRequest: CreditVaultWithdrawRequest): WalletRequest["status"] => {
    const claimDeadline = getRequestClaimDeadline(withdrawRequest)

    if (withdrawRequest.isInstant){
      if (!epochData.allowInstantWithdraw){
        if (claimDeadline && claimDeadline.isSameOrBefore(toDayjs())){
          return 'WAITING'
        }
        return 'PENDING'
      }
    } else {
      if (epochData.epochNumber <= withdrawRequest.epochNumber){
        return 'PENDING'
      }
    }
  
    return !claimDeadline || claimDeadline.isSameOrBefore(toDayjs()) ? 'CLAIMABLE' : 'PENDING'
  }, [epochData, getRequestClaimDeadline])

  const getRequestCountdown = useCallback((withdrawRequest: CreditVaultWithdrawRequest) => {
    const status = getRequestStatus(withdrawRequest)
    if (status === 'CLAIMABLE'){
      return null
    }
    const claimDeadline = getRequestClaimDeadline(withdrawRequest)

    return claimDeadline ? <Countdown date={claimDeadline.toDate()} /> : null
  }, [getRequestStatus, getRequestClaimDeadline])

  const getContractSendMethod = useCallback((request: WalletRequest) => {

    // Queue requests
    if (request.type === 'QUEUE'){
      switch (request.action){
        case 'WITHDRAW':
         
        break;
        case 'DEPOSIT':
          if (request.status === 'PENDING'){
            return vault?.getDeleteRequestDepositSendMethod(request.epochNumber)
          } else if (request.status === 'CLAIMABLE'){
            return vault?.getClaimRequestDepositSendMethod(request.epochNumber)
          }
          return
        default:
        break;
      }
    }

    // Withdraw from vault
    switch (request.action){
      case 'WITHDRAW':
        if (request.type === 'INSTANT'){
          if (!vault || !("getClaimInstantContractSendMethod" in vault)) return
          return vault?.getClaimInstantContractSendMethod()
        }
        if (!vault || !("getClaimContractSendMethod" in vault)) return
        return vault?.getClaimContractSendMethod()
        default:
          break;
    }

  }, [vault])

  // @ts-ignore
  const columns: Column<WalletRequest>[] = useMemo(() => ([
    // {
    //   width: '16%',
    //   id:'epochNumber',
    //   accessor: 'epochNumber',
    //   disableSortBy: !sortEnabled,
    //   defaultCanSort: sortEnabled,
    //   Header:translate('epochs.table.epochNumber'),
    //   Cell: ({ value }: { value: WalletRequest["epochNumber"] }) => {
    //     return (
    //       <Amount.Int fontSize={'h4'} textStyle={'heading'} value={value} />
    //     )
    //   },
    // },
    {
      id:'action',
      width: '16%',
      accessor:'action',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('common.action'),
      Cell: ({ value }: { value: WalletRequest["action"] }) => {
        return (
          <Translation translation={`common.${value.toLowerCase()}`} fontSize={'h4'} textStyle={'heading'} />
        )
      },
    },
    {
      id: 'type',
      width: '16%',
      accessor: 'type',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header: translate('common.type'),
      Cell: ({ value }: { value: WalletRequest["type"] }) => {
        return (
          <Translation translation={`assets.status.epoch.${value.toLowerCase()}`} fontSize={'h4'} textStyle={'heading'} />
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
      Cell: ({ value }: { value: WalletRequest["type"] }) => {
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
        const status = row.original.status.toLowerCase()
        const countdown = row.original.countdown
        return status !== 'PENDING' ? (
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
      id:'cta',
      width: '30%',
      accessor:'status',
      disableSortBy: true,
      defaultCanSort: false,
      Header:translate('epochs.table.claim'),
      Cell: ({ value, row }: { value: WalletRequest["status"], row: RowProps }) => {
        const contractSendMethod = getContractSendMethod(row.original)
        if (row.original.type === 'QUEUE' && value === 'PENDING'){
          const isDisabled = !!epochData?.isEpochRunning
          return (
            <TransactionButton size={'xs'} text={'common.cancel'} vaultId={asset.id as string} assetId={asset.id as string} contractSendMethod={contractSendMethod} actionType={'cancel'} width={'100%'} disabled={isDisabled} />
          )
        }
        const amount = fixTokenDecimals(row.original.amount, (vault?.underlyingToken?.decimals || 18))
        const isDisabled = value !== 'CLAIMABLE'
        return (
          <TransactionButton size={'xs'} text={'common.claim'} vaultId={asset.id as string} assetId={asset.id as string} contractSendMethod={contractSendMethod} actionType={'claim'} amount={amount.toFixed(2)} width={'100%'} disabled={isDisabled} />
        )
      },
    }
  ]), [asset, translate, sortEnabled, vault, epochData, getContractSendMethod])

  const walletRequests: WalletRequest[] = useMemo(() => {
    if (!asset || !account) return []
    const requests: WalletRequest[] = withdrawRequests ? withdrawRequests.map( request => ({
      type: request.isInstant ? "INSTANT" : "STANDARD",
      action: "WITHDRAW",
      amount: request.amount,
      epochNumber: request.epochNumber,
      status: getRequestStatus(request),
      countdown: getRequestCountdown(request),
    }) ) : []

    const queueRequests = asset.requests ? asset.requests.filter( (request: VaultBlockRequest) => cmpAddrs(request.walletAddress, account?.address) ).map( (request: VaultBlockRequest) => ({
      type: "QUEUE",
      action: request.type,
      amount: BNify(request.amount),
      epochNumber: request.epochNumber,
      status: request.status === 'PROCESSED' ? 'CLAIMABLE' : 'PENDING',
      requestedOn: request.requestedOn
    }) ) : []

    return [
      ...requests,
      ...queueRequests
    ]
  }, [withdrawRequests, asset, account, getRequestStatus, getRequestCountdown])

  if (!account?.address || !asset || !vault || !(vault instanceof CreditVault) || !("getClaimContractSendMethod" in vault) || isEmpty(walletRequests)){
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
        <Translation translation={'defi.pendingRequests'} component={Text} textStyle={'heading'} fontSize={'h3'} />
        <Card
        >
          <TableWithPagination<WalletRequest> columns={columns} data={walletRequests || []} />
        </Card>
      </VStack>
    </AssetProvider>
  )
}