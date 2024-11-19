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

  const lastEpoch =
    "epochs" in epochData && !!epochData.epochs?.length
      ? sortArrayByKey(epochData.epochs, "count", "desc")[0]
      : undefined;

  const epochApr = !BNify(epochData.epochApr).isNaN()
    ? epochData.epochApr
    : normalizeTokenAmount(lastEpoch?.APRs.GROSS || 0, 18);

  return BNify(epochData.lastEpochApr)
    .minus(epochData.instantWithdrawAprDelta)
    .gt(epochApr);
}
