import { Table, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react"
import { AssetId, VaultContractCdoEpochData } from "constants/"
import { usePortfolioProvider } from "contexts/PortfolioProvider"
import dayjs from "dayjs"
import { toDayjs } from "helpers"
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

      const date = toDayjs(epochData.block.timestamp*1000).toDate()
      const value = epochData.APRs.GROSS

      const year = date.getFullYear();
      const month = date.getMonth();

      if (!groupedData[year]) {
        groupedData[year] = Array(12).fill([]);
      }

      groupedData[year][month] = [...groupedData[year][month], value];
      return groupedData
    }, {});

    Object.keys(groupedData).forEach((year) => {
      groupedData[year] = groupedData[year].map((monthData: any) => {
        if (monthData.length === 0) return 0;
        const sum = monthData.reduce((a: number, b: number) => a + b, 0);
        return sum / monthData.length;
      });
    });

    // Override with init data
    Object.keys(initialData).forEach( year => {
      initialData[year].forEach( (value: number, index: number) => {
        if (!groupedData[year]){
          groupedData[year] = Array(12).fill(0)
        }
        groupedData[year][index] = value
      })
    })

    return groupedData;
  }, [asset, vault])

  return (
    <Table variant="simple" width={'full'} size={'sm'}>
    <Thead>
      <Tr>
        <Th>Year</Th>
        {
          Array.from(Array(12).keys()).map( i => <Th key={i}>{dayjs().month(i).format('MMM')}</Th> )
        }
      </Tr>
    </Thead>
    <Tbody>
      {Object.keys(groupedData).map((year) => (
        <Tr key={year}>
          <Td><strong>{year}</strong></Td>
          {groupedData[year].map((value: number, index: number) => (
            <Td key={index}>{value <= 0 ? '' : `${value.toFixed(2)}%`}</Td>
          ))}
        </Tr>
      ))}
    </Tbody>
  </Table>
  )
}