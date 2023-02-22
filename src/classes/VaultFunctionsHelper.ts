import Web3 from 'web3'
import dayjs from 'dayjs'
import { Vault } from 'vaults/'
import BigNumber from 'bignumber.js'
import { Multicall, CallData } from 'classes/'
import stMATIC_abi from 'abis/lido/stMATIC.json'
import { FEES_COLLECTORS } from 'constants/vars'
import { selectUnderlyingToken } from 'selectors/'
import { TrancheVault } from 'vaults/TrancheVault'
import PoLidoNFT_abi from 'abis/lido/PoLidoNFT.json'
import { StakedIdleVault } from 'vaults/StakedIdleVault'
import { CacheContextProps } from 'contexts/CacheProvider'
import { GenericContract } from 'contracts/GenericContract'
import PoLidoStakeManager_abi from 'abis/lido/PoLidoStakeManager.json'
import type { Abi, Asset, AssetId, Harvest, Explorer, EtherscanTransaction, VaultAdditionalApr, PlatformApiFilters, VaultHistoricalRates, VaultHistoricalPrices, VaultHistoricalData, HistoryData } from 'constants/'
import { BNify, normalizeTokenAmount, makeEtherscanApiRequest, getPlatformApisEndpoint, callPlatformApis, fixTokenDecimals, getSubgraphTrancheInfo, dayDiff, dateDiff, isBigNumberNaN, asyncReduce } from 'helpers/'

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

  public async getStakingRewards(account: string | undefined, stakedIdleVault: StakedIdleVault | undefined): Promise<EtherscanTransaction[]> {

    if (!this.explorer || !account || !stakedIdleVault) return []

    const idleTokenConfig = stakedIdleVault.rewardTokenConfig
    const feeDistributorConfig = stakedIdleVault.feeDistributorConfig

    const endpoint = `${this.explorer?.endpoints[this.chainId]}?module=account&action=tokentx&address=${feeDistributorConfig.address}&sort=desc`

    const callback = async () => (await makeEtherscanApiRequest(endpoint, this.explorer?.keys || []))
    const etherscanTxlist = this.cacheProvider ? await this.cacheProvider.checkAndCache(endpoint, callback, 300) : await callback()

    // console.log('getIdleStakingRewardsTxs',etherscanEndpoint,etherscanTxlist);
    return etherscanTxlist ? etherscanTxlist.filter( (tx: EtherscanTransaction) => (tx.contractAddress.toLowerCase() === idleTokenConfig.address?.toLowerCase() && tx.to.toLowerCase() === feeDistributorConfig.address.toLowerCase() && BNify(tx.value).gt(0))) : []
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
      // this.multiCall.getCallData(trancheVault.cdoContract, 'latestHarvestBlock'),
      this.multiCall.getCallData(trancheVault.cdoContract, 'trancheAPRSplitRatio')
    ].filter( (call): call is CallData => !!call )

    const [
      multicallResults,
      lastHarvestBlockHex
    ] = await Promise.all([
      this.multiCall.executeMulticalls(rawCalls),
      this.web3.eth.getStorageAt(trancheVault.cdoConfig.address, 204)
    ]);

    // console.log('getTrancheLastHarvest', trancheVault.cdoConfig.address, lastHarvestBlockHex, multicallResults)

    if (!multicallResults) return lastHarvest

    const [
      trancheNAVAA,
      trancheNAVBB,
      // latestHarvestBlock,
      trancheAPRSplitRatio
    ] = multicallResults.map( r => BNify(r.data) )

    const lastHarvestBlock = this.web3.utils.hexToNumber(lastHarvestBlockHex)

    // console.log('getTrancheLastHarvest', trancheVault.id, lastHarvestBlockHex, lastHarvestBlock)

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

      // console.log('getTrancheLastHarvest', trancheVault.id, lastHarvestBlock, harvestTxs)

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

  public async getTrancheHarvestApy(trancheVault: TrancheVault): Promise<BigNumber> {
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
      // harvestApy
    ] = await Promise.all([
      this.getMaticTrancheStrategyApr(),
      this.multiCall.executeMulticalls(rawCalls),
      // this.getTrancheHarvestApy(trancheVault)
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

    const apr = isAATranche ? BNify(stratApr).times(trancheAPRSplitRatio).div(currentAARatio) : BNify(stratApr).times(FULL_ALLOC.minus(trancheAPRSplitRatio)).div(BNify(FULL_ALLOC).minus(currentAARatio));
    
    // if (!BNify(harvestApy).isNaN()){
    //   apr = apr.plus(harvestApy)
    // }

    return BNify(normalizeTokenAmount(apr.times(100), (trancheVault.underlyingToken?.decimals || 18)))
  }

  public async getMaticTrancheNFTs(account: string): Promise<any> {

    if (!this.multiCall) return []

    const MATIC = selectUnderlyingToken(this.chainId, 'MATIC')
    const stMATIC = selectUnderlyingToken(this.chainId, 'STMATIC')

    const stMaticContract = new GenericContract(this.web3, this.chainId, {
      name: 'stMATIC',
      abi: stMATIC_abi as Abi,
      address: stMATIC?.address as string
    })

    const rawCalls: CallData[] = [
      this.multiCall.getCallData(stMaticContract.contract, 'poLidoNFT'),
      this.multiCall.getCallData(stMaticContract.contract, 'stakeManager'),
    ].filter( (call): call is CallData => !!call )

    const multicallResults = await this.multiCall.executeMulticalls(rawCalls)
    if (!multicallResults) return []

    const [
      poLidoNFT_address,
      stakeManager_address
    ] = multicallResults.map( r => r.data as string )

    const poLidoNFTContract = new GenericContract(this.web3, this.chainId, {
      name: 'poLidoNFT',
      abi: PoLidoNFT_abi as Abi,
      address: poLidoNFT_address
    })

    const poLidoStakeManagerContract = new GenericContract(this.web3, this.chainId, {
      name: 'poLidoStakeManager',
      abi: PoLidoStakeManager_abi as Abi,
      address: stakeManager_address
    })

    const rawCalls2: CallData[] = [
      this.multiCall.getCallData(poLidoStakeManagerContract.contract, 'epoch'),
      this.multiCall.getCallData(poLidoNFTContract.contract, 'getOwnedTokens', [account]),
    ].filter( (call): call is CallData => !!call )

    const [
      multicallResults2,
      currentPolygonHeight
    ] = await Promise.all([
      this.multiCall.executeMulticalls(rawCalls2),
      callPlatformApis(this.chainId, 'lido', 'checkpoints', 'count')
    ])

    if (!multicallResults2) return []

    const [
      poLidoStakeManagerEpoch,
      tokenIds
    ] = multicallResults2.map( r => r.data )

    // console.log('poLidoNFT_address', poLidoNFT_address, 'stakeManager_address', stakeManager_address, 'poLidoStakeManagerEpoch', poLidoStakeManagerEpoch, 'tokenIds', tokenIds, 'currentPolygonHeight', currentPolygonHeight)

    // Decrease checkpoint
    let epochIntervalInSeconds = 2700;
    let currentEpochTimestamp = Date.now()/1000;
    let currentPolygonEpoch = currentPolygonHeight?.result || poLidoStakeManagerEpoch;

    // Get checkpoints interval
    if (currentPolygonEpoch){
      // Safe margin for epoch fethed from polido stake manager
      if (!currentPolygonHeight || !currentPolygonHeight.result){
        currentPolygonEpoch-=2;
      }
      const [
        lastEpochInfo,
        currentEpochInfo
      ] = await Promise.all([
        callPlatformApis(this.chainId, 'lido', 'checkpoints', (currentPolygonEpoch-1).toString()),
        callPlatformApis(this.chainId, 'lido', 'checkpoints', currentPolygonEpoch.toString())
      ])

      if (currentEpochInfo && currentEpochInfo.result){
        currentEpochTimestamp = parseInt(currentEpochInfo.result.timestamp);

        if (lastEpochInfo && lastEpochInfo.result){
          epochIntervalInSeconds = (currentEpochInfo.result.timestamp-lastEpochInfo.result.timestamp);
        }
      }
      // console.log('epoch info', currentEpochInfo, lastEpochInfo, epochIntervalInSeconds);
    } else {
      currentPolygonEpoch = 0;
    }

    const tokensAmounts = await asyncReduce<any, any>(
      tokenIds,
      async (tokenId) => {
        const rawCalls: CallData[] = [
          this.multiCall?.getCallData(stMaticContract.contract, 'getMaticFromTokenId', [tokenId]),
          this.multiCall?.getCallData(stMaticContract.contract, 'token2WithdrawRequest', [tokenId]),
        ].filter( (call): call is CallData => !!call )

        const multicallResults = await this.multiCall?.executeMulticalls(rawCalls)

        if (!multicallResults) return

        const [
          tokenAmount,
          usersRequest
        ] = multicallResults.map( r => r.data )

        const status = Math.round(usersRequest.requestEpoch)>=Math.round(poLidoStakeManagerEpoch) ? 'pending' : 'available';

        // console.log('usersRequest', tokenId, usersRequest, epochIntervalInSeconds);

        const remainingEpochs = Math.max(0, Math.round(usersRequest.requestEpoch)-Math.round(currentPolygonEpoch));

        // Calculate tokens unlock time
        const remainingTime = Math.round(remainingEpochs)*epochIntervalInSeconds;
        const unlockTimestamp = (currentEpochTimestamp+remainingTime)*1000
        const contractSendMethod = stMaticContract.contract.methods.claimTokens(tokenId)

        return {
          status,
          tokenId,
          remainingTime,
          unlockTimestamp,
          remainingEpochs,
          contractSendMethod,
          currentEpoch: Math.round(currentPolygonEpoch),
          requestEpoch: Math.round(usersRequest.requestEpoch),
          amount: fixTokenDecimals(tokenAmount, MATIC?.decimals)
        }
      },
      (acc, value) => value ? [...acc, value] : acc,
      []
    )

    return tokensAmounts
  }

  public async getVaultsCollectedFees(vaults: Vault[]): Promise<Record<AssetId, HistoryData[]>> {

    if (!this.explorer) return {}

    const filteredVaults = vaults.filter( (vault: Vault) => ['BY','AA','BB'].includes(vault.type) )
    const allVaultsIds = filteredVaults.map( (vault: Vault) => vault.id.toLowerCase() )

    return await asyncReduce<any, any>(
      FEES_COLLECTORS,
      async (feeCollectorAddress) => {
        const endpoint = `${this.explorer?.endpoints[this.chainId]}?module=account&action=tokentx&address=${feeCollectorAddress}&sort=desc`
        const callback = async () => (await makeEtherscanApiRequest(endpoint, this.explorer?.keys || []))
        const etherscanTxlist = this.cacheProvider ? await this.cacheProvider.checkAndCache(endpoint, callback, 300) : await callback()

        return etherscanTxlist.reduce( (vaultsCollectedFees: Record<AssetId, HistoryData[]>, tx: EtherscanTransaction) => {
          // Look for incoming txs
          if (tx.to.toLowerCase() !== feeCollectorAddress.toLowerCase()) return vaultsCollectedFees
          // Lookup for tranche vault
          let foundVault = filteredVaults.find( (vault: Vault) => vault.id === tx.contractAddress.toLowerCase())
          if (foundVault) {
            if (!vaultsCollectedFees[foundVault.id]){
              vaultsCollectedFees[foundVault.id] = []
            }
            vaultsCollectedFees[foundVault.id].push({
              date: +tx.timeStamp*1000,
              value: fixTokenDecimals(tx.value, 18).toNumber()
            })
            console.log(foundVault.id, tx.hash, 'from', tx.from, 'to', tx.to, feeCollectorAddress, fixTokenDecimals(tx.value, 18).toString())
          } else {
            // Lookup for BY vault
            foundVault = filteredVaults.find( (vault: Vault) => vault.id === tx.from.toLowerCase())
            if (foundVault && ("underlyingToken" in foundVault)){
              const isSameUnderlying = foundVault.underlyingToken?.address?.toLowerCase() === tx.contractAddress.toLowerCase()
              if (isSameUnderlying){
                if (!vaultsCollectedFees[foundVault.id]){
                  vaultsCollectedFees[foundVault.id] = []
                }
                vaultsCollectedFees[foundVault.id].push({
                  date: +tx.timeStamp*1000,
                  value: fixTokenDecimals(tx.value, foundVault.underlyingToken?.decimals).toNumber()
                })
                // console.log(foundVault.id, tx.hash, 'from', tx.from, 'to', tx.to, feeCollectorAddress, fixTokenDecimals(tx.value, foundVault.underlyingToken?.decimals).toString())
              }
            }
          }
          return vaultsCollectedFees
        }, {})
      },
      (acc, value) => value ? {...acc, ...value} : acc,
      {}
    )
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
        case 'BB':
          const newTvlRatioBB = BNify(FULL_ALLOC).minus(BNify(BNify(asset.tvl).plus(liqToAdd)).times(FULL_ALLOC).div(newTotalTvl))
          const newAprSplitBB = this.calcNewAPRSplit(newTvlRatioBB)
          // console.log('calcNewAPRSplit - BB', newTvlRatioBB.toString(), BNify(FULL_ALLOC).minus(newAprSplitBB).toString(), BNify(FULL_ALLOC).minus(newAprSplitBB).div(BNify(FULL_ALLOC).minus(newTvlRatioBB)).toString())
          return BNify(asset.baseApr).times(BNify(FULL_ALLOC).minus(newAprSplitBB).div(BNify(FULL_ALLOC).minus(newTvlRatioBB)))
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
        for (const result of cachedData.data) {
          const date = +(dayjs(+result.timeStamp*1000).startOf('day').valueOf())
          dataToCache.set(date, result)
        }
      }

      for (const result of results) {
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

    // console.log('getVaultHistoricalDataFromSubgraph', vault.id, results)

    const dailyData = results.reduce( (dailyData: Record<string, Record<number, HistoryData>>, result: any) => {
      
      const date = +(dayjs(+result.timeStamp*1000).startOf('day').valueOf())
      const decimals = ("underlyingToken" in vault) && vault.underlyingToken?.decimals ? vault.underlyingToken?.decimals : 18
      const price = parseFloat(fixTokenDecimals(result.virtualPrice, decimals).toFixed(8))
      const rate = parseFloat(fixTokenDecimals(result.apr, 18).toFixed(8))
      const tvl = parseFloat(fixTokenDecimals(result.contractValue, decimals).toFixed(8))

      dailyData.rates[date] = {
        date,
        value: rate
      }

      dailyData.tvls[date] = {
        date,
        value: tvl
      }

      dailyData.prices[date] = {
        date,
        value: price
      }

      return dailyData
    }, {
      tvls: {},
      rates: {},
      prices: {}
    })

    return {
      vaultId: vault.id,
      tvls: Object.values(dailyData.tvls),
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

    const apiType = ("flags" in vault) && vault.flags?.apiType ? vault.flags?.apiType : 'rates'
    const address = apiType === 'rates' ? vault.underlyingToken?.address : vault.id

    const cacheKey = `idleRates_${this.chainId}_${address}`
    const cachedData = this.cacheProvider && this.cacheProvider.getCachedUrl(cacheKey)

    const lastFetchTimestamp = cachedData && cachedData.timestamp
    const latestTimestamp = cachedData && cachedData.data.reduce( (t: number, d: any) => Math.max(t, +d.timestamp), 0)

    // Retrieve new data if the latest cached is more than 1 day and 1 hour old
    const daysDiff = latestTimestamp && dayDiff(latestTimestamp*1000, currTime*1000)
    const hoursDiff = latestTimestamp && dateDiff(latestTimestamp*1000, currTime*1000, 'h', true)
    const lastFetchTimeDiff = lastFetchTimestamp && dateDiff(lastFetchTimestamp, currTime*1000, 'h', true)

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

    const fetchData = !cachedData || (daysDiff>=1 && hoursDiff>=1 && lastFetchTimeDiff>=1)
    let results = fetchData ? await callPlatformApis(this.chainId, 'idle', apiType as string, address, filters) : cachedData.data

    // console.log('getIdleRatesData', cacheKey, cachedData, latestTimestamp, results)

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
      tvls: [],
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
      const tvl = parseFloat(fixTokenDecimals(result.idleSupply, 18).times(fixTokenDecimals(result.idlePrice, decimals)).toFixed(8))

      dailyData.rates[date] = {
        date,
        value: rate
      }

      dailyData.tvls[date] = {
        date,
        value: tvl
      }

      dailyData.prices[date] = {
        date,
        value: price
      }

      return dailyData
    }, {
      tvls: {},
      rates: {},
      prices: {}
    })

    historicalData.tvls = Object.values(dailyData.tvls)
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