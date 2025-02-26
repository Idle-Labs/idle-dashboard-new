import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { BsStars } from 'react-icons/bs'
import { useTranslate } from 'react-polyglot'
import type { AssetId, RewardEmission, VaultContractCdoEpochData } from 'constants/types'
import { DATETIME_FORMAT, SECONDS_IN_YEAR, VAULT_LIMIT_MAX } from 'constants/vars'
import { strategies } from 'constants/strategies'
import { Amount } from 'components/Amount/Amount'
import { TrancheVault } from 'vaults/TrancheVault'
import { useI18nProvider } from 'contexts/I18nProvider'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { TooltipContent } from 'components/TooltipContent/TooltipContent'
import { TextProps, VStack, HStack, Text, Tooltip } from '@chakra-ui/react'
import { BNify, bnOrZero, apr2apy, getFeeDiscount, dateToLocale, toDayjs, secondsToPeriod, fixTokenDecimals, formatDate, sortArrayByKey, getEpochVaultInstantWithdrawEnabled, compoundVaultApr, isEmpty } from 'helpers/'
import { MdArrowForward } from 'react-icons/md'
import { AssetProvider } from 'components/AssetProvider/AssetProvider'
import { TokenAmount } from 'components/TokenAmount/TokenAmount'

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
  const translate = useTranslate()
  const { locale } = useI18nProvider()
  const { vaultsAccountData, stakingData, helpers: { vaultFunctionsHelper }, selectors: { selectAssetById, selectVaultById, selectVaultGauge } } = usePortfolioProvider()

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
      const compoundAprFlag = ("getFlag" in vault) ? vault.getFlag('compoundApr') : undefined
      const compoundApr = compoundAprFlag !== undefined ? vault.getFlag('compoundApr') : true
      const newApy = compoundApr ? apr2apy(bnOrZero(newApr).div(100)).times(100) : bnOrZero(newApr)

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
            const harvestAprCompressionFactor = BNify(asset.tvl).div(newTrancheTvl)
            const newHarvestApr = asset.aprBreakdown[type].times(harvestAprCompressionFactor)
            return total.plus(apr2apy(BNify(newHarvestApr).div(100)).times(100))
          case 'rewards':
            const rewardsAprCompressionFactor = BNify(asset.tvl).div(newTrancheTvl)
            const newRewardsApr = asset.aprBreakdown[type].times(rewardsAprCompressionFactor)
            return total.plus(apr2apy(BNify(newRewardsApr).div(100)).times(100))
          default:
            return total.plus(asset.apyBreakdown[type])
        }
      }, BNify(0)) : BNify(0)
      return BNify(newApy).plus(additionalApy)
    } else {
      return bnOrZero(asset?.apy)
    }

  }, [asset, vault, amount, newTrancheTvl, assetGauge, newApr])
  
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

  const tooltipTranslateKey = useMemo(() => `dynamicActionFields.tooltips.${field}`, [field]) 

  const tooltipText = useMemo(() => {
    return translate(tooltipTranslateKey, {underlying: asset?.epochData?.underlyingToken})
  }, [asset, tooltipTranslateKey, translate])

  const hasTooltip = useMemo(() => {
    return tooltipText !== tooltipTranslateKey
  }, [tooltipText, tooltipTranslateKey])

  const ticketSize = useMemo(() => {
    return vault && "getFlag" in vault ? bnOrZero(vault.getFlag('ticketSize')) : BNify(0)
  }, [vault])

  const rewardsEmissions = useMemo(() => {
    return Object.keys(asset?.rewardsEmissions || []).filter(rewardId => !asset.rewardsEmissions?.[rewardId].apr).map( (rewardId: AssetId) => asset.rewardsEmissions[rewardId] )
  }, [asset])

  const textCta = useMemo(() => {
    switch (field){
      case 'withdrawFee':
        if (bnOrZero(vault.flags?.withdrawFee).gt(0)){
          return 'orange'
        }
        break;
      case 'depositLimit':
        return 'orange'
      default:
        return 'cta'
    }
    return 'cta'
  }, [field, vault])

  const epochData = useMemo(() => asset?.epochData, [asset])

  const lastEpoch = useMemo(() => {
    return epochData && ("epochs" in epochData) && epochData.epochs ? sortArrayByKey(epochData.epochs.filter( (epoch: VaultContractCdoEpochData ) => epoch.status === 'FINISHED' ), 'count', 'desc')[0] : undefined
  }, [epochData])
  
  const dynamicActionField = useMemo(() => {
    const allowInstantWithdraw = getEpochVaultInstantWithdrawEnabled(epochData)
    let textColor = ''

    switch (field){
      case 'boost':
        const apyBoost = newApy && asset?.baseApr?.gt(0) ? newApy.div(asset?.baseApr) : BNify(0)
        return (<Text {...textProps} textStyle={'titleSmall'} color={'primary'}>{apyBoost.gt(9999) ? `>9999` : apyBoost.toFixed(2)}x</Text>)
      case 'epochDuration':
        return (<Text {...textProps} textStyle={'titleSmall'} color={'primary'}>{secondsToPeriod(epochData?.epochDuration || 0)}</Text>)
      case 'epochEnd':
        return (<Text {...textProps} textStyle={'titleSmall'} color={'primary'}>{dateToLocale(epochData?.endDate || 0, locale)}</Text>)
      case 'epochStart':
        return (<Text {...textProps} textStyle={'titleSmall'} color={'primary'}>{dateToLocale(epochData?.startDate || 0, locale)}</Text>)
      case 'epochExpectedInterest':
        const expectedInterest = vault.getNextEpochInterests(epochData, bnOrZero(asset.balance), bnOrZero(asset.vaultPrice), bnOrZero(vaultsAccountData?.maxWithdrawable?.[asset.id]), allowInstantWithdraw, amount)
        return (<Amount suffix={` ${underlyingAsset.token}`} decimals={2} textStyle={'titleSmall'} color={'primary'} {...textProps} value={expectedInterest.times(bnOrZero(asset.vaultPrice))} />)
      case 'epochWithdrawType':
        return (<Translation translation={`assets.status.epoch.${allowInstantWithdraw ? 'instant' : 'standard'}`} {...textProps} textStyle={'titleSmall'} color={allowInstantWithdraw ? 'brightGreen' : 'primary'} />)
      case 'epochClaimPeriod':
        return (<Text {...textProps} textStyle={'titleSmall'} color={'primary'}>{secondsToPeriod(allowInstantWithdraw ? epochData?.instantWithdrawDelay : epochData?.epochDuration)} { allowInstantWithdraw ? translate('assets.assetCards.rewards.afterEpochStart') : '' }</Text>)
      case 'epochClaimDate':
        if (allowInstantWithdraw){
          return (<Text {...textProps} textStyle={'titleSmall'} color={'primary'}>{formatDate(epochData?.instantWithdrawDeadline*1000, DATETIME_FORMAT)}</Text>)
        } else if (epochData?.epochEndDate) {
          return (<Text {...textProps} textStyle={'titleSmall'} color={'primary'}>{formatDate(BNify(epochData.epochEndDate).plus(BNify(epochData.bufferPeriod).plus(epochData.epochDuration).times(1000)).toNumber(), DATETIME_FORMAT)}</Text>)
        } else {
          return (<Text {...textProps} textStyle={'titleSmall'} color={'primary'}>-</Text>)
        }
      case 'epochWithdrawDeadline':
        return (<Text {...textProps} textStyle={'titleSmall'} color={'primary'}>{dateToLocale(epochData?.startDate || 0, locale)}</Text>)
      case 'epochAprChange':
        if (vault.mode === 'STRATEGY' || !lastEpoch){
          return (<AssetProvider.NetApyWithFees textStyle={'titleSmall'} color={'primary'} {...textProps} />)
        }
        const lastGrossApr = BNify(lastEpoch.APRs.GROSS)
        const lastNetApy = compoundVaultApr(lastGrossApr.minus(lastGrossApr.times(bnOrZero(asset?.fee))), asset.epochData?.epochDuration)
        return (
          <HStack>
            <Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} textDecoration={'line-through'} value={lastNetApy} />
            <MdArrowForward size={16} />
            <AssetProvider.NetApyWithFees textStyle={'titleSmall'} color={'brightGreen'} {...textProps} />
          </HStack>
        )
      case 'epochInterestChange':
        return (<Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={fixTokenDecimals(epochData?.lastEpochApr, 18)} />)
      case 'lastEpochApr':
        return (<Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={fixTokenDecimals(epochData?.lastEpochApr, 18)} />)
      case 'lastEpochInterest':
        return (<Amount suffix={` ${underlyingAsset.token}`} textStyle={'titleSmall'} decimals={4} color={'primary'} {...textProps} value={fixTokenDecimals(epochData?.lastEpochInterest, underlyingAsset.decimals)} />)
      case 'riskThreshold':
        return (<Amount.Usd abbreviate={false} decimals={0} textStyle={'titleSmall'} color={'primary'} {...textProps} value={epochData.riskThreshold} />)
      case 'ticketSize':
        textColor = BNify(amount).lte(0) ? 'primary' : ticketSize.gt(0) && BNify(amount).lt(ticketSize) ? 'orange' : 'brightGreen'
        return (<TokenAmount assetId={underlyingAsset?.id} amount={ticketSize} abbreviate={false} decimals={0} showIcon={false} textStyle={'tableCell'} color={textColor} {...textProps} />)
      case 'overperformance':
        const basePerformance = bnOrZero(amountUsd).times(BNify(asset?.baseApr).div(100))
        const tranchePerformance = bnOrZero(amountUsd).times(BNify(asset?.apy).div(100))
        const overperformance = amountIsValid ? tranchePerformance.minus(basePerformance) : null
        return (<Amount.Usd textStyle={'titleSmall'} color={'primary'} {...textProps} value={overperformance} suffix={'/year'} />)
      case 'newApy':
        return (<Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={newApy} />)
      case 'totalGain':
        return (<Amount.Usd decimals={gain.lt(1) ? 4 : 2} textStyle={'titleSmall'} color={'primary'} {...textProps} value={redeemableAmountIsValid ? gain : null} />)
      case 'fee':
        return (<Amount.Usd decimals={fees.lt(1) ? 4 : 2} textStyle={'titleSmall'} color={'primary'} {...textProps} value={redeemableAmountIsValid ? -fees : null} />)
      case 'withdrawFee':
        if (bnOrZero(vault.flags?.withdrawFee).gt(0)){
          return (<Amount.Usd decimals={withdrawFee.lt(1) ? 4 : 2} textStyle={'titleSmall'} color={'orange'} {...textProps} value={redeemableAmountIsValid ? -withdrawFee : null} />)
        }
        break;
      case 'depositLimit':
        const remainingAmount = BigNumber.maximum(0, bnOrZero(asset.limit).minus(asset.totalTvl).minus(bnOrZero(amount)))
        return (<Amount suffix={` ${underlyingAsset.token}`} decimals={2} textStyle={'titleSmall'} color={textCta} {...textProps} value={remainingAmount} />)
      case 'netGain':
        const netGain = BigNumber.minimum(totalGain.minus(fees), bnOrZero(gain).minus(fees))
        return (<Amount.Usd decimals={netGain.lt(1) ? 4 : 2} textStyle={'titleSmall'} color={'primary'} {...textProps} value={redeemableAmountIsValid ? netGain : null} />)
      case 'coverage':
        const bbTranche = selectAssetById(vault?.vaultConfig.Tranches.BB.address)
        const coverageAmount = bbTranche.tvl && newTrancheTvl ? bbTranche.tvl.div(newTrancheTvl).times(100) : 0;
        return (<Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={coverageAmount} />)
      case 'stakingPoolShare':
        if (stakingData){
          const stakingPoolShare = bnOrZero(amount).div(stakingData.stkIDLE.totalSupply.plus(bnOrZero(amount))).times(100)
          return (<Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={stakingPoolShare} />)
        }
        break;
      case 'stkIDLE':
      case 'stkIDLEAfterIncrease':
        return (<Amount textStyle={'titleSmall'} color={'primary'} suffix={' stkIDLE'} {...textProps} value={amount} />)
      case 'currentFeeDiscount':
        const currentFeeDiscount = bnOrZero(stakingData?.feeDiscount)
        textColor = currentFeeDiscount.lte(0) ? 'orange' : 'brightGreen'
        return (<Amount.Percentage color={textColor} textStyle={'titleSmall'} {...textProps} value={currentFeeDiscount} />)
      case 'feeDiscount':
        const feeDiscount = getFeeDiscount(amount)
        textColor = feeDiscount.lte(0) ? 'orange' : 'brightGreen'
        return (<Amount.Percentage color={textColor} textStyle={'titleSmall'} {...textProps} value={feeDiscount} />)
      case 'feeDiscountTier':
        return (<Amount textStyle={'titleSmall'} color={'primary'} {...textProps} value={1} />)
      case 'stakingApy':
        if (stakingData){
          const stakingApy = bnOrZero(stakingPower).times(stakingData.maxApr)
          return (<Amount.Percentage textStyle={'titleSmall'} color={'primary'} {...textProps} value={stakingApy} />)
        }
        break;
      case 'rewardsEmissions':
        if (!rewardsEmissions?.length){
          return
        }
        return (
          <VStack
            spacing={2}
            width={'full'}
            alignItems={'flex-end'}
          >
            {
              rewardsEmissions.map( rewardEmission => {
                const rewardAsset = selectAssetById(rewardEmission.assetId)
                const dailyRewardsOn1000Usd = bnOrZero(rewardEmission.annualDistributionOn1000Usd).times(bnOrZero(amountUsd)).div(1000).div(365)
                return (
                  <TokenAmount key={rewardEmission.assetId} assetId={rewardEmission.assetId} size={'xs'} abbreviate={true} showName={false} amount={dailyRewardsOn1000Usd} suffix={` ${rewardAsset.token} / day`} textStyle={'titleSmall'} color={'primary'} {...textProps} />
                )
              })
            }
          </VStack>
        )
      default:
        return
    }
  }, [field, rewardsEmissions, vaultsAccountData, ticketSize, lastEpoch, epochData, amount, textCta, textProps, asset, locale, amountIsValid, amountUsd, fees, gain, newApy, newTrancheTvl, redeemableAmountIsValid, selectAssetById, stakingData, stakingPower, totalGain, translate, underlyingAsset, vault, withdrawFee])


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
      <HStack
        spacing={2}
        alignItems={'center'}
      >
        <Tooltip
          hasArrow
          placement={'top'}
          label={tooltipText}
          isDisabled={!hasTooltip}
        >
          <TooltipContent>
            <Translation
              component={Text}
              color={textCta}
              textStyle={'captionSmall'}
              translation={`dynamicActionFields.${field}`}
              borderBottomColor={hasTooltip ? 'cta' : 'none'}
              borderBottom={hasTooltip ? '1px dashed' : 'none'}
            />
          </TooltipContent>
        </Tooltip>
        {
          ['feeDiscount', 'currentFeeDiscount'].includes(field) && (
            <BsStars size={16} color={'orange'} />
          )
        }
      </HStack>
      {dynamicActionField}
    </HStack>
  )
}

