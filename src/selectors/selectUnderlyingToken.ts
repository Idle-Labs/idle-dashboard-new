import { underlyingTokens, UnderlyingTokenProps } from 'constants/'

export function selectUnderlyingToken(chainId: number, token: string | undefined): UnderlyingTokenProps | undefined {
  if (!token) return
  return underlyingTokens && underlyingTokens[chainId][token.toUpperCase()];
}

export function selectUnderlyingTokenByAddress(chainId: number, address: string): UnderlyingTokenProps | undefined {
  return underlyingTokens && Object.values(underlyingTokens[chainId]).find( tokenConfig => tokenConfig.address?.toLowerCase() === address.toLowerCase() );
}