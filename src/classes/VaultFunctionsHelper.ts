import Web3 from 'web3'
import dayjs from 'dayjs'
import { Vault } from 'vaults/'
import { TrancheVault } from 'vaults/TrancheVault'
import { Multicall, CallData } from 'classes/'
import { BNify, normalizeTokenAmount, makeEtherscanApiRequest, callPlatformApis, fixTokenDecimals, getSubgraphTrancheInfo } from 'helpers/'
import type { BigNumber, Explorer, EtherscanTransaction, VaultAdditionalApr, PlatformApiFilters, VaultHistoricalRates, VaultHistoricalPrices, VaultHistoricalData, HistoryData } from 'constants/'

export class VaultFunctionsHelper {

  readonly web3: Web3
  readonly chainId: number
  readonly explorer: Explorer | undefined
  readonly multiCall: Multicall | undefined

  constructor(chainId: number, web3: Web3, multiCall?: Multicall, explorer?: Explorer) {
    this.web3 = web3
    this.chainId = chainId
    this.explorer = explorer
    this.multiCall = multiCall
  }

  public async getTrancheHarvestApy(trancheVault: TrancheVault, trancheType: string): Promise<BigNumber> {

    if (!this.multiCall || !this.explorer) return BNify(0)

    const rawCalls: CallData[] = [
      this.multiCall.getCallData(trancheVault.cdoContract, `lastNAV${trancheType}`),
      this.multiCall.getCallData(trancheVault.cdoContract, 'trancheAPRSplitRatio'),
    ].filter( (call): call is CallData => !!call )

    const [
      multicallResults,
      lastHarvestBlockHex
    ] = await Promise.all([
      this.multiCall.executeMulticalls(rawCalls),
      this.web3.eth.getStorageAt(trancheVault.cdoConfig.address, 204)
    ]);

    if (!multicallResults) return BNify(0)

    const [trancheNAV, trancheAPRSplitRatio] = multicallResults.map( r => BNify(r.data) )
    const lastHarvestBlock = this.web3.utils.hexToNumber(lastHarvestBlockHex)

    const tranchePool = BNify(trancheNAV).div(`1e${trancheVault.underlyingToken?.decimals}`)
    const trancheAprRatio = trancheType === 'AA' ? BNify(trancheAPRSplitRatio).div(1000) : BNify(100).minus(BNify(trancheAPRSplitRatio).div(1000))

    try {
      const endpoint = `${this.explorer.endpoints[this.chainId]}?module=account&action=tokentx&address=${trancheVault.cdoConfig.address}&startblock=${lastHarvestBlock}&endblock=${lastHarvestBlock}&sort=asc`
      const harvestTxs = await makeEtherscanApiRequest(endpoint, this.explorer.keys)

      if (!harvestTxs) return BNify(0)

      const harvestTx = harvestTxs.find( (tx: EtherscanTransaction) => tx.contractAddress.toLowerCase() === trancheVault.underlyingToken?.address?.toLowerCase() && tx.to.toLowerCase() === trancheVault.cdoConfig.address.toLowerCase() )

      if (!harvestTx) return BNify(0)

      const harvestedValue = BNify(harvestTx.value).div(`1e${trancheVault.underlyingToken?.decimals}`).times(trancheAprRatio.div(100));
      const tokenApr = harvestedValue.div(tranchePool).times(52.1429);
      
      // console.log('getTrancheHarvestApy', harvestedValue.toString(), tranchePool.toString(), trancheAprRatio.toString(), tokenApr.toString(), apr2apy(tokenApr).toString())
      
      return tokenApr;
    } catch (err) {
      // console.log('err', err)
      return BNify(0)
    }
  }

  public async getMaticTrancheStrategyApr(): Promise<BigNumber> {
    const apr = await callPlatformApis(this.chainId, 'lido', 'rates');
    if (!BNify(apr).isNaN()){
      return BNify(apr).div(100);
    }
    return BNify(0);
  }

  public async getMaticTrancheApy(trancheVault: TrancheVault): Promise<BigNumber> {

    if (!this.multiCall) return BNify(0)

    const rawCalls: CallData[] = [
      this.multiCall.getCallData(trancheVault.cdoContract, 'FULL_ALLOC'),
      this.multiCall.getCallData(trancheVault.cdoContract, 'getCurrentAARatio'),
      this.multiCall.getCallData(trancheVault.cdoContract, 'trancheAPRSplitRatio')
    ].filter( (call): call is CallData => !!call )

    const [
      stratApr,
      multicallResults,
      harvestApy
    ] = await Promise.all([
      this.getMaticTrancheStrategyApr(),
      this.multiCall.executeMulticalls(rawCalls),
      this.getTrancheHarvestApy(trancheVault, trancheVault.type)
    ]);

    if (!multicallResults) return BNify(0)

    const [FULL_ALLOC, currentAARatio, trancheAPRSplitRatio] = multicallResults.map( r => BNify(r.data) )

    const isAATranche = trancheVault.type === 'AA';

    if (BNify(currentAARatio).eq(0)){
      return isAATranche ? BNify(0) : BNify(stratApr);
    }

    if (BNify(stratApr).isNaN()){
      return BNify(0);
    }

    let apr = isAATranche ? BNify(stratApr).times(trancheAPRSplitRatio).div(currentAARatio) : BNify(stratApr).times(FULL_ALLOC.minus(trancheAPRSplitRatio)).div(BNify(FULL_ALLOC).minus(currentAARatio));
    
    if (!BNify(harvestApy).isNaN()){
      apr = apr.plus(harvestApy)
    }

    // console.log('getMaticTrancheApy', FULL_ALLOC.toString(), currentAARatio.toString(), trancheAPRSplitRatio.toString(), harvestApy.toString(), apr.toString())

    return BNify(normalizeTokenAmount(apr.times(100), (trancheVault.underlyingToken?.decimals || 18)))
  }

