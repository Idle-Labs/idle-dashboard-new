import BigNumber from "bignumber.js";
import { DATE_FORMAT, strategies, TransactionDataApiV2 } from "constants/";
import { useState, useMemo, useEffect } from "react";
import {
  BNify,
  bnOrZero,
  cmpAddrs,
  fixTokenDecimals,
  floorTimestamp,
  getChartTimestampBounds,
  getTimestampRange,
  getTokenBlocksFromApiV2,
  getTokensFromApiV2,
  getTransactionsFromApiV2,
  getWalletBlocksFromApiV2,
  getWalletPerformancesFromApiV2,
  getWalletsVaultsPerformancesFromApiV2,
  isEmpty,
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
import { usePortfolioProvider } from "contexts/PortfolioProvider";
import { collapseTextChangeRangesAcrossMultipleVersions } from "typescript";

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
  const {
    isVaultsLoaded,
    vaultsApiData,
    selectors: { selectAssetById },
  } = usePortfolioProvider();

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

  useEffect(
    () => {
      if (!account?.address || !isVaultsLoaded) return;
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

        const vaultInfos = walletPerformances.reduce(
          (acc: any, walletPerformance: any) => {
            if (acc[walletPerformance.vaultId]) return acc;
            const vaultData = vaultsApiData.find(
              (vault: any) => vault._id === walletPerformance.vaultId
            );
            if (!vaultData) return acc;
            console.log("vaultInfos", walletPerformance.vaultId, vaultData);
            return {
              ...acc,
              [walletPerformance.vaultId]: vaultData,
            };
          },
          {}
        );

        const walletVaultsPerformances = await getWalletPerformancesFromApiV2(
          account.address,
          {
            "timestamp:lte": Math.floor(timeframeStartTimestamp / 1000),
          },
          Object.values(vaultInfos)
        );

        console.log("vaultInfos", vaultInfos);
        console.log("transactions", transactions);
        console.log("walletPerformances", walletPerformances);
        console.log("walletVaultsPerformances", walletVaultsPerformances);

        const tokensById: any = (
          await getTokensFromApiV2(
            Object.values(vaultInfos).map((vaultInfo: any) => vaultInfo.tokenId)
          )
        ).reduce(
          (acc: Record<string, any>, token: any) => ({
            ...acc,
            [token._id]: token,
          }),
          {}
        );

        const tokenBlocksPromises = Object.entries(tokensById).map(
          ([tokenId, blocks]) =>
            getTokenBlocksFromApiV2(
              tokenId,
              undefined,
              timeframeStartTimestamp,
              timeframeEndTimestamp
            ).then((tokenBlocks) => ({
              [tokenId]: tokenBlocks,
            }))
        );

        console.log("tokensById", tokensById);

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

        const vaultsStartAmounts = Object.values(
          walletVaultsPerformances
        ).reduce(
          (
            acc: {
              ids: string[];
              deposits: Record<string, BigNumber>;
              earnings: BigNumber;
            },
            walletVaultPerformance: any
          ) => {
            const vaultData = vaultsApiData.find(
              (vault: any) => vault._id === walletVaultPerformance.vaultId
            );
            if (!vaultData) {
              console.log("Skip vaultId", walletVaultPerformance.vaultId);
              return acc;
            }
            const asset = selectAssetById(vaultData.address);
            if (!asset) {
              console.log("Skip asset", vaultData.address);
              return acc;
            }
            const tokenData: any = Object.values(tokensById).find(
              (token: any) => cmpAddrs(token.address, asset.underlyingId)
            );
            if (!tokenData) {
              console.log("Skip token", asset.underlyingId);
              return acc;
            }

            return {
              ...acc,
              ids: [...acc.ids, walletVaultPerformance.vaultId],
              deposits: {
                ...(acc.deposits || {}),
                [tokenData._id]: bnOrZero(acc.deposits[tokenData._id]).plus(
                  bnOrZero(walletVaultPerformance.performance.deposits.token)
                ),
              },
              earnings: acc.earnings.plus(
                BNify(walletVaultPerformance.performance.earnings.USD).div(1e6)
              ),
            };
          },
          {
            ids: [],
            deposits: {},
            earnings: BNify(0),
          }
        );

        console.log("vaultsStartAmounts", vaultsStartAmounts);

        const timestampRange = getTimestampRange(
          timeframeStartTimestamp,
          timeframeEndTimestamp
        );

        let cumulativeTotalEarnings = vaultsStartAmounts.earnings;
        const cumulativeVaultsEarnings: Record<string, BigNumber> = {};

        const dailyVaultsEarnings = timestampRange.reduce(
          (acc: Record<string, BigNumber>, dayTimestamp: number) => {
            const dayPerformances = walletPerformances.filter(
              (walletPerformance: any) =>
                floorTimestamp(walletPerformance.block.timestamp * 1000) ===
                dayTimestamp
            );

            if (!dayPerformances) {
              return {
                ...acc,
                [dayTimestamp]: cumulativeTotalEarnings,
              };
            }

            dayPerformances.forEach((walletPerformance: any) => {
              if (
                !cumulativeVaultsEarnings[walletPerformance.vaultId] ||
                (BNify(walletPerformance.earnings.USD).lte(0) &&
                  BNify(walletPerformance.poolSharePercentage).lte(0))
              ) {
                cumulativeVaultsEarnings[walletPerformance.vaultId] =
                  fixTokenDecimals(walletPerformance.earnings.USD, 6);
              } else {
                cumulativeVaultsEarnings[walletPerformance.vaultId] =
                  cumulativeVaultsEarnings[walletPerformance.vaultId].plus(
                    fixTokenDecimals(walletPerformance.earnings.USD, 6)
                  );
              }
            });

            const totalEarnings = Object.values(
              cumulativeVaultsEarnings
            ).reduce((sum: BigNumber, earnings: BigNumber) => {
              return sum.plus(earnings);
            }, vaultsStartAmounts.earnings);

            cumulativeTotalEarnings = totalEarnings;

            return {
              ...acc,
              [dayTimestamp]: cumulativeTotalEarnings,
            };
          },
          {
            [floorTimestamp(timeframeStartTimestamp)]:
              vaultsStartAmounts.earnings,
          }
        );

        let cumulativeBalance = vaultsStartAmounts.deposits;
        const walletBalances: Record<
          string,
          Record<string, { block: number; balance: BigNumber }>
        > = transactions.reduce(
          (
            acc: Record<
              string,
              Record<string, { block: number; balance: BigNumber }>
            >,
            transaction: any
          ) => {
            // Check vaultIds
            if (!vaultsStartAmounts.ids.includes(transaction.vaultId)) {
              return acc;
            }

            const tokenId = transaction.tokenId;

            // Init accumulator
            // if (isEmpty(acc)) {
            //   acc[tokenId] = {
            //     ...acc[tokenId],
            //     [floorTimestamp(timeframeStartTimestamp)]: {
            //       block: tokenBlocks[tokenId]
            //         ? +Object.keys(tokenBlocks[tokenId])[0]
            //         : 0,
            //       balance: cumulativeBalance[tokenId],
            //     },
            //   };
            // }

            const dayTimestamp = floorTimestamp(
              transaction.block.timestamp * 1000
            );

            cumulativeBalance[tokenId] =
              transaction.type === "DEPOSIT"
                ? bnOrZero(cumulativeBalance[tokenId]).plus(
                    transaction.tokenAmount
                  )
                : BigNumber.maximum(
                    0,
                    bnOrZero(cumulativeBalance[tokenId]).minus(
                      transaction.tokenAmount
                    )
                  );

            return {
              ...acc,
              [tokenId]: {
                ...acc[tokenId],
                [dayTimestamp]: {
                  block: transaction.block.number,
                  balance: cumulativeBalance[tokenId],
                },
              },
            };
          },
          Object.keys(vaultsStartAmounts.deposits).reduce(
            (acc: any, tokenId: any) => {
              return {
                ...acc,
                [tokenId]: {
                  [timeframeStartTimestamp]: {
                    block: tokenBlocks[tokenId]
                      ? +Object.keys(tokenBlocks[tokenId])[0]
                      : 0,
                    balance: cumulativeBalance[tokenId],
                  },
                },
              };
            },
            {}
          )
        );

        console.log("walletBalances", walletBalances);
        console.log("tokenBlocks", tokenBlocks);

        const dailyBalances = timestampRange.reduce(
          (acc: Record<string, BigNumber>, dayTimestamp: number) => {
            // For each token get latest balance and convert in USD
            const cumulativeBalanceUsd = Object.keys(walletBalances).reduce(
              (acc: BigNumber, tokenId: any) => {
                const latestTimestamp = Object.keys(walletBalances[tokenId])
                  .sort((a, b) => (a > b ? -1 : 1))
                  .find((timestamp) => BNify(timestamp).lte(dayTimestamp));
                if (!latestTimestamp) return acc;
                const tokenBalance =
                  walletBalances[tokenId][latestTimestamp].balance;
                const token = tokensById[tokenId];
                const tokenDecimals = token?.decimals || 18;

                const tokenBlock: any = tokenBlocks[tokenId]
                  ? sortArrayByKey(
                      Object.values(tokenBlocks[tokenId]).filter(
                        (tokenBlock: any) =>
                          floorTimestamp(tokenBlock.block.timestamp * 1000) <=
                          dayTimestamp
                      ),
                      "block.timestamp",
                      "desc"
                    )[0]
                  : undefined;

                const tokenPrice = fixTokenDecimals(
                  tokenBlock?.price || 1000000,
                  6
                );

                const amountUsd = fixTokenDecimals(
                  tokenBalance,
                  tokenDecimals
                ).times(tokenPrice);

                return acc.plus(amountUsd);
              },
              BNify(0)
            );

            return {
              ...acc,
              [dayTimestamp]: cumulativeBalanceUsd,
            };
          },
          {}
        );

        const walletFirstTimestamp = bnOrZero(
          sortArrayByKey(transactions, "block.timestamp", "asc")[0]?.block
            ?.timestamp
        )
          .times(1000)
          .toNumber();

        setEarningsChartData({
          total: Object.entries(dailyBalances).reduce(
            (acc: HistoryData[], [timestamp, balance]: any) => {
              if (timestamp < walletFirstTimestamp) return acc;
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
              if (timestamp < walletFirstTimestamp) return acc;
              return [
                ...acc,
                {
                  date: timestamp,
                  total: parseFloat(
                    BNify(balance)
                      .plus(bnOrZero(dailyVaultsEarnings[timestamp]))
                      .toFixed(2)
                  ),
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
    },
    // eslint-disable-next-line
    [
      account,
      vaultsApiData,
      isVaultsLoaded,
      timeframeStartTimestamp,
      timeframeEndTimestamp,
      setEarningsChartData,
    ]
  );

  const extraData = useMemo(
    (): ExtraData => ({
      labels: {
        deposited: "Deposited",
        earnings: "Earnings",
      },
      colors: {
        deposited: "#2875c9",
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
