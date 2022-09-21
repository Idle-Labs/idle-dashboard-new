import { underlyingTokens, UnderlyingTokenConfig } from '../constants'

export function selectUnderlyingToken(chainId: number, token: string): UnderlyingTokenConfig | undefined{
  return underlyingTokens[chainId][token.toUpperCase()];
}

export function selectUnderlyingTokenByAddress(chainId: number, address: string): UnderlyingTokenConfig | undefined{
  return Object.values(underlyingTokens[chainId]).find( tokenConfig => tokenConfig.address?.toLowerCase() === address.toLowerCase() );
}