import Web3 from 'web3'
import { Multicall, CallData } from 'classes/'
import { GenericContract } from 'contracts/GenericContract'
import type { Abi, GenericContractConfig, ContractRawCall } from 'constants/'
import ChainlinkFeedRegistry from 'abis/chainlink/ChainlinkFeedRegistry.json'
import ChainlinkAggregatorV3 from 'abis/chainlink/ChainlinkAggregatorV3.json'

export class ChainlinkHelper {
  readonly web3: Web3
  readonly chainId: number
  readonly feedRegistry: GenericContract
  readonly multiCall: Multicall | undefined

  constructor(chainId: number, web3: Web3, multiCall?: Multicall) {
    this.web3 = web3
    this.chainId = chainId
    this.multiCall = multiCall
    
    const feedRegistryContract: GenericContractConfig = {
      name: 'chainlinkFeedRegistry',
      abi: ChainlinkFeedRegistry as Abi,
      address: '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf'
    }
    this.feedRegistry = new GenericContract(web3, chainId, feedRegistryContract)
  }

  public async getUsdFeedAddress(address: string): Promise<any> {
    const feedAddress = await this.feedRegistry.call('getFeed', [address, '0x0000000000000000000000000000000000000348']);
    // console.log('getUsdFeedAddress', address, feedAddress)
    return feedAddress || null
  }

  public async getHistoricalPricesRawCalls(address: string): Promise<ContractRawCall[]> {

    const feedAddress = await this.getUsdFeedAddress(address)

    // console.log('feedAddress', address, feedAddress)

    if (!feedAddress) return []

    const priceFeedContract: GenericContractConfig = {
      address: feedAddress,
      name: 'chainlinkPriceFeed',
      abi: ChainlinkAggregatorV3 as Abi
    }
    const priceFeed: GenericContract = new GenericContract(this.web3, this.chainId, priceFeedContract)

    // Get Round Data
    const [
      firstTimestamp,
      lastRoundId,
      latestTimestamp
    ] = await Promise.all([
      priceFeed.call('getTimestamp', [1]),
      priceFeed.call('latestRound'),
      priceFeed.call('latestTimestamp')
    ])


    const maxDays = 365
    const secondsBetweenInterval = Math.round((latestTimestamp-firstTimestamp)/lastRoundId)
    const roundsPerDay = Math.max(1, Math.floor(86400/secondsBetweenInterval))
    const maxRounds = roundsPerDay*maxDays
    const firstRoundId = Math.max(1, lastRoundId-maxRounds)
    const increment = Math.round(roundsPerDay*0.8)

    // const rawCalls: ContractRawCall[] = Array.from(Array(+lastRoundId).keys()).map( (roundId: number) => {
    const rawCalls: ContractRawCall[] = []
    for (let roundId = firstRoundId; roundId <= +lastRoundId; roundId += increment) {
      rawCalls.push({
        assetId: address,
        call: priceFeed.contract.methods.getRoundData(+roundId)
      })
    }

    console.log('getHistoricalPricesRawCalls', address, firstTimestamp, latestTimestamp, firstRoundId, lastRoundId, roundsPerDay, rawCalls)

    // console.log('rawCalls', address, rawCalls.length)

    return rawCalls
  }

  public async getHistoricalPrices(address: string): Promise<any> {
    const rawCalls = await this.getHistoricalPricesRawCalls(address)
    const batchCalls = rawCalls.map( (rawCall: ContractRawCall) => this.multiCall?.getDataFromRawCall(rawCall.call, rawCall) ).filter( (call): call is CallData => !!call )
    const prices = await this.multiCall?.executeMulticalls(batchCalls)
    return prices
  }
}