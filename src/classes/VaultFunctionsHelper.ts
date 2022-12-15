import Web3 from 'web3'
import dayjs from 'dayjs'
import { Vault } from 'vaults/'
import BigNumber from 'bignumber.js'
import { Multicall, CallData } from 'classes/'
import { TrancheVault } from 'vaults/TrancheVault'
import { CacheContextProps } from 'contexts/CacheProvider'
import { BNify, normalizeTokenAmount, makeEtherscanApiRequest, getPlatformApisEndpoint, callPlatformApis, fixTokenDecimals, getSubgraphTrancheInfo, dayDiff, dateDiff, isBigNumberNaN } from 'helpers/'
import type { Asset, Harvest, Explorer, EtherscanTransaction, VaultAdditionalApr, PlatformApiFilters, VaultHistoricalRates, VaultHistoricalPrices, VaultHistoricalData, HistoryData } from 'constants/'

export interface CdoLastHarvest {
  cdoId: string
  harvest: Harvest | null
}

type ConstructorProps = {
  chainId: number
  web3: Web3
  explorer?: Explorer
  multiCall?: Multicall
  cacheProvider?: CacheContextProps
}

export class VaultFunctionsHelper {

  readonly web3: Web3
  readonly chainId: number
  readonly explorer: Explorer | undefined
  readonly multiCall: Multicall | undefined
  readonly cacheProvider: CacheContextProps | undefined

  constructor(props: ConstructorProps) {
    this.web3 = props.web3
    this.chainId = props.chainId
    this.explorer = props.explorer
    this.multiCall = props.multiCall
    this.cacheProvider = props.cacheProvider
  }

