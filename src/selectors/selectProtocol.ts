import { protocols, Protocol } from 'constants/protocols'

export function selectProtocol(protocol: string): Protocol | undefined {
  return protocols[protocol.toLowerCase()]
}