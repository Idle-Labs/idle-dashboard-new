import { Box, Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react"
import { AssetId, VaultContractCdoEpochData } from "constants/"
import { usePortfolioProvider } from "contexts/PortfolioProvider"
import dayjs from "dayjs"
import { apr2apy, BNify, toDayjs } from "helpers"
import { useMemo } from "react"

type CreditVaultPerformanceArgs = {
  assetId: AssetId
}

export const CreditVaultPerformance: React.FC<CreditVaultPerformanceArgs> = ({
  assetId
}) => {
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const vault = useMemo(() => {
    return selectVaultById(assetId)
  }, [assetId, selectVaultById])

  const groupedData = useMemo(() => {
    if (!vault || !asset || !("epochData" in asset) || !asset.epochData){
      return {}
    }

    const initialData = vault.getFlag('performance') || {}

    const groupedData = asset.epochData.epochs.reduce( (groupedData: any, epochData: VaultContractCdoEpochData) => {
      // const date = toDayjs(epochData.block.timestamp*1000).toDate()
      // const value = epochData.APRs.GROSS

      // const year = date.getFullYear();
      // const month = date.getMonth();

      // if (!groupedData[year]) {
      //   groupedData[year] = Array(13).fill([]);
      // }

      // groupedData[year][month] = [...groupedData[year][month], value];
      return groupedData
    }, {});

    Object.keys(groupedData).forEach((year) => {
      groupedData[year] = groupedData[year].map((monthData: any, monthIndex: number) => {
        if (monthData.length === 0 || new Date().getMonth()<=monthIndex) return 0;
        const sum = monthData.reduce((a: number, b: number) => a + b, 0);
        return sum / monthData.length;
      });
    });

    // Override with init data
    Object.keys(initialData).forEach( year => {
      initialData[year].forEach( (value: number, index: number) => {
        if (!groupedData[year]){
          groupedData[year] = Array(13).fill(0)
        }
        groupedData[year][index] = value
      })

      // Calculate YTD
      if (!groupedData[year][12]){
        const monthData = groupedData[year].filter( (v: number) => v>0 )
        const sum = monthData.reduce( (acc: number, v: number) => acc+v, 0)
        groupedData[year][12] = BNify(apr2apy(sum/100, 12)).times(100).toNumber()
      }
    })

    return groupedData;
  }, [asset, vault])

  return (
    <Box w="full" overflowX="auto">
      <Table variant="simple" width={'full'} size={'sm'}>
        <Thead>
          <Tr>
            <Th
              p={2}
              position={"sticky"}
              left={0}
              zIndex={1}
              color={'primary'}
              backgroundColor={"card.bg"}
            >
              Year
            </Th>
            {Array.from(Array(12).keys()).map( i => <Th key={i}>{dayjs().month(i).format('MMM')}</Th> )}
            <Th
              p={2}
              right={0}
              zIndex={1}
              position={"sticky"}
              textStyle={'bold'}
              backgroundColor={"card.bg"}
              color={'primary'}
            >
              YTD
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {Object.keys(groupedData).map((year) => (
            <Tr key={year}>
              <Td
                position={"sticky"}
                left={0}
                zIndex={1}
                backgroundColor={"card.bg"}
                textStyle={'bold'}
              >
                {year}
              </Td>
              {
              Array.from(Array(13).keys()).map( i => {
                const isLastColumn = i === 12
                return isLastColumn ? (
                  <Td position={'sticky'} p={2} right={0} zIndex={1} key={i} color={'primary'} backgroundColor={'card.bg'} textStyle={'bold'}>{groupedData[year][i] <= 0 ? '' : `${BNify(groupedData[year][i]).toFixed(2)}%`}</Td>
                ) : (
                  <Td p={2} key={i}>{groupedData[year][i] <= 0 ? '' : `${BNify(groupedData[year][i]).toFixed(3)}%`}</Td>
                )
              })
            }
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}