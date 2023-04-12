import aToken from 'abis/aave/AToken.json'
import ERC20 from 'abis/tokens/ERC20.json'
import cToken from 'abis/compound/cDAI.json'
import IdleCDO from 'abis/idle/IdleCDO.json'
import type { Abi, VaultStatus } from './types'
import RibbonPool from 'abis/ribbon/RibbonPool.json'
import IdleTokenV4 from 'abis/idle/IdleTokenV4.json'
import IdleStrategy from 'abis/idle/IdleStrategy.json'
import IdleCDOPolygon from 'abis/idle/IdleCDOPolygon.json'
import LiquidityGauge from 'abis/idle/LiquidityGauge.json'
import GaugeMultiRewards from 'abis/idle/GaugeMultiRewards.json'
import IdleCDOTrancheRewards from 'abis/idle/IdleCDOTrancheRewards.json'
import TrancheStakingRewards from 'abis/idle/TrancheStakingRewards.json'

export const vaultsStatusSchemes: Record<string, string> = {
  'production' : 'green',
  'paused' : 'gray',
  'disabled' : 'gray',
  'beta' : 'blue',
  'experimental' : 'purple',
  'deprecated' : 'gray'
}

export interface CDO {
  decimals:number
  abi:Abi
  name:string
  address:string
}

export interface Strategy {
  abi: Abi
  name: string
  address?: string
  harvestEnabled?: boolean
}

export interface Pool {
  abi: Abi
  name: string
  address?: string
}

export interface VaultMessages {
  withdraw?: string
  buyInstructions?: string
  actions?: Record<string, string>
}

interface StakingReward {
  enabled:boolean
  token: string
  address: string
}

interface CDOReward {
  decimals:number
  stakingRewards:StakingReward[]
  unstakeWithBalance?:boolean
  abi:Abi
  name: string
  address: string
}

export interface Tranche {
  abi:Abi
  decimals:number
  tranche: string
  functions: Record<string, string | null>
  CDORewards:CDOReward
  blockNumber:number
  label: string
  name: string
  token: string
  address: string
}

export type StatsProps = {
  startTimestamp: number
}

export interface TrancheConfig {
  protocol:string
  status?: VaultStatus
  enabledEnvs?: string[]
  curveApyPath?: string[]
  adaptiveYieldSplitEnabled?: boolean
  multiCallDisabled?: boolean
  blockNumber:number
  referralEnabled?:boolean
  autoFarming?:string[]
  underlyingToken:string
  modal?: any
  variant?: string
  CDO: CDO
  Pool?: Pool
  stats?: StatsProps
  Strategy: Strategy
  description?: string
  messages?: VaultMessages
  flags?: Record<string, any>
  Tranches: Record<string, Tranche>
}

