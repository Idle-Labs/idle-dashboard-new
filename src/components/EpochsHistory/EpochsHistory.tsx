import { Tag, Text, VStack } from "@chakra-ui/react"
import { Amount } from "components/Amount/Amount"
import { useAssetProvider } from "components/AssetProvider/AssetProvider"
import { Card } from "components/Card/Card"
import { TableWithPagination } from "components/TableWithPagination/TableWithPagination"
import { TokenAmount } from "components/TokenAmount/TokenAmount"
import { Translation } from "components/Translation/Translation"
import { DATETIME_FORMAT, VaultContractCdoEpochData, vaultsStatusSchemes } from "constants/"
import { fixTokenDecimals, formatDate, sortNumeric, toDayjs } from "helpers"
import { useMemo } from "react"
import { useTranslate } from "react-polyglot"
import { Column, Row } from "react-table"
import { CreditVault } from "vaults/CreditVault"

type EpochsHistoryArgs = {
  sortEnabled?: boolean
}

type RowProps = Row<VaultContractCdoEpochData>

export const EpochsHistory: React.FC<EpochsHistoryArgs> = ({
  sortEnabled = true,
}) => {
  const translate = useTranslate()
  const { asset, vault, underlyingAsset } = useAssetProvider()

  // @ts-ignore
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
      id:'tvl',
      width: '15%',
      accessor:'TVL.USD',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.tvl'),
      Cell: ({ value }: { value: VaultContractCdoEpochData["TVL"]["USD"] }) => {
        return asset && underlyingAsset && (
          <TokenAmount size={'xs'} assetId={asset.underlyingId} textStyle={'tableCell'} amount={fixTokenDecimals(value, underlyingAsset.decimals)} />
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
          <TokenAmount size={'xs'} assetId={asset.underlyingId} textStyle={'tableCell'} amount={fixTokenDecimals(value, underlyingAsset.decimals)} />
        )
      },
      sortType: sortNumeric
    },
    {
      id:'status',
      width: '10%',
      accessor:'status',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.status'),
      Cell: ({ value, row }: { value: VaultContractCdoEpochData["status"], row: RowProps }) => {
        const statusKey =  toDayjs(row.original.endDate).isSameOrBefore(Date.now()) ? 'closed' : value.toLowerCase()
        const colorScheme = vaultsStatusSchemes[statusKey]
        const status = translate(`assets.status.epoch.${statusKey}`)
        return (
          <Tag variant={'solid'} colorScheme={colorScheme} color={'primary'} fontWeight={700}>{status}</Tag>
        )
      },
      sortType: sortNumeric
    },
  ]), [sortEnabled, translate, asset, underlyingAsset])

  const initialState = useMemo(() => ({
    sortBy: [
      {
        id: 'count',
        desc: false
      }
    ]
  }), [])

  if (!asset || !(vault instanceof CreditVault) || !("epochData" in asset) || !asset.epochData || !("epochs" in asset.epochData)){
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
        <TableWithPagination<VaultContractCdoEpochData> columns={columns} data={asset.epochData.epochs || []} initialState={initialState} />
      </Card>
    </VStack>
  )
}