  public async getVaultAdditionalApr(vault: Vault): Promise<VaultAdditionalApr> {
    if (vault instanceof TrancheVault) {
      switch (vault.cdoConfig.name) {
        case 'IdleCDO_lido_MATIC':
          return {
            vaultId: vault.id,
            apr: await this.getMaticTrancheApy(vault)
          }
        default:
          return {
            vaultId: vault.id,
            apr: BNify(0)
          }
      }
    }

    return {
      vaultId: vault.id,
      apr: BNify(0)
    }
  }

  public async getVaultHistoricalDataFromSubgraph(vault: Vault, filters?: PlatformApiFilters): Promise<VaultHistoricalData> {

    const results = await getSubgraphTrancheInfo(this.chainId, vault.id, filters?.start, filters?.end);

    const dailyData = results.reduce( (dailyData: Record<string, Record<number, HistoryData>>, result: any) => {
      
      const date = +(dayjs(+result.timeStamp*1000).startOf('day').valueOf())
      const decimals = ("underlyingToken" in vault) && vault.underlyingToken?.decimals ? vault.underlyingToken?.decimals : 18
      const price = parseFloat(fixTokenDecimals(result.virtualPrice, decimals).toFixed(8))
      const rate = parseFloat(fixTokenDecimals(result.apr, 18).toFixed(8))

      dailyData.rates[date] = {
        date,
        value: rate
      }

      dailyData.prices[date] = {
        date,
        value: price
      }

      return dailyData
    }, {
      rates: {},
      prices: {}
    })

    return {
      vaultId: vault.id,
      rates: Object.values(dailyData.rates),
      prices: Object.values(dailyData.prices)
    }
  }

  public async getVaultHistoricalDataFromIdleApi(vault: Vault, filters?: PlatformApiFilters): Promise<VaultHistoricalData> {

    const historicalData: VaultHistoricalData = {
      vaultId: vault.id,
      rates: [],
      prices: []
    }

    if (!("underlyingToken" in vault) || !vault.underlyingToken?.address) return historicalData

    const results = await callPlatformApis(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters);

    const dailyData = results.reduce( (dailyData: Record<string, Record<number, HistoryData>>, result: any) => {
      const decimals = vault.underlyingToken?.decimals || 18
      const date = +(dayjs(+result.timestamp*1000).startOf('day').valueOf())
      const price = parseFloat(fixTokenDecimals(result.idlePrice, decimals).toFixed(8))
      const rate = parseFloat(fixTokenDecimals(result.idleRate, 18).toFixed(8))

      dailyData.rates[date] = {
        date,
        value: rate
      }

      dailyData.prices[date] = {
        date,
        value: price
      }

      return dailyData
    }, {
      rates: {},
      prices: {}
    })

    historicalData.rates = Object.values(dailyData.rates)
    historicalData.prices = Object.values(dailyData.prices)

    return historicalData
  }

  public async getVaultPricesFromSubgraph(vault: Vault, filters?: PlatformApiFilters): Promise<VaultHistoricalPrices> {
    const historicalPrices: VaultHistoricalPrices = {
      vaultId: vault.id,
      prices: []
    }

    const infos = await getSubgraphTrancheInfo(this.chainId, vault.id, filters?.start, filters?.end);
    
    historicalPrices.prices = infos.map( (result: any) => {
      const date = +result.timeStamp*1000
      const decimals = ("underlyingToken" in vault) && vault.underlyingToken?.decimals ? vault.underlyingToken?.decimals : 18
      const value = parseFloat(fixTokenDecimals(result.virtualPrice, decimals).toFixed(8))
      return {
        date,
        value
      }
    })

    return historicalPrices
  }

  public async getVaultRatesFromSubgraph(vault: Vault, filters?: PlatformApiFilters): Promise<VaultHistoricalRates> {
    const historicalRates: VaultHistoricalRates = {
      vaultId: vault.id,
      rates: []
    }

    const rates = await getSubgraphTrancheInfo(this.chainId, vault.id, filters?.start, filters?.end);

    historicalRates.rates = rates.map( (result: any) => {
      const date = +result.timeStamp*1000
      const value = parseFloat(fixTokenDecimals(result.apr, 18).toFixed(8))
      return {
        date,
        value
      }
    })

    return historicalRates
  }

  public async getVaultPricesFromIdleApi(vault: Vault, filters?: PlatformApiFilters): Promise<VaultHistoricalPrices> {

    const historicalPrices = {
      vaultId: vault.id,
      prices: []
    }

    if (!("underlyingToken" in vault) || !vault.underlyingToken?.address) return historicalPrices

    const infos = await callPlatformApis(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters);

    historicalPrices.prices = infos.map( (result: any) => {
      const decimals = vault.underlyingToken?.decimals || 18
      const date = +result.timestamp*1000
      const value = parseFloat(fixTokenDecimals(result.idlePrice, decimals).toFixed(8))
      return {
        date,
        value
      }
    })

    return historicalPrices
  }

  public async getVaultRatesFromIdleApi(vault: Vault, filters?: PlatformApiFilters): Promise<VaultHistoricalRates> {

    const historicalRates = {
      vaultId: vault.id,
      rates: []
    }

    if (!("underlyingToken" in vault) || !vault.underlyingToken?.address) return historicalRates

    const rates = await callPlatformApis(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters);

    historicalRates.rates = rates.map( (result: any) => {
      const date = +result.timestamp*1000
      const value = parseFloat(fixTokenDecimals(result.idleRate, 18).toFixed(8))
      return {
        date,
        value
      }
    })

    return historicalRates
  }
}