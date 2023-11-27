import { Address } from 'constants/types'
import { IDLE_MULTISIG_MAINNET, IDLE_MULTISIG_OPTIMISM, DISPERSE_APP_OPTIMISM } from 'constants/addresses'

export const rewardsSenders: Record<number, string[]> = {
  10: [
    DISPERSE_APP_OPTIMISM,
    IDLE_MULTISIG_OPTIMISM
  ]
}

export const distributedFeesSenders: Record<number, string[]> = {
  1: [
    IDLE_MULTISIG_MAINNET,
    '0x34dcd573c5de4672c8248cd12a99f875ca112ad8' // TEST
  ]
}