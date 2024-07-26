import { useMemo } from "react";
import { BNify, bnOrZero } from "helpers/";
import { useTranslate } from "react-polyglot";
import type { Asset, AssetId, Balances, BigNumber } from "constants/types";
import { strategies, StrategyProps } from "constants/strategies";
import { usePortfolioProvider } from "contexts/PortfolioProvider";
import type {
  DonutChartData,
  DonutChartColors,
} from "components/DonutChart/DonutChart";
import { chains } from "constants/chains";
import { networks } from "constants/networks";

export type CompositionType = "assets" | "strategies" | "chains";

type UseCompositionChartDataArgs = {
  assetIds: AssetId[];
  strategies?: string[];
};

export type Colors = Record<CompositionType, DonutChartColors>;

type ExtraData = {
  colors: Colors;
};

export type Compositions = Record<CompositionType, DonutChartData[]>;

export type UseCompositionChartDataReturn = {
  compositions: Compositions;
} & ExtraData;

type UseCompositionChartData = (
  args: UseCompositionChartDataArgs
) => UseCompositionChartDataReturn;

export const useCompositionChartData: UseCompositionChartData = ({
  assetIds,
  strategies: enabledStrategies,
}) => {
  const translate = useTranslate();
  const {
    selectors: { selectAssetById, selectAssetsByIds },
  } = usePortfolioProvider();

  const assets = useMemo(() => {
    if (!selectAssetsByIds) return [];
    return selectAssetsByIds(assetIds);
  }, [assetIds, selectAssetsByIds]);

  const strategiesInitialBalances = Object.keys(strategies).reduce(
    (balances: Record<string, Balances>, strategy: string) => {
      return {
        ...balances,
        [strategy]: {
          balance: BNify(0),
          earnings: BNify(0),
          deposited: BNify(0),
          weightedRealizedApy: BNify(0),
        },
      };
    },
    {}
  );

  const strategiesBalances = useMemo(() => {
    const filteredAssets = assets.filter(
      (asset: Asset) =>
        asset.type &&
        (!enabledStrategies || enabledStrategies.includes(asset.type))
    );
    return filteredAssets.reduce(
      (strategiesBalances: Record<string, Balances>, asset: Asset) => {
        if (!asset.type || !asset.vaultPosition) return strategiesBalances;

        strategiesBalances[asset.type].earnings = strategiesBalances[
          asset.type
        ].earnings.plus(asset.vaultPosition.usd.earnings);
        strategiesBalances[asset.type].balance = strategiesBalances[
          asset.type
        ].balance.plus(asset.vaultPosition.usd.redeemable);
        strategiesBalances[asset.type].deposited = strategiesBalances[
          asset.type
        ].deposited.plus(asset.vaultPosition.usd.deposited);
        if (BNify(asset.vaultPosition?.realizedApy).gt(0)) {
          strategiesBalances[asset.type].weightedRealizedApy =
            strategiesBalances[asset.type].weightedRealizedApy.plus(
              asset.vaultPosition.realizedApy.times(
                asset.vaultPosition.usd.redeemable
              )
            );
        }

        return strategiesBalances;
      },
      strategiesInitialBalances
    );
  }, [assets, enabledStrategies, strategiesInitialBalances]);

  const assetsBalances: Balances = useMemo(() => {
    const filteredAssets = assets.filter(
      (asset: Asset) =>
        asset.type &&
        (!enabledStrategies || enabledStrategies.includes(asset.type))
    );
    return filteredAssets.reduce((assetsBalances: Balances, asset: Asset) => {
      if (!asset.underlyingId || !asset.vaultPosition) return assetsBalances;

      const underlyingAsset = selectAssetById(asset.underlyingId);
      if (!underlyingAsset) return assetsBalances;

      if (!assetsBalances[underlyingAsset.id]) {
        assetsBalances[underlyingAsset.id] = BNify(0);
      }
      assetsBalances[underlyingAsset.id] = assetsBalances[
        underlyingAsset.id
      ].plus(asset.vaultPosition.usd.redeemable);
      return assetsBalances;
    }, {});
  }, [assets, enabledStrategies, selectAssetById]);

  const chainsBalances: Record<string, BigNumber> = useMemo(() => {
    const filteredAssets = assets.filter(
      (asset: Asset) =>
        asset.type &&
        (!enabledStrategies || enabledStrategies.includes(asset.type))
    );
    return filteredAssets.reduce((chainsBalances: Balances, asset: Asset) => {
      if (!asset.underlyingId || !asset.vaultPosition) return chainsBalances;

      const underlyingAsset = selectAssetById(asset.underlyingId);
      if (!underlyingAsset) return chainsBalances;

      if (!chainsBalances[underlyingAsset.chainId]) {
        chainsBalances[underlyingAsset.chainId] = BNify(0);
      }
      chainsBalances[underlyingAsset.chainId] = chainsBalances[
        underlyingAsset.chainId
      ].plus(asset.vaultPosition.usd.redeemable);
      return chainsBalances;
    }, {});
  }, [assets, enabledStrategies, selectAssetById]);

  const totalFunds = useMemo(() => {
    return Object.values(assetsBalances).reduce(
      (acc: BigNumber, value: BigNumber) => acc.plus(BNify(value)),
      BNify(0)
    );
  }, [assetsBalances]);

  const compositions: Compositions = {
    assets: [],
    chains: [],
    strategies: [],
  };

  compositions.strategies = useMemo((): DonutChartData[] => {
    return Object.keys(strategiesBalances).map((strategy: string) => {
      const label = translate(strategies[strategy].label);
      const avgRealizedApy = strategiesBalances[strategy].balance.gt(0)
        ? parseFloat(
            strategiesBalances[strategy].weightedRealizedApy.div(
              strategiesBalances[strategy].balance
            )
          )
        : 0;
      return {
        label,
        extraData: {
          avgRealizedApy,
          strategy: strategies[strategy],
          earnings: parseFloat(strategiesBalances[strategy].earnings),
          deposited: parseFloat(strategiesBalances[strategy].deposited),
        },
        value: parseFloat(strategiesBalances[strategy].balance),
      };
    });
  }, [strategiesBalances, translate]);

  const assetsNameBalances: Record<
    string,
    { balance: BigNumber; asset: Asset }
  > = useMemo(() => {
    return Object.keys(assetsBalances).reduce(
      (
        acc: Record<string, { balance: BigNumber; asset: Asset }>,
        assetId: AssetId
      ) => {
        const asset = selectAssetById(assetId);
        return {
          ...acc,
          [asset.name]: {
            asset,
            balance: bnOrZero(acc[asset.name]?.balance).plus(
              assetsBalances[assetId]
            ),
          },
        };
      },
      {}
    );
  }, [assetsBalances, selectAssetById]);

  compositions.assets = useMemo((): DonutChartData[] => {
    return Object.keys(assetsNameBalances).reduce(
      (compositionAssets: DonutChartData[], assetName: string) => {
        const assetInfo = assetsNameBalances[assetName];
        const allocation = assetInfo.balance.div(totalFunds);
        return [
          ...compositionAssets,
          {
            label: assetName,
            extraData: {
              asset: assetInfo.asset,
              allocation,
            },
            value: assetInfo.balance.toNumber(),
          },
        ];
      },
      []
    );
  }, [assetsNameBalances, totalFunds]);

  compositions.chains = useMemo((): DonutChartData[] => {
    return Object.keys(chainsBalances).reduce(
      (compositionAssets: DonutChartData[], chainId: string) => {
        const network = networks[+chainId];
        if (!network) {
          return compositionAssets;
        }
        const allocation = chainsBalances[chainId].div(totalFunds);
        return [
          ...compositionAssets,
          {
            label: network.name,
            extraData: {
              network,
              allocation,
            },
            value: chainsBalances[chainId].toNumber(),
          },
        ];
      },
      []
    );
  }, [chainsBalances, totalFunds]);

  const colors: Colors = {
    assets: {},
    strategies: {},
    chains: {},
  };

  colors.chains = useMemo((): DonutChartColors => {
    return Object.keys(chains).reduce(
      (colors: DonutChartColors, chainId: string) => {
        const network = networks[+chainId];
        if (!network) {
          return colors;
        }
        return {
          ...colors,
          [network.name]: network.color,
        };
      },
      {}
    );
  }, []);

  colors.strategies = useMemo((): DonutChartColors => {
    return Object.values(strategies).reduce(
      (colors: DonutChartColors, strategy: StrategyProps) => {
        const label = translate(strategy.label);
        return {
          ...colors,
          [label]: strategy.color,
        };
      },
      {}
    );
  }, [translate]);

  colors.assets = useMemo((): DonutChartColors => {
    return Object.keys(assetsBalances).reduce(
      (colors: DonutChartColors, assetId: string) => {
        const asset = selectAssetById(assetId);
        if (!asset) return colors;
        const label = asset.name;
        return {
          ...colors,
          [label]: asset.color,
        };
      },
      {}
    );
  }, [assetsBalances, selectAssetById]);

  return {
    colors,
    compositions,
  };
};
