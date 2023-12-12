import Web3 from 'web3'
import { Block } from "web3-eth"
import { Multicall } from 'classes/'
import BigNumber from 'bignumber.js';
import type { BlockNumber } from 'web3-core'
import { GenericContract } from 'contracts/GenericContract'
import type { CallData, DecodedResult } from 'classes/Multicall'
import type { UnderlyingTokenProps } from 'constants/underlyingTokens'
import { BNify, normalizeTokenDecimals, fixTokenDecimals } from '../helpers'
import { selectUnderlyingToken, selectUnderlyingTokenByAddress } from 'selectors/'

type ConversionRateParams = {
  one: BigNumber
  path: string[]
  invertTokens: boolean
  routerMethod: string
  processResults: Function
  call: any
}

type ConstructorProps = {
  chainId: number
  web3: Web3
  multiCall?: Multicall
  contracts: GenericContract[]
}

export class GenericContractsHelper {
  readonly web3: Web3
  readonly chainId: number
  readonly contracts: GenericContract[]
  readonly multiCall: Multicall | undefined

  // constructor(chainId: number, web3: Web3, contracts: GenericContract[], multiCall?: Multicall) {
  constructor(props: ConstructorProps) {
    this.web3 = props.web3
    this.chainId = props.chainId
    this.contracts = props.contracts
    this.multiCall = props.multiCall
  }

  public async getGaugesRelativeWeights(timeWeights: DecodedResult[]): Promise<Record<string, DecodedResult[]> | null> {

    if (!this.multiCall) return null

    const GaugeControllerContract = this.contracts.find( Contract => Contract.name === 'GaugeController' )
    if (!GaugeControllerContract) return null

    const blockInfo: Block = await this.web3.eth.getBlock('latest')
    const nextGaugeTimestamp: number = Math.ceil((+blockInfo.timestamp/604800)*604800+604800);

    const gaugesRelativeWeightsCalls = timeWeights.reduce( (calls: CallData[][], decodedResult: DecodedResult) => {
      const timeWeight = decodedResult.data
      const gaugeId = decodedResult.extraData.assetId
      
      const params = [gaugeId]
      if (timeWeight && +timeWeight<Date.now()){
        params.push(timeWeight)
      }
      const rawCall = GaugeControllerContract.getRawCall('gauge_relative_weight', params, gaugeId)
      const callData = rawCall && this.multiCall?.getDataFromRawCall(rawCall.call, rawCall)
      if (callData){
        calls[0].push(callData)
      }

      const rawCallNext = GaugeControllerContract.getRawCall('gauge_relative_weight', [gaugeId, nextGaugeTimestamp], gaugeId)
      const callDataNext = rawCallNext && this.multiCall?.getDataFromRawCall(rawCallNext.call, rawCallNext)
      if (callDataNext){
        calls[1].push(callDataNext)
      }

      return calls
    }, [[],[]])

    // console.log('gaugesRelativeWeightsCalls', gaugesRelativeWeightsCalls)

    const [
      weights,
      nextWeights
    ] = await this.multiCall?.executeMultipleBatches(gaugesRelativeWeightsCalls)

    return {
      weights,
      nextWeights
    }
  }

  /*
  public async getGaugeWeight(gaugeAddress) {

    const GaugeControllerContract = this.contracts.find( Contract => Contract.name === 'GaugeController' )

    const rawCalls: CallData[] = [
      this.multiCall.getCallData(GaugeControllerContract.contract, 'time_weight', [gaugeAddress]),
      this.multiCall.getCallData(GaugeControllerContract.contract, 'gauge_relative_weight'),
    ].filter( (call): call is CallData => !!call )

    const multicallResults = await this.multiCall.executeMulticalls(rawCalls)
  }
  */

  public getConversionRateParams(tokenConfig: UnderlyingTokenProps): ConversionRateParams | null {

    const conversionRateParams = tokenConfig.conversionRate
    if (!conversionRateParams || !tokenConfig.address || conversionRateParams.isPoolToken) return null

    const DAI = selectUnderlyingToken(this.chainId, 'DAI')
    const WETH = selectUnderlyingToken(this.chainId, 'WETH')
    const conversionToken = conversionRateParams.addressFrom ? selectUnderlyingTokenByAddress(this.chainId, conversionRateParams.addressFrom) : DAI

    if (!conversionToken || !WETH || !conversionToken.address || !WETH.address) return null

    const addressFrom = conversionRateParams.address || tokenConfig.address
    const defaultContractProtocol = conversionRateParams.protocolContract || 'UniswapRouter'
    const underlyingToken = tokenConfig.underlyingToken ? selectUnderlyingToken(this.chainId, tokenConfig.underlyingToken) : null

    const ProtocolContract = this.contracts.find( Contract => Contract.name === defaultContractProtocol )

    if (!ProtocolContract) return null

    const useWETH = conversionRateParams.useWETH !== undefined ? !!conversionRateParams.useWETH : conversionToken?.address === DAI?.address
    const invertTokens = !!conversionRateParams.invertTokens
    const routerMethod = conversionRateParams.routerMethod || 'getAmountsIn'

    const path: string[] = []
    let decimals = tokenConfig.decimals || 18
    let one = normalizeTokenDecimals(decimals);

    if (routerMethod === 'quoteExactInputSingle'){
      const processResults = (results: any): BigNumber => {
        return fixTokenDecimals(results, conversionToken.decimals)
      }

      path.push(addressFrom, conversionToken.address)
      
      return {
        one,
        path,
        invertTokens,
        routerMethod,
        processResults,
        call:ProtocolContract.contract.methods[routerMethod](addressFrom, conversionToken.address, 3000, one.toFixed(), 0)
      }
    } else {
      path.push(routerMethod === 'getAmountsOut' || invertTokens ? addressFrom : conversionToken.address)
      // Don't pass through weth if i'm converting weth
      if (useWETH && WETH.address.toLowerCase() !== addressFrom.toLowerCase()) {
        path.push(WETH.address)
      }
      path.push(routerMethod === 'getAmountsOut' || invertTokens ? conversionToken.address : addressFrom)
      
      // Use decimals of underlying token if set
      if (routerMethod === 'getAmountsOut' && underlyingToken && underlyingToken.decimals){
        decimals = underlyingToken.decimals
      }

      one = normalizeTokenDecimals(decimals);

      const processResults = (results: any, conversionRateParams: ConversionRateParams): BigNumber => {
        if (results && conversionRateParams) {
          const price = BNify(results[0]).div(conversionRateParams.one)
          if (conversionRateParams.routerMethod === 'getAmountsOut'){
            return BNify(results[2]).div(normalizeTokenDecimals(18))
          } else if (conversionRateParams.invertTokens){
            return BNify(1).div(price)
          }
          return price
        }
        return BNify(1)
      }
      
      return {
        one,
        path,
        invertTokens,
        routerMethod,
        processResults,
        call:ProtocolContract.contract.methods[routerMethod](one.toFixed(), path)
      }
    }
  }

  public async getConversionRate(tokenConfig: UnderlyingTokenProps, blockNumber: BlockNumber = 'latest'): Promise<BigNumber> {
    const conversionRateParams = this.getConversionRateParams(tokenConfig)
    if (!conversionRateParams){
      return BNify(1)
    }

    const results = await conversionRateParams.call.call({}, blockNumber)
    return conversionRateParams.processResults(results, conversionRateParams)
  }
}