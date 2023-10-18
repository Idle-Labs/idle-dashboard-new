import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import type { AssetId } from 'constants/types'
import { VAULT_LIMIT_MAX } from 'constants/vars'
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

  const underlyingAsset = useMemo(() => {
    return asset && selectAssetById && selectAssetById(asset.underlyingId)
  }, [asset, selectAssetById])

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

  const amountIsValid = useMemo(() => bnOrZero(amountUsd).gt(0), [amountUsd])

  const redeemable = useMemo(() => bnOrZero(asset?.vaultPosition?.underlying.redeemable), [asset])
  const redeemableUsd = useMemo(() => bnOrZero(asset?.vaultPosition?.usd.redeemable), [asset])
  
  const withdrawFee = useMemo(() => {
    if ("flags" in vault && bnOrZero(vault.flags?.withdrawFee).gt(0)){
      return redeemableUsd.times(vault.flags?.withdrawFee)
    }
    return BNify(0)
  }, [vault, redeemableUsd])

  let totalGain = useMemo(() => BigNumber.maximum(0, bnOrZero(asset?.vaultPosition?.usd.earnings).minus(withdrawFee)), [withdrawFee, asset])

  // const earningsPerc = bnOrZero(asset?.vaultPosition?.earningsPercentage)
  const redeemablePercentage = useMemo(() => BigNumber.minimum(1, bnOrZero(amountUsd).div(redeemableUsd)), [amountUsd, redeemableUsd])
  let gain = useMemo(() => BigNumber.minimum(totalGain, redeemablePercentage.times(totalGain)), [totalGain, redeemablePercentage])
  const maxFees = useMemo(() => BigNumber.maximum(0, bnOrZero(asset?.vaultPosition?.usd.earnings).times(asset?.fee)), [asset])
  let fees = useMemo(() => BigNumber.minimum(maxFees, bnOrZero(gain).times(asset?.fee)), [maxFees, gain, asset])

  // Add fee to totalGain and gain for tranches
  if (vault instanceof TrancheVault){
    totalGain = totalGain.plus(fees)
    gain = gain.plus(fees)
  }

  const redeemableAmountIsValid = amountIsValid && bnOrZero(amount).lte(redeemable)
  // console.log('redeemableAmountIsValid', bnOrZero(amountUsd).toString(), redeemable.toString(), redeemableAmountIsValid)

  let textCta = 'cta'
  let dynamicActionField = null

  switch (field){
    case 'boost':
      const apyBoost = newApy && asset?.baseApr?.gt(0) ? newApy.div(asset?.baseApr) : BNify(0)
      dynamicActionField = (<Text {...textProps} textStyle={'titleSmall'} color={'primary'}>{apyBoost.toFixed(2)}x</Text>)
    break;
    case 'overperformance':
      const basePerformance = bnOrZero(amountUsd).times(BNify(asset?.baseApr).div(100))
      const tranchePerformance = bnOrZero(amountUsd).times(BNify(asset?.apy).div(100))
      const overperformance = amountIsValid ? tranchePerformance.minus(basePerformance) : null
      dynamicActionField = (<Amount.Usd textStyle={'titleSmall'} color={'primary'} {...textProps} value={overperformance} suffix={'/year'} />)
    break;
    case 'newApy':
      dynamicActionField = (<Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={newApy} />)
    break;
    case 'totalGain':
      dynamicActionField = (<Amount.Usd decimals={gain.lt(1) ? 4 : 2} textStyle={'titleSmall'} color={'primary'} {...textProps} value={redeemableAmountIsValid ? gain : null} />)
    break;
    case 'fee':
      dynamicActionField = (<Amount.Usd decimals={fees.lt(1) ? 4 : 2} textStyle={'titleSmall'} color={'primary'} {...textProps} value={redeemableAmountIsValid ? -fees : null} />)
    break;
    case 'withdrawFee':
      if (bnOrZero(vault.flags?.withdrawFee).gt(0)){
        textCta = 'orange'
        dynamicActionField = (<Amount.Usd decimals={withdrawFee.lt(1) ? 4 : 2} textStyle={'titleSmall'} color={'orange'} {...textProps} value={redeemableAmountIsValid ? -withdrawFee : null} />)
      }
    break;
    case 'depositLimit':
      textCta = 'orange'
      const remainingAmount = BigNumber.maximum(0, bnOrZero(asset.limit).minus(asset.totalTvl).minus(bnOrZero(amount)))
      dynamicActionField = (<Amount suffix={` ${underlyingAsset.token}`} decimals={2} textStyle={'titleSmall'} color={textCta} {...textProps} value={remainingAmount} />)
    break;
    case 'netGain':
      const netGain = BigNumber.minimum(totalGain.minus(fees), bnOrZero(gain).minus(fees))
      dynamicActionField = (<Amount.Usd decimals={netGain.lt(1) ? 4 : 2} textStyle={'titleSmall'} color={'primary'} {...textProps} value={redeemableAmountIsValid ? netGain : null} />)
    break;
    case 'coverage':
      const bbTranche = selectAssetById(vault?.vaultConfig.Tranches.BB.address)
      const coverageAmount = bbTranche.tvl && newTrancheTvl ? bbTranche.tvl.div(newTrancheTvl).times(100) : 0;
      dynamicActionField = (<Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={coverageAmount} />)
    break;
    case 'stakingPoolShare':
      if (stakingData){
        const stakingPoolShare = bnOrZero(amount).div(stakingData.stkIDLE.totalSupply.plus(bnOrZero(amount))).times(100)
        dynamicActionField = (<Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={stakingPoolShare} />)
      }
    break;
    case 'stkIDLE':
    case 'stkIDLEAfterIncrease':
      dynamicActionField = (<Amount textStyle={'titleSmall'} color={'primary'} suffix={' stkIDLE'} {...textProps} value={amount} />)
    break;
    case 'stakingApy':
      if (stakingData){
        const stakingApy = bnOrZero(stakingPower).times(stakingData.maxApr)
        dynamicActionField = (<Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={stakingApy} />)
      }
    break;
    default:
      return null
  }

  if (!dynamicActionField) return null

  return (
    <HStack
      pb={2}
      px={4}
      width={'100%'}
      alignItems={'center'}
      borderBottom={`1px solid`}
      borderBottomColor={'divider'}
      justifyContent={'space-between'}
    >
      <Translation component={Text} translation={`dynamicActionFields.${field}`} textStyle={'captionSmall'} color={textCta} />
      {dynamicActionField}
    </HStack>
  )
}