export const DynamicActionFields: React.FC<DynamicActionFieldsProps> = (props) => {
  const { stakingData, selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

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

  const minTicketSize = useMemo(() => {
    return vault && "getFlag" in vault ? bnOrZero(vault.getFlag('ticketSize')) : BNify(0)
  }, [vault])

  const limitCapReached = useMemo(() => {
    return vaultLimitCap.gt(0) ? BNify(asset?.totalTvl).gte(vaultLimitCap) : false
  }, [asset, vaultLimitCap])

  const rewardsEmissions = useMemo(() => {
    return Object.keys(asset?.rewardsEmissions || []).filter(rewardId => !asset.rewardsEmissions?.[rewardId].apr).map( (rewardId: AssetId) => asset.rewardsEmissions[rewardId] )
  }, [asset])

  const dynamicActionFields = useMemo(() => {
    if (!strategy?.dynamicActionFields?.[action]) return null
    let fields = strategy?.dynamicActionFields[action]

    // Add epoch end
    if (action === 'deposit' && asset?.epochData) {
      // Epoch started
      if (toDayjs(asset.epochData.startDate).isBefore(Date.now())) {
        fields = [
          'riskThreshold',
          'epochEnd',
          ...fields
        ]
      } else if (toDayjs(asset.epochData.startDate).isAfter(Date.now())) {
        fields = [
          'riskThreshold',
          'epochStart',
          ...fields
        ]
      }
    }

    // Add reward emissions
    if (action === 'deposit' && rewardsEmissions?.length){
      fields = [
        ...fields,
        'rewardsEmissions'
      ]
    }

    const showLimitCap = vault && ("flags" in vault) && vault.flags?.showLimitCap
    const showFeeDiscount = vault && ("flags" in vault) && vault.flags?.feeDiscountEnabled && bnOrZero(stakingData?.feeDiscount).gt(0)

    // Add limit cap
    if (showLimitCap && action === 'deposit' && vaultLimitCap.gt(0) && !limitCapReached) {
      fields = [
        'depositLimit',
        ...fields
      ]
    }

    // Add min investment
    if (action === 'deposit' && minTicketSize.gt(0)) {
      fields = [
        'ticketSize',
        ...fields
      ]
    }

    // Add fee discount
    if (showFeeDiscount && action === 'deposit' && fields.indexOf('currentFeeDiscount') === -1) {
      fields = [
        ...fields,
        'currentFeeDiscount'
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
  }, [action, vault, asset, strategy, minTicketSize, rewardsEmissions, limitCapReached, stakingData, vaultLimitCap])
  
  if (!dynamicActionFields) return null

  return (
    <VStack
      spacing={2}
      width={'full'}
    >
      {
        dynamicActionFields.map( (dynamicField: string) => (
          <DynamicActionField key={`field_${dynamicField}`} {...props} field={dynamicField} />
        ))
      }
    </VStack>
  )
}