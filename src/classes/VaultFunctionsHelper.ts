import Web3 from 'web3'
import dayjs from 'dayjs'
import { Vault } from 'vaults/'
import { Multicall, CallData } from 'classes/'
import { TrancheVault } from 'vaults/TrancheVault'
import { BNify, normalizeTokenAmount, makeEtherscanApiRequest, getPlatformApisEndpoint, callPlatformApis, fixTokenDecimals, getSubgraphTrancheInfo } from 'helpers/'
import type { Harvest, BigNumber, Explorer, EtherscanTransaction, VaultAdditionalApr, PlatformApiFilters, VaultHistoricalRates, VaultHistoricalPrices, VaultHistoricalData, HistoryData } from 'constants/'

export interface CdoLastHarvest {
  cdoId: string
  harvest: Harvest | null
}

type VaultFunctionsHelperProps = {
  chainId: number,
  web3: Web3,
  multiCall?: Multicall,
  explorer?: Explorer,
  checkAndCache?: Function
}

export class VaultFunctionsHelper {

  readonly web3: Web3
  readonly chainId: number
  readonly explorer: Explorer | undefined
  readonly multiCall: Multicall | undefined
  readonly checkAndCache: Function | undefined

  constructor(props: VaultFunctionsHelperProps) {
    this.web3 = props.web3
    this.chainId = props.chainId
    this.explorer = props.explorer
    this.multiCall = props.multiCall
    this.checkAndCache = props.checkAndCache
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
      const callback = async () => (await makeEtherscanApiRequest(endpoint, this.explorer?.keys || []))
      const harvestTxs = this.checkAndCache ? await this.checkAndCache(endpoint, callback) : await callback()

      if (!harvestTxs) return lastHarvest

      const harvestTx = harvestTxs.find( (tx: EtherscanTransaction) => tx.contractAddress.toLowerCase() === trancheVault.underlyingToken?.address?.toLowerCase() && tx.to.toLowerCase() === trancheVault.cdoConfig.address.toLowerCase() )

      if (!harvestTx) return lastHarvest

      const harvestedValueAA = BNify(harvestTx.value).div(`1e${trancheVault.underlyingToken?.decimals}`).times(aprRatioAA.div(100));
      const harvestedValueBB = BNify(harvestTx.value).div(`1e${trancheVault.underlyingToken?.decimals}`).times(aprRatioBB.div(100));
      const tokenAprAA = harvestedValueAA.div(tranchePoolAA).times(52.1429);
      const tokenAprBB = harvestedValueBB.div(tranchePoolBB).times(52.1429);
      
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
    const apr = this.checkAndCache ? await this.checkAndCache(platformApiEndpoint, callback) : await callback()

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

  public async getVaultAdditionalBaseApr(vault: Vault): Promise<VaultAdditionalApr> {
    if (vault instanceof TrancheVault) {
      switch (vault.cdoConfig.name) {
        case 'IdleCDO_lido_MATIC':
          const maticTrancheBaseApr = await this.getMaticTrancheStrategyApr()
          const apr = maticTrancheBaseApr ? BNify(maticTrancheBaseApr).times(100) : BNify(0)
          return {
            vaultId: vault.id,
            apr
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

    const endpoint = `subgraph_${this.chainId}_${vault.id}_${filters?.start}_${filters?.end}`
    const callback = async () => (await getSubgraphTrancheInfo(this.chainId, vault.id, filters?.start, filters?.end))
    const results = this.checkAndCache ? await this.checkAndCache(endpoint, callback) : await callback()

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

    const platformApiEndpoint = getPlatformApisEndpoint(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters)
    const callback = async () => ( await callPlatformApis(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters) )
    const results = this.checkAndCache ? await this.checkAndCache(platformApiEndpoint, callback) : await callback()

    if (!results) return historicalData

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

    const endpoint = `subgraph_${this.chainId}_${vault.id}_${filters?.start}_${filters?.end}`
    const callback = async () => (await getSubgraphTrancheInfo(this.chainId, vault.id, filters?.start, filters?.end))
    const infos = this.checkAndCache ? await this.checkAndCache(endpoint, callback) : await callback()
    
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

    const endpoint = `subgraph_${this.chainId}_${vault.id}_${filters?.start}_${filters?.end}`
    const callback = async () => (await getSubgraphTrancheInfo(this.chainId, vault.id, filters?.start, filters?.end))
    const rates = this.checkAndCache ? await this.checkAndCache(endpoint, callback) : await callback()

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

    const platformApiEndpoint = getPlatformApisEndpoint(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters)
    const callback = async() => (await callPlatformApis(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters))
    const infos = this.checkAndCache ? await this.checkAndCache(platformApiEndpoint, callback) : await callback()

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

    const platformApiEndpoint = getPlatformApisEndpoint(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters)
    const callback = async () => (await callPlatformApis(this.chainId, 'idle', 'rates', vault.underlyingToken?.address, filters))
    const rates = this.checkAndCache ? await this.checkAndCache(platformApiEndpoint, callback) : await callback()

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