export const tranches: Record<number, Record<string, Record<string, TrancheConfig>>> = {
  137:{
    quickswap:{
      CXETHWETH:{
        protocol:'quickswap',
        blockNumber:28501471,
        referralEnabled:true,
        autoFarming:['WMATIC'],
        underlyingToken:'CXETHWETH',
        CDO:{
          decimals:18,
          abi:IdleCDOPolygon as Abi,
          name:'IdleCDO_quickswap_CXETHWETH',
          address:'0xB144eE58679e15f1b25A5F6EfcEBDd0AB8c8BEF5'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_quickswap_CXETHWETH'
        },
        messages:{
          buyInstructions:'To get CXETHWETH token your have to supply liquidity into the <a class="link" rel="nofollow noopener noreferrer" target="_blank" href="https://quickswap.exchange/#/add/0xfe4546feFe124F30788c4Cc1BB9AA6907A7987F9/0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619">Quickswap cxETH-ETH pool</a>.',
        },
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              rewardsRate:null,
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              stakedBalance:'balanceOf',
              periodFinish:'periodFinish',
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[
                {
                  enabled:true,
                  token:'DQUICK',
                  address:'0xf28164A485B0B2C90639E47b0f377b4a438a16B1'
                }
              ],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_quickswap_CXETHWETH_AA',
              address:'0x466cFDfF869666941CdB89daa412c3CddC55D6c1'
            },
            blockNumber:28501471,
            label:'AA-CXETHWETH-LP',
            name:'AA_quickswap_CXETHWETH',
            token:'AA_quickswap_CXETHWETH',
            address:'0x967b2fdEc06c0178709F1BFf56E0aA9367c3225c'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              rewardsRate:null,
              claim:'getReward',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'balanceOf',
              periodFinish:'periodFinish'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[
                {
                  enabled:true,
                  token:'DQUICK',
                  address:'0xf28164A485B0B2C90639E47b0f377b4a438a16B1'
                }
              ],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_quickswap_CXETHWETH_BB',
              address:'0x727d9c331e9481167Dc61A9289C948da25bE825e'
            },
            blockNumber:28501471,
            label:'BB-CXETHWETH-LP',
            name:'BB_quickswap_CXETHWETH',
            token:'BB_quickswap_CXETHWETH',
            address:'0x1aFf460F388E3822756F5697f05A7E2AEB8Db7ef'
          }
        }
      }
    }
  },
  1:{
    lido:{
      stETH:{
        protocol:'lido',
        autoFarming:['LDO'],
        blockNumber:13776954,
        underlyingToken:'stETH',
        CDO:{
          decimals:18,
          abi:IdleCDO as Abi,
          name:'IdleCDO_lido_stETH',
          address:'0x34dcd573c5de4672c8248cd12a99f875ca112ad8'
        },
        Strategy:{
          harvestEnabled:false,
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_lido_stETH',
          address:'0x0cac674ebD77bBD899f6079932768f6d59Da089A'
        },

        description:'This strategy converts the stETH into native <a class="link" rel="nofollow noopener noreferrer" target="_blank" href="https://etherscan.io/address/0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0">Lido wstETH</a> tokens. The APR is boosted by LDO rewards and dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        messages:{
          buyInstructions:'To get stETH token your have to deposit first into <a class="link" rel="nofollow noopener noreferrer" target="_blank" href="https://stake.lido.fi">Lido ETH staking</a>.',
        },
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf',
              periodFinish:'periodFinish'
            },
            CDORewards:{
              decimals:18,
              unstakeWithBalance:false,
              stakingRewards:[
                {
                  token:'LDO',
                  enabled:true,
                  address:'0x5a98fcbea516cf06857215779fd812ca3bef1b32'
                }
              ],
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_lido_stETH_AA',
              address:'0xd7c1b48877a7dfa7d51cf1144c89c0a3f134f935'
            },
            blockNumber:13776954,
            name:'AA_lido_stETH',
            token:'AA_lido_stETH',
            label:'lido stETH AA',
            address:'0x2688fc68c4eac90d9e5e1b94776cf14eade8d877'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_lido_stETH_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:13776954,
            name:'BB_lido_stETH',
            token:'BB_lido_stETH',
            label:'lido stETH BB',
            address:'0x3a52fa30c33caf05faee0f9c5dfe5fd5fe8b3978'
          }
        }
      },
      MATIC:{
        protocol:'lido',
        enabledEnvs: [],
        autoFarming:['LDO'],
        blockNumber:15623682,
        underlyingToken:'MATIC',
        flags:{
          showMaticNFTs: true
        },
        stats:{
          startTimestamp: 1665360000000
        },
        CDO:{
          decimals:18,
          abi:IdleCDO as Abi,
          name:'IdleCDO_lido_MATIC',
          address:'0xF87ec7e1Ee467d7d78862089B92dd40497cBa5B8'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_lido_MATIC',
          // customAprFunction:'getMaticTrancheStrategyApr',
          address:'0x6110deC9faC2A721c0EEe64B769A7E4cCcf4aa81'
        },
        modal:{
          enabled:true,
          buttonText:'Continue',
          icon:'images/warning-2.png',
          id:'modal_lido_matic_withdraw',
          title:'Lido stMATIC unstake period',
          text:'When you withdraw your funds from the tranche you will receive an NFT representing your redeemed amount, default stMATIC unstaking period takes around 3-4 days (80 epochs) to process. After that you can claim your rewards directly from <a href="https://polygon.lido.fi" class="link" rel="nofollow noopener noreferrer" target="_blank">https://polygon.lido.fi</a> in Claim tab. More info at <a href="https://docs.polygon.lido.fi/how-lido-on-polygon-works/#unstake-tokens" class="link" rel="nofollow noopener noreferrer" target="_blank">https://docs.polygon.lido.fi/how-lido-on-polygon-works/#unstake-tokens</a>'
        },
        description:'This strategy deploys funds in the <a href="https://polygon.lido.fi/" class="link" rel="nofollow noopener noreferrer" target="_blank">Lido MATIC pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        messages:{
          // pendingNFTAmount:'Claim your rewards directly from <a href="https://polygon.lido.fi" class="link" rel="nofollow noopener noreferrer" target="_blank">https://polygon.lido.fi</a> in Claim tab.',
          actions:{
            withdraw:'trade.actions.deposit.messages.maticNFT'
          },
          withdraw:'trade.actions.withdraw.messages.maticNFT'
        },
        Tranches: {
          AA:{
            decimals:18,
            tranche:'AA',
            abi:ERC20 as Abi,
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf',
              periodFinish:'periodFinish',
              pendingNFTAmount:'getMaticTrancheNFTs'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_lido_MATIC_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15623682,
            name:'AA_lido_MATIC',
            token:'AA_lido_MATIC',
            label:'lido MATIC AA',
            address:'0xAEf4FCC4E5F2dc270760063446d4116D24704Ad1'
          },
          BB:{
            decimals:18,
            tranche:'BB',
            abi:ERC20 as Abi,
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes',
              pendingNFTAmount:'getMaticTrancheNFTs'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_lido_MATIC_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15623682,
            name:'BB_lido_MATIC',
            token:'BB_lido_MATIC',
            label:'lido MATIC BB',
            address:'0x077212c69A66261CF7bD1fd3b5C5db7CfFA948Ee'
          }
        }
      }
    },
    convex:{
      FRAX3CRV:{
        protocol:'convex',
        status:'deprecated',
        enabledEnvs:['beta'],
        blockNumber:13812864,
        autoFarming:['CVX','CRV'],
        underlyingToken:'FRAX3CRV',
        curveApyPath:['apy','day','frax'],
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_convex_frax3crv',
          address:'0x4ccaf1392a17203edab55a1f2af3079a8ac513e7'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_convex_frax3crv',
          address:'0xBc1707D16541108b7035E52e1DAeb27ca4B6B79F'
        },
        description:'This strategy accrue interest only after an harvest is done. The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
        messages:{
          // withdraw:'The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
          buyInstructions:'To get FRAX3CRV token your have to deposit first into <a class="link" rel="nofollow noopener noreferrer" target="_blank" href="https://curve.fi/frax/deposit">FRAX Curve Pool</a>.',
        },
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              stakedBalance:'usersStakes',
              rewards:'expectedUserReward'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_convex_frax3crv_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:13812864,
            name:'AA_convex_frax3crv',
            token:'AA_convex_frax3crv',
            label:'convex frax3crv AA',
            address:'0x15794da4dcf34e674c18bbfaf4a67ff6189690f5'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_convex_frax3crv_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:13812864,
            name:'BB_convex_frax3crv',
            token:'BB_convex_frax3crv',
            label:'convex frax3crv BB',
            address:'0x18cf59480d8c16856701f66028444546b7041307'
          }
        }
      },
      steCRV:{
        protocol:'convex',
        status:'deprecated',
        enabledEnvs:['beta'],
        blockNumber:14182975,
        autoFarming:['CVX','CRV','LDO'],
        curveApyPath:['apy','day','steth'],
        underlyingToken: 'steCRV',
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_convex_steCRV',
          address:'0x7ecfc031758190eb1cb303d8238d553b1d4bc8ef'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_convex_steCRV',
          address:'0x3bCbA0AfD36C9B350f46c570f89ab70817D122CB'
        },
        description:'This strategy accrue interest only after an harvest is done. The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
        messages:{
          // withdraw:'The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
          buyInstructions:'To get steCRV token your have to deposit first into <a class="link" rel="nofollow noopener noreferrer" target="_blank" href="https://curve.fi/steth/deposit">stETH Curve Pool</a>.',
        },
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              stakedBalance:'usersStakes',
              rewards:'expectedUserReward'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_convex_steCRV',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:14182975,
            name:'AA_convex_steCRV',
            token:'AA_convex_steCRV',
            label:'convex steCRV AA',
            address:'0x060a53BCfdc0452F35eBd2196c6914e0152379A6'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_convex_steCRV',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:14182975,
            name:'BB_convex_steCRV',
            token:'BB_convex_steCRV',
            label:'convex steCRV BB',
            address:'0xd83246d2bCBC00e85E248A6e9AA35D0A1548968E'
          }
        }
      },
      ALUSD3CRV:{
        protocol:'convex',
        status:'deprecated',
        enabledEnvs:['beta'],
        blockNumber:14177732,
        autoFarming:['CVX','CRV'],
        underlyingToken:'ALUSD3CRV',
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_convex_alusd3crv',
          address:'0x008c589c471fd0a13ac2b9338b69f5f7a1a843e1'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_convex_alusd3crv',
          address:'0xDb7306Ddba67DD9d5aF08204E314F4DE6c29e20d'
        },
        description:'This strategy accrue interest only after an harvest is done. The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
        messages:{
          // withdraw:'The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
          buyInstructions:'To get ALUSD3CRV token your have to deposit first into <a class="link" rel="nofollow noopener noreferrer" target="_blank" href="https://curve.fi/alusd/deposit">ALUSD Curve Pool</a>.',
        },
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              stakedBalance:'usersStakes',
              rewards:'expectedUserReward'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_convex_alusd3crv_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:14177732,
            name:'AA_convex_alusd3crv',
            token:'AA_convex_alusd3crv',
            label:'convex alusd3crv AA',
            address:'0x790E38D85a364DD03F682f5EcdC88f8FF7299908'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_convex_alusd3crv_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:14177732,
            name:'BB_convex_alusd3crv',
            token:'BB_convex_alusd3crv',
            label:'convex alusd3crv BB',
            address:'0xa0E8C9088afb3Fa0F40eCDf8B551071C34AA1aa4'
          }
        }
      },
      PBTCCRV:{
        protocol:'convex',
        status:'deprecated',
        enabledEnvs:['beta'],
        blockNumber:14570195,
        multiCallDisabled:true,
        autoFarming:['CVX','CRV','PNT'],
        underlyingToken:'PBTCCRV',
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_convex_pbtccrv',
          address:'0xf324Dca1Dc621FCF118690a9c6baE40fbD8f09b7'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_convex_pbtccrv',
          address:'0x0198792f2849397908C092b6B57654e1a57a4CDC'
        },
        description:'This strategy accrue interest only after an harvest is done. The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
        messages:{
          // withdraw:'The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
          buyInstructions:'To get PBTCCRV token your have to deposit first into <a class="link" rel="nofollow noopener noreferrer" target="_blank" href="https://curve.fi/factory/99/deposit">PBTC Curve Pool</a>.',
        },
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              stakedBalance:'usersStakes',
              rewards:'expectedUserReward'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_convex_pbtccrv_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:14570195,
            name:'AA_convex_pbtccrv',
            token:'AA_convex_pbtccrv',
            label:'convex pbtccrv AA',
            address:'0x4657B96D587c4d46666C244B40216BEeEA437D0d'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_convex_pbtccrv_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:14570195,
            name:'BB_convex_pbtccrv',
            token:'BB_convex_pbtccrv',
            label:'convex pbtccrv BB',
            address:'0x3872418402d1e967889aC609731fc9E11f438De5'
          }
        }
      }
    },
    euler:{
      USDC:{
        autoFarming:[],
        enabledEnvs: [],
        protocol:'euler',
        blockNumber:14785127,
        underlyingToken:'USDC',
        adaptiveYieldSplitEnabled:true,
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_euler_USDC',
          address:'0xf5a3d259bfe7288284bd41823ec5c8327a314054'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_euler_USDC',
          address:'0x5DaD2eEF80a8cdFD930aB8f0353cA13Bd48c4346'
        },
        description:'This strategy deploys funds in the <a href="https://app.euler.finance/market/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" class="link" rel="nofollow noopener noreferrer" target="_blank">Euler USDC pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_euler_USDC_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            name:'AA_euler_USDC',
            blockNumber:14785127,
            token:'AA_euler_USDC',
            label:'euler USDC AA',
            address:'0x1e095cbF663491f15cC1bDb5919E701b27dDE90C'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_euler_USDC_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:14785127,
            name:'BB_euler_USDC',
            token:'BB_euler_USDC',
            label:'euler USDC BB',
            address:'0xe11679CDb4587FeE907d69e9eC4a7d3F0c2bcf3B'
          }
        }
      },
      DAI:{
        autoFarming:[],
        enabledEnvs: [],
        protocol:'euler',
        blockNumber:14961854,
        adaptiveYieldSplitEnabled:true,
        underlyingToken:'DAI',
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_euler_DAI',
          address:'0x46c1f702a6aad1fd810216a5ff15aab1c62ca826'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_euler_DAI',
          address:'0xc7F1B9C72B8230E470420A4b69af7c50781A3f44'
        },
        description:'This strategy deploys funds in the <a href="https://app.euler.finance/market/0x6b175474e89094c44da98b954eedeac495271d0f" class="link" rel="nofollow noopener noreferrer" target="_blank">Euler DAI pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_euler_DAI_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            name:'AA_euler_DAI',
            blockNumber:14961854,
            token:'AA_euler_DAI',
            label:'euler DAI AA',
            address:'0x852c4d2823E98930388b5cE1ed106310b942bD5a'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_euler_DAI_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:14961854,
            name:'BB_euler_DAI',
            token:'BB_euler_DAI',
            label:'euler DAI BB',
            address:'0x6629baA8C7c6a84290Bf9a885825E3540875219D'
          }
        }
      },
      USDT:{
        autoFarming:[],
        enabledEnvs: [],
        protocol:'euler',
        blockNumber:14961973,
        adaptiveYieldSplitEnabled:true,
        underlyingToken:'USDT',
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_euler_USDT',
          address:'0xD5469DF8CA36E7EaeDB35D428F28E13380eC8ede'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_euler_USDT',
          address:'0x3d1775dA27Dd9c6d936795Ac21b94CDeD8baBD69'
        },
        description:'This strategy deploys funds in the <a href="https://app.euler.finance/market/0xdac17f958d2ee523a2206206994597c13d831ec7" class="link" rel="nofollow noopener noreferrer" target="_blank">Euler USDT pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_euler_USDT_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            name:'AA_euler_USDT',
            blockNumber:14961973,
            token:'AA_euler_USDT',
            label:'euler USDT AA',
            address:'0xE0f126236d2a5b13f26e72cBb1D1ff5f297dDa07'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_euler_USDT_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            name:'BB_euler_USDT',
            blockNumber:14961973,
            token:'BB_euler_USDT',
            label:'euler USDT BB',
            address:'0xb1EC065abF6783BCCe003B8d6B9f947129504854'
          }
        }
      },
      AGEUR:{
        autoFarming:[],
        enabledEnvs: [],
        protocol:'euler',
        blockNumber:15055915,
        adaptiveYieldSplitEnabled:true,
        underlyingToken:'AGEUR',
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_euler_AGEUR',
          address:'0x2398Bc075fa62Ee88d7fAb6A18Cd30bFf869bDa4'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_euler_AGEUR',
          address:'0x8468B8Efe7eeA52978Ccfe3C0248Ca6F6895e166'
        },
        description:'This strategy deploys funds in the <a href="https://app.euler.finance/market/0x1a7e4e63778b4f12a199c062f3efdd288afcbce8" class="link" rel="nofollow noopener noreferrer" target="_blank">Euler AGEUR pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_euler_AGEUR_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            name:'AA_euler_AGEUR',
            blockNumber:15055915,
            token:'AA_euler_AGEUR',
            label:'euler AGEUR AA',
            address:'0x624DfE05202b66d871B8b7C0e14AB29fc3a5120c'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_euler_AGEUR_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15055915,
            name:'BB_euler_AGEUR',
            token:'BB_euler_AGEUR',
            label:'euler AGEUR BB',
            address:'0xcf5FD05F72cA777d71FB3e38F296AAD7cE735cB7'
          }
        }
      },
      USDCStaking:{
        autoFarming:[],
        enabledEnvs:[],
        protocol:'euler',
        variant:'staking',
        blockNumber:16246945,
        underlyingToken:'USDC',
        adaptiveYieldSplitEnabled:true,
        flags:{
          addHarvestApy: false
        },
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_euler_USDC',
          address:'0xf615a552c000B114DdAa09636BBF4205De49333c'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_euler_USDC',
          address:'0x0FE4Fc1301aFe4aFE8C3ac288c3E13cDaCe71b04'
        },
        description:'This strategy deploys funds in the <a href="https://app.euler.finance/market/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" class="link" rel="nofollow noopener noreferrer" target="_blank">Euler USDC pool</a> and automatically stake the received eUSDC to earn additional EUL rewards. The accrued EUL are harvested and re-invested in the strategy. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_euler_USDC_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16246945,
            label:'euler USDC AA',
            name:'AA_euler_USDCStaking',
            token:'AA_euler_USDCStaking',
            address:'0x1AF0294524093BFdF5DA5135853dC2fC678C12f7'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_euler_USDC_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16246945,
            label:'euler USDC BB',
            name:'BB_euler_USDCStaking',
            token:'BB_euler_USDCStaking',
            address:'0x271db794317B44827EfE81DeC6193fFc277050F6'
          }
        }
      },
      USDTStaking:{
        autoFarming:[],
        enabledEnvs:[],
        protocol:'euler',
        variant:'staking',
        blockNumber:16375769,
        underlyingToken:'USDT',
        adaptiveYieldSplitEnabled:true,
        flags:{
          addHarvestApy: false
        },
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_euler_USDTStaking',
          address:'0x860B1d25903DbDFFEC579d30012dA268aEB0d621'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_euler_USDTStaking',
          address:'0xaf141907c3185bee2d451b5a72b89232b0340652'
        },
        description:'This strategy deploys funds in the <a href="https://app.euler.finance/market/0xdac17f958d2ee523a2206206994597c13d831ec7" class="link" rel="nofollow noopener noreferrer" target="_blank">Euler USDT pool</a> and automatically stake the received eUSDT to earn additional EUL rewards. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_euler_USDTStaking_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16375769,
            label:'euler USDT AA',
            name:'AA_euler_USDTStaking',
            token:'AA_euler_USDTStaking',
            address:'0x6796FCd41e4fb26855Bb9BDD7Cad41128Da1Fd59'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_euler_USDTStaking_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16375769,
            label:'euler USDT BB',
            name:'BB_euler_USDTStaking',
            token:'BB_euler_USDTStaking',
            address:'0x00B80FCCA0fE4fDc3940295AA213738435B0f94e'
          }
        }
      },
      WETHStaking:{
        autoFarming:[],
        enabledEnvs:[],
        protocol:'euler',
        variant:'staking',
        blockNumber:16375825,
        underlyingToken:'WETH',
        adaptiveYieldSplitEnabled:true,
        flags:{
          addHarvestApy: false
        },
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_euler_WETHStaking',
          address:'0xec964d06cD71a68531fC9D083a142C48441F391C'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_euler_WETHStaking',
          address:'0x2D29c277Ac61376Fb011DCAFCe03EA3C9485f4c2'
        },
        description:'This strategy deploys funds in the <a href="https://app.euler.finance/market/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2" class="link" rel="nofollow noopener noreferrer" target="_blank">Euler WETH pool</a> and automatically stake the received eWETH to earn additional EUL rewards. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_euler_WETHStaking_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16375825,
            label:'euler WETH AA',
            name:'AA_euler_WETHStaking',
            token:'AA_euler_WETHStaking',
            address:'0x2B7Da260F101Fb259710c0a4f2EfEf59f41C0810'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_euler_WETHStaking_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16375825,
            label:'euler WETH BB',
            name:'BB_euler_WETHStaking',
            token:'BB_euler_WETHStaking',
            address:'0x2e80225f383F858E8737199D3496c5Cf827670a5'
          }
        }
      },
      DAIStaking:{
        autoFarming:[],
        enabledEnvs:[],
        protocol:'euler',
        variant:'staking',
        blockNumber:16375825,
        underlyingToken:'DAI',
        adaptiveYieldSplitEnabled:true,
        flags:{
          addHarvestApy: false
        },
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_euler_DAIStaking',
          address:'0x264E1552Ee99f57a7D9E1bD1130a478266870C39'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_euler_DAIStaking',
          address:'0x62aa57dd00c3d77f984379892c857bef58fc7722'
        },
        description:'This strategy deploys funds in the <a href="https://app.euler.finance/market/0x6b175474e89094c44da98b954eedeac495271d0f" class="link" rel="nofollow noopener noreferrer" target="_blank">Euler DAI pool</a> and automatically stake the received eDAI to earn additional EUL rewards. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_euler_DAIStaking_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16375825,
            label:'euler DAI AA',
            name:'AA_euler_DAIStaking',
            token:'AA_euler_DAIStaking',
            address:'0x62Eb6a8c7A555eae3e0B17D42CA9A3299af2787E'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_euler_DAIStaking_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16375825,
            label:'euler DAI BB',
            name:'BB_euler_DAIStaking',
            token:'BB_euler_DAIStaking',
            address:'0x56263BDE26b72b3e3D26d8e03399a275Aa8Bbfb2'
          }
        }
      },
    },
    ribbon:{
      USDCFolk:{
        status:'experimental',
        protocol:'ribbon',
        autoFarming:['RBN'],
        enabledEnvs:['beta'],
        blockNumber:15831531,
        underlyingToken:'USDC',
        // maxUtilizationRate:0.99,
        adaptiveYieldSplitEnabled:true,
        CDO:{
          decimals:18,
          abi:IdleCDO as Abi,
          name:'IdleCDO_ribbon_USDC',
          address:'0x4bC5E595d2e0536Ea989a7a9741e9EB5c3CAea33'
        },
        Pool:{
          abi:RibbonPool as Abi,
          name:'Pool_ribbon_USDC',
          address:'0x3cd0ecf1552d135b8da61c7f44cefe93485c616d'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_ribbon_USDC',
          address:'0x25e7337037817DD9Bddd0334Ca1591f370518893'
        },
        description:'This strategy deploys funds in the <a href="https://lend.ribbon.finance/app/pool/folkvang" class="link" rel="nofollow noopener noreferrer" target="_blank">Ribbon Folkvang USDC pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf',
              utilizationRate:'getUtilizationRate'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_ribbon_USDC_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15831531,
            name:'AA_ribbon_USDC',
            token:'AA_ribbon_USDC',
            label:'ribbon USDC AA',
            address:'0x5f45A578491A23AC5AEE218e2D405347a0FaFa8E'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes',
              utilizationRate:'getUtilizationRate'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_ribbon_USDC_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15831531,
            name:'BB_ribbon_USDC',
            token:'BB_ribbon_USDC',
            label:'ribbon USDC BB',
            address:'0x982E46e81E99fbBa3Fb8Af031A7ee8dF9041bb0C'
          }
        }
      },
      USDCWin:{
        status:'experimental',
        protocol:'ribbon',
        autoFarming:['RBN'],
        // lender:'wintermute',
        enabledEnvs:['beta'],
        blockNumber:15925109,
        underlyingToken:'USDC',
        // maxUtilizationRate:0.99,
        adaptiveYieldSplitEnabled:true,
        CDO:{
          decimals:18,
          abi:IdleCDO as Abi,
          name:'IdleCDO_ribbon_wintermute_USDC',
          address:'0xf6B692CC9A5421E4C66D32511d65F94c64fbD043'
        },
        Pool:{
          abi:RibbonPool as Abi,
          name:'Pool_ribbon_wintermute_USDC',
          address:'0x0Aea75705Be8281f4c24c3E954D1F8b1D0f8044C'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_ribbon_wintermute_USDC',
          address:'0x73f3fb86cb579eeea9d482df2e91b6770a42fd6a'
        },
        // links:{
        //   default:'https://docs.ribbon.finance/ribbon-lend/introduction-to-ribbon-lend/no-lockups/pool-status',
        // },
        description:'This strategy deploys funds in the <a href="https://lend.ribbon.finance/app/pool/wintermute" class="link" rel="nofollow noopener noreferrer" target="_blank">Ribbon Wintermute USDC pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches: {
          AA:{
            decimals:18,
            abi:ERC20 as Abi,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf',
              utilizationRate:'getUtilizationRate'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_ribbon_wintermute_USDC_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15925109,
            name:'AA_ribbon_wintermute_USDC',
            token:'AA_ribbon_wintermute_USDC',
            label:'Ribbon Wintermute USDC AA',
            address:'0x3e041C9980Bc03011cc30491d0c4ccD53602F89B'
          },
          BB:{
            decimals:18,
            abi:ERC20 as Abi,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes',
              utilizationRate:'getUtilizationRate'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_ribbon_wintermute_USDC_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15925109,
            name:'BB_ribbon_wintermute_USDC',
            token:'BB_ribbon_wintermute_USDC',
            label:'Ribbon Wintermute USDC BB',
            address:'0x65237B6Fc6E62B05B62f1EbE53eDAadcCd1684Ad'
          }
        }
      },
      DAI:{
        status:'experimental',
        protocol:'ribbon',
        autoFarming:['RBN'],
        blockNumber:15831214,
        enabledEnvs:['beta'],
        underlyingToken:'DAI',
        // maxUtilizationRate:0.99,
        adaptiveYieldSplitEnabled:true,
        CDO:{
          decimals:18,
          abi:IdleCDO as Abi,
          name:'IdleCDO_ribbon_DAI',
          address:'0xc8c64CC8c15D9aa1F4dD40933f3eF742A7c62478'
        },
        Pool:{
          abi:RibbonPool as Abi,
          name:'Pool_ribbon_DAI',
          address:'0x0aea75705be8281f4c24c3e954d1f8b1d0f8044c'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_ribbon_DAI',
          address:'0x94BcFfc172Af69132BbCE7DF52D567e5ce651dcd'
        },
        description:'This strategy converts 1:1 DAI into USDC via <a href="https://makerdao.world/en/learn/governance/module-psm/" class="link" rel="nofollow noopener noreferrer" target="_blank">Maker DAO PSM</a> and deploys USDC into <a href="https://lend.ribbon.finance/app/pool/wintermute" class="link" rel="nofollow noopener noreferrer" target="_blank">Ribbon Wintermute USDC pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf',
              utilizationRate:'getUtilizationRate'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_ribbon_DAI_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15831214,
            name:'AA_ribbon_DAI',
            token:'AA_ribbon_DAI',
            label:'ribbon DAI AA',
            address:'0xd54E5C263298E60A5030Ce2C8ACa7981EaAaED4A'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes',
              utilizationRate:'getUtilizationRate'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_ribbon_DAI_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15831214,
            name:'BB_ribbon_DAI',
            token:'BB_ribbon_DAI',
            label:'ribbon DAI BB',
            address:'0xD3E4C5C37Ba3185410550B836557B8FA51d5EA3b'
          }
        }
      }
    },
    clearpool:{
      USDC:{
        autoFarming:[],
        enabledEnvs:[],
        variant:'portofino',
        protocol:'clearpool',
        blockNumber:16790250,
        underlyingToken:'USDC',
        adaptiveYieldSplitEnabled:true,
        flags:{
          addHarvestApy: false
        },
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_clearpool_portofino_USDC',
          address:'0x1329E8DB9Ed7a44726572D44729427F132Fa290D'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_clearpool_portofino_USDC',
          address:'0x931c080c7ed6b3c6988576654e5d56753dc92181'
        },
        description:'This strategy deploys funds in the <a href="https://app.clearpool.finance/pool/0x4a90c14335e81829d7cb0002605f555b8a784106?market=ethereum" class="link" rel="nofollow noopener noreferrer" target="_blank">Clearpool Portofino USDC pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_clearpool_portofino_USDC_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16790250,
            name:'AA_clearpool_portofino_USDC',
            label:'Clearpool Portofino USDC AA',
            token:'AA_clearpool_portofino_USDC',
            address:'0x9CAcd44cfDf22731bc99FaCf3531C809d56BD4A2'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_clearpool_portofino_USDC_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16790250,
            name:'BB_clearpool_portofino_USDC',
            token:'BB_clearpool_portofino_USDC',
            label:'Clearpool Portofino USDC BB',
            address:'0xf85Fd280B301c0A6232d515001dA8B6c8503D714'
          }
        }
      },
      USDT:{
        autoFarming:[],
        enabledEnvs:[],
        variant:'fasanara',
        protocol:'clearpool',
        blockNumber:16790250,
        underlyingToken:'USDT',
        adaptiveYieldSplitEnabled:true,
        flags:{
          addHarvestApy: false
        },
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_clearpool_fasanara_USDT',
          address:'0xc4574C60a455655864aB80fa7638561A756C5E61'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_clearpool_fasanara_USDT',
          address:'0xc8e2Fad99061407e947485c846bd05Eae9DE1991'
        },
        description:'This strategy deploys funds in the <a href="https://app.clearpool.finance/pool/0x1a1d778776542c2efed161ba1fbcfe6e09ba99fb?market=ethereum" class="link" rel="nofollow noopener noreferrer" target="_blank">Clearpool Fasanara USDT pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_clearpool_fasanara_USDT_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16790250,
            name:'AA_clearpool_fasanara_USDT',
            label:'Clearpool fasanara USDT AA',
            token:'AA_clearpool_fasanara_USDT',
            address:'0x0a6f2449C09769950cFb76f905Ad11c341541f70'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_clearpool_fasanara_USDT_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16790250,
            name:'BB_clearpool_fasanara_USDT',
            token:'BB_clearpool_fasanara_USDT',
            label:'Clearpool fasanara USDT BB',
            address:'0x3Eb6318b8D9f362a0e1D99F6032eDB1C4c602500'
          }
        }
      },
      DAI:{
        autoFarming:[],
        enabledEnvs:[],
        variant:'portofino',
        protocol:'clearpool',
        blockNumber:16790274,
        underlyingToken:'DAI',
        flags:{
          addHarvestApy: false
        },
        adaptiveYieldSplitEnabled:true,
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_clearpool_portofino_DAI',
          address:'0x5dcA0B3Ed7594A6613c1A2acd367d56E1f74F92D'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_clearpool_portofino_DAI',
          address:'0x3687c0F8760371fc1BD1c7bc28695c388CdEd5a0'
        },
        description:'This strategy converts 1:1 DAI into USDC via <a href="https://makerdao.world/en/learn/governance/module-psm/" class="link" rel="nofollow noopener noreferrer" target="_blank">Maker DAO PSM</a> and deploys USDC into <a href="https://app.clearpool.finance/pool/0x4a90c14335e81829d7cb0002605f555b8a784106?market=ethereum" class="link" rel="nofollow noopener noreferrer" target="_blank">Clearpool Portofino DAI pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_clearpool_portofino_DAI_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16790274,
            name:'AA_clearpool_portofino_DAI',
            label:'Clearpool Portofino DAI AA',
            token:'AA_clearpool_portofino_DAI',
            address:'0x43eD68703006add5F99ce36b5182392362369C1c'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_clearpool_portofino_DAI_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16790274,
            name:'BB_clearpool_portofino_DAI',
            token:'BB_clearpool_portofino_DAI',
            label:'Clearpool Portofino DAI BB',
            address:'0x38D36353D07CfB92650822D9c31fB4AdA1c73D6E'
          }
        }
      }
    },
    morpho:{
      USDC:{
        variant:'Aave',
        autoFarming:[],
        enabledEnvs:[],
        protocol:'morpho',
        blockNumber:16420584,
        underlyingToken:'USDC',
        adaptiveYieldSplitEnabled:true,
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_morpho_USDC',
          address:'0x9C13Ff045C0a994AF765585970A5818E1dB580F8'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_morpho_USDC',
          address:'0x6c14a1a28dd6dae5734fd960bac0b89a6b401cfd'
        },
        description:'This strategy deploys funds in the <a href="https://aave.morpho.xyz/?network=mainnet" class="link" rel="nofollow noopener noreferrer" target="_blank">Morpho Aave USDC pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_morpho_USDC_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16420584,
            name:'AA_morpho_USDC',
            token:'AA_morpho_USDC',
            label:'morpho USDC AA',
            address:'0x376B2dCF9eBd3067BB89eb6D1020FbE604092212'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_morpho_USDC_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16420584,
            name:'BB_morpho_USDC',
            token:'BB_morpho_USDC',
            label:'morpho USDC BB',
            address:'0x86a40De6d77331788Ba24a85221fb8DBFcBC9bF0'
          }
        }
      },
      DAI:{
        variant:'Aave',
        autoFarming:[],
        enabledEnvs:[],
        protocol:'morpho',
        blockNumber:16519261,
        underlyingToken:'DAI',
        adaptiveYieldSplitEnabled:true,
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_morpho_aave_DAI',
          address:'0xDB82dDcb7e2E4ac3d13eBD1516CBfDb7b7CE0ffc'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_morpho_aave_DAI',
          address:'0x9182A7C9D9858d54816baC7e3C049B26d3fc56bB'
        },
        description:'This strategy deploys funds in the <a href="https://aave.morpho.xyz/?network=mainnet" class="link" rel="nofollow noopener noreferrer" target="_blank">Morpho Aave DAI pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_morpho_aave_DAI_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16519261,
            name:'AA_morpho_aave_DAI',
            token:'AA_morpho_aave_DAI',
            label:'morpho DAI AA',
            address:'0x69d87d0056256e3df7Be9b4c8D6429B4b8207C5E'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_morpho_aave_DAI_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16519261,
            name:'BB_morpho_aave_DAI',
            token:'BB_morpho_aave_DAI',
            label:'morpho DAI BB',
            address:'0xB098AF638aF0c4Fa3edb1A24f807E9c22dA0fE73'
          }
        }
      },
      USDT:{
        variant:'Aave',
        autoFarming:[],
        enabledEnvs:[],
        protocol:'morpho',
        blockNumber:16519329,
        underlyingToken:'USDT',
        adaptiveYieldSplitEnabled:true,
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_morpho_aave_USDT',
          address:'0x440ceAd9C0A0f4ddA1C81b892BeDc9284Fc190dd'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_morpho_aave_USDT',
          address:'0x57E142278E93d721F3eBD52EC5D2D28484862f32'
        },
        description:'This strategy deploys funds in the <a href="https://aave.morpho.xyz/?network=mainnet" class="link" rel="nofollow noopener noreferrer" target="_blank">Morpho Aave USDT pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_morpho_aave_USDT_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16519329,
            label:'morpho USDT AA',
            name:'AA_morpho_aave_USDT',
            token:'AA_morpho_aave_USDT',
            address:'0x745e005a5dF03bDE0e55be811350acD6316894E1'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_morpho_aave_USDT_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16519329,
            label:'morpho USDT BB',
            name:'BB_morpho_aave_USDT',
            token:'BB_morpho_aave_USDT',
            address:'0xF0C177229Ae1cd41BF48dF6241fae3e6A14A6967'
          }
        }
      },
      WETH:{
        variant:'Aave',
        autoFarming:[],
        protocol:'morpho',
        blockNumber:16726342,
        underlyingToken:'WETH',
        adaptiveYieldSplitEnabled:true,
        CDO:{
          decimals:18,
          abi:IdleCDO as Abi,
          name:'IdleCDO_morpho_aave_WETH',
          address:'0xb3F717a5064D2CBE1b8999Fdfd3F8f3DA98339a6'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_morpho_aave_WETH',
          address:'0x9708B5398382EE064A8E718972670351F1c2c860'
        },
        description:'This strategy deploys funds in the <a href="https://aave.morpho.xyz/?network=mainnet" class="link" rel="nofollow noopener noreferrer" target="_blank">Morpho Aave WETH pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
        Tranches:{
          AA:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'AA',
            functions:{
              stake:'stake',
              unstake:'exit',
              rewards:'earned',
              claim:'getReward',
              deposit:'depositAA',
              withdraw:'withdrawAA',
              rewardsRate:'rewardRate',
              stakedBalance:'balanceOf'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_morpho_aave_WETH_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16726342,
            label:'morpho WETH AA',
            name:'AA_morpho_aave_WETH',
            token:'AA_morpho_aave_WETH',
            address:'0x6c0c8708e2FD507B7057762739cb04cF01b98d7b'
          },
          BB:{
            abi:ERC20 as Abi,
            decimals:18,
            tranche:'BB',
            functions:{
              stake:'stake',
              claim:'claim',
              unstake:'unstake',
              deposit:'depositBB',
              withdraw:'withdrawBB',
              stakedBalance:'usersStakes'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_morpho_aave_WETH_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:16726342,
            label:'morpho WETH BB',
            name:'BB_morpho_aave_WETH',
            token:'BB_morpho_aave_WETH',
            address:'0xd69c52E6AF3aE708EE4b3d3e7C0C5b4CF4d6244B'
          }
        }
      }
    }
  }
};

