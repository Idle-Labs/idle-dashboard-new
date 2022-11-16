import type { Abi } from './types'
import aToken from 'abis/aave/AToken.json';
import ERC20 from 'abis/tokens/ERC20.json';
import cToken from 'abis/compound/cDAI.json';
import IdleCDO from 'abis/idle/IdleCDO.json';
import IdleTokenV4 from 'abis/idle/IdleTokenV4.json';
import TruefiPool from 'abis/truefi/TruefiPool.json';
import RibbonPool from 'abis/ribbon/RibbonPool.json';
import IdleStrategy from 'abis/idle/IdleStrategy.json';
import IdleCDOPolygon from 'abis/idle/IdleCDOPolygon.json';
import LiquidityGauge from 'abis/idle/LiquidityGauge.json';
import IdleCDOTrancheRewards from 'abis/idle/IdleCDOTrancheRewards.json';
import TrancheStakingRewards from 'abis/idle/TrancheStakingRewards.json';

export const vaultsStatusSchemes: Record<string, string> = {
  'production' : 'green',
  'paused' : 'gray',
  'disabled' : 'gray',
  'beta' : 'blue'
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

interface Messages {
  withdraw?: string
  buyInstructions?: string
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

export interface TrancheConfig {
  protocol:string
  enabledEnvs?: string[]
  curveApyPath?: string[]
  adaptiveYieldSplitEnabled?: boolean
  multiCallDisabled?: boolean
  blockNumber:number
  referralEnabled?:boolean
  autoFarming?:string[]
  underlyingToken:string
  modal?: any
  CDO: CDO
  Pool?: Pool
  Strategy: Strategy
  description?: string
  messages?: Messages
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
    /*
    idle:{
      DAI:{
        protocol:'idle',
        blockNumber:13054628,
        underlyingToken:'DAI',
        CDO:{
          decimals:18,
          abi:IdleCDO as Abi,
          name:'IdleCDO_idleDAIYield',
          address:'0xd0DbcD556cA22d3f3c142e9a3220053FD7a247BC'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_idleDAIYield',
          address:'0x48a48c6694168093A3dEE02E9e8AC5a14169a652'
        },
        description:'This strategy accrue additional interest after an harvest is done. The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
        messages:{
          withdraw:'The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
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
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_idleDAIYield_AA',
              address:'0x9c3bC87693c65E740d8B2d5F0820E04A61D8375B',
              stakingRewards:[
                {
                  token:'IDLE',
                  enabled:true,
                  address:'0x875773784Af8135eA0ef43b5a374AaD105c5D39e'
                }
              ]
            },
            label:'idleDAI AA',
            blockNumber:13054628,
            name:'AA_idleDAIYield',
            token:'AA_idleDAIYield',
            address:'0xE9ada97bDB86d827ecbaACCa63eBcD8201D8b12E'
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
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_idleDAIYield_BB',
              address:'0x4473bc90118b18be890af42d793b5252c4dc382d',
              stakingRewards:[
                {
                  token:'IDLE',
                  enabled:false,
                  address:'0x875773784Af8135eA0ef43b5a374AaD105c5D39e'
                }
              ]
            },
            label:'idleDAI BB',
            blockNumber:13054628,
            name:'BB_idleDAIYield',
            token:'BB_idleDAIYield',
            address:'0x730348a54bA58F64295154F0662A08Cbde1225c2'
          }
        }
      },
      // FEI:{
      //   protocol:'idle',
      //   blockNumber:13575397,
      //   underlyingToken:'FEI',
      //   CDO:{
      //     abi:IdleCDO as Abi,
      //     decimals:18,
      //     name:'IdleCDO_idleFEIYield',
      //     address:'0x77648a2661687ef3b05214d824503f6717311596'
      //   },
      //   Strategy:{
      //     abi:IdleStrategy as Abi,
      //     name:'IdleStrategy_idleFEIYield',
      //     address:'0x73A44027bDAF5D71296d2C73cfb13e561c76a916'
      //   },
      //   Tranches:{
      //     AA:{
      //       abi:ERC20 as Abi,
      //       decimals:18,
      //       tranche:'AA',
      //       functions:{
      //         stake:'stake',
      //         claim:'claim',
      //         unstake:'unstake',
      //         deposit:'depositAA',
      //         withdraw:'withdrawAA',
      //         stakedBalance:'usersStakes',
      //         rewards:'expectedUserReward'
      //       },
      //       CDORewards:{
      //         decimals:18,
      //         unstakeWithBalance:true,
      //         abi:IdleCDOTrancheRewards as Abi,
      //         name:'IdleCDOTrancheRewards_idleFEIYield_AA',
      //         address:'0x8fcD21253AaA7E228531291cC6f644d13B3cF0Ba',
      //         stakingRewards:[
      //           {
      //             token:'IDLE',
      //             enabled:true,
      //             address:'0x875773784Af8135eA0ef43b5a374AaD105c5D39e'
      //           }
      //         ]
      //       },
      //       label:'idleFEI AA',
      //       blockNumber:13575397,
      //       name:'AA_idleFEIYield',
      //       token:'AA_idleFEIYield',
      //       address:'0x9cE3a740Df498646939BcBb213A66BBFa1440af6'
      //     },
      //     BB:{
      //       abi:ERC20 as Abi,
      //       decimals:18,
      //       tranche:'BB',
      //       functions:{
      //         stake:'stake',
      //         claim:'claim',
      //         unstake:'unstake',
      //         deposit:'depositBB',
      //         withdraw:'withdrawBB',
      //         stakedBalance:'usersStakes'
      //       },
      //       CDORewards:{
      //         decimals:18,
      //         stakingRewards:[],
      //         unstakeWithBalance:true,
      //         abi:IdleCDOTrancheRewards as Abi,
      //         name:'IdleCDOTrancheRewards_idleFEIYield_BB',
      //         address:'0x0000000000000000000000000000000000000000'
      //       },
      //       label:'idleFEI BB',
      //       blockNumber:13575397,
      //       name:'BB_idleFEIYield',
      //       token:'BB_idleFEIYield',
      //       address:'0x2490D810BF6429264397Ba721A488b0C439aA745'
      //     }
      //   }
      // }
    },
    */
    lido:{
      stETH:{
        protocol:'lido',
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
        // getApyFromApi:{
        //   path:['apr'],
        //   protocol:'polido',
        //   apyLabel:'stMATIC APR'
        // },
        // functions:{
        //   getCustomApr:'getMaticTrancheApy',
        //   getAdditionalApr:'getMaticTrancheAdditionalApy',
        // },
        // ClaimNFT:{
        //   contract:'stMATIC',
        //   method:'claimTokens',
        //   event:{
        //     name:'ClaimTokensEvent',
        //     amountField:'_amountClaimed'
        //   }
        // },
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
        messages:{
          // pendingNFTAmount:'Claim your rewards directly from <a href="https://polygon.lido.fi" class="link" rel="nofollow noopener noreferrer" target="_blank">https://polygon.lido.fi</a> in Claim tab.',
          withdraw:'By withdrawing you will receive an NFT representing your redeemed funds, then you need to claim your funds directly from <a href="https://polygon.lido.fi" class="link" rel="nofollow noopener noreferrer" target="_blank">https://polygon.lido.fi</a>'
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
        blockNumber:13812864,
        autoFarming:['CVX','CRV'],
        curveApyPath:['apy','day','frax'],
        underlyingToken:'FRAX3CRV',
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
          withdraw:'The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
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
      MIM3CRV:{
        protocol:'convex',
        blockNumber:13848124,
        curveApyPath:['apy','day','mim'],
        autoFarming:['CVX','CRV','SPELL'],
        underlyingToken:'MIM3CRV',
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_convex_mim3crv',
          address:'0x151e89e117728ac6c93aae94c621358b0ebd1866'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_convex_mim3crv',
          address:'0x35168324dC1981aDDc3bC915788e200BeDF77865'
        },
        description:'This strategy accrue interest only after an harvest is done. The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
        messages:{
          withdraw:'The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
          buyInstructions:'To get MIM3CRV token your have to deposit first into <a class="link" rel="nofollow noopener noreferrer" target="_blank" href="https://curve.fi/mim/deposit">MIM Curve Pool</a>.',
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
              name:'IdleCDOTrancheRewards_convex_mim3crv_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:13848124,
            name:'AA_convex_mim3crv',
            token:'AA_convex_mim3crv',
            label:'convex mim3crv AA',
            address:'0xFC96989b3Df087C96C806318436B16e44c697102'
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
              name:'IdleCDOTrancheRewards_convex_mim3crv_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:13848124,
            name:'BB_convex_mim3crv',
            token:'BB_convex_mim3crv',
            label:'convex mim3crv BB',
            address:'0x5346217536852CD30A5266647ccBB6f73449Cbd1'
          }
        }
      },
      steCRV:{
        protocol:'convex',
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
          withdraw:'The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
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
          withdraw:'The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
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
      "3EUR":{
        protocol:'convex',
        blockNumber:14177892,
        autoFarming:['CVX','CRV','ANGLE'],
        underlyingToken:'3EUR',
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_convex_3eur',
          address:'0x858F5A3a5C767F8965cF7b77C51FD178C4A92F05'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_convex_3eur',
          address:'0x4Ae60BC9A3eFc160AE2EbA70947a9b47Ad2b9094'
        },
        description:'This strategy accrue interest only after an harvest is done. The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
        messages:{
          withdraw:'The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
          buyInstructions:'To get 3EUR token your have to deposit first into <a class="link" rel="nofollow noopener noreferrer" target="_blank" href="https://curve.fi/factory/66/deposit">3EUR Curve Pool</a>.',
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
              name:'IdleCDOTrancheRewards_convex_3eur_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:14177892,
            name:'AA_convex_3eur',
            token:'AA_convex_3eur',
            label:'convex 3eur AA',
            address:'0x158e04225777BBEa34D2762b5Df9eBD695C158D2'
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
              name:'IdleCDOTrancheRewards_convex_3eur_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:14177892,
            name:'BB_convex_3eur',
            token:'BB_convex_3eur',
            label:'convex 3eur BB',
            address:'0x3061C652b49Ae901BBeCF622624cc9f633d01bbd'
          }
        }
      },
      MUSD3CRV:{
        protocol:'convex',
        blockNumber:14177794,
        autoFarming:['CVX','CRV'],
        underlyingToken:'MUSD3CRV',
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_convex_musd3crv',
          address:'0x16d88C635e1B439D8678e7BAc689ac60376fBfA6'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_convex_musd3crv',
          address:'0x271cE5dED4cCbD28833bddF8a8093517299920f0'
        },
        description:'This strategy accrue interest only after an harvest is done. The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
        messages:{
          withdraw:'The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
          buyInstructions:'To get MUSD3CRV token your have to deposit first into <a class="link" rel="nofollow noopener noreferrer" target="_blank" href="https://curve.fi/musd/deposit">MUSD Curve Pool</a>.',
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
              name:'IdleCDOTrancheRewards_convex_musd3crv_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:14177794,
            name:'AA_convex_musd3crv',
            token:'AA_convex_musd3crv',
            label:'convex musd3crv AA',
            address:'0x4585F56B06D098D4EDBFc5e438b8897105991c6A'
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
              name:'IdleCDOTrancheRewards_convex_musd3crv_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:14177794,
            name:'BB_convex_musd3crv',
            token:'BB_convex_musd3crv',
            label:'convex musd3crv BB',
            address:'0xFb08404617B6afab0b19f6cEb2Ef9E07058D043C'
          }
        }
      },
      PBTCCRV:{
        protocol:'convex',
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
          withdraw:'The returns from an harvest are linearly released in 24 hours, so you should wait 24 hours after an harvest to see all the interests you are eligible for.',
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
      levUSDC:{
        autoFarming:[],
        protocol:'euler',
        blockNumber:15445762,
        enabledEnvs: ['beta'],
        underlyingToken:'USDC',
        adaptiveYieldSplitEnabled:true,
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_euler_levUSDC',
          address:'0xcb2bd49d4b7874e6597dedfaa3e7b4e01831c5af'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_euler_levUSDC',
          address:'0xee5ec95ce2c8700a2d152db3249fa13b163f0073'
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
              name:'TrancheStakingRewards_euler_levUSDC_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15445762,
            label:'euler USDC AA',
            name:'AA_euler_levUSDC',
            token:'AA_euler_levUSDC',
            address:'0x9F94fa97cC2d48315015040708D12aB855283164'
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
              name:'IdleCDOTrancheRewards_euler_levUSDC_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15445762,
            label:'euler USDC BB',
            name:'BB_euler_levUSDC',
            token:'BB_euler_levUSDC',
            address:'0x617648B846512E2F49dC21Bf27e4505C285E6977'
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
      }
    },
    clearpool:{
      USDC:{
        enabledEnvs:[],
        blockNumber:15044679,
        protocol:'clearpool',
        autoFarming:['CPOOL'],
        adaptiveYieldSplitEnabled:true,
        underlyingToken:'USDC',
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_clearpool_USDC',
          address:'0xDBCEE5AE2E9DAf0F5d93473e08780C9f45DfEb93'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_clearpool_USDC',
          address:'0x54ae90be2dee0a960953c724839541e75bb1f471'
        },
        description:'This strategy deploys funds in the <a href="https://app.clearpool.finance/pool/0xCb288b6d30738db7E3998159d192615769794B5b" class="link" rel="nofollow noopener noreferrer" target="_blank">Clearpool Wintermute USDC pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
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
              name:'TrancheStakingRewards_clearpool_USDC_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15044679,
            name:'AA_clearpool_USDC',
            token:'AA_clearpool_USDC',
            label:'clearpool USDC AA',
            address:'0xb86264c21418aA75F7c337B1821CcB4Ff4d57673'
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
              name:'IdleCDOTrancheRewards_clearpool_USDC_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15044679,
            name:'BB_clearpool_USDC',
            token:'BB_clearpool_USDC',
            label:'clearpool USDC BB',
            address:'0x4D9d9AA17c3fcEA05F20a87fc1991A045561167d'
          }
        }
      }
    },
    truefi:{
      USDC:{
        enabledEnvs:[],
        protocol:'truefi',
        autoFarming:['TRU'],
        blockNumber:15326147,
        multiCallDisabled:true,
        // adaptiveYieldSplitEnabled:true,
        underlyingToken:'USDC',
        CDO:{
          abi:IdleCDO as Abi,
          decimals:18,
          name:'IdleCDO_truefi_USDC',
          address:'0x1f5A97fB665e295303D2F7215bA2160cc5313c8E'
        },
        Strategy:{
          abi:IdleStrategy as Abi,
          name:'IdleStrategy_truefi_USDC',
          address:'0x62B17c9083Db5941197E83BD385985B8878B58Fb'
        },
        Pool:{
          abi:TruefiPool as Abi,
          name:'Pool_truefi_USDC',
          address:'0xA991356d261fbaF194463aF6DF8f0464F8f1c742'
        },
        modal:{
          enabled:true,
          buttonText:'Continue',
          title:'Truefi exit fee',
          id:'modal_truefi_usdc_exit_fee',
          text:'This strategy is subject to an exit fee between 0.05% and 10% depending on the utilization ratio of the Truefi pool, in addition to the performance fee. Read more at <a href="https://docs.truefi.io/faq/dao-managed-pools/pool#what-is-liquid-exit" class="link" rel="nofollow noopener noreferrer" target="_blank">https://docs.truefi.io/faq/dao-managed-pools/pool#what-is-liquid-exit</a>'
        },
        messages:{
          withdraw:'This strategy is subject to an exit fee between 0.05% and 10% depending on the utilization ratio of the Truefi pool.',
        },
        description:'This strategy deploys funds in the <a href="https://app.truefi.io/pools/0xA991356d261fbaF194463aF6DF8f0464F8f1c742" class="link" rel="nofollow noopener noreferrer" target="_blank">Truefi USDC pool</a>. The APR is dynamically adjusted according to the coverage provided to the counterpart Senior tranche thanks to the <a href="https://medium.com/idle-finance/adaptive-yield-split-foster-pyts-liquidity-scalability-a796fa17ea35" class="link" rel="nofollow noopener noreferrer" target="_blank">Adaptive Yield Split</a>.',
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
              penaltyFee:'liquidExitPenalty'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:false,
              abi:TrancheStakingRewards as Abi,
              name:'TrancheStakingRewards_truefi_USDC_AA',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15044679,
            name:'AA_truefi_USDC',
            token:'AA_truefi_USDC',
            label:'truefi USDC AA',
            address:'0x868bb78fb045576162B510ba33358C9f93e7959e'
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
              penaltyFee:'liquidExitPenalty'
            },
            CDORewards:{
              decimals:18,
              stakingRewards:[],
              unstakeWithBalance:true,
              abi:IdleCDOTrancheRewards as Abi,
              name:'IdleCDOTrancheRewards_truefi_USDC_BB',
              address:'0x0000000000000000000000000000000000000000'
            },
            blockNumber:15044679,
            name:'BB_truefi_USDC',
            token:'BB_truefi_USDC',
            label:'truefi USDC BB',
            address:'0x6EdE2522347E6a5A0420F41f42e021246e97B540'
          }
        }
      }
    },
    ribbon:{
      USDCFolk:{
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
  autoFarming?: string[]
  enabledEnvs?: string[]
  underlyingToken: string
  protocols: IdleTokenProtocol[]
}

export const bestYield: Record<number, Record<string, BestYieldConfig>> = {
  1: { // Mainnet
    DAI: {
      underlyingToken: 'DAI',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleDAIYield',
        address: '0x3fe7940616e5bc47b0775a0dccf6237893353bb4',
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
          decimals: 28,
          functions: {
            exchangeRate: {
              name: 'exchangeRateStored',
              params: []
            }
          },
        },
        {
          abi: aToken as Abi,
          name: 'aave',
          enabled: true,
          address: '0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d',
          token: 'aDAI',
          decimals: 18,
          functions: {

          }
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
        }
      ]
    },
    USDCBB: {
      underlyingToken: 'USDC',
      enabledEnvs: ['beta'],
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleUSDCBB',
        address: '0xf6954b03d6a94ba9e8c80cbe5824f22a401ee5d2',
      },
      protocols: [
        {
          decimals: 18,
          enabled: true,
          name: 'clearpool',
          abi: IdleCDO as Abi,
          token: 'BB_clearpool_USDC',
          address: '0x4D9d9AA17c3fcEA05F20a87fc1991A045561167d',
          functions: {
            exchangeRate: {
              name: 'virtualPrice',
              params: ['0x4D9d9AA17c3fcEA05F20a87fc1991A045561167d']
            }
          },
        },
        {
          decimals: 18,
          enabled: true,
          name: 'ribbon',
          abi: IdleCDO as Abi,
          token: 'BB_ribbon_USDC',
          address: '0x982E46e81E99fbBa3Fb8Af031A7ee8dF9041bb0C',
          functions: {
            exchangeRate: {
              name: 'virtualPrice',
              params: ['0x982E46e81E99fbBa3Fb8Af031A7ee8dF9041bb0C']
            }
          },
        },
      ]
    },
    USDC: {
      underlyingToken: 'USDC',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleUSDCYield',
        address: '0x5274891bEC421B39D23760c04A6755eCB444797C',
      },
      proxies: ['0x43bD6a78b37b50E3f52CAcec53F1202dbDe6a761'],
      autoFarming:['IDLE', 'COMP'],
      protocols: [
        {
          enabled: true,
          abi: cToken as Abi,
          name: 'compound',
          address: '0x39aa39c021dfbae8fac545936693ac917d5e7563',
          token: 'cUSDC',
          decimals: 16,
          functions: {
            exchangeRate: {
              name: 'exchangeRateStored',
              params: []
            }
          },
        },
        {
          name: 'aave',
          enabled: true,
          abi: aToken as Abi,
          address: '0x9bA00D6856a4eDF4665BcA2C2309936572473B7E',
          token: 'aUSDC',
          decimals: 18,
          functions: {

          }
        },
        {
          abi: aToken as Abi,
          decimals: 18,
          enabled: true,
          name: 'aavev2',
          token: 'aUSDCv2',
          address: '0xBcca60bB61934080951369a648Fb03DF4F96263C',
          functions: {

          }
        },
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
      ]
    },
    USDT: {
      underlyingToken: 'USDT',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleUSDTYield',
        address: '0xF34842d05A1c888Ca02769A633DF37177415C2f8',
      },
      autoFarming:['IDLE', 'COMP'],
      protocols: [
        {
          name: 'compound',
          enabled: true,
          abi: cToken as Abi,
          address: '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9',
          token: 'cUSDT',
          decimals: 16,
          functions: {
            exchangeRate: {
              name: 'exchangeRateStored',
              params: []
            }
          },
        },
        {
          name: 'aave',
          enabled: true,
          abi: aToken as Abi,
          address: '0x71fc860F7D3A592A4a98740e39dB31d25db65ae8',
          token: 'aUSDT',
          decimals: 18,
          functions: {

          }
        },
        {
          abi: aToken as Abi,
          decimals: 18,
          name: 'aavev2',
          enabled: true,
          token: 'aUSDTv2',
          address: '0x3ed3b47dd13ec9a98b44e6204a523e766b225811',
          functions: {

          }
        }
      ]
    },
    SUSD: {
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
          name: 'aave',
          enabled: true,
          abi: aToken as Abi,
          address: '0x625aE63000f46200499120B906716420bd059240',
          token: 'aSUSD',
          decimals: 18,
          functions: {

          }
        },
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
          name: 'aave',
          enabled: true,
          abi: aToken as Abi,
          address: '0x4da9b813057d04baef4e5800e36083717b4a0341',
          token: 'aTUSD',
          decimals: 18,
          functions: {

          }
        },
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
    WETH: {
      underlyingToken: 'WETH',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleWETHYield',
        address: '0xC8E6CA6E96a326dC448307A5fDE90a0b21fd7f80',
      },
      autoFarming:['IDLE', 'COMP'],
      protocols: [
        {
          enabled: true,
          abi: cToken as Abi,
          name: 'compound',
          address: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
          token: 'cETH',
          decimals: 28,
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
      ]
    },
    WBTC: {
      underlyingToken: 'WBTC',
      idle: {
        decimals:18,
        abi: IdleTokenV4 as Abi,
        token: 'idleWBTCYield',
        address: '0x8C81121B15197fA0eEaEE1DC75533419DcfD3151',
      },
      autoFarming:['IDLE', 'COMP'],
      protocols: [
        {
          enabled: true,
          token: 'cWBTC',
          abi: cToken as Abi,
          name: 'compound',
          address: '0xccF4429DB6322D5C611ee964527D42E5d685DD6a',
          decimals: 18,
          functions: {
            exchangeRate: {
              name: 'exchangeRateStored',
              params: []
            }
          },
        },
        {
          abi: aToken as Abi,
          name: 'aave',
          enabled: true,
          token: 'aWBTC',
          address: '0xfc4b8ed459e00e5400be803a9bb3954234fd50e3',
          decimals: 18,
          functions: {

          }
        },
        {
          abi: aToken as Abi,
          enabled: true,
          name: 'aavev2',
          token: 'aWBTCv2',
          address: '0x9ff58f4fFB29fA2266Ab25e75e2A8b3503311656',
          decimals: 18,
          functions: {

          }
        }
      ]
    },
    RAI: {
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
  },
  137:{ // Matic Mainnet
    DAI:{
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
  rewardTokens:string[]
  underlyingToken:string
  multiRewards?:MultiReward
  trancheToken:TrancheToken
}

export const gauges: Record<string, GaugeConfig> = {
  stETH:{
    protocol:'lido',
    abi:LiquidityGauge as Abi,
    rewardTokens:['IDLE'],
    underlyingToken:'stETH',
    name: "LiquidityGauge_aa_lido_steth",
    token: "LiquidityGauge_aa_lido_steth",
    address:'0x675eC042325535F6e176638Dd2d4994F645502B9',
    multiRewards:{
      rewardTokens:['LDO'],
      name:'multiRewards_aa_lido_stETH',
      address:'0xA357AF9430e4504419A7A05e217D4A490Ecec6FA',
    },
    trancheToken:{
      name: 'AA_lido_stETH',
      token: 'AA_lido_stETH',
      address: '0x2688fc68c4eac90d9e5e1b94776cf14eade8d877'
    }
  },
  ALUSD3CRV:{
    protocol:'convex',
    abi:LiquidityGauge as Abi,
    rewardTokens:['IDLE'],
    underlyingToken:'ALUSD3CRV',
    name: "LiquidityGauge_aa_convex_alusd3crv",
    token: "LiquidityGauge_aa_convex_alusd3crv",
    address:'0x21dDA17dFF89eF635964cd3910d167d562112f57',
    trancheToken:{
      name: 'AA_convex_alusd3crv',
      token: 'AA_convex_alusd3crv',
      address: '0x790E38D85a364DD03F682f5EcdC88f8FF7299908'
    }
  },
  FRAX3CRV:{
    protocol:'convex',
    abi:LiquidityGauge as Abi,
    rewardTokens:['IDLE'],
    underlyingToken:'FRAX3CRV',
    name: "LiquidityGauge_aa_convex_frax3crv",
    token: "LiquidityGauge_aa_convex_frax3crv",
    address:'0x7ca919Cf060D95B3A51178d9B1BCb1F324c8b693',
    trancheToken:{
      name: 'AA_convex_frax3crv',
      token: 'AA_convex_frax3crv',
      address: '0x15794da4dcf34e674c18bbfaf4a67ff6189690f5'
    }
  },
  MIM3CRV:{
    protocol:'convex',
    abi:LiquidityGauge as Abi,
    rewardTokens:['IDLE'],
    underlyingToken:'MIM3CRV',
    name: "LiquidityGauge_aa_convex_mim3crv",
    token: "LiquidityGauge_aa_convex_mim3crv",
    address:'0x8cC001dd6C9f8370dB99c1e098e13215377Ecb95',
    trancheToken:{
      name: 'AA_convex_mim3crv',
      token: 'AA_convex_mim3crv',
      address: '0xFC96989b3Df087C96C806318436B16e44c697102'
    }
  },
  "3EUR":{
    protocol:'convex',
    abi:LiquidityGauge as Abi,
    rewardTokens:['IDLE'],
    underlyingToken:'3EUR',
    name: "LiquidityGauge_aa_convex_3eur",
    token: "LiquidityGauge_aa_convex_3eur",
    address:'0xDfB27F2fd160166dbeb57AEB022B9EB85EA4611C',
    trancheToken:{
      name: 'AA_convex_3eur',
      token: 'AA_convex_3eur',
      address: '0x158e04225777BBEa34D2762b5Df9eBD695C158D2'
    }
  },
  steCRV:{
    protocol:'convex',
    abi:LiquidityGauge as Abi,
    rewardTokens:['IDLE'],
    underlyingToken:'steCRV',
    name: "LiquidityGauge_aa_convex_steCRV",
    token: "LiquidityGauge_aa_convex_steCRV",
    address:'0x30a047d720f735Ad27ad384Ec77C36A4084dF63E',
    trancheToken:{
      name: 'AA_convex_steCRV',
      token: 'AA_convex_steCRV',
      address: '0x060a53BCfdc0452F35eBd2196c6914e0152379A6'
    }
  },
  MUSD3CRV:{
    protocol:'convex',
    abi:LiquidityGauge as Abi,
    rewardTokens:['IDLE'],
    underlyingToken:'MUSD3CRV',
    name: "LiquidityGauge_aa_convex_musd3crv",
    token: "LiquidityGauge_aa_convex_musd3crv",
    address:'0xAbd5e3888ffB552946Fc61cF4C816A73feAee42E',
    multiRewards:{
      rewardTokens:['MUSD'],
      name:'multiRewards_aa_convex_musd3crv',
      address:'0x7f366a2b4c4380fd9746cf10b4ded562c890b0b1',
    },
    trancheToken:{
      name: 'AA_convex_musd3crv',
      token: 'AA_convex_musd3crv',
      address: '0x4585F56B06D098D4EDBFc5e438b8897105991c6A'
    }
  },
  PBTCCRV:{
    protocol:'convex',
    abi:LiquidityGauge as Abi,
    rewardTokens:['IDLE'],
    underlyingToken:'PBTCCRV',
    name: "LiquidityGauge_aa_convex_pbtccrv",
    token: "LiquidityGauge_aa_convex_pbtccrv",
    address:'0x2bea05307b42707be6cce7a16d700a06ff93a29d',
    multiRewards:{
      rewardTokens:['PNT'],
      name:'multiRewards_aa_convex_pbtccrv',
      address:'0x7d4091D8b28d09b4135905213DE105C45d7F459d',
    },
    trancheToken:{
      name: 'AA_convex_pbtccrv',
      token: 'AA_convex_pbtccrv',
      address: '0x4657B96D587c4d46666C244B40216BEeEA437D0d'
    }
  },
  AGEUR:{
    protocol:'euler',
    abi:LiquidityGauge as Abi,
    rewardTokens:['IDLE'],
    underlyingToken:'AGEUR',
    name: "LiquidityGauge_aa_euler_ageur",
    token: "LiquidityGauge_aa_euler_ageur",
    address:'0x8f195979f7af6c500b4688e492d07036c730c1b2',
    trancheToken:{
      name: 'AA_euler_AGEUR',
      token: 'AA_euler_AGEUR',
      address: '0x624DfE05202b66d871B8b7C0e14AB29fc3a5120c'
    }
  },
  USDC:{
    protocol:'euler',
    abi:LiquidityGauge as Abi,
    rewardTokens:['IDLE'],
    underlyingToken:'USDC',
    name: "LiquidityGauge_aa_euler_usdc",
    token: "LiquidityGauge_aa_euler_usdc",
    address:'0x1cd24f833af78ae877f90569eaec3174d6769995',
    trancheToken:{
      name: 'AA_euler_USDC',
      token: 'AA_euler_USDC',
      address: '0x1e095cbF663491f15cC1bDb5919E701b27dDE90C'
    }
  },
  DAI:{
    protocol:'euler',
    abi:LiquidityGauge as Abi,
    rewardTokens:['IDLE'],
    underlyingToken:'DAI',
    name: "LiquidityGauge_aa_euler_dai",
    token: "LiquidityGauge_aa_euler_dai",
    address:'0x57d59d4bbb0e2432f1698f33d4a47b3c7a9754f3',
    trancheToken:{
      name: 'AA_euler_DAI',
      token: 'AA_euler_DAI',
      address: '0x852c4d2823E98930388b5cE1ed106310b942bD5a'
    }
  },
  USDT:{
    protocol:'euler',
    abi:LiquidityGauge as Abi,
    rewardTokens:['IDLE'],
    underlyingToken:'USDT',
    name: "LiquidityGauge_aa_euler_usdt",
    token: "LiquidityGauge_aa_euler_usdt",
    address:'0x0c3310b0b57b86d376040b755f94a925f39c4320',
    trancheToken:{
      name: 'AA_euler_USDT',
      token: 'AA_euler_USDT',
      address: '0xE0f126236d2a5b13f26e72cBb1D1ff5f297dDa07'
    }
  },
  /*
  mUSD:{
    protocol:'mstable',
    abi:LiquidityGauge as Abi,
    rewardTokens:['IDLE'],
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