import Web3 from 'web3'
import BigNumber from 'bignumber.js';
import { ContractSendMethod } from 'web3-eth-contract'
import { GenericContract } from '../contracts/GenericContract'
import type { UnderlyingTokenConfig } from '../constants/underlyingTokens'
import { BNify, normalizeTokenDecimals } from '../helpers/helperFunctions'
import { selectUnderlyingToken, selectUnderlyingTokenByAddress } from '../selectors'

type ConversionRateParams = {
  one: BigNumber
  path: string[]
  invertTokens: boolean
  routerMethod: string
  processResults: Function
  call: ContractSendMethod
}

export class GenericContractsHelper {
  readonly web3: Web3
  readonly chainId: number
  readonly contracts: GenericContract[]

  constructor(chainId: number, web3: Web3, contracts: GenericContract[]) {
    this.web3 = web3
    this.chainId = chainId
    this.contracts = contracts
  }

  public getConversionRateParams(tokenConfig: UnderlyingTokenConfig): ConversionRateParams | null {

    const conversionRateProps = tokenConfig.conversionRate
    if (!conversionRateProps || !tokenConfig.address) return null

    const DAI = selectUnderlyingToken(this.chainId, 'DAI')
    const WETH = selectUnderlyingToken(this.chainId, 'WETH')
    const conversionToken = conversionRateProps.addressFrom ? selectUnderlyingTokenByAddress(this.chainId, conversionRateProps.addressFrom) : DAI

    if (!conversionToken || !WETH || !conversionToken.address || !WETH.address) return null

    const addressFrom = conversionRateProps.address || tokenConfig.address
    const defaultContractProtocol = conversionRateProps.protocolContract || 'UniswapRouter'
    const underlyingToken = tokenConfig.underlyingToken ? selectUnderlyingToken(this.chainId, tokenConfig.underlyingToken) : null

    const ProtocolContract = this.contracts.find( Contract => Contract.name === defaultContractProtocol )

    if (!ProtocolContract) return null

    const useWETH = conversionToken?.address === DAI?.address
    const invertTokens = !!conversionRateProps.invertTokens
    const routerMethod = conversionRateProps.routerMethod || 'getAmountsIn'

    const path = []
    path.push(routerMethod === 'getAmountsOut' || invertTokens ? addressFrom : conversionToken.address)
    // Don't pass through weth if i'm converting weth
    if (useWETH && WETH.address.toLowerCase() !== addressFrom.toLowerCase()) {
      path.push(WETH.address)
    }
    path.push(routerMethod === 'getAmountsOut' || invertTokens ? conversionToken.address : addressFrom)

    let decimals = tokenConfig.decimals || 18
    
    // Use decimals of underlying token if set
    if (routerMethod === 'getAmountsOut'){
      if (underlyingToken && underlyingToken.decimals){
        decimals = underlyingToken.decimals
      }
    }
    
    const one = normalizeTokenDecimals(decimals);

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

  public async getConversionRate(tokenConfig: UnderlyingTokenConfig): Promise<BigNumber> {
    const conversionRateParams = this.getConversionRateParams(tokenConfig)
    if (!conversionRateParams){
      return BNify(1)
    }

    const results = await conversionRateParams.call
    return conversionRateParams.processResults(results, conversionRateParams)
  }
}