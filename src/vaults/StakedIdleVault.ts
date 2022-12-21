import Web3 from 'web3'
import ERC20 from 'abis/tokens/ERC20.json'
import { Contract } from 'web3-eth-contract'
import { tokensFolder } from 'constants/folders'
import { ContractSendMethod } from 'web3-eth-contract'
import { GenericContractConfig } from 'constants/contracts'
import type { UnderlyingTokenProps } from 'constants/underlyingTokens'
import type { Abi, Assets, ContractRawCall, PlatformApiFilters } from 'constants/types'

type ConstructorProps = {
  web3: Web3
  chainId: number
  stkIdleConfig: GenericContractConfig
  rewardTokenConfig: UnderlyingTokenProps
  feeDistributorConfig: GenericContractConfig
}

export class StakedIdleVault {

  // Global data
  readonly id: string
  readonly web3: Web3
  readonly chainId: number
  public readonly type: string
  public stkIdleConfig: GenericContractConfig
  public rewardTokenConfig: UnderlyingTokenProps
  public feeDistributorConfig: GenericContractConfig

  // Contracts
  public readonly stkIdleContract: Contract
  public readonly rewardTokenContract: Contract
  public readonly feeDistributorContract: Contract

  constructor(props: ConstructorProps){

    const {
      web3,
      chainId,
      stkIdleConfig,
      rewardTokenConfig,
      feeDistributorConfig
    } = props
    
    // Init global data
    this.web3 = web3
    this.type = 'staking'
    this.chainId = chainId
    this.stkIdleConfig = stkIdleConfig
    this.rewardTokenConfig = rewardTokenConfig
    this.feeDistributorConfig = feeDistributorConfig
    this.id = stkIdleConfig.address.toLowerCase()

    // Init contracts
    const rewardTokenContractAbi = rewardTokenConfig.abi || ERC20 as Abi
    this.rewardTokenContract = new web3.eth.Contract(rewardTokenContractAbi, rewardTokenConfig.address)

    this.stkIdleContract = new web3.eth.Contract(stkIdleConfig.abi, stkIdleConfig.address)
    this.feeDistributorContract = new web3.eth.Contract(feeDistributorConfig.abi, feeDistributorConfig.address)
  }

  public getTransactions(account: string, etherscanTransactions: any[]): any[] {
    return []
  }

  public async getHistoricalData(filters?: PlatformApiFilters): Promise<any> {
    return {
      vaultId: this.id,
      rates: [],
      prices: []
    }
  }

  public async getHistoricalPrices(filters?: PlatformApiFilters): Promise<any> {
    return {
      vaultId: this.id,
      prices: []
    }
  }

  public async getHistoricalAprs(filters?: PlatformApiFilters): Promise<any> {
    return {
      vaultId: this.id,
      rates: []
    }
  }

  public getBalancesCalls(params: any[] = []): any[] {
    return [
      {
        assetId:this.id,
        call:this.stkIdleContract.methods.balanceOf(...params)
      }
    ]
  }

  public getTotalSupplyCalls(): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.stkIdleContract.methods.totalSupply()
      }
    ]
  }

  /*
  public getRewardTokensCalls(data?: any): ContractRawCall[] {
    return [
      {
        assetId:this.id,
        call:this.stkIdleContract.methods.token()
      }
    ]
  }

  public getRewardTokensAmounts(account: string): ContractRawCall[] {
    return [
      {
        assetId: this.id,
        call: this.feeDistributorContract.methods.claim(account)
      }
    ]
  }
  */

  public getClaimRewardsContractSendMethod(): ContractSendMethod {
    return this.feeDistributorContract.methods.claim()
  }

  public getAssetsData(): Assets {
    return {
      [this.id]:{
        type: this.type,
        token: this.rewardTokenConfig.token,
        color: this.rewardTokenConfig.colors.hex,
        underlyingId: this.rewardTokenConfig.address,
        decimals: this.rewardTokenConfig.decimals || 18,
        icon: `${tokensFolder}${this.rewardTokenConfig.token}.svg`,
        name: this.rewardTokenConfig.label || this.rewardTokenConfig.token,
      }
    }
  }
}
