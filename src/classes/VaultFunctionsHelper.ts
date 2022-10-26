import Web3 from 'web3'
import { Vault } from 'vaults/'
import { protocols } from 'constants/'
import { Multicall, CallData } from 'classes/'
import { TrancheVault } from 'vaults/TrancheVault'
import type { BigNumber, Explorer, EtherscanTransaction, VaultAdditionalApr } from 'constants/'
import { BNify, normalizeTokenAmount, makeRequest, getObjectPath, makeEtherscanApiRequest, apr2apy } from 'helpers/'

export class VaultFunctionsHelper {

  readonly web3: Web3
  readonly chainId: number
  readonly explorer: Explorer
  readonly multiCall: Multicall

  constructor(chainId: number, web3: Web3, multiCall: Multicall, explorer: Explorer) {
    this.web3 = web3
    this.chainId = chainId
    this.explorer = explorer
    this.multiCall = multiCall
  }

  public async getTrancheHarvestApy(trancheVault: TrancheVault, trancheType: string): Promise<BigNumber> {

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
      
      return apr2apy(tokenApr);
    } catch (err) {
      // console.log('err', err)
      return BNify(0)
    }
  }

  public async callPlatformApis(protocol: string, api: string): Promise<any> {
    const protocolApis = protocols[protocol]
    if (!protocolApis || !protocolApis.apis) return null
    
    const apiConfig = protocolApis.apis[api]
    if (!apiConfig) return null

    const results = await makeRequest(apiConfig.endpoint, apiConfig.config)

    return apiConfig.path ? getObjectPath(results, apiConfig.path) : results
  }

  public async getMaticTrancheStrategyApr(): Promise<BigNumber> {
    const apr = await this.callPlatformApis('lido', 'rates');
    if (!BNify(apr).isNaN()){
      return BNify(apr).div(100);
    }
    return BNify(0);
  }

  public async getMaticTrancheApy(trancheVault: TrancheVault): Promise<BigNumber> {

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
}