import { BNify } from 'helpers/'
import React, { useMemo } from 'react'
import { BsStars } from "react-icons/bs"
import { Card } from 'components/Card/Card'
import { useModalProvider } from 'contexts/ModalProvider'
import type { ModalProps, AssetId } from 'constants/types'
import { STAKING_CHAINID, PROTOCOL_TOKEN } from 'constants/vars'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useAssetPageProvider } from 'components/AssetPage/AssetPage'
import { STAKING_FEE_DISCOUNTS } from 'constants/stakingFeeDiscounts'
import { VStack, HStack, Checkbox, TextProps } from '@chakra-ui/react'
import { selectUnderlyingToken } from 'selectors/selectUnderlyingToken'
import { FeeDiscountTable } from 'components/FeeDiscountTable/FeeDiscountTable'

type FeeDiscountTogglerArgs = {
  assetId?: AssetId
}

export const FeeDiscountLink: React.FC<TextProps> = (props) => {
  const { openModal } = useModalProvider()

  const modalProps = {
    cta: 'common.close',
    subtitle: 'feeDiscount.table.header',
    body: (<FeeDiscountTable showHeader={false} />)
  }

  return (
    <Translation translation={'feeDiscount.op.viewDiscountTable'} textStyle={'linkBlue'} textDecoration={'underline'} fontSize={'sm'} {...props} onClick={() => openModal(modalProps as ModalProps, '2xl')} />
  )
}

export const FeeDiscountToggler: React.FC<FeeDiscountTogglerArgs> = ({
  assetId
}) => {
  const { stakingEnabled, toggleStakingEnabled } = useAssetPageProvider()
  const { stakingData, selectors: { selectVaultById, selectAssetById, selectAssetBalance } } = usePortfolioProvider()

  const vault = useMemo(() => {
    if (!assetId || !selectVaultById) return null
    return selectVaultById(assetId)
  }, [assetId, selectVaultById])

  const protocolTokenAsset = useMemo(() => {
    const underlyingToken = selectUnderlyingToken(STAKING_CHAINID, PROTOCOL_TOKEN)
    return underlyingToken ? selectAssetById(underlyingToken?.address) : null
  }, [selectAssetById])

  const feeDiscountEnabled = useMemo(() => {
    return vault && ("flags" in vault) && !!vault.flags?.feeDiscountEnabled
  }, [vault])

  const protocolTokenBalance = useMemo(() => {
    if (!protocolTokenAsset) return BNify(0)
    return selectAssetBalance(protocolTokenAsset.id)
  }, [selectAssetBalance, protocolTokenAsset])

  if (!feeDiscountEnabled) return null

  const discount = Object.values(STAKING_FEE_DISCOUNTS).pop();
  
  /*
  stakingData?.feeDiscount.gt(0) ? (
      <VStack
        spacing={2}
        width={'full'}
        alignItems={'flex-start'}
      >
        <Card.Dark
          p={2}
          border={0}
          alignItems={'center'}
        >
          <HStack
            spacing={1}
            width={'full'}
            justifyContent={'center'}
          >
            <Translation translation={'feeDiscount.op.feeDiscount'} textStyle={'bodyTitle'} params={{discount: bnOrZero(stakingData.feeDiscount)}} isHtml fontSize={'xs'} fontWeight={600} />
            <BsStars size={16} color={'orange'} />
          </HStack>
        </Card.Dark>
        <FeeDiscountLink pl={4} />
      </VStack>
    ) : 
  */

  return (
    <VStack
      spacing={2}
      width={'full'}
      alignItems={'flex-start'}
    >
      {
        stakingData?.feeDiscount.lte(0) && (
          <HStack
            pl={4}
            spacing={1}
          >
            <Translation translation={'defi.feeDiscount'} textStyle={'bodyTitle'} fontSize={'xs'} fontWeight={600} />
            <BsStars size={16} color={'orange'} />
          </HStack>
        )
      }
      <Card.Light
        py={2}
        px={4}
        sx={!stakingEnabled && protocolTokenBalance.gt(0) ? {
          opacity:0.8,
          ':hover':{
            opacity:1
          }
        } : {}}
      >
        <HStack
          spacing={2}
          justifyContent={protocolTokenBalance.gt(0) ? 'flex-start' : 'center'}
        >
          {
            protocolTokenBalance.lte(0) ? (
              <Translation py={1} textAlign={'center'} translation={'feeDiscount.op.ctaNoIDLE'} fontSize={'xs'} color={'primary'} isHtml params={{discount}} />
            ) : (
              <Checkbox size={'md'} isChecked={stakingEnabled} onChange={() => toggleStakingEnabled()}>
                <Translation translation={stakingData?.feeDiscount.gt(0) ? 'feeDiscount.op.ctaIncrease' : 'feeDiscount.op.cta'} fontSize={'xs'} color={'primary'} isHtml params={{discount}} />
              </Checkbox>
            )
          }
        </HStack>
      </Card.Light>
      <FeeDiscountLink pl={4} />
    </VStack>
  )
}