export type IdleToken = {
  abi: Abi
  token: string
  address: string
  decimals: number
}

export type ProtocolFunction = {
  name: string
  params: any[]
}

export type IdleTokenProtocol = {
  enabled: boolean
  abi: Abi
  name: string
  address: string
  token: string
  decimals: number
  functions?: Record<string, ProtocolFunction>
}

export type BestYieldConfig = {
  idle: IdleToken
  proxies?: string[]
  blockNumber: number
  variant?: string
  description?: string
  status?: VaultStatus
  autoFarming?: string[]
  enabledEnvs?: string[]
  underlyingToken: string
  flags?: Record<string, any>
  protocols: IdleTokenProtocol[]
}

export const bestYield: Record<number, Record<string, BestYieldConfig>> = {
  1: { // Mainnet
    DAI: {
      blockNumber: 10595640,
      underlyingToken: 'DAI',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleDAIYield',
        address: '0x3fe7940616e5bc47b0775a0dccf6237893353bb4',
      },
      flags:{
        referralEnabled:true
      },
      proxies: ['0xDe3c769cCD1878372864375e9f89956806B86daA'],
      autoFarming:['IDLE', 'COMP'],
      protocols: [
        {
          enabled: true,
          abi: cToken as Abi,
          name: 'compound',
          address: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
          token: 'cDAI',
          decimals: 8,
          functions: {
            exchangeRate: {
              name: 'exchangeRateStored',
              params: []
            }
          },
        },
        {
          abi: aToken as Abi,
          name: 'aavev2',
          enabled: true,
          address: '0x028171bCA77440897B824Ca71D1c56caC55b68A3',
          token: 'aDAIv2',
          decimals: 18,
          functions: {

          }
        },
        {
          decimals: 18,
          name: 'euler',
          enabled: true,
          abi: IdleCDO as Abi,
          token: 'AA_euler_DAIStaking',
          address: '0x62Eb6a8c7A555eae3e0B17D42CA9A3299af2787E',
          functions: {
            exchangeRate: {
              name: 'virtualPrice',
              params: ['0x62Eb6a8c7A555eae3e0B17D42CA9A3299af2787E']
            }
          },
        },
      ]
    },
    /*
    USDCBBOld: {
      status:'deprecated',
      enabledEnvs: ['beta'],
      blockNumber: 16277063,
      flags:{
        statsEnabled:false,
        referralEnabled:false
      },
      underlyingToken: 'USDC',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleUSDCBBOld',
        address: '0xF6954B03d6a94Ba9e8C80CBE5824f22a401EE5D2',
      },
      protocols: []
    },
    */
    USDCBB: {
      // status:'maintenance',
      blockNumber: 16277063,
      flags:{
        // depositsDisabled:true,
        apiType:'juniorRates',
        referralEnabled:true,
        redeemInterestBearingEnabled:false
      },
      underlyingToken: 'USDC',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleUSDCBB',
        address: '0xDc7777C771a6e4B3A82830781bDDe4DBC78f320e',
      },
      description:'This Junior Best Yield Vaults seek to maximize yields across multiple Junior yield sources (see protocols below). As deposited funds provide first-loss capital to an array of different Junior Tranches, it represent an aggressive target risk allocation strategy. <a href="https://docs.idle.finance/products/perpetual-yield-tranches" class="link" rel="nofollow noopener noreferrer" target="_blank">Learn more.</a>',
      protocols: [
        {
          decimals: 18,
          name: 'euler',
          enabled: true,
          abi: IdleCDO as Abi,
          token: 'BB_euler_USDC',
          address: '0x271db794317B44827EfE81DeC6193fFc277050F6',
          functions: {
            exchangeRate: {
              name: 'virtualPrice',
              params: ['0x271db794317B44827EfE81DeC6193fFc277050F6']
            }
          },
        },
        {
          decimals: 18,
          enabled: true,
          name: 'morpho',
          abi: IdleCDO as Abi,
          token: 'BB_morpho_USDC',
          address: '0x86a40De6d77331788Ba24a85221fb8DBFcBC9bF0',
          functions: {
            exchangeRate: {
              name: 'virtualPrice',
              params: ['0x86a40De6d77331788Ba24a85221fb8DBFcBC9bF0']
            }
          },
        }
      ]
    },
    USDTBB: {
      // status:'maintenance',
      blockNumber: 16277063,
      flags:{
        apiType:'juniorRates',
        referralEnabled:true,
        redeemInterestBearingEnabled:false
      },
      underlyingToken: 'USDT',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleUSDTBB',
        address: '0xfa3AfC9a194BaBD56e743fA3b7aA2CcbED3eAaad',
      },
      description:'This Junior Best Yield Vaults seek to maximize yields across multiple Junior yield sources (see protocols below). As deposited funds provide first-loss capital to an array of different Junior Tranches, it represent an aggressive target risk allocation strategy. <a href="https://docs.idle.finance/products/perpetual-yield-tranches" class="link" rel="nofollow noopener noreferrer" target="_blank">Learn more.</a>',
      protocols: [
        {
          decimals: 18,
          name: 'euler',
          enabled: true,
          abi: IdleCDO as Abi,
          token: 'BB_euler_USDTStaking',
          address: '0x00B80FCCA0fE4fDc3940295AA213738435B0f94e',
          functions: {
            exchangeRate: {
              name: 'virtualPrice',
              params: ['0x00B80FCCA0fE4fDc3940295AA213738435B0f94e']
            }
          },
        },
        {
          decimals: 18,
          enabled: true,
          name: 'morpho',
          abi: IdleCDO as Abi,
          token: 'BB_morpho_aave_USDT',
          address: '0xF0C177229Ae1cd41BF48dF6241fae3e6A14A6967',
          functions: {
            exchangeRate: {
              name: 'virtualPrice',
              params: ['0xF0C177229Ae1cd41BF48dF6241fae3e6A14A6967']
            }
          },
        }
      ]
    },
    DAIBB: {
      enabledEnvs: [],
      // status:'maintenance',
      blockNumber: 16519501,
      flags:{
        referralEnabled:true,
        apiType:'juniorRates',
        redeemInterestBearingEnabled:false
      },
      underlyingToken: 'DAI',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleDAIBB',
        address: '0xeC9482040e6483B7459CC0Db05d51dfA3D3068E1',
      },
      description:'This Junior Best Yield Vaults seek to maximize yields across multiple Junior yield sources (see protocols below). As deposited funds provide first-loss capital to an array of different Junior Tranches, it represent an aggressive target risk allocation strategy. <a href="https://docs.idle.finance/products/perpetual-yield-tranches" class="link" rel="nofollow noopener noreferrer" target="_blank">Learn more.</a>',
      protocols: [
        {
          decimals: 18,
          name: 'euler',
          enabled: true,
          abi: IdleCDO as Abi,
          token: 'BB_euler_DAIStaking',
          address: '0x56263BDE26b72b3e3D26d8e03399a275Aa8Bbfb2',
          functions: {
            exchangeRate: {
              name: 'virtualPrice',
              params: ['0x56263BDE26b72b3e3D26d8e03399a275Aa8Bbfb2']
            }
          },
        },
        {
          decimals: 18,
          enabled: true,
          name: 'morpho',
          abi: IdleCDO as Abi,
          token: 'BB_morpho_aave_DAI',
          address: '0xB098AF638aF0c4Fa3edb1A24f807E9c22dA0fE73',
          functions: {
            exchangeRate: {
              name: 'virtualPrice',
              params: ['0xB098AF638aF0c4Fa3edb1A24f807E9c22dA0fE73']
            }
          },
        }
      ]
    },
    USDC: {
      blockNumber: 10618515,
      underlyingToken: 'USDC',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleUSDCYield',
        address: '0x5274891bEC421B39D23760c04A6755eCB444797C',
      },
      flags:{
        referralEnabled:true
      },
      description:'This Senior Best Yield Vaults seek to automatically maximize yields across either Senior Tranches, providing higher yields while keeping a low-risk profile thanks to Seniors’ built-in coverage, or overcollateralized lending protocols (see underlying protocols below). It represent a conservative target risk allocation strategy. <a href="https://docs.idle.finance/products/perpetual-yield-tranches" class="link" rel="nofollow noopener noreferrer" target="_blank">Learn more.</a>',
      proxies: ['0x43bD6a78b37b50E3f52CAcec53F1202dbDe6a761'],
      autoFarming:['IDLE', 'COMP'],
      protocols: [
        {
          enabled: true,
          abi: cToken as Abi,
          name: 'compound',
          address: '0x39aa39c021dfbae8fac545936693ac917d5e7563',
          token: 'cUSDC',
          decimals: 8,
          functions: {
            exchangeRate: {
              name: 'exchangeRateStored',
              params: []
            }
          },
        },
        {
          abi: aToken as Abi,
          decimals: 6,
          enabled: true,
          name: 'aavev2',
          token: 'aUSDCv2',
          address: '0xBcca60bB61934080951369a648Fb03DF4F96263C',
          functions: {

          }
        },
        {
          decimals: 18,
          name: 'euler',
          enabled: true,
          abi: ERC20 as Abi,
          token: 'AA_euler_USDCStaking',
          address: '0x1AF0294524093BFdF5DA5135853dC2fC678C12f7',
          functions: {

          }
        },
        /*
        {
          abi: IdleCDO as Abi,
          enabled: true,
          name: 'clearpool',
          token: 'AA_clearpool_USDC',
          address: '0xb86264c21418aa75f7c337b1821ccb4ff4d57673',
          decimals: 18,
          functions: {
            exchangeRate: {
              name: 'virtualPrice',
              params: ['0xb86264c21418aa75f7c337b1821ccb4ff4d57673']
            }
          },
        },
        */
      ]
    },
    USDT: {
      blockNumber: 10627792,
      underlyingToken: 'USDT',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleUSDTYield',
        address: '0xF34842d05A1c888Ca02769A633DF37177415C2f8',
      },
      flags:{
        referralEnabled:true
      },
      autoFarming:['IDLE', 'COMP'],
      description:'This Senior Best Yield Vaults seek to automatically maximize yields across either Senior Tranches, providing higher yields while keeping a low-risk profile thanks to Seniors’ built-in coverage, or overcollateralized lending protocols (see underlying protocols below). It represent a conservative target risk allocation strategy. <a href="https://docs.idle.finance/products/perpetual-yield-tranches" class="link" rel="nofollow noopener noreferrer" target="_blank">Learn more.</a>',
      protocols: [
        {
          name: 'compound',
          enabled: true,
          abi: cToken as Abi,
          address: '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9',
          token: 'cUSDT',
          decimals: 8,
          functions: {
            exchangeRate: {
              name: 'exchangeRateStored',
              params: []
            }
          },
        },
        {
          abi: aToken as Abi,
          decimals: 6,
          name: 'aavev2',
          enabled: true,
          token: 'aUSDTv2',
          address: '0x3ed3b47dd13ec9a98b44e6204a523e766b225811',
          functions: {

          }
        },
        {
          abi: ERC20 as Abi,
          name: 'euler',
          enabled: true,
          address: '0x6796FCd41e4fb26855Bb9BDD7Cad41128Da1Fd59',
          token: 'AA_euler_USDTStaking',
          decimals: 18,
          functions: {

          }
        },
      ]
    },
    /*
    SUSD: {
      blockNumber: 10628446,
      underlyingToken: 'SUSD',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleSUSDYield',
        address: '0xf52cdcd458bf455aed77751743180ec4a595fd3f',
      },
      autoFarming:['IDLE'],
      protocols: [
        {
          name: 'aavev2',
          enabled: true,
          abi: aToken as Abi,
          address: '0x6c5024cd4f8a59110119c56f8933403a539555eb',
          token: 'aSUSDv2',
          decimals: 18,
          functions: {

          }
        }
      ]
    },
    TUSD: {
      blockNumber: 10628641,
      underlyingToken: 'TUSD',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleTUSDYield',
        address: '0xc278041fDD8249FE4c1Aad1193876857EEa3D68c',
      },
      autoFarming:['IDLE'],
      protocols: [
        {
          abi: aToken as Abi,
          enabled: true,
          name: 'aavev2',
          token: 'aTUSDv2',
          address: '0x101cc05f4A51C0319f570d5E146a8C625198e636',
          decimals: 18,
          functions: {

          }
        }
      ]
    },
    */
    WETH: {
      blockNumber: 11815164,
      underlyingToken: 'WETH',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleWETHYield',
        address: '0xC8E6CA6E96a326dC448307A5fDE90a0b21fd7f80',
      },
      flags:{
        referralEnabled:true
      },
      autoFarming:['IDLE', 'COMP'],
      description:'This Senior Best Yield Vaults seek to automatically maximize yields across either Senior Tranches, providing higher yields while keeping a low-risk profile thanks to Seniors’ built-in coverage, or overcollateralized lending protocols (see underlying protocols below). It represent a conservative target risk allocation strategy. <a href="https://docs.idle.finance/products/perpetual-yield-tranches" class="link" rel="nofollow noopener noreferrer" target="_blank">Learn more.</a>',
      protocols: [
        {
          enabled: true,
          abi: cToken as Abi,
          name: 'compound',
          address: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
          token: 'cETH',
          decimals: 8,
          functions: {
            exchangeRate: {
              name: 'exchangeRateStored',
              params: []
            }
          },
        },
        {
          abi: aToken as Abi,
          name: 'aavev2',
          enabled: true,
          address: '0x030bA81f1c18d280636F32af80b9AAd02Cf0854e',
          token: 'aWETH',
          decimals: 18,
          functions: {

          }
        },
        {
          abi: ERC20 as Abi,
          name: 'euler',
          enabled: true,
          address: '0x2B7Da260F101Fb259710c0a4f2EfEf59f41C0810',
          token: 'AA_euler_WETHStaking',
          decimals: 18,
          functions: {

          }
        },
      ]
    },
    WETHBB: {
      blockNumber: 16733433,
      underlyingToken: 'WETH',
      idle: {
        decimals: 18,
        abi: IdleTokenV4 as Abi,
        token: 'idleWETHJunior',
        address: '0x62A0369c6BB00054E589D12aaD7ad81eD789514b',
      },
      flags:{
        apiType:'juniorRates',
        referralEnabled:true,
        redeemInterestBearingEnabled:false
      },
      description:'This Junior Best Yield Vaults seek to maximize yields across multiple Junior yield sources (see protocols below). As deposited funds provide first-loss capital to an array of different Junior Tranches, it represent an aggressive target risk allocation strategy. <a href="https://docs.idle.finance/products/perpetual-yield-tranches" class="link" rel="nofollow noopener noreferrer" target="_blank">Learn more.</a>',
      protocols: [
        {
          decimals: 18,
          functions: {},
          enabled: true,
          name: 'morpho',
          abi: ERC20 as Abi,
          token: 'BB_morpho_aave_WETH',
          address: '0xd69c52E6AF3aE708EE4b3d3e7C0C5b4CF4d6244B'
        },
        {
          decimals: 18,
          name: 'euler',
          functions: {},
          enabled: true,
          abi: ERC20 as Abi,
          token: 'BB_euler_WETHStaking',
          address: '0x2e80225f383F858E8737199D3496c5Cf827670a5'
        },
      ]
    },
    WBTC: {
      status:'deprecated',
      enabledEnvs: ['beta'],
      blockNumber: 10627962,
      underlyingToken: 'WBTC',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleWBTCYield',
        address: '0x8C81121B15197fA0eEaEE1DC75533419DcfD3151',
      },
      flags:{
        referralEnabled:true
      },
      autoFarming:['IDLE', 'COMP'],
      protocols: [
        {
          enabled: true,
          token: 'cWBTC',
          abi: cToken as Abi,
          name: 'compound',
          address: '0xccF4429DB6322D5C611ee964527D42E5d685DD6a',
          decimals: 8,
          functions: {
            exchangeRate: {
              name: 'exchangeRateStored',
              params: []
            }
          },
        },
        {
          abi: aToken as Abi,
          enabled: true,
          name: 'aavev2',
          token: 'aWBTCv2',
          address: '0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656',
          decimals: 8,
          functions: {

          }
        }
      ]
    },
    /*
    RAI: {
      blockNumber: 12317005,
      underlyingToken: 'RAI',
      enabledEnvs: [],
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleRAIYield',
        address: '0x5C960a3DCC01BE8a0f49c02A8ceBCAcf5D07fABe',
      },
      autoFarming:['IDLE'],
      protocols: [
        {
          abi: aToken as Abi,
          decimals: 18,
          token: 'aRAI',
          enabled: true,
          name: 'aavev2',
          functions: {
          },
          address: '0xc9bc48c72154ef3e5425641a3c747242112a46af',
        }
      ]
    },
    */
  },
  137:{ // Matic Mainnet
    DAI:{
      blockNumber: 15152893,
      underlyingToken:'DAI',
      idle:{
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token:'idleDAIYield',
        address:'0x8a999F5A3546F8243205b2c0eCb0627cC10003ab',
      },
      protocols:[
        {
          abi: aToken as Abi,
          name:'aavev2',
          enabled:true,
          token:'amDAI',
          address:'0x27F8D03b3a2196956ED754baDc28D73be8830A6e',
          decimals:18,
          functions:{

          }
        },
      ]
    },
    USDC:{
      blockNumber: 15451334,
      underlyingToken:'USDC',
      idle:{
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token:'idleUSDCYield',
        address:'0x1ee6470CD75D5686d0b2b90C0305Fa46fb0C89A1',
      },
      protocols:[
        {
          abi: aToken as Abi,
          name:'aavev2',
          enabled:true,
          token:'amUSDC',
          address:'0x1a13F4Ca1d028320A707D99520AbFefca3998b7F',
          decimals:18,
          functions:{

          }
        },
      ]
    },
    WETH:{
      blockNumber: 15473520,
      underlyingToken:'WETH',
      idle:{
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token:'idleWETHYield',
        address:'0xfdA25D931258Df948ffecb66b5518299Df6527C4',
      },
      protocols:[
        {
          abi: aToken as Abi,
          decimals:18,
          enabled:true,
          token:'aWETH',
          name:'aavev2',
          address:'0x28424507fefb6f7f8E9D3860F56504E4e5f5f390',
          functions:{

          }
        },
      ]
    },
  },
};

