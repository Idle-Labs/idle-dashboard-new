import './progress.css'
import { getRoutePath } from 'helpers/'
import React, { useState } from 'react'
import { HStack } from '@chakra-ui/react'
import type { Vault } from 'constants/types'
import { useNavigate } from 'react-router-dom'
import { strategies } from 'constants/strategies'
import { VaultCard } from 'components/VaultCard/VaultCard'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'

export const VaultsCarousel: React.FC = () => {
  const navigate = useNavigate()
  const { vaults } = usePortfolioProvider()
  const [ animationState, setAnimationState ] = useState<string>('running')

  return (
    <HStack
      left={0}
      spacing={2}
      width={'100%'}
      overflow={'hidden'}
      position={'absolute'}
      top={['90px', '110px']}
      onMouseOut={() => setAnimationState('running')}
      onMouseOver={() => setAnimationState('paused')}
    >
      <HStack
        spacing={2}
        position={'relative'}
        sx={{
          animationDuration: '120s',
          animationFillMode: 'backwards',
          animationTimingFunction: 'linear',
          animationPlayState: animationState,
          animationIterationCount: 'infinite',
          animationName: 'vaults-carousel-progress',
        }}
      >
        {
          vaults.map( (vault: Vault) => {
            const strategy = strategies[vault.type]
            if (!strategy || !strategy.route) return null
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
    </HStack>
  )
}