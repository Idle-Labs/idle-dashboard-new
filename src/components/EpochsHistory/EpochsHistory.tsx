import { Tag, Text, VStack } from "@chakra-ui/react"
import { Amount } from "components/Amount/Amount"
import { useAssetProvider } from "components/AssetProvider/AssetProvider"
import { Card } from "components/Card/Card"
import { ReactTable } from "components/ReactTable/ReactTable"
import { TokenAmount } from "components/TokenAmount/TokenAmount"
import { Translation } from "components/Translation/Translation"
import { AssetId, BigNumber, DATETIME_FORMAT, NumberType, vaultsStatusSchemes } from "constants/"
import { useI18nProvider } from "contexts/I18nProvider"
import { usePortfolioProvider } from "contexts/PortfolioProvider"
import { useWalletProvider } from "contexts/WalletProvider"
import { BNify, dateToLocale, fixTokenDecimals, formatDate, sortNumeric, toDayjs } from "helpers"
import { useMemo } from "react"
import { useTranslate } from "react-polyglot"
import { Column, Row } from "react-table"
import { CreditVault } from "vaults/CreditVault"

type EpochsHistoryArgs = {
  assetId: AssetId
  sortEnabled?: boolean
}

interface VaultContractCdoEpochData {
  TVL: {
    token: string
    USD: string
  }

  apr: number
  lastApr: number
  lastInterest: string | number
  expectedInterest: string | number
  deposits: string | number
  duration: number
  unclaimedFees: string | number

  startDate?: string
  endDate?: string
  count?: number

  status: 'WAITING' | 'RUNNING' | 'DEFAULTED'

  instantWithdraws?: {
    disabled?: boolean
    deadline?: string
    allowed: boolean
    delay: number
    amount: string | number
    aprDelta: number
  }
  withdraws?: {
    amount: string | number
    fees: string | number
  }
}

type RowProps = Row<VaultContractCdoEpochData>

export const EpochsHistory: React.FC<EpochsHistoryArgs> = ({
  assetId,
  sortEnabled = true,
}) => {
  const translate = useTranslate()
  const { asset, vault, underlyingAsset } = useAssetProvider()

  const columns: Column<VaultContractCdoEpochData>[] = useMemo(() => ([
    // {
    //   id:'count',
    //   width: '10%',
    //   accessor:'count',
    //   disableSortBy: !sortEnabled,
    //   defaultCanSort: sortEnabled,
    //   Header:translate('epochs.table.count'),
    //   Cell: ({ value }: { value: VaultContractCdoEpochData["count"] }) => {
    //     return (
    //       <Amount.Int textStyle={'tableCell'} value={value} />
    //     )
    //   },
    //   sortType: sortNumeric
    // },
    {
      id:'status',
      width: '15%',
      accessor:'status',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.status'),
      Cell: ({ value, row }: { value: VaultContractCdoEpochData["status"], row: RowProps }) => {
        const statusKey =  toDayjs(row.original.endDate).isSameOrBefore(Date.now()) ? 'closed' : value.toLowerCase()
        console.log(row.original.endDate, statusKey)
        const colorScheme = vaultsStatusSchemes[statusKey]
        const status = translate(`assets.status.epoch.${statusKey}`)
        return (
          <Tag variant={'solid'} colorScheme={colorScheme} color={'primary'} fontWeight={700}>{status}</Tag>
        )
      },
      sortType: sortNumeric
    },
    {
      id:'startDate',
      accessor:'startDate',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.start'),
      Cell: ({ value }: { value: VaultContractCdoEpochData["startDate"] }) => {
        return (
          <Text textStyle={'tableCell'}>{value ? formatDate(value, DATETIME_FORMAT) : '-'}</Text>
        )
      },
      sortType: sortNumeric
    },
    {
      id:'endDate',
      accessor:'endDate',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.end'),
      Cell: ({ value }: { value: VaultContractCdoEpochData["endDate"] }) => {
        return (
          <Text textStyle={'tableCell'}>{value ? formatDate(value, DATETIME_FORMAT) : '-'}</Text>
        )
      },
      sortType: sortNumeric
    },
    {
      id:'apr',
      width: '15%',
      accessor:'apr',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.apr'),
      Cell: ({ value }: { value: VaultContractCdoEpochData["apr"] }) => {
        return (
          <Amount.Percentage textStyle={'tableCell'} value={value} />
        )
      },
      sortType: sortNumeric
    },
    {
      id:'expectedInterest',
      accessor:'expectedInterest',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.interests'),
      Cell: ({ value }: { value: VaultContractCdoEpochData["expectedInterest"] }) => {
        return asset && underlyingAsset && (
          <TokenAmount assetId={asset.underlyingId} textStyle={'tableCell'} amount={fixTokenDecimals(value, underlyingAsset.decimals)} />
        )
      },
      sortType: sortNumeric
    },
  ]), [sortEnabled, translate, asset, underlyingAsset])

  const initialState = {
    sortBy: [
      {
        id: 'number',
        desc: true
      }
    ]
  }

  const data = useMemo(() => {
    return [
      {
        "TVL": {
          "token": "1500190",
          "USD": "1500190"
        },
        "status": "RUNNING",
        "expectedInterest": "14",
        "lastApr": 246,
        "lastInterest": "12",
        "duration": 120,
        "endDate": "2024-09-16T17:08:47.000Z",
        "unclaimedFees": "0",
        "instantWithdraws": {
          "deadline": "2024-09-16T17:07:47.000Z",
          "allowed": true,
          "delay": 60,
          "aprDelta": 1,
          "amount": "0"
        },
        "withdraws": {
          "fees": "0",
          "amount": "0"
        },
        "apr": 246,
        "deposits": "0",
        "startDate": "2024-09-16T17:06:47.000Z",
        "count": 8
      }
    ] as VaultContractCdoEpochData[]
  }, [])

  if (!(vault instanceof CreditVault)){
    return null
  }

  return (
    <VStack
      spacing={6}
      width={'100%'}
      id={'vault-rewards'}
      alignItems={'flex-start'}
    >
      <Translation translation={'epochs.epochsHistory'} component={Text} textStyle={'heading'} fontSize={'h3'} />
      <Card
      >
        <ReactTable columns={columns} data={data} page={1} rowsPerPage={data.length} initialState={initialState} />
      </Card>
    </VStack>
  )
}