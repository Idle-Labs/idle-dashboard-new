import { Address } from 'constants/types'
import { IDLE_MULTISIG_MAINNET, IDLE_MULTISIG_OPTIMISM, DISPERSE_APP_OPTIMISM, DISPERSE_APP_MAINNET } from 'constants/addresses'

export const rewardsSenders: Record<number, Address[]> = {
  10: [
    DISPERSE_APP_OPTIMISM,
    IDLE_MULTISIG_OPTIMISM
  ]
}

export const distributedFeesSenders: Record<number, Address[]> = {
  1: [
    IDLE_MULTISIG_MAINNET,
    DISPERSE_APP_MAINNET
    // '0x0000000000000000000000000000000000000000' // TEST
  ]
}