export type MultiReward = {
  abi: Abi
  name: string
  address: string
  rewardTokens: string[]
}

export type TrancheToken = {
  name: string
  token: string
  address: string
}

export type GaugeConfig = {
  abi:Abi
  name: string
  token: string
  address:string
  protocol:string
  enabled: boolean
  rewardToken:string
  description?:string
  underlyingToken:string
  messages?: VaultMessages
  multiRewards?:MultiReward
  trancheToken:TrancheToken
}

export const gauges: Record<string, GaugeConfig> = {
  stETH:{
    enabled: false,
    protocol:'lido',
    rewardToken:'IDLE',
    underlyingToken:'stETH',
    abi:LiquidityGauge as Abi,
    name: "LiquidityGauge_aa_lido_steth",
    token: "LiquidityGauge_aa_lido_steth",
    address:'0x675eC042325535F6e176638Dd2d4994F645502B9',
    description:'Starting from February 21st 2023, LDO rewards are automatically harvested and distributed to both Senior and Junior Tranches.<br />Therefore, this Gauge won\'t distribute any reward. Please claim any remaining IDLE and LDO reward, and redeem your stETH-AA tokens, as you will receive incentives by just holding them.',
    messages:{
      withdraw:'This gauge has been disabled since LDO rewards are automatically harvested by the strategy, please withdraw your stETH-AA tokens'
    },
    multiRewards:{
      rewardTokens:['LDO'],
      abi:GaugeMultiRewards as Abi,
      name:'multiRewards_aa_lido_stETH',
      address:'0xA357AF9430e4504419A7A05e217D4A490Ecec6FA',
    },
    trancheToken:{
      name: 'stETH-AA',
      token: 'stETH-AA',
      address: '0x2688fc68c4eac90d9e5e1b94776cf14eade8d877'
    }
  },
  ALUSD3CRV:{
    enabled: false,
    protocol:'convex',
    rewardToken:'IDLE',
    abi:LiquidityGauge as Abi,
    underlyingToken:'ALUSD3CRV',
    name: "LiquidityGauge_aa_convex_alusd3crv",
    token: "LiquidityGauge_aa_convex_alusd3crv",
    address:'0x21dDA17dFF89eF635964cd3910d167d562112f57',
    trancheToken:{
      name: 'ALUSD3CRV-AA',
      token: 'ALUSD3CRV-AA',
      address: '0x790E38D85a364DD03F682f5EcdC88f8FF7299908'
    }
  },
  FRAX3CRV:{
    enabled: false,
    protocol:'convex',
    rewardToken:'IDLE',
    abi:LiquidityGauge as Abi,
    underlyingToken:'FRAX3CRV',
    name: "LiquidityGauge_aa_convex_frax3crv",
    token: "LiquidityGauge_aa_convex_frax3crv",
    address:'0x7ca919Cf060D95B3A51178d9B1BCb1F324c8b693',
    trancheToken:{
      name: 'FRAX3CRV-AA',
      token: 'FRAX3CRV-AA',
      address: '0x15794da4dcf34e674c18bbfaf4a67ff6189690f5'
    }
  },
  MIM3CRV:{
    enabled: false,
    protocol:'convex',
    rewardToken:'IDLE',
    abi:LiquidityGauge as Abi,
    underlyingToken:'MIM3CRV',
    name: "LiquidityGauge_aa_convex_mim3crv",
    token: "LiquidityGauge_aa_convex_mim3crv",
    address:'0x8cC001dd6C9f8370dB99c1e098e13215377Ecb95',
    trancheToken:{
      name: 'MIM3CRV-AA',
      token: 'MIM3CRV-AA',
      address: '0xFC96989b3Df087C96C806318436B16e44c697102'
    }
  },
  "3EUR":{
    enabled: false,
    protocol:'convex',
    rewardToken:'IDLE',
    abi:LiquidityGauge as Abi,
    underlyingToken:'3EUR',
    name: "LiquidityGauge_aa_convex_3eur",
    token: "LiquidityGauge_aa_convex_3eur",
    address:'0xDfB27F2fd160166dbeb57AEB022B9EB85EA4611C',
    trancheToken:{
      name: '3EUR-AA',
      token: '3EUR-AA',
      address: '0x158e04225777BBEa34D2762b5Df9eBD695C158D2'
    }
  },
  steCRV:{
    enabled: false,
    protocol:'convex',
    rewardToken:'IDLE',
    abi:LiquidityGauge as Abi,
    underlyingToken:'steCRV',
    name: "LiquidityGauge_aa_convex_steCRV",
    token: "LiquidityGauge_aa_convex_steCRV",
    address:'0x30a047d720f735Ad27ad384Ec77C36A4084dF63E',
    trancheToken:{
      name: 'steCRV-AA',
      token: 'steCRV-AA',
      address: '0x060a53BCfdc0452F35eBd2196c6914e0152379A6'
    }
  },
  MUSD3CRV:{
    enabled: false,
    protocol:'convex',
    rewardToken:'IDLE',
    abi:LiquidityGauge as Abi,
    underlyingToken:'MUSD3CRV',
    name: "LiquidityGauge_aa_convex_musd3crv",
    token: "LiquidityGauge_aa_convex_musd3crv",
    address:'0xAbd5e3888ffB552946Fc61cF4C816A73feAee42E',
    multiRewards:{
      rewardTokens:['MUSD'],
      abi:GaugeMultiRewards as Abi,
      name:'multiRewards_aa_convex_musd3crv',
      address:'0x7f366a2b4c4380fd9746cf10b4ded562c890b0b1',
    },
    trancheToken:{
      name: 'MUSD3CRV-AA',
      token: 'MUSD3CRV-AA',
      address: '0x4585F56B06D098D4EDBFc5e438b8897105991c6A'
    }
  },
  PBTCCRV:{
    enabled: false,
    protocol:'convex',
    rewardToken:'IDLE',
    abi:LiquidityGauge as Abi,
    underlyingToken:'PBTCCRV',
    name: "LiquidityGauge_aa_convex_pbtccrv",
    token: "LiquidityGauge_aa_convex_pbtccrv",
    address:'0x2bea05307b42707be6cce7a16d700a06ff93a29d',
    multiRewards:{
      rewardTokens:['PNT'],
      abi:GaugeMultiRewards as Abi,
      name:'multiRewards_aa_convex_pbtccrv',
      address:'0x7d4091D8b28d09b4135905213DE105C45d7F459d',
    },
    trancheToken:{
      name: 'PBTCCRV-AA',
      token: 'PBTCCRV-AA',
      address: '0x4657B96D587c4d46666C244B40216BEeEA437D0d'
    }
  },
  AGEUR:{
    enabled: false,
    protocol:'euler',
    rewardToken:'IDLE',
    abi:LiquidityGauge as Abi,
    underlyingToken:'AGEUR',
    name: "LiquidityGauge_aa_euler_ageur",
    token: "LiquidityGauge_aa_euler_ageur",
    address:'0x8f195979f7af6c500b4688e492d07036c730c1b2',
    trancheToken:{
      name: 'AGEUR-AA',
      token: 'AGEUR-AA',
      address: '0x624DfE05202b66d871B8b7C0e14AB29fc3a5120c'
    }
  },
  USDC:{
    enabled: false,
    protocol:'euler',
    rewardToken:'IDLE',
    abi:LiquidityGauge as Abi,
    underlyingToken:'USDC',
    name: "LiquidityGauge_aa_euler_usdc",
    token: "LiquidityGauge_aa_euler_usdc",
    address:'0x1cd24f833af78ae877f90569eaec3174d6769995',
    trancheToken:{
      name: 'USDC-AA',
      token: 'USDC-AA',
      address: '0x1e095cbF663491f15cC1bDb5919E701b27dDE90C'
    }
  },
  DAI:{
    enabled: false,
    protocol:'euler',
    rewardToken:'IDLE',
    abi:LiquidityGauge as Abi,
    underlyingToken:'DAI',
    name: "LiquidityGauge_aa_euler_dai",
    token: "LiquidityGauge_aa_euler_dai",
    address:'0x57d59d4bbb0e2432f1698f33d4a47b3c7a9754f3',
    trancheToken:{
      name: 'DAI-AA',
      token: 'DAI-AA',
      address: '0x852c4d2823E98930388b5cE1ed106310b942bD5a'
    }
  },
  USDT:{
    enabled: false,
    protocol:'euler',
    rewardToken:'IDLE',
    abi:LiquidityGauge as Abi,
    underlyingToken:'USDT',
    name: "LiquidityGauge_aa_euler_usdt",
    token: "LiquidityGauge_aa_euler_usdt",
    address:'0x0c3310b0b57b86d376040b755f94a925f39c4320',
    trancheToken:{
      name: 'USDT-AA',
      token: 'USDT-AA',
      address: '0xE0f126236d2a5b13f26e72cBb1D1ff5f297dDa07'
    }
  },
  /*
  mUSD:{
    protocol:'mstable',
    rewardToken:'IDLE',
    abi:LiquidityGauge as Abi,
    name: "LiquidityGauge_aa_mstable_musd",
    token: "LiquidityGauge_aa_mstable_musd",
    address:'0x41653c7AF834F895Db778B1A31EF4F68Be48c37c',
    trancheToken:{
      name: 'AA_mstable_musd',
      token: 'AA_mstable_musd',
      address: '0xfC558914b53BE1DfAd084fA5Da7f281F798227E7'
    }
  },
  */
}