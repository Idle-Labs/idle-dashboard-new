import { Tag, Text, VStack } from "@chakra-ui/react"
import { Amount } from "components/Amount/Amount"
import { useAssetProvider } from "components/AssetProvider/AssetProvider"
import { Card } from "components/Card/Card"
import { TableWithPagination } from "components/TableWithPagination/TableWithPagination"
import { TokenAmount } from "components/TokenAmount/TokenAmount"
import { Translation } from "components/Translation/Translation"
import { DATETIME_FORMAT, VaultContractCdoEpochData, vaultsStatusSchemes } from "constants/"
import { useThemeProvider } from "contexts/ThemeProvider"
import { apr2apy, bnOrZero, compoundVaultApr, fixTokenDecimals, formatDate, sortDate, sortNumeric } from "helpers"
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
  const { isMobile } = useThemeProvider()
  const { asset, vault, underlyingAsset } = useAssetProvider()

  // @ts-ignore
  const columns: Column<VaultContractCdoEpochData>[] = useMemo(() => ([
    {
      id:'count',
      width: '10%',
      accessor:'count',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.count'),
      Cell: ({ value }: { value: VaultContractCdoEpochData["count"] }) => {
        return (
          <Amount.Int textStyle={'tableCell'} value={value} />
        )
      },
      sortType: sortNumeric
    },
    {
      width: '17%',
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
      sortType: sortDate
    },
    {
      id:'endDate',
      width: '17%',
      accessor:'endDate',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.end'),
      Cell: ({ value }: { value: VaultContractCdoEpochData["endDate"] }) => {
        return (
          <Text textStyle={'tableCell'}>{value ? formatDate(value, DATETIME_FORMAT) : '-'}</Text>
        )
      },
      sortType: sortDate
    },
    {
      id:'apr',
      accessor:'APRs.GROSS',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.netApy'),
      Cell: ({ value }: { value: number }) => {
        if (!vault || !asset){
          return null
        }
        const grossApr = bnOrZero(value)
        const netApr = grossApr.minus(grossApr.times(bnOrZero(asset?.fee)))
        const netApy = compoundVaultApr(netApr, asset.epochData?.epochDuration)
        if ("mode" in vault && vault.mode === 'STRATEGY' && bnOrZero(netApy).lte(0)){
          return <Text textStyle={'tableCell'}>-</Text>
        }
        return (
          <Amount.Percentage textStyle={'tableCell'} value={netApy} />
        )
      },
      sortType: sortNumeric
    },
    {
      id:'tvl',
      accessor:'TVL.USD',
      isVisible: !isMobile,
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.tvl'),
      Cell: ({ value }: { value: string }) => {
        return asset && underlyingAsset && (
          <TokenAmount showIcon={false} size={'xs'} assetId={asset.underlyingId} textStyle={'tableCell'} abbreviate={false} amount={fixTokenDecimals(value, underlyingAsset.decimals)} />
        )
      },
      sortType: sortNumeric
    },
    {
      id:'expectedInterest',
      isVisible: !isMobile,
      accessor:'expectedInterest',
      disableSortBy: !sortEnabled,
      defaultCanSort: sortEnabled,
      Header:translate('epochs.table.interests'),
      Cell: ({ value }: { value: VaultContractCdoEpochData["expectedInterest"] }) => {
        return asset && underlyingAsset && (
          <TokenAmount showIcon={false} size={'xs'} assetId={asset.underlyingId} textStyle={'tableCell'} abbreviate={false} amount={fixTokenDecimals(value, underlyingAsset.decimals)} />
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
      Cell: ({ value }: { value: VaultContractCdoEpochData["status"] }) => {
        const statusKey = value.toLowerCase()// value.toLowerCase() === 'running' && toDayjs(row.original.endDate).isSameOrBefore(Date.now()) ? 'finished' : value.toLowerCase()
        const colorScheme = vaultsStatusSchemes[statusKey]
        const status = translate(`assets.status.epoch.${statusKey}`)
        return (
          <Tag variant={'solid'} colorScheme={colorScheme} color={'primary'} fontWeight={700}>{status}</Tag>
        )
      },
      sortType: sortNumeric
    },
  ]), [sortEnabled, isMobile, translate, asset, underlyingAsset, vault])

  const initialState = useMemo(() => ({
    sortBy: [
      {
        id: 'count',
        desc: false
      }
    ]
  }), [])

  if (isMobile || !asset || !(vault instanceof CreditVault) || !("epochData" in asset) || !asset.epochData || !("epochs" in asset.epochData)){
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
        <TableWithPagination<VaultContractCdoEpochData> columns={columns.filter( (col: any) => col.isVisible === undefined || !!col.isVisible )} data={asset.epochData.epochs || []} initialState={initialState} />
      </Card>
    </VStack>
  )
}