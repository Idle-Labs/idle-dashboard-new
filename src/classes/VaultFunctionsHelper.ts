import Web3 from "web3";
import dayjs from "dayjs";
import { Vault } from "vaults/";
import BigNumber from "bignumber.js";
import { EventData } from "web3-eth-contract";
import { Multicall, CallData } from "classes/";
import stMATIC_abi from "abis/lido/stMATIC.json";
import { TrancheVault } from "vaults/TrancheVault";
import { AssetTransfersResult } from "alchemy-sdk";
import { selectUnderlyingToken } from "selectors/";
import PoLidoNFT_abi from "abis/lido/PoLidoNFT.json";
import { FEES_COLLECTORS } from "constants/addresses";
import { BestYieldVault } from "vaults/BestYieldVault";
import { explorers, networks, chains } from "constants/";
import { StakedIdleVault } from "vaults/StakedIdleVault";
import { CacheContextProps } from "contexts/CacheProvider";
import { GenericContract } from "contracts/GenericContract";
import type { Transaction as Web3Transaction } from "web3-core";
import PoLidoStakeManager_abi from "abis/lido/PoLidoStakeManager.json";
import type {
  Abi,
  Assets,
  Asset,
  AssetId,
  Harvest,
  Explorer,
  Transaction,
  EtherscanTransaction,
  UnderlyingTokenProps,
  VaultAdditionalApr,
  PlatformApiFilters,
  VaultHistoricalRates,
  VaultHistoricalPrices,
  VaultHistoricalData,
  HistoryData,
  EpochData,
  CdoEvents,
  RewardEmission,
  ApisProps,
  AmphorEpoch,
  VaultContractCdoEpochData,
} from "constants/";
import {
  bnOrZero,
  toDayjs,
  BNify,
  normalizeTokenAmount,
  makeEtherscanApiRequest,
  getPlatformApisEndpoint,
  callPlatformApis,
  fixTokenDecimals,
  getSubgraphTrancheInfo,
  dayDiff,
  dateDiff,
  isBigNumberNaN,
  asyncReduce,
  cmpAddrs,
  getExplorerByChainId,
  isEmpty,
  getAlchemyTransactionHistory,
  getEtherscanTransactionObject,
  getPlatformApiConfig,
  makePostRequest,
  makeRequest,
  floorTimestamp,
  sortArrayByKey,
  decodeTxParams,
  getBlock,
} from "helpers/";
import { isConstructSignatureDeclaration } from "typescript";
import {
  getDataFromApiV2,
  getIdleAPIV2AllPages,
  getVaultBlocksFromApiV2,
} from "helpers/apiv2";
import { CreditVault } from "vaults/CreditVault";
import { eventNames } from "process";

export interface CdoLastHarvest {
  cdoId: string;
  harvest: Harvest | null;
}

type ConstructorProps = {
  chainId: number;
  web3: Web3 | null;
  multiCall?: Multicall;
  explorer?: Explorer | null;
  cacheProvider?: CacheContextProps;
  web3Chains?: Record<string, Web3> | null;
  contracts?: Record<string, GenericContract[]>;
};

type SubgraphData = {
  filters: PlatformApiFilters | undefined;
  results: any;
  cacheKey: string;
  daysDiff: number;
  fetchData: boolean;
  cachedData: any;
  latestTimestamp: number;
};

export class VaultFunctionsHelper {
  readonly chainId: number;
  readonly web3: Web3 | null;
  readonly multiCall: Multicall | undefined;
  readonly explorer: Explorer | null | undefined;
  readonly cacheProvider: CacheContextProps | undefined;
  readonly web3Chains: Record<string, Web3> | null | undefined;
  readonly contracts: Record<string, GenericContract[]> | undefined;

  constructor(props: ConstructorProps) {
    this.web3 = props.web3;
    this.chainId = props.chainId;
    this.explorer = props.explorer;
    this.contracts = props.contracts;
    this.multiCall = props.multiCall;
    this.web3Chains = props.web3Chains;
    this.cacheProvider = props.cacheProvider;
  }

  private getVaultMulticallParams = (vault: Vault): any[] => {
    const chainId = vault.chainId || this.chainId;
    const web3ToUse = this.web3Chains ? this.web3Chains[chainId] : this.web3;
    return [true, chainId, web3ToUse];
  };

  private getExporerByChainId = (chainId: number): Explorer => {
    return explorers[networks[chainId].explorer];
  };

  public async getStakingRewards(
    stakedIdleVault: StakedIdleVault | undefined,
    chainId?: number
  ): Promise<EtherscanTransaction[]> {
    if (!stakedIdleVault) return [];

    const idleTokenConfig = stakedIdleVault.rewardTokenConfig;
    const feeDistributorConfig = stakedIdleVault.feeDistributorConfig;

    chainId = chainId || this.chainId;
    const explorer = this.getExporerByChainId(stakedIdleVault.chainId);
    if (!explorer) return [];

    const endpoint = `${explorer?.endpoints[chainId]}?module=account&action=tokentx&address=${feeDistributorConfig.address}&sort=desc`;

    const callback = async () =>
      await makeEtherscanApiRequest(endpoint, explorer?.keys || []);
    const etherscanTxlist = this.cacheProvider
      ? await this.cacheProvider.checkAndCache(endpoint, callback, 300)
      : await callback();

    // console.log('getIdleStakingRewardsTxs', endpoint, stakedIdleVault.rewardTokenConfig, stakedIdleVault.feeDistributorConfig, etherscanTxlist);
    return etherscanTxlist
      ? etherscanTxlist.filter(
          (tx: EtherscanTransaction) =>
            tx.contractAddress.toLowerCase() ===
              idleTokenConfig.address?.toLowerCase() &&
            tx.to.toLowerCase() ===
              feeDistributorConfig.address.toLowerCase() &&
            BNify(tx.value).gt(0)
        )
      : [];
  }

