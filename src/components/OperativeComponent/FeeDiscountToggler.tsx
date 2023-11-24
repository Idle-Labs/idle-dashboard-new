import React, { useMemo } from 'react'
import { BsStars } from "react-icons/bs"
import { Card } from 'components/Card/Card'
import { useModalProvider } from 'contexts/ModalProvider'
import type { ModalProps, AssetId } from 'constants/types'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useAssetPageProvider } from 'components/AssetPage/AssetPage'
import { STAKING_FEE_DISCOUNTS } from 'constants/stakingFeeDiscounts'
import { VStack, HStack, Checkbox, TextProps } from '@chakra-ui/react'
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
  const { selectors: { selectVaultById } } = usePortfolioProvider()
  const { stakingEnabled, toggleStakingEnabled } = useAssetPageProvider()

  const vault = useMemo(() => {
    if (!assetId || !selectVaultById) return null
    return selectVaultById(assetId)
  }, [assetId, selectVaultById])

  const feeDiscountEnabled = useMemo(() => {
    return vault && ("flags" in vault) && !!vault.flags?.feeDiscountEnabled
  }, [vault])

  if (!feeDiscountEnabled) return null

  const discount = Object.values(STAKING_FEE_DISCOUNTS).pop();

  return (
    <VStack
      spacing={2}
      width={'full'}
      alignItems={'flex-start'}
    >
      <HStack
        pl={4}
        spacing={1}
      >
        <Translation translation={'common.new'} textStyle={'bodyTitle'} fontSize={'xs'} fontWeight={600} />
        <BsStars size={16} color={'orange'} />
      </HStack>
      <Card.Light
        py={2}
        px={4}
        sx={!stakingEnabled ? {
          opacity:0.8,
          ':hover':{
            opacity:1
          }
        } : {}}
      >
        <HStack
          spacing={2}
          alignItems={'flex-start'}
        >
          <Checkbox size={'md'} isChecked={stakingEnabled} onChange={() => toggleStakingEnabled()}>
            <Translation translation={'feeDiscount.op.cta'} fontSize={'xs'} color={'primary'} isHtml params={{discount}} />
          </Checkbox>
        </HStack>
      </Card.Light>
      <FeeDiscountLink pl={4} />
    </VStack>
  )
}