import { GaugeVault } from './GaugeVault'
import { TrancheVault } from './TrancheVault'
import { BestYieldVault } from './BestYieldVault'
import { StakedIdleVault } from './StakedIdleVault'
import { UnderlyingToken } from './UnderlyingToken'

export type Vault = TrancheVault | BestYieldVault | UnderlyingToken | GaugeVault | StakedIdleVault