  public async getTrancheLastHarvest(
    trancheVault: TrancheVault
  ): Promise<CdoLastHarvest> {
    const lastHarvest: CdoLastHarvest = {
      cdoId: trancheVault.cdoConfig.address,
      harvest: null,
    };

    // User tranche chain
    const chainId = trancheVault.chainId;

    const web3ToUse = this.web3Chains ? this.web3Chains[+chainId] : this.web3;

    if (!web3ToUse) return lastHarvest;

    // Get explorer by vault chainId
    const explorer = this.getExporerByChainId(chainId);

    if (!this.multiCall || !explorer || !this.web3Chains?.[+chainId])
      return lastHarvest;

    const rawCalls: CallData[] = [
      this.multiCall.getCallData(trancheVault.cdoContract, "lastNAVAA"),
      this.multiCall.getCallData(trancheVault.cdoContract, "lastNAVBB"),
      // this.multiCall.getCallData(trancheVault.cdoContract, 'latestHarvestBlock'),
      this.multiCall.getCallData(
        trancheVault.cdoContract,
        "trancheAPRSplitRatio"
      ),
    ].filter((call): call is CallData => !!call);

    const [multicallResults, lastHarvestBlockHex] = await Promise.all([
      this.multiCall.executeMulticalls(
        rawCalls,
        ...this.getVaultMulticallParams(trancheVault)
      ),
      web3ToUse.eth.getStorageAt(trancheVault.cdoConfig.address, 204),
    ]);

    // console.log('getTrancheLastHarvest', chainId, trancheVault.cdoConfig.address, lastHarvestBlockHex, multicallResults)

    if (!multicallResults) return lastHarvest;

    const [
      trancheNAVAA,
      trancheNAVBB,
      // latestHarvestBlock,
      trancheAPRSplitRatio,
    ] = multicallResults.map((r) => BNify(r.data));

    const lastHarvestBlock =
      trancheVault.getFlag("lastHarvestBlock") ||
      web3ToUse.utils.hexToNumber(lastHarvestBlockHex);

    // console.log('getTrancheLastHarvest', trancheVault.id, lastHarvestBlockHex, lastHarvestBlock)

    if (!lastHarvestBlock) return lastHarvest;

    const tranchePoolAA = BNify(trancheNAVAA).div(
      `1e${trancheVault.underlyingToken?.decimals}`
    );
    const tranchePoolBB = BNify(trancheNAVBB).div(
      `1e${trancheVault.underlyingToken?.decimals}`
    );

    const aprRatioAA = BNify(trancheAPRSplitRatio).div(1000);
    const aprRatioBB = BNify(100).minus(BNify(trancheAPRSplitRatio).div(1000));

    try {
      const endpoint = `${
        explorer.endpoints[trancheVault.chainId]
      }?module=account&action=tokentx&address=${
        trancheVault.cdoConfig.address
      }&startblock=${lastHarvestBlock}&endblock=${lastHarvestBlock}&sort=asc`;
      const callback = async () =>
        await makeEtherscanApiRequest(endpoint, explorer?.keys || []);
      let harvestTxs = this.cacheProvider
        ? await this.cacheProvider.checkAndCache(endpoint, callback, 0)
        : await callback();

      if (!harvestTxs || isEmpty(harvestTxs)) {
        const blockHex = "0x" + (+lastHarvestBlock).toString(16);
        const cacheKey = `alchemyTxs_${chainId}_${trancheVault.cdoConfig.address}_${blockHex}`;
        const callback = async () =>
          await getAlchemyTransactionHistory(
            chainId,
            undefined,
            trancheVault.cdoConfig.address,
            blockHex,
            blockHex
          );
        const harvestTxsAlchemy = this.cacheProvider
          ? await this.cacheProvider.checkAndCache(cacheKey, callback, 0)
          : await callback();

        // Override harvestTxs with alchemy txs
        if (harvestTxsAlchemy && !isEmpty(harvestTxsAlchemy)) {
          const blockInfo = await this.web3Chains[chainId].eth.getBlock(
            lastHarvestBlock
          );
          harvestTxs = harvestTxsAlchemy.reduce(
            (txs: EtherscanTransaction[], alchemyTx: AssetTransfersResult) => {
              if (
                cmpAddrs(
                  alchemyTx.rawContract.address,
                  trancheVault.underlyingToken?.address as string
                )
              ) {
                const etherscanTx = getEtherscanTransactionObject({
                  hash: alchemyTx.hash,
                  timeStamp: blockInfo.timestamp,
                  blockNumber: alchemyTx.blockNum,
                  to: trancheVault.cdoConfig.address,
                  contractAddress: alchemyTx.rawContract.address,
                  value: normalizeTokenAmount(
                    alchemyTx.value,
                    +(alchemyTx.rawContract.decimal || 18)
                  ),
                } as Record<keyof EtherscanTransaction, any>);
                txs.push(etherscanTx);
              }
              return txs;
            },
            []
          );
        }
      }

      if (!harvestTxs) return lastHarvest;

      const harvestTx = harvestTxs.find(
        (tx: EtherscanTransaction) =>
          cmpAddrs(
            tx.contractAddress,
            trancheVault.underlyingToken?.address as string
          ) && cmpAddrs(tx.to, trancheVault.cdoConfig.address)
      );

      // if (+chainId === 10){
      //   console.log('harvestTx', trancheVault.cdoConfig.address, harvestTx)
      // }

      if (!harvestTx) return lastHarvest;

      const totalValue = BNify(harvestTx.value).div(
        `1e${trancheVault.underlyingToken?.decimals}`
      );

      const harvestedValueAA = totalValue.times(aprRatioAA.div(100));
      const harvestedValueBB = totalValue.times(aprRatioBB.div(100));
      const tokenAprAA = harvestedValueAA.div(tranchePoolAA).times(52.1429);
      const tokenAprBB = harvestedValueBB.div(tranchePoolBB).times(52.1429);

      // const totalApr = totalValue.div(tranchePoolAA.plus(tranchePoolBB)).times(52.1429)
      // console.log('getTrancheHarvest', trancheVault.cdoConfig.address, trancheVault.id, totalValue.toString(), harvestedValueAA.toString(), harvestedValueBB.toString(), tranchePoolAA.toString(), tranchePoolBB.toString(), tokenAprAA.toString(), tokenAprBB.toString(), totalApr.toString())

      lastHarvest.harvest = {
        aprs: {
          AA: tokenAprAA,
          BB: tokenAprBB,
        },
        value: {
          AA: harvestedValueAA,
          BB: harvestedValueBB,
        },
        totalValue,
        hash: harvestTx.hash,
        timestamp: +harvestTx.timeStamp,
        blockNumber: +harvestTx.blockNumber,
        tokenAddress: harvestTx.contractAddress,
      };
    } catch (err) {}

    return lastHarvest;
  }

  public async getTrancheHarvestApy(
    trancheVault: TrancheVault
  ): Promise<BigNumber> {
    const trancheLastHarvest = await this.getTrancheLastHarvest(trancheVault);
    if (!trancheLastHarvest?.harvest) return BNify(0);
    return trancheLastHarvest.harvest.aprs[trancheVault.type];
  }

  public async getStETHTrancheStrategyApr(chainId: number): Promise<BigNumber> {
    const platformApiEndpoint = getPlatformApisEndpoint(
      chainId,
      "lido",
      "stETH"
    );
    const callback = async () =>
      await callPlatformApis(chainId, "lido", "stETH");
    const apr = this.cacheProvider
      ? await this.cacheProvider.checkAndCache(platformApiEndpoint, callback)
      : await callback();

    if (!BNify(apr).isNaN()) {
      return BNify(apr).div(100);
    }
    return BNify(0);
  }

  public async getGearboxTokenSupply(
    chainId: number,
    assetId: string
  ): Promise<BigNumber> {
    const platformApiEndpoint = getPlatformApisEndpoint(
      chainId,
      "gearbox",
      "tokenSupply",
      assetId
    );
    const callback = async () =>
      await callPlatformApis(chainId, "gearbox", "tokenSupply", assetId);
    const supplies = this.cacheProvider
      ? await this.cacheProvider.checkAndCache(platformApiEndpoint, callback)
      : await callback();

    return supplies?.result
      ? supplies.result.reduce((acc: BigNumber, supply: any) => {
          return acc.plus(supply.effective_balance);
        }, BNify(0))
      : BNify(0);
  }

  public async getStETHTrancheApy(
    trancheVault: TrancheVault
  ): Promise<BigNumber> {
    const strategyApr = await this.getStETHTrancheStrategyApr(
      trancheVault.chainId
    );
    return await this.getTrancheApy(strategyApr, trancheVault);
  }

  public async getAmphorwstETHTrancheBaseStrategyApr(
    chainId: number
  ): Promise<BigNumber> {
    const platformApiEndpoint = getPlatformApisEndpoint(
      chainId,
      "amphor",
      "wstETHBase"
    );
    const callback = async () =>
      await callPlatformApis(chainId, "amphor", "wstETHBase");
    const apr = this.cacheProvider
      ? await this.cacheProvider.checkAndCache(
          `${platformApiEndpoint}_amphor_wstETHBase`,
          callback
        )
      : await callback();

    if (!BNify(apr).isNaN()) {
      return BNify(apr).div(100);
    }
    return BNify(0);
  }

  public async getAmphorwstETHTrancheStrategyApr(
    chainId: number
  ): Promise<BigNumber> {
    const platformApiEndpoint = getPlatformApisEndpoint(
      chainId,
      "amphor",
      "wstETH"
    );
    const callback = async () =>
      await callPlatformApis(chainId, "amphor", "wstETH");
    const apr = this.cacheProvider
      ? await this.cacheProvider.checkAndCache(
          `${platformApiEndpoint}_amphor_wstETH`,
          callback
        )
      : await callback();

    if (!BNify(apr).isNaN()) {
      return BNify(apr).div(100);
    }
    return BNify(0);
  }

  public async getAmphorwstETHTrancheTotalApr(
    chainId: number
  ): Promise<BigNumber> {
    const platformApiEndpoint = getPlatformApisEndpoint(
      chainId,
      "amphor",
      "wstETHTotal"
    );
    const callback = async () =>
      await callPlatformApis(chainId, "amphor", "wstETHTotal");
    const apr = this.cacheProvider
      ? await this.cacheProvider.checkAndCache(
          `${platformApiEndpoint}_amphor_wstETHTotal`,
          callback
        )
      : await callback();

    if (!BNify(apr).isNaN()) {
      return BNify(apr);
    }
    return BNify(0);
  }

  public async getAmphorwstETHTrancheApy(
    trancheVault: TrancheVault
  ): Promise<BigNumber> {
    const strategyApr = await this.getAmphorwstETHTrancheStrategyApr(
      trancheVault.chainId
    );
    return await this.getTrancheApy(strategyApr, trancheVault);
  }

