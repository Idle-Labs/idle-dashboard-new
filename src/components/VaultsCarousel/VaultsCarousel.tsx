import './progress.css'
import React from 'react'
import Marquee from "react-fast-marquee"
import { HStack } from '@chakra-ui/react'
import type { Vault } from 'constants/types'
import { useNavigate } from 'react-router-dom'
import { strategies } from 'constants/strategies'
import { getRoutePath/*, bnOrZero*/ } from 'helpers/'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { VaultCard } from 'components/VaultCard/VaultCard'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'

export const VaultsCarousel: React.FC = () => {
  const navigate = useNavigate()
  const { isMobile } = useThemeProvider()
  const { vaults, isPortfolioLoaded/*, selectors: { selectAssetById }*/ } = usePortfolioProvider()

  if (!isPortfolioLoaded) return null

  return (
    <HStack
      left={0}
      zIndex={1}
      spacing={2}
      width={'100%'}
      overflow={'hidden'}
      position={'absolute'}
      top={['90px', '110px']}
    >
      <Marquee
        gradient={false}
        pauseOnHover={true}
        speed={isMobile ? 40 : 50}
      >
        <HStack
          ml={2}
          spacing={2}
        >
          {
            vaults.map( (vault: Vault) => {
              const strategy = strategies[vault.type]
              if (!strategy || !strategy.route) return null
              // const asset = selectAssetById(vault.id)
              // if (!asset || bnOrZero(asset.apr).lte(0)) return null
              const strategyPath = getRoutePath('earn', [strategy.route])
              return (
                <VaultCard.Inline
                  key={`vault_${vault.id}`}
                  onClick={() => navigate(`${strategyPath}/${vault.id}`)}
                  assetId={`${vault.id}`}
                  fields={[
                    {
                      label:'defi.tvl',
                      field:'tvl'
                    },
                    {
                      label:'defi.apy',
                      field:'apy',
                      props:{
                        color: strategy.color
                      }
                    }
                  ]}
                />
              )
            })
          }
        </HStack>
      </Marquee>
    </HStack>
  )
}