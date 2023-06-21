import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import type { AssetId } from 'constants/types'
import { strategies } from 'constants/strategies'
import { Amount } from 'components/Amount/Amount'
import { TrancheVault } from 'vaults/TrancheVault'
import { BNify, bnOrZero, apr2apy } from 'helpers/'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { TextProps, VStack, HStack, Text } from '@chakra-ui/react'

type DynamicActionFieldsProps = {
  action: string
  amount: BigNumber | string
  stakingPower?: BigNumber | number
  amountUsd: BigNumber | string | number
  assetId: AssetId | undefined
}

type DynamicActionFieldProps = {
  field: string
} & TextProps & DynamicActionFieldsProps

const DynamicActionField: React.FC<DynamicActionFieldProps> = ({ assetId, field, amount, amountUsd, stakingPower, ...textProps }) => {
  const { stakingData, helpers: { vaultFunctionsHelper }, selectors: { selectAssetById, selectVaultById, selectVaultGauge } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return assetId && selectAssetById && selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const vault = useMemo(() => {
    return assetId && selectVaultById && selectVaultById(assetId)
  }, [assetId, selectVaultById])

  const vaultGauge = useMemo(() => {
    return assetId && selectVaultGauge && selectVaultGauge(assetId)
  }, [assetId, selectVaultGauge])

  const assetGauge = useMemo(() => {
    return vaultGauge && selectAssetById && selectAssetById(vaultGauge.id)
  }, [vaultGauge, selectAssetById])

  const newTrancheTvl = useMemo(() => BNify(asset.tvl).plus(bnOrZero(amount)), [asset, amount])
  // const newTotalTvl = useMemo(() => BNify(asset.totalTvl).plus(bnOrZero(amount)), [asset, amount])
  
  const newApr = useMemo(() => {
    return vaultFunctionsHelper?.getVaultNewApr(asset, vault, BNify(amount))
  }, [asset, vault, amount, vaultFunctionsHelper])

  // Calculate the new APY using the apy breakdown (dilute Gauge and Harest APY based on new TVL)
  const newApy = useMemo(() => {
    if (bnOrZero(newApr).gt(0)){
        const newApy = apr2apy(bnOrZero(newApr).div(100)).times(100)
        const additionalApy = asset.apyBreakdown ? (Object.keys(asset.apyBreakdown || {}) as string[]).filter( (type: string) => type !== 'base' ).reduce( (total: BigNumber, type: string) => {
          switch (type){
            case 'gauge':
              const gaugeData = assetGauge?.gaugeData
              if (gaugeData){
                const gaugeNewTotalSupply = bnOrZero(gaugeData?.totalSupply).plus(bnOrZero(amount))
                const gaugeApyCompressionFactor = bnOrZero(gaugeData?.totalSupply).div(gaugeNewTotalSupply)
                const newGaugeApy = asset.apyBreakdown[type].times(gaugeApyCompressionFactor)
                return total.plus(newGaugeApy)
              }
              return total.plus(asset.apyBreakdown[type])
            case 'harvest':
              const harvestApyCompressionFactor = BNify(asset.tvl).div(newTrancheTvl)
              const newHarvestApy = asset.apyBreakdown[type].times(harvestApyCompressionFactor)
              return total.plus(newHarvestApy)
            default:
              return total.plus(asset.apyBreakdown[type])
          }
        }, BNify(0)) : BNify(0)
        return BNify(newApy).plus(additionalApy)
    } else {
      return bnOrZero(asset?.apy)
    }

  }, [asset, amount, newTrancheTvl, assetGauge, newApr])
  
  // console.log('newApy', amount, asset, newApr.toString(), BNify(asset.additionalApr).toString(), newApy.toString())

  const amountIsValid = bnOrZero(amountUsd).gt(0)

  const redeemable = bnOrZero(asset?.vaultPosition?.underlying.redeemable)
  const redeemableUsd = bnOrZero(asset?.vaultPosition?.usd.redeemable)
  let totalGain = BigNumber.maximum(0, bnOrZero(asset?.vaultPosition?.usd.earnings))

  // const earningsPerc = bnOrZero(asset?.vaultPosition?.earningsPercentage)
  const redeemablePercentage = BigNumber.minimum(1, bnOrZero(amountUsd).div(redeemableUsd))
  let gain = BigNumber.minimum(totalGain, redeemablePercentage.times(totalGain))
  const maxFees = BigNumber.maximum(0, bnOrZero(asset?.vaultPosition?.usd.earnings).times(asset?.fee))
  let fees = BigNumber.minimum(maxFees, bnOrZero(gain).times(asset?.fee))

  // Add fee to totalGain and gain for tranches
  if (vault instanceof TrancheVault){
    totalGain = totalGain.plus(fees)
    gain = gain.plus(fees)
  }

  const redeemableAmountIsValid = amountIsValid && bnOrZero(amount).lte(redeemable)
  // console.log('redeemableAmountIsValid', bnOrZero(amountUsd).toString(), redeemable.toString(), redeemableAmountIsValid)

  switch (field){
    case 'boost':
      const apyBoost = newApy && asset?.baseApr?.gt(0) ? newApy.div(asset?.baseApr) : BNify(0)
      return <Text {...textProps} textStyle={'titleSmall'} color={'primary'}>{apyBoost.toFixed(2)}x</Text>
    case 'overperformance':
      const basePerformance = bnOrZero(amountUsd).times(BNify(asset?.baseApr).div(100))
      const tranchePerformance = bnOrZero(amountUsd).times(BNify(asset?.apy).div(100))
      const overperformance = amountIsValid ? tranchePerformance.minus(basePerformance) : null
      return <Amount.Usd textStyle={'titleSmall'} color={'primary'} {...textProps} value={overperformance} suffix={'/year'} />
    case 'newApy':
      return <Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={newApy} />
    case 'totalGain':
      return <Amount.Usd textStyle={'titleSmall'} color={'primary'} {...textProps} value={redeemableAmountIsValid ? gain : null} />
    case 'fee':
      return <Amount.Usd textStyle={'titleSmall'} color={'primary'} {...textProps} value={redeemableAmountIsValid ? fees : null} />
    case 'netGain':
      const netGain = BigNumber.minimum(totalGain.minus(fees), bnOrZero(gain).minus(fees))
      return <Amount.Usd textStyle={'titleSmall'} color={'primary'} {...textProps} value={redeemableAmountIsValid ? netGain : null} />
    case 'coverage':
      const bbTranche = selectAssetById(vault?.vaultConfig.Tranches.BB.address)
      const coverageAmount = bbTranche.tvl && newTrancheTvl ? bbTranche.tvl.div(newTrancheTvl).times(100) : 0;
      return <Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={coverageAmount} />
    case 'stakingPoolShare':
      if (!stakingData) return null
      const stakingPoolShare = bnOrZero(amount).div(stakingData.stkIDLE.totalSupply.plus(bnOrZero(amount))).times(100)
      return <Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={stakingPoolShare} />
    case 'stkIDLE':
    case 'stkIDLEAfterIncrease':
      return <Amount textStyle={'titleSmall'} color={'primary'} suffix={' stkIDLE'} {...textProps} value={amount} />
    case 'stakingApy':
      if (!stakingData) return null
      const stakingApy = bnOrZero(stakingPower).times(stakingData.maxApr)
      return <Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={stakingApy} />
    default:
      return null
  }
}

export const DynamicActionFields: React.FC<DynamicActionFieldsProps> = (props) => {
  const { selectors: { selectVaultById } } = usePortfolioProvider()

  const { assetId, action } = props

  const vault = useMemo(() => {
    return assetId && selectVaultById && selectVaultById(assetId)
  }, [assetId, selectVaultById])

  const strategy = useMemo(() => {
    return vault?.type && strategies[vault.type]
  }, [vault])

  if (!strategy?.dynamicActionFields?.[action]) return null

  const dynamicActionFields = strategy?.dynamicActionFields[action]

  return (
    <VStack
      spacing={2}
      width={'100%'}
    >
      {
        dynamicActionFields.map( (dynamicField: string) => (
          <HStack
            pb={2}
            px={4}
            width={'100%'}
            alignItems={'center'}
            borderBottom={`1px solid`}
            borderBottomColor={'divider'}
            justifyContent={'space-between'}
            key={`dynamicField_${dynamicField}`}
          >
            <Translation component={Text} translation={`dynamicActionFields.${dynamicField}`} textStyle={'captionSmall'} />
            <DynamicActionField {...props} field={dynamicField} />
          </HStack>
        ))
      }
    </VStack>
  )
}