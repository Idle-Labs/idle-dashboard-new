import { StakedIdleVault } from 'vaults/StakedIdleVault'
import { MdLockClock, MdLockOpen } from 'react-icons/md'
import { useWalletProvider } from 'contexts/WalletProvider'
import React, { useMemo, useCallback, useEffect } from 'react'
import { VStack, Text, Button, Center } from '@chakra-ui/react'
import { Translation } from 'components/Translation/Translation'
import { usePortfolioProvider } from 'contexts/PortfolioProvider'
import { useTransactionManager } from 'contexts/TransactionManagerProvider'
import { EstimatedGasFees } from 'components/OperativeComponent/EstimatedGasFees'
import { useOperativeComponent, ActionComponentArgs } from './OperativeComponent'
import { SwitchNetworkButton } from 'components/SwitchNetworkButton/SwitchNetworkButton'
import { ConnectWalletButton } from 'components/ConnectWalletButton/ConnectWalletButton'
import { AssetProvider, useAssetProvider } from 'components/AssetProvider/AssetProvider'
import { BNify, estimateGasLimit, bnOrZero, toDayjs, formatDate, abbreviateNumber } from 'helpers/'

export const Unstake: React.FC<ActionComponentArgs> = ({ itemIndex, chainIds=[] }) => {
  const { asset, vault } = useAssetProvider()
  const { account, checkChainEnabled } = useWalletProvider()
  const { dispatch, activeItem, setActionIndex } = useOperativeComponent()
  const { stakingData, selectors: { selectVaultPrice } } = usePortfolioProvider()
  const { sendTransaction, setGasLimit, state: { block } } = useTransactionManager()

  const isChainEnabled = useMemo(() => checkChainEnabled(chainIds), [chainIds, checkChainEnabled])

  const amount = useMemo(() => {
    return bnOrZero(stakingData?.position?.deposited)
  }, [stakingData])

  const lockExpired = useMemo(() => {
    if (!stakingData?.position?.lockEnd || !block) return false
    // console.log('lockExpired', stakingData?.position?.lockEnd, block)
    return toDayjs(stakingData?.position?.lockEnd).isSameOrBefore(toDayjs(block.timestamp*1000))
  }, [stakingData, block])

  const lockEndDate = useMemo(() => {
    if (!stakingData?.position?.lockEnd) return null
    return formatDate(stakingData?.position?.lockEnd, 'YYYY-MM-DD HH:mm', true)
  }, [stakingData])

  // Withdraw
  const withdraw = useCallback(() => {
    if (!account || !lockExpired) return
    if (!vault || !("getWithdrawContractSendMethod" in vault) || !("getWithdrawParams" in vault) || !(vault instanceof StakedIdleVault)) return

    ;(async() => {
      const withdrawParams = vault.getWithdrawParams()
      const withdrawContractSendMethod = vault.getWithdrawContractSendMethod(withdrawParams)
      // console.log('withdrawParams', withdrawParams, withdrawContractSendMethod)
      sendTransaction(vault.id, vault.id, withdrawContractSendMethod)
    })()
  }, [account, lockExpired, vault, sendTransaction])

  const getDefaultGasLimit = useCallback(async () => {
    if (!vault || !("getWithdrawContractSendMethod" in vault) || !("getWithdrawParams" in vault) || !(vault instanceof StakedIdleVault)) return
    
    const defaultGasLimit = vault.getMethodDefaultGasLimit('unstake')
    if (!account || !lockExpired){
      return defaultGasLimit
    }

    const sendOptions = {
      from: account?.address
    }
    const withdrawParams = vault.getWithdrawParams()
    const withdrawContractSendMethod = vault.getWithdrawContractSendMethod(withdrawParams)

    const estimatedGasLimit = await estimateGasLimit(withdrawContractSendMethod, sendOptions) || defaultGasLimit
    // console.log('WITHDRAW - estimatedGasLimit', estimatedGasLimit)
    return estimatedGasLimit
  }, [account, vault, lockExpired])

  // Update gas fees
  useEffect(() => {
    if (activeItem !== itemIndex) return
    ;(async () => {
      const defaultGasLimit = await getDefaultGasLimit()
      setGasLimit(defaultGasLimit)
    })()
  }, [activeItem, itemIndex, getDefaultGasLimit, setGasLimit])

  // Update parent amount
  useEffect(() => {
    if (activeItem !== itemIndex) return
    dispatch({type: 'SET_ASSET', payload: asset})

    if (!selectVaultPrice || !vault) return
    // const vaultPrice = selectVaultPrice(vault.id)
    dispatch({type: 'SET_AMOUNT', payload: BNify(amount).toString()})
    dispatch({type: 'SET_DEFAULT_AMOUNT', payload: BNify(amount).toString()})
  }, [vault, asset, amount, selectVaultPrice, activeItem, itemIndex, dispatch, withdraw])

  const withdrawButton = useMemo(() => {
    return !isChainEnabled && asset ? (
      <SwitchNetworkButton chainId={asset.chainId as number} width={'full'} />
    ) : account ? (
      <Translation component={Button} translation={"common.withdraw"} disabled={!lockExpired} onClick={withdraw} variant={'ctaFull'} />
    ) : (
      <ConnectWalletButton variant={'ctaFull'} />
    )
  }, [account, lockExpired, withdraw, isChainEnabled, asset])

  // console.log('stakingData', stakingData)

  return (
    <AssetProvider
      flex={1}
      width={'100%'}
      assetId={asset?.id}
    >
      <VStack
        flex={1}
        spacing={6}
        width={'100%'}
        height={'100%'}
        id={'withdraw-container'}
        alignItems={'space-between'}
        justifyContent={'flex-start'}
        pt={isChainEnabled && stakingData?.position?.lockEnd ? 8 : 0}
      >
        <VStack
          flex={1}
          spacing={0}
          id={'confirm-on-wallet'}
          alignItems={'flex-start'}
        >
          {
            !stakingData?.position?.lockEnd ? (
              <Center
                px={6}
                flex={1}
                width={'100%'}
              >
                <VStack
                  spacing={5}
                >
                  <Translation component={Text} translation={"staking.noStake"} textStyle={'heading'} fontSize={'h3'} textAlign={'center'} />
                  <Translation component={Text} translation={`staking.stakeBeforeUnstake`} textStyle={'captionSmall'} textAlign={'center'} />
                  <Translation component={Button} translation={`common.stake`} onClick={() => setActionIndex(0)} variant={'ctaPrimary'} px={10} />
                </VStack>
              </Center>
            ) : !lockExpired ? (
              <VStack
                py={20}
                flex={1}
                spacing={6}
                px={[6, 10]}
                width={'100%'}
              >
                <MdLockClock size={72} />
                <VStack
                  spacing={4}
                >
                  <Translation component={Text} translation={"staking.lockNotExpired"} textStyle={'heading'} fontSize={'h3'} textAlign={'center'} />
                  <Translation component={Text} translation={`staking.waitUntilLockExpired`} params={{lockEndDate}} textStyle={'captionSmall'} textAlign={'center'} />
                  <Translation component={Button} translation={`staking.increaseLock`} onClick={() => setActionIndex(0)} variant={'ctaPrimary'} px={10} />
                </VStack>
              </VStack>
            ) : (
              <Center
                py={14}
                flex={1}
                px={[4, 10]}
                width={'100%'}
              >
                <VStack
                  spacing={6}
                >
                  <MdLockOpen size={72} />
                  <VStack
                    spacing={4}
                  >
                    <Translation component={Text} translation={"staking.lockExpired"} textStyle={'heading'} fontSize={'h3'} textAlign={'center'} />
                    <Translation component={Text} translation={`staking.canWithdrawLock`} params={{amount: abbreviateNumber(amount), asset: asset?.name}} textStyle={'captionSmall'} textAlign={'center'} />
                  </VStack>
                </VStack>
              </Center>
            )
          }
        </VStack>
        {
          stakingData?.position?.lockEnd && lockExpired && (
            <VStack
              spacing={4}
              id={'footer'}
              alignItems={'flex-start'}
            >
              {
                lockExpired && (
                  <EstimatedGasFees />
                )
              }
              {withdrawButton}
            </VStack>
          )
        }
      </VStack>
    </AssetProvider>
  )
}