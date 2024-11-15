import { SimpleGrid, VStack } from "@chakra-ui/react";
import { Amount } from "components/Amount/Amount";
import { AssetProvider } from "components/AssetProvider/AssetProvider";
import { Card } from "components/Card/Card";
import { EpochWithdrawInterestButton } from "components/OperativeComponent/EpochVaultMessage";
import { Translation } from "components/Translation/Translation";
import{ AssetId, CreditVaultEpoch, VaultContractCdoEpochData } from "constants/";
import { usePortfolioProvider } from "contexts/PortfolioProvider";
import React, { useMemo } from "react";

type NextEpochOverviewArgs = {
  assetId: AssetId
}

export const NextEpochOverview: React.FC<NextEpochOverviewArgs> = ({
  assetId
}) => {
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(assetId)
  }, [selectVaultById, assetId])

  const epochData = useMemo(() => {
    return asset?.epochData
  }, [asset])

  const nextEpoch = useMemo(() => {
    if (!epochData || !("epochs" in epochData) || !epochData.epochs?.length) return
    return epochData.epochs.find( (epoch: VaultContractCdoEpochData) => epoch.status === 'WAITING' )
  }, [epochData])
  
  if (!nextEpoch){
    return null
  }

  return (
    <AssetProvider
      wrapFlex={false}
      flex={1}
      assetId={assetId}
    >
      <VStack
        spacing={6}
        width={'100%'}
        id={'vault-rewards'}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.nextCycle'} textStyle={'heading'} fontSize={'h3'} />
        <Card.Outline>
          <SimpleGrid
            columns={5}
            width={'full'}
            spacing={[10, 14]}
            alignItems={'flex-start'}
          >
            <VStack
              spacing={2}
              alignItems={'flex-start'}
            >
              <Translation translation={'epochs.table.epochNumber'} textStyle={'titleSmall'} />
              <Amount.Int fontSize={'h4'} textStyle={'heading'} value={nextEpoch.count} />
            </VStack>

            <VStack
              spacing={2}
              alignItems={'flex-start'}
            >
              <Translation translation={'epochs.table.countdown'} textStyle={'titleSmall'} />
              <AssetProvider.EpochCountdown fontSize={'h4'} textStyle={'heading'} />
            </VStack>

            <VStack
              spacing={2}
              alignItems={'flex-start'}
            >
              <Translation translation={'defi.apr'} textStyle={'titleSmall'} />
              <Amount.Percentage value={nextEpoch.APRs.GROSS} fontSize={'h4'} textStyle={'heading'} />
            </VStack>

            <VStack
              spacing={2}
              alignItems={'flex-start'}
            >
              <Translation translation={'defi.expectedInterests'} textStyle={'titleSmall'} />
              <AssetProvider.EpochExpectedInterest fontSize={'h4'} textStyle={'heading'} />
            </VStack>

            <EpochWithdrawInterestButton />
            
          </SimpleGrid>
        </Card.Outline>
      </VStack>
    </AssetProvider>
  )
}