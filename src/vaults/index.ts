import { GaugeVault } from "./GaugeVault";
import { CreditVault } from "./CreditVault";
import { TrancheVault } from "./TrancheVault";
import { BestYieldVault } from "./BestYieldVault";
import { StakedIdleVault } from "./StakedIdleVault";
import { UnderlyingToken } from "./UnderlyingToken";

export type Vault =
  | CreditVault
  | TrancheVault
  | BestYieldVault
  | UnderlyingToken
  | GaugeVault
  | StakedIdleVault;