  public async getEthenaUSDeTrancheStrategyApr(
    chainId: number
  ): Promise<BigNumber> {
    const platformApiEndpoint = getPlatformApisEndpoint(
      chainId,
      "ethena",
      "USDe"
    );
    const callback = async () =>
      await callPlatformApis(chainId, "ethena", "USDe");
    const apr = this.cacheProvider
      ? await this.cacheProvider.checkAndCache(
          `${platformApiEndpoint}_ethena_USDe`,
          callback
        )
      : await callback();

    if (!BNify(parseFloat(apr)).isNaN()) {
      return BNify(parseFloat(apr)).div(100);
    }
    return BNify(0);
  }

  public async getEthenaUSDeTrancheApy(
    trancheVault: TrancheVault
  ): Promise<BigNumber> {
    const strategyApr = await this.getEthenaUSDeTrancheStrategyApr(
      trancheVault.chainId
    );
    return await this.getTrancheApy(strategyApr, trancheVault);
  }

  public async getAmphorwstETHEpochData(chainId: number): Promise<any> {
    const platformApiEndpoint = getPlatformApisEndpoint(
      chainId,
      "amphor",
      "wstETHEpoch"
    );
    const callback = async () =>
      await callPlatformApis(chainId, "amphor", "wstETHEpoch");
    return this.cacheProvider
      ? await this.cacheProvider.checkAndCache(
          `${platformApiEndpoint}_amphor_wstETHEpoch`,
          callback
        )
      : await callback();
  }

  public async getInstadappStETHTrancheStrategyApr(
    chainId: number
  ): Promise<BigNumber> {
    const platformApiEndpoint = getPlatformApisEndpoint(
      chainId,
      "instadapp",
      "stETH"
    );
    const callback = async () =>
      await callPlatformApis(chainId, "instadapp", "stETH");
    const results = this.cacheProvider
      ? await this.cacheProvider.checkAndCache(platformApiEndpoint, callback)
      : await callback();

    if (!results) return BNify(0);

    const foundVault = results.find(
      (r: any) => r.vault === "0xA0D3707c569ff8C87FA923d3823eC5D81c98Be78"
    );
    const apr = bnOrZero(foundVault?.apy?.apyWithoutFee);

    if (!BNify(apr).isNaN()) {
      return BNify(apr).div(100);
    }
    return BNify(0);
  }

  public async getInstadappStETHTrancheApy(
    trancheVault: TrancheVault
  ): Promise<BigNumber> {
    const strategyApr = await this.getInstadappStETHTrancheStrategyApr(
      trancheVault.chainId
    );
    return await this.getTrancheApy(strategyApr, trancheVault);
  }

  public getBestYieldRWAAdditionalApy(asset: Asset): BigNumber {
    let targetApy = BNify(0);
    if (bnOrZero(asset.totalTvlUsd).lte(2000000)) {
      targetApy = BNify(20);
    } else if (bnOrZero(asset.totalTvlUsd).lte(3000000)) {
      targetApy = BNify(18);
    } else if (bnOrZero(asset.totalTvlUsd).lte(5000000)) {
      targetApy = BNify(16);
    }

    return BigNumber.maximum(0, targetApy.minus(bnOrZero(asset.apy)));
  }

  public getGearboxSrTrancheAdditionalApy(asset: Asset): BigNumber {
    let targetApy = BNify(0);
    if (bnOrZero(asset.totalTvlUsd).lte(500000)) {
      targetApy = BNify(10);
    } else if (bnOrZero(asset.totalTvlUsd).lte(1000000)) {
      targetApy = BNify(9);
    } else if (bnOrZero(asset.totalTvlUsd).lte(2000000)) {
      targetApy = BNify(8);
    }

    return BigNumber.maximum(0, targetApy.minus(bnOrZero(asset.apy)));
  }

  public async getOptimismTrancheAdditionalApy(
    trancheVault: TrancheVault
  ): Promise<BigNumber> {
    const platformApiEndpoint = getPlatformApisEndpoint(
      trancheVault.chainId,
      "optimism",
      "additionalRewards"
    );
    const callback = async () =>
      await callPlatformApis(
        trancheVault.chainId,
        "optimism",
        "additionalRewards"
      );
    const results = this.cacheProvider
      ? await this.cacheProvider.checkAndCache(platformApiEndpoint, callback)
      : await callback();

    if (!results) return BNify(0);

    const foundVault = results.find((r: any) =>
      cmpAddrs(r.address, trancheVault.id)
    );

    // console.log('getOptimismTrancheAdditionalApy', trancheVault.id, foundVault?.apr, results, trancheVault.underlyingToken?.decimals, BNify(normalizeTokenAmount(bnOrZero(foundVault?.apr), trancheVault.underlyingToken?.decimals || 18)).toString())
    return BNify(normalizeTokenAmount(bnOrZero(foundVault?.apr), 18));
  }

  public async getTrancheApy(
    strategyApr: BigNumber,
    trancheVault: TrancheVault
  ): Promise<BigNumber> {
    if (!this.multiCall) return BNify(0);

    const rawCalls: CallData[] = [
      this.multiCall.getCallData(trancheVault.cdoContract, "FULL_ALLOC"),
      this.multiCall.getCallData(trancheVault.cdoContract, "getCurrentAARatio"),
      this.multiCall.getCallData(
        trancheVault.cdoContract,
        "trancheAPRSplitRatio"
      ),
    ].filter((call): call is CallData => !!call);

    const multicallResults = await this.multiCall.executeMulticalls(
      rawCalls,
      ...this.getVaultMulticallParams(trancheVault)
    );

    if (!multicallResults) return BNify(0);

    let [FULL_ALLOC, currentAARatio, trancheAPRSplitRatio] =
      multicallResults.map((r) => BNify(r.data));

    const isAATranche = trancheVault.type === "AA";

    if (BNify(currentAARatio).eq(0)) {
      return isAATranche ? BNify(0) : BNify(strategyApr);
    }

    if (BNify(strategyApr).isNaN()) {
      return BNify(0);
    }

    // BB tranche
    if (!isAATranche) {
      trancheAPRSplitRatio = FULL_ALLOC.minus(trancheAPRSplitRatio);
      currentAARatio = FULL_ALLOC.minus(currentAARatio);
    }

    const apr = BNify(strategyApr)
      .times(trancheAPRSplitRatio)
      .div(currentAARatio);

    return BNify(
      normalizeTokenAmount(
        apr.times(100),
        trancheVault.underlyingToken?.decimals || 18
      )
    );
  }

  public async getMaticTrancheStrategyApr(chainId: number): Promise<BigNumber> {
    const platformApiEndpoint = getPlatformApisEndpoint(
      chainId,
      "lido",
      "rates"
    );
    const callback = async () =>
      await callPlatformApis(chainId, "lido", "rates");
    const apr = this.cacheProvider
      ? await this.cacheProvider.checkAndCache(platformApiEndpoint, callback)
      : await callback();

    if (!BNify(apr).isNaN()) {
      return BNify(apr).div(100);
    }
    return BNify(0);
  }

  public async getMaticTrancheApy(
    trancheVault: TrancheVault
  ): Promise<BigNumber> {
    if (!this.multiCall) return BNify(0);

    const rawCalls: CallData[] = [
      this.multiCall.getCallData(trancheVault.cdoContract, "FULL_ALLOC"),
      this.multiCall.getCallData(trancheVault.cdoContract, "getCurrentAARatio"),
      this.multiCall.getCallData(
        trancheVault.cdoContract,
        "trancheAPRSplitRatio"
      ),
    ].filter((call): call is CallData => !!call);

    const [
      stratApr,
      multicallResults,
      // harvestApy
    ] = await Promise.all([
      this.getMaticTrancheStrategyApr(trancheVault.chainId),
      this.multiCall.executeMulticalls(
        rawCalls,
        ...this.getVaultMulticallParams(trancheVault)
      ),
      // this.getTrancheHarvestApy(trancheVault)
    ]);

    if (!multicallResults) return BNify(0);

    const [FULL_ALLOC, currentAARatio, trancheAPRSplitRatio] =
      multicallResults.map((r) => BNify(r.data));

    const isAATranche = trancheVault.type === "AA";

    if (BNify(currentAARatio).eq(0)) {
      return isAATranche ? BNify(0) : BNify(stratApr);
    }

    if (BNify(stratApr).isNaN()) {
      return BNify(0);
    }

    const apr = isAATranche
      ? BNify(stratApr).times(trancheAPRSplitRatio).div(currentAARatio)
      : BNify(stratApr)
          .times(FULL_ALLOC.minus(trancheAPRSplitRatio))
          .div(BNify(FULL_ALLOC).minus(currentAARatio));

    // if (!BNify(harvestApy).isNaN()){
    //   apr = apr.plus(harvestApy)
    // }

    return BNify(
      normalizeTokenAmount(
        apr.times(100),
        trancheVault.underlyingToken?.decimals || 18
      )
    );
  }