  public async getTrancheLastHarvest(trancheVault: TrancheVault): Promise<CdoLastHarvest> {
    const lastHarvest: CdoLastHarvest = {
      cdoId: trancheVault.cdoConfig.address,
      harvest: null
    }

    if (!this.multiCall || !this.explorer) return lastHarvest

    const rawCalls: CallData[] = [
      this.multiCall.getCallData(trancheVault.cdoContract, 'lastNAVAA'),
      this.multiCall.getCallData(trancheVault.cdoContract, 'lastNAVBB'),
      this.multiCall.getCallData(trancheVault.cdoContract, 'trancheAPRSplitRatio')
    ].filter( (call): call is CallData => !!call )

    const [
      multicallResults,
      lastHarvestBlockHex
    ] = await Promise.all([
      this.multiCall.executeMulticalls(rawCalls),
      this.web3.eth.getStorageAt(trancheVault.cdoConfig.address, 204)
    ]);

    if (!multicallResults) return lastHarvest

    const [
      trancheNAVAA,
      trancheNAVBB,
      trancheAPRSplitRatio
    ] = multicallResults.map( r => BNify(r.data) )
    const lastHarvestBlock = this.web3.utils.hexToNumber(lastHarvestBlockHex)

    if (!lastHarvestBlock) return lastHarvest

    const tranchePoolAA = BNify(trancheNAVAA).div(`1e${trancheVault.underlyingToken?.decimals}`)
    const tranchePoolBB = BNify(trancheNAVBB).div(`1e${trancheVault.underlyingToken?.decimals}`)

    const aprRatioAA = BNify(trancheAPRSplitRatio).div(1000)
    const aprRatioBB = BNify(100).minus(BNify(trancheAPRSplitRatio).div(1000))

    try {
      const endpoint = `${this.explorer.endpoints[this.chainId]}?module=account&action=tokentx&address=${trancheVault.cdoConfig.address}&startblock=${lastHarvestBlock}&endblock=${lastHarvestBlock}&sort=asc`
      // console.log('getTrancheLastHarvest', trancheVault.cdoConfig.address, lastHarvestBlock, this.cacheProvider?.isLoaded, this.cacheProvider?.getCachedUrl(endpoint))
      const callback = async () => (await makeEtherscanApiRequest(endpoint, this.explorer?.keys || []))
      const harvestTxs = this.cacheProvider ? await this.cacheProvider.checkAndCache(endpoint, callback, 0) : await callback()

      if (!harvestTxs) return lastHarvest

      const harvestTx = harvestTxs.find( (tx: EtherscanTransaction) => tx.contractAddress.toLowerCase() === trancheVault.underlyingToken?.address?.toLowerCase() && tx.to.toLowerCase() === trancheVault.cdoConfig.address.toLowerCase() )

      if (!harvestTx) return lastHarvest

      const totalValue = BNify(harvestTx.value).div(`1e${trancheVault.underlyingToken?.decimals}`)

      const harvestedValueAA = totalValue.times(aprRatioAA.div(100))
      const harvestedValueBB = totalValue.times(aprRatioBB.div(100))
      const tokenAprAA = harvestedValueAA.div(tranchePoolAA).times(52.1429)
      const tokenAprBB = harvestedValueBB.div(tranchePoolBB).times(52.1429)
      
      // console.log('getTrancheHarvestApy', harvestedValueAA.toString(), harvestedValueBB.toString(), tranchePoolAA.toString(), tranchePoolBB.toString(), tokenAprAA.toString(), tokenAprBB.toString())

      lastHarvest.harvest = {
        aprs: {
          AA: tokenAprAA,
          BB: tokenAprBB
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
      }
    } catch (err) {

    }

    return lastHarvest
  }

  public async getTrancheHarvestApy(trancheVault: TrancheVault, trancheType: string): Promise<BigNumber> {
    const trancheLastHarvest = await this.getTrancheLastHarvest(trancheVault)
    if (!trancheLastHarvest?.harvest) return BNify(0)
    return trancheLastHarvest.harvest.aprs[trancheVault.type]
  }

  public async getMaticTrancheStrategyApr(): Promise<BigNumber> {
    const platformApiEndpoint = getPlatformApisEndpoint(this.chainId, 'lido', 'rates')
    const callback = async () => (await callPlatformApis(this.chainId, 'lido', 'rates'))
    const apr = this.cacheProvider ? await this.cacheProvider.checkAndCache(platformApiEndpoint, callback) : await callback()

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
    
    // if (!BNify(harvestApy).isNaN()){
    //   apr = apr.plus(harvestApy)
    // }

    return BNify(normalizeTokenAmount(apr.times(100), (trancheVault.underlyingToken?.decimals || 18)))
  }

  public async getVaultAdditionalApr(vault: Vault): Promise<VaultAdditionalApr> {
    if (vault instanceof TrancheVault) {
      // console.log('getVaultAdditionalApr', vault.cdoConfig.name, vault.type)
      switch (vault.cdoConfig.name) {
        case 'IdleCDO_lido_MATIC':
          return {
            vaultId: vault.id,
            cdoId: vault.cdoConfig.address,
            apr: await this.getMaticTrancheApy(vault)
          }
        default:
          return {
            apr: BNify(0),
            vaultId: vault.id,
            cdoId: vault.cdoConfig.address,
          }
      }
    }

    return {
      vaultId: vault.id,
      apr: BNify(0)
    }
  }

  private calcNewAPRSplit(ratio: BigNumber): BigNumber {

    const FULL_ALLOC = 100
    const AA_RATIO_LIM_UP = 99
    const AA_RATIO_LIM_DOWN = 50

    let aux = BNify(0)
    if (ratio.gte(AA_RATIO_LIM_UP)){
      aux = BNify(AA_RATIO_LIM_UP)
    } else if (ratio.gt(AA_RATIO_LIM_DOWN)){
      aux = BNify(ratio)
    } else {
      aux = BNify(AA_RATIO_LIM_DOWN)
    }

    return BNify(aux).times(ratio).div(FULL_ALLOC)
  }

  public getVaultNewApr(asset: Asset, vault: Vault, liqToAdd: BigNumber): BigNumber {
    if (!liqToAdd || isBigNumberNaN(liqToAdd)){
      return BNify(0)
    }

    if (vault instanceof TrancheVault) {
      const FULL_ALLOC = 100
      const newTotalTvl = BNify(asset.totalTvl).plus(liqToAdd)
      switch (vault.type){
        case 'AA':
          const newTvlRatioAA = BNify(BNify(asset.tvl).plus(liqToAdd)).times(FULL_ALLOC).div(newTotalTvl)
          const newAprSplitAA = this.calcNewAPRSplit(newTvlRatioAA)
          // console.log('calcNewAPRSplit - AA', BNify(asset.tvl).plus(liqToAdd).toString(), newTotalTvl.toString(), newTvlRatioAA.toString(), newAprSplitAA.toString(), newAprSplitAA.div(newTvlRatioAA).toString())
          return BNify(asset.baseApr).times(newAprSplitAA.div(newTvlRatioAA))
        break
        case 'BB':
          const newTvlRatioBB = BNify(FULL_ALLOC).minus(BNify(BNify(asset.tvl).plus(liqToAdd)).times(FULL_ALLOC).div(newTotalTvl))
          const newAprSplitBB = this.calcNewAPRSplit(newTvlRatioBB)
          // console.log('calcNewAPRSplit - BB', newTvlRatioBB.toString(), BNify(FULL_ALLOC).minus(newAprSplitBB).toString(), BNify(FULL_ALLOC).minus(newAprSplitBB).div(BNify(FULL_ALLOC).minus(newTvlRatioBB)).toString())
          return BNify(asset.baseApr).times(BNify(FULL_ALLOC).minus(newAprSplitBB).div(BNify(FULL_ALLOC).minus(newTvlRatioBB)))
        break;
        default:
        break;
      }
    }

    return BNify(0)
  }

  public async getVaultAdditionalBaseApr(vault: Vault): Promise<VaultAdditionalApr> {
    if (vault instanceof TrancheVault) {
      switch (vault.cdoConfig.name) {
        case 'IdleCDO_lido_MATIC':
          const maticTrancheBaseApr = await this.getMaticTrancheStrategyApr()
          const apr = maticTrancheBaseApr ? BNify(maticTrancheBaseApr).times(100) : BNify(0)
          return {
            apr,
            vaultId: vault.id,
            cdoId: vault.cdoConfig.address
          }
        default:
          return {
            apr: BNify(0),
            vaultId: vault.id,
            cdoId: vault.cdoConfig.address
          }
      }
    }

    return {
      vaultId: vault.id,
      apr: BNify(0)
    }
  }

  private async getSubgraphData(vault: Vault, filters?: PlatformApiFilters) {
    const currTime = Math.ceil(Date.now()/1000)

    const cacheKey = `subgraph_${this.chainId}_${vault.id}`
    const cachedData = this.cacheProvider && this.cacheProvider.getCachedUrl(cacheKey)
    const lastFetchTimestamp = cachedData && cachedData.timestamp
    const latestTimestamp = cachedData && cachedData.data.reduce( (t: number, d: any) => Math.max(t, +d.timeStamp), 0)

    if (filters) {
      // Replace start timestamp with latest cached timestamp
      if (latestTimestamp){
        filters.start = latestTimestamp+1
      }

      // End timestamp cannot be after current time
      if (filters.end){
        filters.end = Math.min(currTime, +filters.end)
      }
    }

    // Retrieve new data if the latest cached is more than 1 day and 1 hour old
    const daysDiff = latestTimestamp && dayDiff(latestTimestamp*1000, currTime*1000)
    const hoursDiff = latestTimestamp && dateDiff(latestTimestamp*1000, currTime*1000, 'h', true)
    const lastFetchTimeDiff = lastFetchTimestamp && dateDiff(lastFetchTimestamp, currTime*1000, 'h', true)

    const fetchData = !cachedData || (daysDiff>=1 && hoursDiff>=1 && lastFetchTimeDiff>=1)
    let results = fetchData ? await getSubgraphTrancheInfo(this.chainId, vault.id, filters?.start, filters?.end) : cachedData.data

    // console.log('getSubgraphData', this.cacheProvider.getUrlHash(cacheKey), results)

    // Save fetched data
    if (fetchData) {
      const dataToCache = new Map()

      if (cachedData){
        for (let result of cachedData.data) {
          const date = +(dayjs(+result.timeStamp*1000).startOf('day').valueOf())
          dataToCache.set(date, result)
        }
      }

      for (let result of results) {
        const date = +(dayjs(+result.timeStamp*1000).startOf('day').valueOf())
        dataToCache.set(date, result)
      }

      results = Array.from(dataToCache.values())
      if (this.cacheProvider){
        this.cacheProvider.saveData(cacheKey, results, 0)
      }
    }

    return {
      filters,
      results,
      cacheKey,
      daysDiff,
      fetchData,
      cachedData,
      latestTimestamp
    }
  }

  public async getVaultHistoricalDataFromSubgraph(vault: Vault, filters?: PlatformApiFilters): Promise<VaultHistoricalData> {
    
    const {
      results
    } = await this.getSubgraphData(vault, filters)

    // console.log('getVaultHistoricalDataFromSubgraph', latestTimestamp, filters, daysDiff, results)

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

  public async getVaultPricesFromSubgraph(vault: Vault, filters?: PlatformApiFilters): Promise<VaultHistoricalPrices> {
    const historicalPrices: VaultHistoricalPrices = {
      vaultId: vault.id,
      prices: []
    }

    const {
      results
    } = await this.getSubgraphData(vault, filters)
    
    historicalPrices.prices = results.map( (result: any) => {
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

    const {
      results
    } = await this.getSubgraphData(vault, filters)

    historicalRates.rates = results.map( (result: any) => {
      const date = +result.timeStamp*1000
      const value = parseFloat(fixTokenDecimals(result.apr, 18).toFixed(8))
      return {
        date,
        value
      }
    })

    return historicalRates
  }

  private async getIdleRatesData(vault: Vault, filters?: PlatformApiFilters) {

    if (!("underlyingToken" in vault) || !vault.underlyingToken?.address) {
      return {
        results: null
      }
    }

    const currTime = Math.ceil(Date.now()/1000)
    const cacheKey = `idleRates_${this.chainId}_${vault.underlyingToken?.address}`
    const cachedData = this.cacheProvider && this.cacheProvider.getCachedUrl(cacheKey)

    const lastFetchTimestamp = cachedData && cachedData.timestamp
    const latestTimestamp = cachedData && cachedData.data.reduce( (t: number, d: any) => Math.max(t, +d.timestamp), 0)

    if (filters) {
      // Replace start timestamp with latest cached timestamp
      if (latestTimestamp){
        filters.start = latestTimestamp+1
      }

      // End timestamp cannot be after current time
      if (filters.end){
        filters.end = Math.min(currTime, +filters.end)
      }
    }

    // Retrieve new data if the latest cached is more than 1 day and 1 hour old
    const daysDiff = latestTimestamp && dayDiff(latestTimestamp*1000, currTime*1000)
    const hoursDiff = latestTimestamp && dateDiff(latestTimestamp*1000, currTime*1000, 'h', true)
    const lastFetchTimeDiff = lastFetchTimestamp && dateDiff(lastFetchTimestamp, currTime*1000, 'h', true)

    const fetchData = !cachedData || (daysDiff>=1 && hoursDiff>=1 && lastFetchTimeDiff>=1)
    let results = fetchData ? await callPlatformApis(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters) : cachedData.data

    // console.log('getIdleRatesData', cacheKey, cachedData, latestTimestamp, daysDiff, hoursDiff, fetchData, results)

    // Replace if not valid
    results = results || []

    // Save fetched data
    if (fetchData) {
      const dataToCache = new Map()

      let latestIdlePrice = BNify(0)
      if (cachedData){
        for (const result of cachedData.data) {
          const date = +(dayjs(+result.timestamp*1000).startOf('day').valueOf())
          dataToCache.set(date, result)
          latestIdlePrice = BigNumber.maximum(latestIdlePrice, BNify(result.idlePrice))
        }
      }

      for (const result of results) {
        latestIdlePrice = BigNumber.maximum(latestIdlePrice, BNify(result.idlePrice))
        result.idlePrice = BigNumber.maximum(BNify(result.idlePrice), latestIdlePrice).toString()
        // console.log(`REPLACE idlePrice: ${result.idlePrice}<${latestIdlePrice}`)
        const date = +(dayjs(+result.timestamp*1000).startOf('day').valueOf())
        dataToCache.set(date, result)
        
      }

      // Replace results with cached data
      results = Array.from(dataToCache.values())

      if (this.cacheProvider){
        // console.log('dataToCache', cacheKey, dataToCache)
        this.cacheProvider.saveData(cacheKey, results, 0)
      }
    }

    return {
      filters,
      results,
      cacheKey,
      daysDiff,
      fetchData,
      cachedData,
      latestTimestamp
    }
  }

  public async getVaultHistoricalDataFromIdleApi(vault: Vault, filters?: PlatformApiFilters): Promise<VaultHistoricalData> {

    const historicalData: VaultHistoricalData = {
      vaultId: vault.id,
      rates: [],
      prices: []
    }

    if (!("underlyingToken" in vault) || !vault.underlyingToken?.address) return historicalData

    // const platformApiEndpoint = getPlatformApisEndpoint(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters)
    // const callback = async () => ( await callPlatformApis(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters) )
    // const results = this.cacheProvider ? await this.cacheProvider.checkAndCache(platformApiEndpoint, callback) : await callback()

    const {
      results
    } = await this.getIdleRatesData(vault, filters)

    if (!results) return historicalData

    // console.log('getVaultHistoricalDataFromIdleApi', vault.id, results)

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

  public async getVaultPricesFromIdleApi(vault: Vault, filters?: PlatformApiFilters): Promise<VaultHistoricalPrices> {

    const historicalPrices = {
      vaultId: vault.id,
      prices: []
    }

    if (!("underlyingToken" in vault) || !vault.underlyingToken?.address) return historicalPrices

    // const platformApiEndpoint = getPlatformApisEndpoint(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters)
    // const callback = async() => (await callPlatformApis(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters))
    // const infos = this.cacheProvider ? await this.cacheProvider.checkAndCache(platformApiEndpoint, callback) : await callback()

    const {
      results
    } = await this.getIdleRatesData(vault, filters)

    historicalPrices.prices = results.map( (result: any) => {
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

    // const platformApiEndpoint = getPlatformApisEndpoint(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters)
    // const callback = async () => (await callPlatformApis(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters))
    // const rates = this.cacheProvider ? await this.cacheProvider.checkAndCache(platformApiEndpoint, callback) : await callback()

    const {
      results
    } = await this.getIdleRatesData(vault, filters)

    historicalRates.rates = results.map( (result: any) => {
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