import { useMemo } from 'react'
import { Card } from 'components/Card/Card'
import { Stack, Image } from '@chakra-ui/react'
import { TrancheVault } from 'vaults/TrancheVault'
import { BestYieldVault } from 'vaults/BestYieldVault'
import { Translation } from 'components/Translation/Translation'
import { useBrowserRouter } from 'contexts/BrowserRouterProvider'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'

export const EulerHackBanner: React.FC = () => {
  const { params } = useBrowserRouter()
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(params.asset)
  }, [selectAssetById, params.asset])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(params.asset)
  }, [selectVaultById, params.asset])

  if (!asset || !vault) return null

  // Check BY
  if (vault instanceof BestYieldVault){
    if (!("tokenConfig" in vault) || !vault.tokenConfig?.protocols.find( p => p.name === 'euler') || asset?.status !== 'paused') return null
  }

  // Check Tranche
  if (vault instanceof TrancheVault){
    if (asset?.protocol !== 'euler' || asset?.status !== 'paused') return null
  }

  return (
    <Card.Dark
      p={[3, 5]}
      borderColor={'yellow'}
    >
      <Stack
        width={'full'}
        spacing={[2, 3]}
        alignItems={'center'}
        justifyContent={'center'}
        direction={['column','row']}
      >
        <Image src={`images/vaults/deprecated.png`} width={6} />
        <Translation textAlign={'center'} translation={'announcements.eulerHack'} isHtml={true} textStyle={'caption'} />
        <Image display={['none', 'block']} src={`images/vaults/deprecated.png`} width={6} />
      </Stack>
    </Card.Dark>
  )
}