  public async getCreditVaultEpochs(vault: Vault): Promise<
    | {
        assetId: string;
        cdoId?: string;
        epochs: VaultContractCdoEpochData[];
      }
    | undefined
  > {
    if (!(vault instanceof CreditVault)) {
      return;
    }

    const vaultEpochs = await getDataFromApiV2("vaultEpochs", {
      vaultAddress: vault.id,
      sort: "count",
      order: "asc",
    });

    const epochs = vaultEpochs.reduce(
      (acc: VaultContractCdoEpochData[], vaultEpoch: any) => {
        return [...acc, vaultEpoch];
      },
      []
    );

    return {
      epochs,
      assetId: vault.id,
      cdoId: vault.cdoConfig.address,
    };
  }

  public async getEthenaCooldownsEvents(
    vault: Vault,
    account: string
  ): Promise<CdoEvents | null> {
    if (
      !("protocol" in vault) ||
      vault.protocol !== "ethena" ||
      !("cdoContractRpc" in vault) ||
      !vault.cdoContractRpc
    )
      return null;
    return {
      data: { vault, account },
      cdoId: vault.cdoConfig.address,
      events: await vault.cdoContractRpc.getPastEvents(
        "NewCooldownRequestContract",
        {
          toBlock: "latest",
          fromBlock: vault.vaultConfig.blockNumber,
          filter: {
            user: account,
          },
        }
      ),
    };
  }

  public async getMaticTrancheNFTs(account: string): Promise<any> {
    if (!this.multiCall) return [];

    const chainId = 1;
    const web3ToUse =
      +this.chainId === +chainId && this.web3
        ? this.web3
        : this.web3Chains
        ? this.web3Chains[chainId]
        : this.web3;

    if (!web3ToUse) return [];

    const MATIC = selectUnderlyingToken(chainId, "MATIC");
    const stMATIC = selectUnderlyingToken(chainId, "STMATIC");

    if (!MATIC || !stMATIC) return [];

    const stMaticContract = new GenericContract(web3ToUse, chainId, {
      name: "stMATIC",
      abi: stMATIC_abi as Abi,
      address: stMATIC?.address as string,
    });

    const rawCalls: CallData[] = [
      this.multiCall.getCallData(stMaticContract.contract, "poLidoNFT"),
      this.multiCall.getCallData(stMaticContract.contract, "stakeManager"),
    ].filter((call): call is CallData => !!call);

    const multicallResults = await this.multiCall.executeMulticalls(
      rawCalls,
      true,
      chainId,
      web3ToUse
    );

    if (!multicallResults) return [];

    const [poLidoNFT_address, stakeManager_address] = multicallResults.map(
      (r) => r.data as string
    );

    const poLidoNFTContract = new GenericContract(web3ToUse, chainId, {
      name: "poLidoNFT",
      abi: PoLidoNFT_abi as Abi,
      address: poLidoNFT_address,
    });

    const poLidoStakeManagerContract = new GenericContract(web3ToUse, chainId, {
      name: "poLidoStakeManager",
      abi: PoLidoStakeManager_abi as Abi,
      address: stakeManager_address,
    });

    const rawCalls2: CallData[] = [
      this.multiCall.getCallData(poLidoStakeManagerContract.contract, "epoch"),
      this.multiCall.getCallData(poLidoNFTContract.contract, "getOwnedTokens", [
        account,
      ]),
    ].filter((call): call is CallData => !!call);

    const [multicallResults2, currentPolygonHeight] = await Promise.all([
      this.multiCall.executeMulticalls(rawCalls2, true, chainId, web3ToUse),
      callPlatformApis(chainId, "lido", "checkpoints", "count"),
    ]);

    if (!multicallResults2) return [];

    let [poLidoStakeManagerEpoch, tokenIds] = multicallResults2.map(
      (r) => r.data
    );

    if (isEmpty(tokenIds)) return [];

    // Filter by non-zero ID
    tokenIds = tokenIds.filter((tokenId: string) => +tokenId !== 0);
    // console.log('tokenIds', tokenIds)

    if (isEmpty(tokenIds)) return [];

    // Decrease checkpoint
    let epochIntervalInSeconds = 2700;
    let currentEpochTimestamp = Date.now() / 1000;
    let currentPolygonEpoch =
      currentPolygonHeight?.result || poLidoStakeManagerEpoch;

    // Get checkpoints interval
    if (currentPolygonEpoch) {
      // Safe margin for epoch fethed from polido stake manager
      if (!currentPolygonHeight || !currentPolygonHeight.result) {
        currentPolygonEpoch -= 2;
      }
      const [lastEpochInfo, currentEpochInfo] = await Promise.all([
        callPlatformApis(
          chainId,
          "lido",
          "checkpoints",
          (currentPolygonEpoch - 1).toString()
        ),
        callPlatformApis(
          chainId,
          "lido",
          "checkpoints",
          currentPolygonEpoch.toString()
        ),
      ]);

      if (currentEpochInfo && currentEpochInfo.result) {
        currentEpochTimestamp = parseInt(currentEpochInfo.result.timestamp);

        if (lastEpochInfo && lastEpochInfo.result) {
          epochIntervalInSeconds =
            currentEpochInfo.result.timestamp - lastEpochInfo.result.timestamp;
        }
      }
      // console.log('epoch info', currentEpochInfo, lastEpochInfo, epochIntervalInSeconds);
    } else {
      currentPolygonEpoch = 0;
    }

    const tokensAmounts = await asyncReduce<any, any>(
      tokenIds,
      async (tokenId) => {
        const [tokenAmount, token2WithdrawRequests] = await Promise.all([
          stMaticContract.contract.methods.getMaticFromTokenId(tokenId).call(),
          stMaticContract.contract.methods
            .getToken2WithdrawRequests(tokenId)
            .call(),
        ]);

        const usersRequest = !isEmpty(token2WithdrawRequests)
          ? token2WithdrawRequests[0]
          : {
              requestEpoch: 0,
            };

        // console.log(tokenId, 'tokenAmount', tokenAmount, 'token2WithdrawRequests', token2WithdrawRequests, 'usersRequest', usersRequest)

        const status =
          Math.round(usersRequest.requestEpoch) >=
          Math.round(poLidoStakeManagerEpoch)
            ? "pending"
            : "available";

        const remainingEpochs = Math.max(
          0,
          Math.round(usersRequest.requestEpoch) -
            Math.round(currentPolygonEpoch)
        );

        // Calculate tokens unlock time
        const remainingTime =
          Math.round(remainingEpochs) * epochIntervalInSeconds;
        const unlockTimestamp = (currentEpochTimestamp + remainingTime) * 1000;
        const contractSendMethod =
          stMaticContract.contract.methods.claimTokens(tokenId);

        return {
          status,
          tokenId,
          remainingTime,
          unlockTimestamp,
          remainingEpochs,
          contractSendMethod,
          currentEpoch: Math.round(currentPolygonEpoch),
          requestEpoch: Math.round(usersRequest.requestEpoch),
          amount: fixTokenDecimals(tokenAmount, MATIC?.decimals),
        };
      },
      (acc, value) => (value ? [...acc, value] : acc),
      []
    );

    return tokensAmounts;
  }