export const DynamicActionFields: React.FC<DynamicActionFieldsProps> = (props) => {
  const { selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const { assetId, action } = props

  const asset = useMemo(() => {
    return assetId && selectAssetById && selectAssetById(assetId)
  }, [assetId, selectAssetById])

  const vault = useMemo(() => {
    return assetId && selectVaultById && selectVaultById(assetId)
  }, [assetId, selectVaultById])

  const strategy = useMemo(() => {
    return vault?.type && strategies[vault.type]
  }, [vault])

  const vaultLimitCap = useMemo(() => {
    return bnOrZero(asset?.limit).lt(VAULT_LIMIT_MAX) ? bnOrZero(asset?.limit) : BNify(0)
  }, [asset])

  const limitCapReached = useMemo(() => {
    return vaultLimitCap.gt(0) ? BNify(asset?.totalTvl).gte(vaultLimitCap) : false
  }, [asset, vaultLimitCap])

  const dynamicActionFields = useMemo(() => {
    if (!strategy?.dynamicActionFields?.[action]) return null
    let fields = strategy?.dynamicActionFields[action]

    const showLimitCap = vault && ("flags" in vault) && vault.flags?.showLimitCap

    // Add limit cap
    if (showLimitCap && action === 'deposit' && vaultLimitCap.gt(0) && !limitCapReached) {
      fields = [
        'depositLimit',
        ...fields
      ]
    }
    /*
    // Add withdrawFee
    if (action==='withdraw' && ("flags" in vault) && vault.flags?.withdrawFee && !fields.includes("withdrawFee")){
      fields = [
        ...fields,
        'withdrawFee'
      ]
    }
    */
    return fields
  }, [action, vault, strategy, limitCapReached, vaultLimitCap])
  
  if (!dynamicActionFields) return null

  return (
    <VStack
      spacing={2}
      width={'100%'}
    >
      {
        dynamicActionFields.map( (dynamicField: string) => (
          <DynamicActionField key={`field_${dynamicField}`} {...props} field={dynamicField} />
        ))
      }
    </VStack>
  )
}