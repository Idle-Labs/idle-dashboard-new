import { CreditVaultEpochInterests, SECONDS_IN_YEAR } from "constants/";
import { useState, useMemo, useEffect } from "react";
import { bnOrZero, getChartTimestampBounds } from "helpers/";
import { usePortfolioProvider } from "contexts/PortfolioProvider";
import {
  AssetId,
  HistoryData,
  HistoryTimeframe,
  DateRange,
  Asset,
} from "constants/types";

export type RainbowData = {
  date: number;
  total: number;
  [k: AssetId]: number;
};

export type EpochsChartData = {
  total: HistoryData[];
  rainbow: RainbowData[];
};

type UseEpochsChartDataReturn = {
  assets?: Asset[];
  epochsChartData: EpochsChartData;
  epochsChartDataLoading: boolean;
};

type UseEpochsChartDataArgs = {
  assetIds: AssetId[];
  useRates?: boolean;
  dateRange?: DateRange;
  timeframe?: HistoryTimeframe;
};

type UseEpochsChartData = (
  args: UseEpochsChartDataArgs
) => UseEpochsChartDataReturn;

export const useEpochsChartData: UseEpochsChartData = (args) => {
  const [epochsChartDataLoading, setEpochsChartDataLoading] =
    useState<boolean>(true);
  const {
    selectors: { selectAssetsByIds, selectVaultById },
  } = usePortfolioProvider();

  const { assetIds, timeframe, dateRange } = args;

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return [];
    return selectAssetsByIds(assetIds);
  }, [assetIds, selectAssetsByIds]);

  const [timeframeStartTimestamp, timeframeEndTimestamp] = useMemo(
    () => getChartTimestampBounds(timeframe, dateRange),
    [timeframe, dateRange]
  );

  const epochsChartData = useMemo((): EpochsChartData => {
    const chartData: EpochsChartData = {
      total: [],
      rainbow: [],
    };

    const amountsByDate = assets.reduce(
      (
        amountsByDate: Record<number, RainbowData>,
        asset: Asset,
        assetIndex: number
      ) => {
        if (
          !asset.id ||
          !("epochData" in asset) ||
          (asset.epochData && !("epochsInterests" in asset.epochData))
        ) {
          return amountsByDate;
        }

        const epochsInterests = asset?.epochData?.epochsInterests;

        if (!epochsInterests || !epochsInterests.length) return amountsByDate;
        const vault = selectVaultById(asset.id);

        epochsInterests.forEach((epochInterests: CreditVaultEpochInterests) => {
          const date = epochInterests.endTimestamp;
          const value = bnOrZero(epochInterests.apr?.net).times(100).toNumber();

          if (!amountsByDate[date]) {
            amountsByDate[date] = {
              date,
              total: 0,
            };
          }
          if (asset.id) {
            amountsByDate[date][asset.id] = value;

            // Take the first asset to populate the total chart
            if (!assetIndex) {
              chartData.total.push({
                date,
                value,
              });
            }
          }
        });
        return amountsByDate;
      },
      {}
    );

    chartData.rainbow = Object.values(amountsByDate);

    return chartData;
  }, [assets, selectVaultById]);

  useEffect(() => {
    if (!epochsChartData.rainbow.length) return;
    setEpochsChartDataLoading(false);

    return () => {
      setEpochsChartDataLoading(true);
    };
  }, [epochsChartData]);

  return {
    assets,
    epochsChartData,
    epochsChartDataLoading,
  };
};