  public async getVaultsCollectedFees(
    vaults: Vault[]
  ): Promise<Record<AssetId, Transaction[]>> {
    const filteredVaults = vaults.filter((vault: Vault) =>
      ["BY", "AA", "BB"].includes(vault.type)
    );

    const collectedFeesPromises = Object.keys(chains).map((chainId: string) =>
      asyncReduce<any, any>(
        FEES_COLLECTORS[chainId],
        async (feeCollectorAddress) => {
          const explorer = getExplorerByChainId(+chainId);
          const endpoint = `${
            explorer?.endpoints[+chainId]
          }?module=account&action=tokentx&address=${feeCollectorAddress}&sort=desc`;
          const callback = async () =>
            await makeEtherscanApiRequest(endpoint, explorer?.keys || []);
          const etherscanTxlist = this.cacheProvider
            ? await this.cacheProvider.checkAndCache(endpoint, callback, 300)
            : await callback();

          // console.log('etherscanTxlist', chainId, feeCollectorAddress, endpoint, etherscanTxlist)

          if (!etherscanTxlist) return {};

          // Process transactions
          const vaultsTransactions = await asyncReduce<
            Vault,
            Record<AssetId, Transaction[]>
          >(
            vaults,
            async (vault: Vault) => {
              return {
                [vault.id]: await vault.getTransactions(
                  feeCollectorAddress,
                  etherscanTxlist
                ),
              };
            },
            (acc, value) => (value ? { ...acc, ...value } : acc),
            {}
          );

          // console.log('vaultsTransactions', chainId, feeCollectorAddress, endpoint, vaultsTransactions)

          return etherscanTxlist.reduce(
            (
              vaultsCollectedFees: Record<AssetId, Transaction[]>,
              tx: EtherscanTransaction
            ) => {
              // Look for incoming txs
              if (tx.to.toLowerCase() !== feeCollectorAddress.toLowerCase())
                return vaultsCollectedFees;
              // Lookup for tranche vault
              let foundVault = filteredVaults.find(
                (vault: Vault) => vault.id === tx.contractAddress.toLowerCase()
              );
              if (foundVault) {
                // Look for vaults transactions (deposits/redeems)
                const foundVaultTransaction = vaultsTransactions[
                  foundVault.id
                ].find(
                  (vaultTx: Transaction) =>
                    vaultTx.hash.toLowerCase() === tx.hash.toLowerCase() &&
                    vaultTx.subAction === "swapIn"
                );
                if (foundVaultTransaction) return vaultsCollectedFees;

                if (!vaultsCollectedFees[foundVault.id]) {
                  vaultsCollectedFees[foundVault.id] = [];
                }

                vaultsCollectedFees[foundVault.id].push({
                  ...tx,
                  action: "fee",
                  idlePrice: BNify(0),
                  idleAmount: BNify(0),
                  subAction: "collected",
                  assetId: foundVault.id,
                  chainId: foundVault.chainId,
                  underlyingAmount: fixTokenDecimals(tx.value, 18),
                });
                // console.log(foundVault.id, tx.hash, 'from', tx.from, 'to', tx.to, feeCollectorAddress, fixTokenDecimals(tx.value, 18).toString())
              } else {
                // Lookup for BY vault
                foundVault = filteredVaults.find(
                  (vault: Vault) => vault.id === tx.from.toLowerCase()
                );
                if (foundVault && "underlyingToken" in foundVault) {
                  // Look for vaults transactions (deposits/redeems)
                  const foundVaultTransaction = vaultsTransactions[
                    foundVault.id
                  ].find(
                    (vaultTx: Transaction) =>
                      vaultTx.hash.toLowerCase() === tx.hash.toLowerCase() &&
                      vaultTx.subAction === "swapIn"
                  );
                  if (foundVaultTransaction) return vaultsCollectedFees;

                  // Init vault array
                  if (!vaultsCollectedFees[foundVault.id]) {
                    vaultsCollectedFees[foundVault.id] = [];
                  }

                  // Check for same vault underlying collected
                  const isSameUnderlying = cmpAddrs(
                    foundVault.underlyingToken?.address as string,
                    tx.contractAddress
                  );
                  if (isSameUnderlying) {
                    vaultsCollectedFees[foundVault.id].push({
                      ...tx,
                      action: "fee",
                      idlePrice: BNify(0),
                      idleAmount: BNify(0),
                      subAction: "collected",
                      assetId: foundVault.id,
                      chainId: foundVault.chainId,
                      underlyingAmount: fixTokenDecimals(
                        tx.value,
                        foundVault.underlyingToken?.decimals
                      ),
                    });
                    // console.log(foundVault.id, tx.hash, 'from', tx.from, 'to', tx.to, feeCollectorAddress, fixTokenDecimals(tx.value, foundVault.underlyingToken?.decimals).toString())
                  } else {
                    // Check for collected rewards tokens instead
                    const rewardToken = foundVault.rewardTokens.find(
                      (rewardToken: UnderlyingTokenProps) =>
                        cmpAddrs(
                          rewardToken.address as string,
                          tx.contractAddress
                        )
                    );
                    if (rewardToken?.address) {
                      vaultsCollectedFees[foundVault.id].push({
                        ...tx,
                        action: "fee",
                        idlePrice: BNify(0),
                        idleAmount: BNify(0),
                        subAction: "collected",
                        chainId: foundVault.chainId,
                        assetId: rewardToken.address,
                        underlyingAmount: fixTokenDecimals(
                          tx.value,
                          rewardToken.decimals || 18
                        ),
                      });
                    }
                  }
                }
              }
              return vaultsCollectedFees;
            },
            {}
          );
        },
        // (acc, value) => value ? {...acc, ...value} : acc,
        (acc, vaultsCollectedFees) => {
          // value ? {...acc, ...value} : acc
          if (vaultsCollectedFees) {
            Object.keys(vaultsCollectedFees).forEach((vaultId: AssetId) => {
              if (!acc[vaultId]) {
                acc[vaultId] = [];
              }
              acc[vaultId] = [...acc[vaultId], ...vaultsCollectedFees[vaultId]];
            });
          }
          return acc;
        },
        {}
      )
    );

    const collectedFeesResults = await Promise.all(collectedFeesPromises);
    return collectedFeesResults.reduce(
      (collectedFees: Record<AssetId, any[]>, vaultsTxs: any) => {
        Object.keys(vaultsTxs).forEach((assetId: AssetId) => {
          if (!collectedFees[assetId]) {
            collectedFees[assetId] = [];
          }
          collectedFees[assetId] = collectedFees[assetId].concat(
            vaultsTxs[assetId]
          );
        });
        return collectedFees;
      },
      {}
    );
  }

  private calcNewAPRSplit(ratio: BigNumber): BigNumber {
    const FULL_ALLOC = 100;
    const AA_RATIO_LIM_UP = 99;
    const AA_RATIO_LIM_DOWN = 50;

    let aux = BNify(0);
    if (ratio.gte(AA_RATIO_LIM_UP)) {
      aux = BNify(AA_RATIO_LIM_UP);
    } else if (ratio.gt(AA_RATIO_LIM_DOWN)) {
      aux = BNify(ratio);
    } else {
      aux = BNify(AA_RATIO_LIM_DOWN);
    }

    return BNify(aux).times(ratio).div(FULL_ALLOC);
  }

  public getVaultNewApr(
    asset: Asset,
    vault: Vault,
    liqToAdd: BigNumber
  ): BigNumber {
    if (!liqToAdd || isBigNumberNaN(liqToAdd)) {
      return BNify(0);
    }

    if (vault instanceof TrancheVault) {
      const FULL_ALLOC = 100;
      const newTotalTvl = BNify(asset.totalTvl).plus(liqToAdd);
      switch (vault.type) {
        case "AA":
          const newTvlRatioAA = BNify(BNify(asset.tvl).plus(liqToAdd))
            .times(FULL_ALLOC)
            .div(newTotalTvl);
          const newAprSplitAA = this.calcNewAPRSplit(newTvlRatioAA);
          // console.log('calcNewAPRSplit - AA', BNify(asset.tvl).plus(liqToAdd).toString(), newTotalTvl.toString(), newTvlRatioAA.toString(), newAprSplitAA.toString(), newAprSplitAA.div(newTvlRatioAA).toString())
          return BNify(asset.baseApr).times(newAprSplitAA.div(newTvlRatioAA));
        case "BB":
          const newTvlRatioBB = BNify(FULL_ALLOC).minus(
            BNify(BNify(asset.tvl).plus(liqToAdd))
              .times(FULL_ALLOC)
              .div(newTotalTvl)
          );
          const newAprSplitBB = this.calcNewAPRSplit(newTvlRatioBB);
          // console.log('calcNewAPRSplit - BB', newTvlRatioBB.toString(), BNify(FULL_ALLOC).minus(newAprSplitBB).toString(), BNify(FULL_ALLOC).minus(newAprSplitBB).div(BNify(FULL_ALLOC).minus(newTvlRatioBB)).toString())
          return BNify(asset.baseApr).times(
            BNify(FULL_ALLOC)
              .minus(newAprSplitBB)
              .div(BNify(FULL_ALLOC).minus(newTvlRatioBB))
          );
        default:
          break;
      }
    }

    return BNify(0);
  }

