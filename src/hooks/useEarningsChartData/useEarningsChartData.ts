import BigNumber from "bignumber.js";
import { DATE_FORMAT, strategies, TransactionDataApiV2 } from "constants/";
import { useState, useMemo, useEffect } from "react";
import {
  BNify,
  bnOrZero,
  fixTokenDecimals,
  floorTimestamp,
  getChartTimestampBounds,
  getTokenBlocksFromApiV2,
  getTokensFromApiV2,
  getTransactionsFromApiV2,
  getWalletBlocksFromApiV2,
  getWalletsVaultsPerformancesFromApiV2,
  sortArrayByKey,
  toDayjs,
} from "helpers/";
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
import { useWalletProvider } from "contexts/WalletProvider";
import { useThemeProvider } from "contexts/ThemeProvider";

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
  const { theme } = useThemeProvider();
  const { account } = useWalletProvider();

  const [earningsChartData, setEarningsChartData] = useState<EarningsChartData>(
    {
      total: [],
      rainbow: [],
    }
  );
  const [earningsChartDataLoading, setEarningsChartDataLoading] =
    useState<boolean>(true);

  const [timeframeStartTimestamp, timeframeEndTimestamp] = useMemo(
    () => getChartTimestampBounds(timeframe, dateRange),
    [timeframe, dateRange]
  );

  useEffect(() => {
    if (!account?.address) return;
    console.log("account", account);
    (async () => {
      const transactions = await getTransactionsFromApiV2(
        account.address,
        timeframeStartTimestamp,
        timeframeEndTimestamp,
        "timestamp",
        "asc"
      );

      const walletPerformances = await getWalletsVaultsPerformancesFromApiV2(
        account.address,
        timeframeStartTimestamp,
        timeframeEndTimestamp,
        "timestamp",
        "asc"
      );

      console.log("transactions", transactions);
      console.log("walletPerformances", walletPerformances);

      const tokenIdsBlocks = transactions.reduce(
        (acc: Record<string, number[]>, transaction: TransactionDataApiV2) => {
          return {
            ...acc,
            [transaction.tokenId]: [
              ...(acc[transaction.tokenId] || []),
              transaction.block.number,
            ],
          };
        },
        {}
      );

      const tokensById: any = (
        await getTokensFromApiV2(Object.keys(tokenIdsBlocks))
      ).reduce(
        (acc: Record<string, any>, token: any) => ({
          ...acc,
          [token._id]: token,
        }),
        {}
      );

      console.log("tokensById", tokensById);

      const tokenBlocksPromises = Object.entries(tokenIdsBlocks).map(
        ([tokenId, blocks]) =>
          getTokenBlocksFromApiV2(tokenId, blocks).then((tokenBlocks) => ({
            [tokenId]: tokenBlocks,
          }))
      );

      const tokenBlocks = (await Promise.all(tokenBlocksPromises)).reduce(
        (acc: Record<string, any>, response: any) => {
          const tokenId = Object.keys(response)[0] as any;
          const tokenBlocks = Object.values(response)[0] as any;
          if (!tokenBlocks.length) return acc;
          return {
            ...acc,
            [tokenId]: tokenBlocks.reduce(
              (acc: Record<string, any>, tokenBlock: any) => {
                return {
                  ...acc,
                  [tokenBlock.block.number]: tokenBlock,
                };
              },
              {}
            ),
          };
        },
        {}
      );

      console.log("tokenBlocks", tokenBlocks);

      const cumulativeVaultsEarnings: Record<string, BigNumber> = {};
      const dailyVaultsEarnings = walletPerformances.reduce(
        (acc: Record<string, BigNumber>, walletPerformance: any) => {
          const dayTimestamp = floorTimestamp(
            walletPerformance.block.timestamp * 1000
          );

          if (
            !cumulativeVaultsEarnings[walletPerformance.vaultId] ||
            BNify(walletPerformance.earnings.USD).lte(0)
          ) {
            cumulativeVaultsEarnings[walletPerformance.vaultId] = BNify(0);
          } else {
            cumulativeVaultsEarnings[walletPerformance.vaultId] =
              cumulativeVaultsEarnings[walletPerformance.vaultId].plus(
                walletPerformance.earnings.USD
              );
          }

          const totalBalance = Object.values(cumulativeVaultsEarnings)
            .reduce((sum: BigNumber, balance: BigNumber) => {
              return sum.plus(balance);
            }, BNify(0))
            .div(1e6);

          console.log(
            walletPerformance.block.timestamp,
            walletPerformance.vaultId,
            walletPerformance.earnings.USD.toString(),
            totalBalance.toString()
          );

          return {
            ...acc,
            [dayTimestamp]: totalBalance,
          };
        },
        {}
      );

      let cumulativeBalance = BNify(0);
      const dailyBalances = transactions.reduce(
        (acc: Record<string, BigNumber>, transaction: any) => {
          const token = tokensById[transaction.tokenId];
          const tokenDecimals = token?.decimals || 18;
          const tokenPrice = fixTokenDecimals(
            tokenBlocks[transaction.tokenId]?.[transaction.block.number]
              ?.price || 1000000,
            6
          );
          const amountUsd = fixTokenDecimals(
            transaction.tokenAmount,
            tokenDecimals
          ).times(tokenPrice);

          const dayTimestamp = floorTimestamp(
            transaction.block.timestamp * 1000
          );

          cumulativeBalance =
            transaction.type === "DEPOSIT"
              ? bnOrZero(cumulativeBalance).plus(amountUsd)
              : BigNumber.maximum(
                  0,
                  bnOrZero(cumulativeBalance).minus(amountUsd)
                );

          return {
            ...acc,
            [dayTimestamp]: cumulativeBalance,
          };
        },
        {}
      );

      // console.log("dailyVaultsEarnings", dailyVaultsEarnings);

      setEarningsChartData({
        total: Object.entries(dailyBalances).reduce(
          (acc: HistoryData[], [timestamp, balance]: any) => {
            return [
              ...acc,
              {
                date: timestamp,
                value: parseFloat(
                  bnOrZero(dailyVaultsEarnings[timestamp])
                    .plus(balance)
                    .toFixed(2)
                ),
              },
            ];
          },
          []
        ),
        rainbow: Object.entries(dailyBalances).reduce(
          (acc: RainbowData[], [timestamp, balance]: any) => {
            return [
              ...acc,
              {
                date: timestamp,
                total: balance.toFixed(2),
                deposited: parseFloat(balance.toFixed(2)),
                earnings: parseFloat(
                  bnOrZero(dailyVaultsEarnings[timestamp]).toFixed(2)
                ),
              },
            ];
          },
          []
        ),
      });

      // console.log("dailyBalances", dailyBalances);
    })();
  }, [
    account,
    timeframeStartTimestamp,
    timeframeEndTimestamp,
    setEarningsChartData,
  ]);

  const extraData = useMemo(
    (): ExtraData => ({
      labels: {
        deposited: "Deposited",
        earnings: "Earnings",
      },
      colors: {
        deposited: "#0519D3",
        earnings: theme.colors.gain,
      },
    }),
    [theme]
  );

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
