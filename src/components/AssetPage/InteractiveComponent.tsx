import type { AssetId } from 'constants/types'
import React, { useMemo, useState } from 'react'
import { MdKeyboardArrowLeft } from 'react-icons/md'
import { useThemeProvider } from 'contexts/ThemeProvider'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { HStack, VStack, Button, Flex, Text } from '@chakra-ui/react'
import { TransactionList } from 'components/TransactionList/TransactionList'
import { OperativeComponent, OperativeComponentAction } from 'components/OperativeComponent/OperativeComponent'

type InteractiveComponentArgs = {
  vaultId?: AssetId
  assetId?: AssetId
  actions: OperativeComponentAction[]
}

export const InteractiveComponent: React.FC<InteractiveComponentArgs> = ({ assetId, vaultId, actions }) => {
  const { isMobile } = useThemeProvider()
  const [ showDeposit, setShowDeposit ] = useState<boolean>(false)
  const { selectors: { selectAssetById } } = usePortfolioProvider()
  const [ showTransactions, setShowTransactions ] = useState<boolean>(false)

  return (
    <>
      <VStack
        left={0}
        zIndex={40}
        spacing={[0, 6]}
        id={'right-side'}
        width={['100vw', '27em']}
        height={['100vh', 'auto']}
        position={['fixed', 'relative']}
        top={[showDeposit ? 0 : '100vh', 0]}
        bg={isMobile ? 'rgba(0, 0, 0, 0.5)' : undefined}
        sx={isMobile ? {transition:'top 0.3s ease-in-out'} : {}}
      >
        <VStack
          bottom={0}
          spacing={0}
          width={'100%'}
          height={['100vh', 'auto']}
          position={['fixed', 'relative']}
          top={[showDeposit ? 0 : '100vh', 0]}
          sx={isMobile ? {transition:'top 0.3s ease-in-out'} : {}}
        >
          {
            isMobile && (
              <HStack
                px={4}
                py={2}
                bg={'card.bg'}
                width={'100%'}
                borderBottom={'1px solid'}
                borderBottomColor={'divider'}
                justifyContent={'space-between'}
              >
                <Translation alignItems={'center'} display={'flex'} variant={'unstyled'} translation={'common.exit'} component={Button} leftIcon={<MdKeyboardArrowLeft size={24} />} onClick={() => setShowDeposit(false)} />
                <Translation alignItems={'center'} display={'flex'} variant={'unstyled'} translation={['common.show', 'navBar.transactions']} component={Button} onClick={() => setShowTransactions(true)} />
              </HStack>
            )
          }
          <OperativeComponent flex={1} minHeight={isMobile ? 'auto' : '590px'} borderRadius={isMobile ? 0 : undefined} assetId={assetId} actions={actions} />
        </VStack>
        <VStack
          flex={1}
          bottom={0}
          spacing={0}
          width={'100%'}
          height={['100vh', 'auto']}
          position={['fixed', 'relative']}
          top={[showTransactions ? 0 : '100vh', 0]}
          sx={isMobile ? {transition:'top 0.3s ease-in-out'} : {}}
        >
          {
            isMobile && (
              <HStack
                px={4}
                py={2}
                bg={'card.bg'}
                width={'100%'}
                borderBottom={'1px solid'}
                borderBottomColor={'divider'}
                justifyContent={'space-between'}
              >
                <Translation alignItems={'center'} display={'flex'} variant={'unstyled'} translation={'common.back'} component={Button} leftIcon={<MdKeyboardArrowLeft size={24} />} onClick={() => setShowTransactions(false)} />
                <Translation textStyle={'ctaStatic'} translation={'assets.assetDetails.assetHistory.transactionHistory'} component={Text} />
              </HStack>
            )
          }
          <TransactionList assetIds={[vaultId as AssetId]} fullHeightOnMobile={true} maxH={['100%', 600]} />
        </VStack>
      </VStack>
      {
        isMobile && (
          <Flex
            p={4}
            left={0}
            bottom={0}
            border={0}
            zIndex={30}
            width={'100%'}
            bg={'card.bgDark'}
            position={'fixed'}
          >
            <Translation component={Button} translation={['common.start', 'common.deposit']} variant={'ctaFull'} onClick={() => setShowDeposit(true)} />
          </Flex>
        )
      }
    </>
  )
}