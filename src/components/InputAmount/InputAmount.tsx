import React, { useMemo } from 'react'
import { BNify, bnOrZero } from 'helpers/'
import { HStack, Input } from '@chakra-ui/react'
import type { NumberType } from 'constants/types'
import { Amount } from 'components/Amount/Amount'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useAssetProvider } from 'components/AssetProvider/AssetProvider'

type InputAmountArgs = {
  amount?: NumberType
  amountUsd?: NumberType | null
  setAmount: Function
  inputHeight?: number
}

export const InputAmount: React.FC<InputAmountArgs> = ({ inputHeight, amount, amountUsd, setAmount }) => {
  const { asset, underlyingAsset } = useAssetProvider()
  const { selectors: { selectAssetPriceUsd, selectVaultPrice } } = usePortfolioProvider()
  
  const handleAmountChange = ({target: { value }}: { target: {value: string} }) => {
    setAmount(Math.max(0, parseFloat(value)).toString())
  }

  const amountUsdToDisplay = useMemo(() => {
    if (amountUsd) return BNify(amountUsd)
    if (!selectAssetPriceUsd || !selectVaultPrice || !underlyingAsset || !asset) return
    const assetPriceUsd = selectAssetPriceUsd(underlyingAsset.id)
    const vaultPrice = selectVaultPrice(asset.id)

    if (asset.type === 'underlying') {
      return parseFloat(BNify(amount).times(assetPriceUsd).toString()) || 0
    } else {
      return parseFloat(BNify(amount).times(assetPriceUsd).times(vaultPrice).toString()) || 0
    }
  }, [asset, underlyingAsset, amount, amountUsd, selectVaultPrice, selectAssetPriceUsd])

  return (
    <HStack
      width={'100%'}
      justifyContent={'space-between'}
    >
      <Input height={inputHeight} flex={1} type={'number'} placeholder={'0'} variant={'balance'} value={BNify(amount).toString()} onChange={handleAmountChange} />
      {
        amountUsd !== null && (
          <Amount.Usd abbreviateThresold={10000} textStyle={'captionSmall'} color={'brightGreen'} prefix={'≈ $'} value={bnOrZero(amountUsdToDisplay).toString()} />
        )
      }
    </HStack>
  )
}