  public async getVaultEpochData(vault: Vault): Promise<EpochData | null> {
    if (vault instanceof TrancheVault) {
      switch (vault.cdoConfig.name) {
        case "IdleCDO_amphor_wstETH":
          const epochData = await this.getAmphorwstETHEpochData(+vault.chainId);
          if (!epochData) {
            return null;
          }
          let index = 0;
          const weeklyThresholds: AmphorEpoch["weeklyThresholds"] = Object.keys(
            epochData
          )
            .filter((key) => key.match(/ET[\d]Price/))
            .reduce(
              (
                weeklyThresholds: AmphorEpoch["weeklyThresholds"],
                thresholdKey: string
              ) => {
                const start = !index
                  ? toDayjs(epochData.epochStart)
                  : toDayjs(weeklyThresholds[index - 1].end).add(1, "day");
                const end = !index
                  ? start.add(+epochData.first_week_duration, "day")
                  : start.add(6, "day");
                if (end.isSameOrBefore(toDayjs(epochData.epochEnd))) {
                  // console.log('weeklyThresholds', index, dateToLocale(start, 'en'), dateToLocale(end, 'en'), epochData[thresholdKey])
                  weeklyThresholds[index] = {
                    number: index + 1,
                    end: end.valueOf(),
                    start: start.valueOf(),
                    threshold: BNify(epochData[thresholdKey]),
                  };
                  index++;
                }
                return weeklyThresholds;
              },
              {}
            );

          return {
            weeklyThresholds,
            bullish: !!epochData.bullish,
            cdoId: vault.cdoConfig.address,
            apr: BNify(epochData.epochApr),
            number: +epochData.epochNumber,
            underlyingToken: epochData.underlying,
            epochEndDate: toDayjs(epochData.epochEnd).valueOf(),
            epochStartDate: toDayjs(epochData.epochStart).valueOf(),
            riskThreshold: BNify(epochData.protection_band),
          };
        default:
          return null;
      }
    }
    return null;
  }

  public async getVaultTotalApr(
    vault: Vault
  ): Promise<VaultAdditionalApr | null> {
    if (vault instanceof TrancheVault) {
      switch (vault.cdoConfig.name) {
        case "IdleCDO_amphor_wstETH":
          const apr = await this.getAmphorwstETHTrancheTotalApr(+vault.chainId);
          return {
            apr,
            vaultId: vault.id,
            cdoId: vault.cdoConfig.address,
          };
        default:
          return null;
      }
    }
    return null;
  }

  public async getVaultAdditionalApr(
    vault: Vault
  ): Promise<VaultAdditionalApr> {
    if (vault instanceof TrancheVault) {
      switch (+vault.chainId) {
        case 1:
          switch (vault.cdoConfig.name) {
            case "IdleCDO_lido_MATIC":
              return {
                vaultId: vault.id,
                cdoId: vault.cdoConfig.address,
                apr: await this.getMaticTrancheApy(vault),
              };
            case "IdleCDO_lido_stETH":
              return {
                vaultId: vault.id,
                cdoId: vault.cdoConfig.address,
                apr: await this.getStETHTrancheApy(vault),
              };
            case "IdleCDO_amphor_wstETH":
              return {
                type: "strategy",
                vaultId: vault.id,
                cdoId: vault.cdoConfig.address,
                apr: await this.getAmphorwstETHTrancheApy(vault),
              };
            case "IdleCDO_ethena_USDe":
              return {
                vaultId: vault.id,
                cdoId: vault.cdoConfig.address,
                apr: await this.getEthenaUSDeTrancheApy(vault),
              };
            case "IdleCDO_instadapp_stETH":
              return {
                vaultId: vault.id,
                cdoId: vault.cdoConfig.address,
                apr: await this.getInstadappStETHTrancheApy(vault),
              };
            default:
              return {
                apr: BNify(0),
                vaultId: vault.id,
                cdoId: vault.cdoConfig.address,
              };
          }
        case 10:
          switch (vault.cdoConfig.name) {
            case "IdleCDO_clearpool_fasanara_USDT":
            case "IdleCDO_clearpool_portofino_USDT":
            case "IdleCDO_clearpool_wincent_USDC":
            case "IdleCDO_clearpool_bastion_USDT":
              return {
                type: "rewards",
                vaultId: vault.id,
                cdoId: vault.cdoConfig.address,
                apr: await this.getOptimismTrancheAdditionalApy(vault),
              };
            default:
              return {
                apr: BNify(0),
                vaultId: vault.id,
                cdoId: vault.cdoConfig.address,
              };
          }
        default:
          break;
      }
      // console.log('getVaultAdditionalApr', vault.cdoConfig.name, vault.type)
    }

    return {
      vaultId: vault.id,
      apr: BNify(0),
    };
  }

  public getRewardsEmissionTotalApr(
    vault: Vault,
    asset: Asset
  ): VaultAdditionalApr {
    if (vault instanceof BestYieldVault) {
      switch (vault.idleConfig.token) {
        // case "idleUSDTRWA":
        //   return {
        //     type: "rewards",
        //     vaultId: vault.id,
        //     apr: this.getBestYieldRWAAdditionalApy(asset),
        //   };
        default:
          return {
            apr: BNify(0),
            vaultId: vault.id,
          };
      }
    } else if (vault instanceof TrancheVault) {
      switch (vault.cdoConfig.name) {
        // case "IdleCDO_gearbox_USDC":
        // case "IdleCDO_gearbox_WETH":
        //   if (vault.type === "AA") {
        //     return {
        //       type: "rewards",
        //       vaultId: vault.id,
        //       apr: this.getGearboxSrTrancheAdditionalApy(asset),
        //     };
        //   }
        //   break;
        default:
          return {
            apr: BNify(0),
            vaultId: vault.id,
          };
      }
    }
    return {
      vaultId: vault.id,
      apr: BNify(0),
    };
  }

  public getVaultRewardsEmissions(
    vault: Vault,
    vaults: Vault[],
    assetsData: Assets
  ): RewardEmission[] | null {
    if (vault instanceof TrancheVault) {
      switch (vault.cdoConfig.name) {
        case "IdleCDO_ethena_USDe":
          if (assetsData[vault.id]?.type === "AA") {
            const otherVault = vaults.find(
              (otherVault: Vault) =>
                otherVault instanceof TrancheVault &&
                otherVault.type === "BB" &&
                otherVault.cdoConfig.address === vault.cdoConfig.address
            );
            if (otherVault) {
              const seniorTvlUsd = bnOrZero(assetsData[vault.id].tvlUsd);
              const juniorTvlUsd = bnOrZero(assetsData[otherVault.id].tvlUsd);
              return [
                {
                  prefix: "",
                  suffix: "x",
                  annualDistribution: BigNumber(0),
                  annualDistributionUsd: BigNumber(0),
                  assetId: "0x4c9edd5852cd905f086c759e8383e09bff1e68b3",
                  tooltip:
                    "assets.assetDetails.tooltips.ethenaShardsRewardEmission",
                  annualDistributionOn1000Usd: BNify(1).plus(
                    bnOrZero(juniorTvlUsd).div(bnOrZero(seniorTvlUsd))
                  ),
                },
              ];
            }
          }
          break;
        // case 'IdleCDO_gearbox_WETH':
        //   return [
        //     {
        //       annualDistribution: BigNumber(0),
        //       annualDistributionUsd: BigNumber(0),
        //       annualDistributionOn1000Usd: BNify(1000),
        //       assetId: '0x8E3A59427B1D87Db234Dd4ff63B25E4BF94672f4',
        //       tooltip: 'assets.assetDetails.tooltips.gearboxKelpMilesRewardEmission',
        //     }
        //   ]
        default:
          break;
      }
    }

    return null;
  }

