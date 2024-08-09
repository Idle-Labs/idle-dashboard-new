import { strategies } from "constants/";
import { useState, useMemo, useEffect } from "react";
import { BNify, getChartTimestampBounds } from "helpers/";
import { usePortfolioProvider } from "contexts/PortfolioProvider";
import {
  HistogramChartLabels,
  HistogramChartColors,
} from "components/HistogramChart/HistogramChart";
import {
  AssetId,
  HistoryData,
  RainbowData,
  HistoryTimeframe,
  DateRange,
  Asset,
} from "constants/types";

export type EarningsChartData = {
  total: HistoryData[];
  rainbow: RainbowData[];
};

type ExtraData = {
  labels: HistogramChartLabels;
  colors: HistogramChartColors;
};

type UseEarningsChartDataReturn = {
  earningsChartData: EarningsChartData;
  earningsChartDataLoading: boolean;
} & ExtraData;

type UseEarningsChartDataArgs = {
  assetIds: AssetId[];
  dateRange?: DateRange;
  timeframe?: HistoryTimeframe;
  useDollarConversion?: boolean;
};

type UseEarningsChartData = (
  args: UseEarningsChartDataArgs
) => UseEarningsChartDataReturn;

export const useEarningsChartData: UseEarningsChartData = ({
  assetIds,
  dateRange,
  timeframe,
  useDollarConversion = true,
}) => {
  const [earningsChartDataLoading, setEarningsChartDataLoading] =
    useState<boolean>(true);
  const {
    historicalTvls,
    selectors: {
      selectAssetsByIds,
      selectVaultById,
      selectAssetHistoricalTvls,
      selectAssetHistoricalTvlsUsd,
    },
  } = usePortfolioProvider();

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return [];
    return selectAssetsByIds(assetIds);
  }, [assetIds, selectAssetsByIds]);

  const [timeframeStartTimestamp, timeframeEndTimestamp] = useMemo(
    () => getChartTimestampBounds(timeframe, dateRange),
    [timeframe, dateRange]
  );

  const earningsChartData = useMemo((): EarningsChartData => {
    const chartData: EarningsChartData = {
      total: [],
      rainbow: [],
    };

    if (!Object.keys(historicalTvls).length) return chartData;

    const volumeByDate = assets.reduce(
      (volumeByDate: Record<number, RainbowData>, asset: Asset) => {
        if (!asset.id) return volumeByDate;
        const tvls = useDollarConversion
          ? selectAssetHistoricalTvlsUsd(asset.id)
          : selectAssetHistoricalTvls(asset.id);
        if (!tvls) return volumeByDate;
        const vault = selectVaultById(asset.id);

        let prevTvl: HistoryData | null = null;
        tvls.forEach((tvl: HistoryData) => {
          const date = tvl.date;

          const assetStartTimestamp =
            "stats" in vault && vault.stats?.startTimestamp;
          const startTimestampToUse =
            assetStartTimestamp && assetStartTimestamp > timeframeStartTimestamp
              ? assetStartTimestamp
              : timeframeStartTimestamp;

          if (
            date < startTimestampToUse ||
            (timeframeEndTimestamp && date > timeframeEndTimestamp)
          )
            return;

          if (prevTvl && asset.id) {
            if (!volumeByDate[date]) {
              volumeByDate[date] = {
                date,
                total: 0,
              };
            }
            const volume = BNify(tvl.value).minus(prevTvl.value);
            volumeByDate[date][asset.id] = Number(volume.toFixed(8));
            volumeByDate[date].total = Number(
              BNify(volumeByDate[date].total).plus(volume).toFixed(8)
            );
          }

          prevTvl = tvl;
        });
        return volumeByDate;
      },
      {}
    );

    chartData.total = (Object.values(volumeByDate) as Array<RainbowData>).map(
      (v: RainbowData) => ({
        date: v.date,
        value: v.total,
      })
    );

    chartData.rainbow = Object.values(volumeByDate);

    return chartData;
  }, [
    assets,
    useDollarConversion,
    selectVaultById,
    historicalTvls,
    selectAssetHistoricalTvls,
    selectAssetHistoricalTvlsUsd,
    timeframeStartTimestamp,
    timeframeEndTimestamp,
  ]);

  const extraData = useMemo((): ExtraData => {
    if (!assets.length)
      return {
        labels: {},
        colors: {},
      };
    return assets.reduce(
      (extraData: ExtraData, asset: Asset) => {
        return {
          ...extraData,
          labels: {
            ...extraData.labels,
            [asset.id as string]: asset.name,
          },
          colors: {
            ...extraData.colors,
            [asset.id as string]: strategies[asset.type as string].color,
          },
        };
      },
      {
        labels: {},
        colors: {},
      }
    );
  }, [assets]);

  useEffect(() => {
    if (!earningsChartData.rainbow.length) return;
    setEarningsChartDataLoading(false);

    return () => {
      setEarningsChartDataLoading(true);
    };
  }, [earningsChartData]);

  return {
    earningsChartData,
    earningsChartDataLoading,
    labels: extraData.labels,
    colors: extraData.colors,
  };
};
