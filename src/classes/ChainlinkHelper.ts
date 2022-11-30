import Web3 from 'web3'
import { Multicall } from 'classes/'
import { fixTokenDecimals } from 'helpers/'
import { GenericContract } from 'contracts/GenericContract'
import ChainlinkFeedRegistry from 'abis/chainlink/ChainlinkFeedRegistry.json'
import ChainlinkAggregatorV3 from 'abis/chainlink/ChainlinkAggregatorV3.json'
import type { BigNumber, Abi, GenericContractConfig, ContractRawCall, AssetId } from 'constants/'

export type FeedRoundBounds = {
  latestRound: string
  firstTimestamp: string
  latestTimestamp: string
}

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

  public getUsdFeedAddressRawCall(address: string, assetId?: AssetId): ContractRawCall {
    return this.feedRegistry.getRawCall('getFeed', [address, '0x0000000000000000000000000000000000000348'], assetId || address)
  }

  public getEthFeedAddressRawCall(address: string, assetId?: AssetId): ContractRawCall {
    return this.feedRegistry.getRawCall('getFeed', [address, '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'], assetId || address)
  }

  public async getUsdFeedAddress(address: string): Promise<string | null> {
    const rawCall = this.getUsdFeedAddressRawCall(address)
    const feedAddress = await this.feedRegistry.executeRawCall(rawCall)
    return feedAddress || null
  }

  // Get Round Bounds (first timestamp, latest Round ID, latestTimestamp)
  public getFeedRoundBoundsRawCalls(address: string, feedAddress: string): ContractRawCall[] {

    if (!this.multiCall) return []

    const priceFeedContract: GenericContractConfig = {
      address: feedAddress,
      name: 'chainlinkPriceFeed',
      abi: ChainlinkAggregatorV3 as Abi
    }
    const priceFeed: GenericContract = new GenericContract(this.web3, this.chainId, priceFeedContract)

    return [
      priceFeed.getRawCall('getTimestamp', [1], address),
      priceFeed.getRawCall('latestRound', [], address),
      priceFeed.getRawCall('latestTimestamp', [], address)
    ]
  }

  public getHistoricalPricesRawCalls(address: string, feedAddress: string, roundBounds: FeedRoundBounds, maxDays: number = 365): ContractRawCall[] {

    const priceFeedContract: GenericContractConfig = {
      address: feedAddress,
      name: 'chainlinkPriceFeed',
      abi: ChainlinkAggregatorV3 as Abi
    }
    const priceFeed: GenericContract = new GenericContract(this.web3, this.chainId, priceFeedContract)

    const latestRound = +roundBounds.latestRound
    const firstTimestamp = +roundBounds.firstTimestamp
    const latestTimestamp = +roundBounds.latestTimestamp
    
    const secondsBetweenInterval = Math.round((latestTimestamp-firstTimestamp)/latestRound)
    const roundsPerDay = Math.max(1, Math.floor(86400/secondsBetweenInterval))
    const maxRounds = roundsPerDay*maxDays
    const firstRoundId = Math.max(1, latestRound-maxRounds)
    const increment = Math.round(roundsPerDay/2)

    // const rawCalls: ContractRawCall[] = Array.from(Array(+latestRound).keys()).map( (roundId: number) => {
    const rawCalls: ContractRawCall[] = []
    for (let roundId = firstRoundId; roundId < +latestRound; roundId += increment) {
      rawCalls.push({
        assetId: address,
        call: priceFeed.contract.methods.getRoundData(+roundId)
      })
    }

    // Add latest round
    rawCalls.push({
      assetId: address,
      call: priceFeed.contract.methods.getRoundData(+latestRound)
    })
    // console.log('getHistoricalPricesRawCalls', address, firstTimestamp, latestTimestamp, firstRoundId, latestRound, roundsPerDay, rawCalls)
    // console.log('rawCalls', address, rawCalls.length)

    return rawCalls
  }

  public async getTokenPriceUsd(address: string): Promise<BigNumber | null> {
    const feedAddress = await this.getUsdFeedAddress(address)
    if (!feedAddress) return null

    const priceFeedContract: GenericContractConfig = {
      address: feedAddress,
      name: 'chainlinkPriceFeed',
      abi: ChainlinkAggregatorV3 as Abi
    }

    const priceFeed: GenericContract = new GenericContract(this.web3, this.chainId, priceFeedContract)

    const latestRound = await priceFeed.contract.methods.latestRound().call()

    if (!latestRound) return null

    const roundData = await priceFeed.contract.methods.getRoundData(+latestRound).call()

    if (!roundData) return null

    // console.log('roundData', feedAddress, latestRound, roundData)
    return fixTokenDecimals(roundData.answer, 8)
  }

  /*
  public async getHistoricalPricesRawCalls(address: string, feedAddress: string | null = null): Promise<ContractRawCall[]> {

    if (!feedAddress) {
      feedAddress = await this.getUsdFeedAddress(address)
    }

    if (!feedAddress) {
      console.log('Feed not found:', address)
      return []
    }

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
  */
}