  public async getVaultAdditionalBaseApr(
    vault: Vault
  ): Promise<VaultAdditionalApr> {
    if (vault instanceof TrancheVault) {
      let apr = BNify(0);
      let strategyApr = BNify(0);
      switch (vault.cdoConfig.name) {
        case "IdleCDO_lido_MATIC":
          strategyApr = await this.getMaticTrancheStrategyApr(vault.chainId);
          apr = strategyApr ? BNify(strategyApr).times(100) : BNify(0);
          return {
            apr,
            vaultId: vault.id,
            cdoId: vault.cdoConfig.address,
          };
        case "IdleCDO_lido_stETH":
          strategyApr = await this.getStETHTrancheStrategyApr(vault.chainId);
          apr = strategyApr ? BNify(strategyApr).times(100) : BNify(0);
          return {
            apr,
            vaultId: vault.id,
            cdoId: vault.cdoConfig.address,
          };
        case "IdleCDO_amphor_wstETH":
          strategyApr = await this.getAmphorwstETHTrancheBaseStrategyApr(
            vault.chainId
          );
          apr = strategyApr ? BNify(strategyApr).times(100) : BNify(0);
          return {
            apr,
            type: "base",
            vaultId: vault.id,
            cdoId: vault.cdoConfig.address,
          };
        case "IdleCDO_ethena_USDe":
          strategyApr = await this.getEthenaUSDeTrancheStrategyApr(
            vault.chainId
          );
          apr = strategyApr ? BNify(strategyApr).times(100) : BNify(0);
          return {
            apr,
            vaultId: vault.id,
            cdoId: vault.cdoConfig.address,
          };
        case "IdleCDO_instadapp_stETH":
          strategyApr = await this.getInstadappStETHTrancheStrategyApr(
            vault.chainId
          );
          apr = strategyApr ? BNify(strategyApr).times(100) : BNify(0);
          return {
            apr,
            vaultId: vault.id,
            cdoId: vault.cdoConfig.address,
          };
        default:
          return {
            apr: BNify(0),
            vaultId: vault.id,
            cdoId: vault.cdoConfig.address,
          };
      }
    }

    return {
      vaultId: vault.id,
      apr: BNify(0),
    };
  }

  private async getSubgraphData(
    vault: Vault,
    filters?: PlatformApiFilters
  ): Promise<SubgraphData> {
    const currTime = Math.ceil(Date.now() / 1000);

    const cacheKey = `subgraph_${vault.chainId}_${vault.id}`;
    const cachedData = this.cacheProvider
      ? await this.cacheProvider.getCachedUrl(cacheKey)
      : null;
    const lastFetchTimestamp = cachedData && cachedData.timestamp;
    const latestTimestamp =
      cachedData &&
      cachedData.data.reduce(
        (t: number, d: any) => Math.max(t, +d.timeStamp),
        0
      );

    if (filters) {
      // Replace start timestamp with latest cached timestamp
      if (latestTimestamp) {
        filters.start = latestTimestamp + 1;
      }

      // End timestamp cannot be after current time
      if (filters.end) {
        filters.end = Math.min(currTime, +filters.end);
      }
    }

    // Retrieve new data if the latest cached is more than 1 day and 1 hour old
    const daysDiff =
      latestTimestamp && dayDiff(latestTimestamp * 1000, currTime * 1000);
    const hoursDiff =
      latestTimestamp &&
      dateDiff(latestTimestamp * 1000, currTime * 1000, "h", true);
    const lastFetchTimeDiff =
      lastFetchTimestamp &&
      dateDiff(lastFetchTimestamp, currTime * 1000, "h", true);

    const fetchData =
      !cachedData ||
      (daysDiff >= 1 && hoursDiff >= 1 && lastFetchTimeDiff >= 1);

    // console.log('getSubgraphData', vault.id, latestTimestamp, currTime, daysDiff, hoursDiff, lastFetchTimeDiff, fetchData)

    let results = fetchData
      ? await getSubgraphTrancheInfo(
          vault.chainId,
          vault.id,
          filters?.start,
          filters?.end
        )
      : cachedData.data;

    // Save fetched data
    if (fetchData && results) {
      const dataToCache = new Map();

      if (cachedData) {
        for (const result of cachedData.data) {
          const date = +dayjs(+result.timeStamp * 1000)
            .startOf("day")
            .valueOf();
          dataToCache.set(date, result);
        }
      }

      for (const result of results) {
        const date = +dayjs(+result.timeStamp * 1000)
          .startOf("day")
          .valueOf();
        dataToCache.set(date, result);
      }

      results = Array.from(dataToCache.values());
      if (this.cacheProvider) {
        this.cacheProvider.saveData(cacheKey, results, 0);
      }
    }

    return {
      filters,
      results,
      cacheKey,
      daysDiff,
      fetchData,
      cachedData,
      latestTimestamp,
    };
  }

  public async getVaultHistoricalDataFromApiV2(
    vault: Vault,
    filters?: PlatformApiFilters
  ): Promise<VaultHistoricalData> {
    const output = {
      vaultId: vault.id,
      tvls: [],
      rates: [],
      prices: [],
    };

    const vaultData = await callPlatformApis(
      vault.chainId,
      "idle",
      "vaults",
      "",
      {
        limit: 1,
        address: vault.id,
      }
    );

    if (!vaultData) return output;

    // console.log("vaultData", vault.id, vaultData);

    const apiConfig = getPlatformApiConfig(
      vault.chainId,
      "idle",
      "vaultBlocks"
    );
    const endpoint = getPlatformApisEndpoint(
      vault.chainId,
      "idle",
      "vaultBlocks",
      "",
      {
        ...filters,
        vaultId: vaultData._id,
      }
    );

    if (!endpoint) return output;

    const results = await getIdleAPIV2AllPages(endpoint, apiConfig);

    const { tvls, rates, prices } = sortArrayByKey(
      results,
      "block.number"
    ).reduce(
      (acc: Record<string, HistoryData[]>, result: any) => {
        const date = floorTimestamp(+result.block.timestamp * 1000);

        const decimals =
          "underlyingToken" in vault && vault.underlyingToken?.decimals
            ? vault.underlyingToken?.decimals
            : 18;
        const tvl = {
          date,
          value: fixTokenDecimals(bnOrZero(result.TVL?.token), 18).toNumber(),
        };
        const rate = {
          date,
          value: bnOrZero(result.APRs[0]?.rate).toNumber(),
        };
        const price = {
          date,
          value: fixTokenDecimals(result.price, decimals).toNumber(),
        };

        return {
          tvls: {
            ...acc.tvls,
            [date]: tvl,
          },
          rates: {
            ...acc.rates,
            [date]: rate,
          },
          prices: {
            ...acc.prices,
            [date]: price,
          },
        };
      },
      {
        tvls: {},
        rates: {},
        prices: {},
      }
    );

    // console.log(
    //   "getVaultHistoricalDataFromApiV2",
    //   vault.id,
    //   tvls,
    //   rates,
    //   prices
    // );

    return {
      vaultId: vault.id,
      tvls: Object.values(tvls),
      rates: Object.values(rates),
      prices: Object.values(prices),
    };
  }

  public async getVaultHistoricalDataFromSubgraph(
    vault: Vault,
    filters?: PlatformApiFilters
  ): Promise<VaultHistoricalData> {
    const { results } = await this.getSubgraphData(vault, filters);

    if (!results) {
      return {
        vaultId: vault.id,
        tvls: [],
        rates: [],
        prices: [],
      };
    }

    // console.log('getVaultHistoricalDataFromSubgraph', vault.id, results)

    const dailyData = results.reduce(
      (dailyData: Record<string, Record<number, HistoryData>>, result: any) => {
        const date = +dayjs(+result.timeStamp * 1000)
          .startOf("day")
          .valueOf();
        const decimals =
          "underlyingToken" in vault && vault.underlyingToken?.decimals
            ? vault.underlyingToken?.decimals
            : 18;
        const price = parseFloat(
          fixTokenDecimals(result.virtualPrice, decimals).toFixed(8)
        );
        const rate = parseFloat(fixTokenDecimals(result.apr, 18).toFixed(8));
        const tvl = parseFloat(
          fixTokenDecimals(result.contractValue, decimals).toFixed(8)
        );

        dailyData.rates[date] = {
          date,
          value: rate,
        };

        dailyData.tvls[date] = {
          date,
          value: tvl,
        };

        dailyData.prices[date] = {
          date,
          value: price,
        };

        return dailyData;
      },
      {
        tvls: {},
        rates: {},
        prices: {},
      }
    );

    return {
      vaultId: vault.id,
      tvls: Object.values(dailyData.tvls),
      rates: Object.values(dailyData.rates),
      prices: Object.values(dailyData.prices),
    };
  }

