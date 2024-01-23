import type { Vault } from 'vaults/'

export function getVaultFlag(vault: Vault, flag: string): any {
  if (vault && "flags" in vault) return vault.flags?.[flag]
  return null
}