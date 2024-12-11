import { CreditVaultEpoch } from "constants/";
import type { Vault } from "vaults/";
import { BNify, normalizeTokenAmount, sortArrayByKey } from "./utilities";

export function getVaultFlag(vault: Vault, flag: string): any {
  if (vault && "flags" in vault) return vault.flags?.[flag];
  return null;
}

export function getEpochVaultInstantWithdrawEnabled(
  epochData?: CreditVaultEpoch | null
): boolean {
  if (!epochData || epochData.disableInstantWithdraw) {
    return false;
  }

  const epochGrossAPR = BNify(epochData.grossEpochApr);

  return BNify(epochData.lastEpochApr)
    .minus(epochData.instantWithdrawAprDelta)
    .gt(epochGrossAPR);
}
