import type { RewardSenders } from 'constants/types'
import { IDLE_MULTISIG_MAINNET, IDLE_MULTISIG_OPTIMISM, DISPERSE_APP_OPTIMISM_RWA, DISPERSE_APP_OPTIMISM, DISPERSE_APP_MAINNET } from 'constants/addresses'

export const rewardsSenders: Record<number, RewardSenders> = {
  10: {
    [DISPERSE_APP_OPTIMISM]: {},
    [IDLE_MULTISIG_OPTIMISM]: {}
  }
}

export const rewardsSendersRwa: Record<number, RewardSenders> = {
  10: {
    [DISPERSE_APP_OPTIMISM]: {
      startBlock: 119519917
    },
    [IDLE_MULTISIG_OPTIMISM]: {
      startBlock: 119519916,
      endBlock: 119519916
    }
  }
}

export const distributedFeesSenders: Record<number, RewardSenders> = {
  1: {
    [IDLE_MULTISIG_MAINNET]:{},
    [DISPERSE_APP_MAINNET]:{}
  }
}