  public async getVaultPricesFromSubgraph(
    vault: Vault,
    filters?: PlatformApiFilters
  ): Promise<VaultHistoricalPrices> {
    const historicalPrices: VaultHistoricalPrices = {
      vaultId: vault.id,
      prices: [],
    };

    const { results } = await this.getSubgraphData(vault, filters);

    historicalPrices.prices = results.map((result: any) => {
      const date = +result.timeStamp * 1000;
      const decimals =
        "underlyingToken" in vault && vault.underlyingToken?.decimals
          ? vault.underlyingToken?.decimals
          : 18;
      const value = parseFloat(
        fixTokenDecimals(result.virtualPrice, decimals).toFixed(8)
      );

      return {
        date,
        value,
      };
    });

    // if (vault.id === '0x077212c69a66261cf7bd1fd3b5c5db7cffa948ee'){
    //   console.log('getVaultPricesFromSubgraph', vault, results, historicalPrices.prices)
    // }

    return historicalPrices;
  }

  public async getVaultRatesFromSubgraph(
    vault: Vault,
    filters?: PlatformApiFilters
  ): Promise<VaultHistoricalRates> {
    const historicalRates: VaultHistoricalRates = {
      vaultId: vault.id,
      rates: [],
    };

    const { results } = await this.getSubgraphData(vault, filters);

    historicalRates.rates = results.map((result: any) => {
      const date = +result.timeStamp * 1000;
      const value = parseFloat(fixTokenDecimals(result.apr, 18).toFixed(8));
      return {
        date,
        value,
      };
    });

    return historicalRates;
  }

  private async getIdleRatesData(vault: Vault, filters?: PlatformApiFilters) {
    if (!("underlyingToken" in vault) || !vault.underlyingToken?.address) {
      return {
        results: null,
      };
    }

    const currTime = Math.ceil(Date.now() / 1000);

    const apiType =
      "flags" in vault && vault.flags?.apiType ? vault.flags?.apiType : "rates";
    const address =
      apiType === "rates" ? vault.underlyingToken?.address : vault.id;

    const cacheKey = `idleRates_${vault.chainId}_${address}`;
    const cachedData = this.cacheProvider
      ? await this.cacheProvider.getCachedUrl(cacheKey)
      : null;

    const lastFetchTimestamp = cachedData && cachedData.timestamp;
    const latestTimestamp =
      cachedData &&
      cachedData.data.reduce(
        (t: number, d: any) => Math.max(t, +d.timestamp),
        0
      );

    // Retrieve new data if the latest cached is more than 1 day and 1 hour old
    const daysDiff =
      latestTimestamp && dayDiff(latestTimestamp * 1000, currTime * 1000);
    const hoursDiff =
      latestTimestamp &&
      dateDiff(latestTimestamp * 1000, currTime * 1000, "h", true);
    const lastFetchTimeDiff =
      lastFetchTimestamp &&
      dateDiff(lastFetchTimestamp, currTime * 1000, "h", true);

    if (filters) {
      // Replace start timestamp with latest cached timestamp
      if (latestTimestamp) {
        filters.start = latestTimestamp + 1;
      }

      // End timestamp cannot be after current time
      if (filters.end) {
        filters.end = Math.min(currTime, +filters.end);
      }
    } /* else {
      filters = {}
    }
    filters.order = 'desc'
    */

    const fetchData =
      !cachedData ||
      (daysDiff >= 1 && hoursDiff >= 1 && lastFetchTimeDiff >= 0.5);
    let results = fetchData
      ? await callPlatformApis(
          vault.chainId,
          "idle",
          apiType as string,
          address,
          filters
        )
      : cachedData.data;

    // if (vault.id === '0x3fe7940616e5bc47b0775a0dccf6237893353bb4'){
    //   console.log('getIdleRatesData', cacheKey, latestTimestamp, currTime, daysDiff, hoursDiff, lastFetchTimeDiff, fetchData, results)
    // }

    // Replace if not valid
    results = results || [];

    // Save fetched data
    if (fetchData) {
      const dataToCache = new Map();

      let latestIdlePrice = BNify(0);
      if (cachedData) {
        for (const result of cachedData.data) {
          const date = +dayjs(+result.timestamp * 1000)
            .startOf("day")
            .valueOf();
          dataToCache.set(date, result);
          latestIdlePrice = BigNumber.maximum(
            latestIdlePrice,
            BNify(result.idlePrice)
          );
        }
      }

      for (const result of results) {
        latestIdlePrice = BigNumber.maximum(
          latestIdlePrice,
          BNify(result.idlePrice)
        );
        result.idlePrice = BigNumber.maximum(
          BNify(result.idlePrice),
          latestIdlePrice
        ).toString();
        // console.log(`REPLACE idlePrice: ${result.idlePrice}<${latestIdlePrice}`)
        const date = +dayjs(+result.timestamp * 1000)
          .startOf("day")
          .valueOf();
        dataToCache.set(date, result);
      }

      // Replace results with cached data
      results = Array.from(dataToCache.values());

      if (this.cacheProvider) {
        // console.log('dataToCache', cacheKey, dataToCache)
        this.cacheProvider.saveData(cacheKey, results, 0);
      }
    }

    return {
      filters,
      results,
      cacheKey,
      daysDiff,
      fetchData,
      cachedData,
      latestTimestamp,
    };
  }

  public async getVaultHistoricalDataFromIdleApi(
    vault: Vault,
    filters?: PlatformApiFilters
  ): Promise<VaultHistoricalData> {
    const historicalData: VaultHistoricalData = {
      vaultId: vault.id,
      tvls: [],
      rates: [],
      prices: [],
    };

    if (!("underlyingToken" in vault) || !vault.underlyingToken?.address)
      return historicalData;

    const { results } = await this.getIdleRatesData(vault, filters);

    if (!results) return historicalData;

    const dailyData = results.reduce(
      (dailyData: Record<string, Record<number, HistoryData>>, result: any) => {
        const decimals = vault.underlyingToken?.decimals || 18;
        const date = +dayjs(+result.timestamp * 1000)
          .startOf("day")
          .valueOf();
        const price = parseFloat(
          fixTokenDecimals(result.idlePrice, decimals).toFixed(8)
        );
        const rate = parseFloat(
          fixTokenDecimals(result.idleRate, 18).toFixed(8)
        );
        const tvl = parseFloat(
          fixTokenDecimals(result.idleSupply, 18)
            .times(fixTokenDecimals(result.idlePrice, decimals))
            .toFixed(8)
        );

        dailyData.rates[date] = {
          date,
          value: rate,
        };

        dailyData.tvls[date] = {
          date,
          value: tvl,
        };

        dailyData.prices[date] = {
          date,
          value: price,
        };

        return dailyData;
      },
      {
        tvls: {},
        rates: {},
        prices: {},
      }
    );

    historicalData.tvls = Object.values(dailyData.tvls);
    historicalData.rates = Object.values(dailyData.rates);
    historicalData.prices = Object.values(dailyData.prices);

    return historicalData;
  }

  public async getVaultPricesFromIdleApi(
    vault: Vault,
    filters?: PlatformApiFilters
  ): Promise<VaultHistoricalPrices> {
    const historicalPrices = {
      vaultId: vault.id,
      prices: [],
    };

    if (!("underlyingToken" in vault) || !vault.underlyingToken?.address)
      return historicalPrices;

    const { results } = await this.getIdleRatesData(vault, filters);

    historicalPrices.prices = results.map((result: any) => {
      const decimals = vault.underlyingToken?.decimals || 18;
      const date = +result.timestamp * 1000;
      const value = parseFloat(
        fixTokenDecimals(result.idlePrice, decimals).toFixed(8)
      );
      return {
        date,
        value,
      };
    });

    return historicalPrices;
  }

  public async getVaultRatesFromIdleApi(
    vault: Vault,
    filters?: PlatformApiFilters
  ): Promise<VaultHistoricalRates> {
    const historicalRates = {
      vaultId: vault.id,
      rates: [],
    };

    if (!("underlyingToken" in vault) || !vault.underlyingToken?.address)
      return historicalRates;

    const { results } = await this.getIdleRatesData(vault, filters);

    historicalRates.rates = results.map((result: any) => {
      const date = +result.timestamp * 1000;
      const value = parseFloat(
        fixTokenDecimals(result.idleRate, 18).toFixed(8)
      );
      return {
        date,
        value,
      };
    });

    return historicalRates;
  }
}
