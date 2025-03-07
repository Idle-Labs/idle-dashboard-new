import { HStack, Stack, VStack, Text } from "@chakra-ui/react"
import { BigNumber } from "alchemy-sdk"
import { Amount } from "components/Amount/Amount"
import { AssetLabel } from "components/AssetLabel/AssetLabel"
import { AssetProvider, useAssetProvider } from "components/AssetProvider/AssetProvider"
import { Card } from "components/Card/Card"
import { TokenAmount } from "components/TokenAmount/TokenAmount"
import { TransactionButton } from "components/TransactionButton/TransactionButton"
import { Translation } from "components/Translation/Translation"
import { AssetId, CreditVaultWithdrawRequest, DATETIME_FORMAT, SECONDS_IN_YEAR } from "constants/"
import { usePortfolioProvider } from "contexts/PortfolioProvider"
import { useThemeProvider } from "contexts/ThemeProvider"
import { useWalletProvider } from "contexts/WalletProvider"
import { BNify, bnOrZero, fixTokenDecimals, formatDate, isEmpty, secondsToPeriod, toDayjs } from "helpers"
import { useCallback, useMemo } from "react"
import Countdown from "react-countdown"
import { useTranslate } from "react-polyglot"
import { CreditVault } from "vaults/CreditVault"


type WithdrawRequestArgs = {
  withdrawRequest: CreditVaultWithdrawRequest
}

export const WithdrawRequest: React.FC<WithdrawRequestArgs> = ({
  withdrawRequest
}) => {
  const { isMobile } = useThemeProvider()
  const { asset, vault } = useAssetProvider()
  const translate = useTranslate()

  const epochData = useMemo(() => {
    return asset?.epochData
  }, [asset])

  const claimDeadline = useMemo(() => {
    if (!epochData || !("instantWithdrawDeadline" in epochData)) return null

    // Instant
    if (withdrawRequest.isInstant){
      // if (!epochData?.isEpochRunning){
      //   return null
      // }
      return toDayjs(epochData?.instantWithdrawDeadline*1000)
    }

    // Standard
    if (!!epochData?.isEpochRunning){
      return toDayjs(epochData?.epochEndDate)
    }

    return null
  }, [epochData, withdrawRequest])

  const status = useMemo(() => {
    if (!epochData || !("isEpochRunning" in epochData)){
      return 'pending'
    }

    if (withdrawRequest.isInstant){
      if (!epochData.isEpochRunning || !epochData.allowInstantWithdraw){
        return 'pending'
      }
      return claimDeadline && claimDeadline.isSameOrBefore(toDayjs()) ? 'claimable' : 'pending'
    }

    return !!epochData?.isEpochRunning ? 'pending' : (bnOrZero(epochData?.pendingWithdraws).lte(0) ? 'claimable' : 'pending')
  }, [withdrawRequest, epochData, claimDeadline])

  const claimableOnText = useMemo(() => {
    if (!epochData || status === 'claimable'){
      return '-'
    }

    if (withdrawRequest.isInstant){
      return claimDeadline ? formatDate(claimDeadline, DATETIME_FORMAT, true) : translate('assets.assetCards.rewards.duringNextEpoch')
    }

    return claimDeadline ? formatDate(claimDeadline, DATETIME_FORMAT, true) : (("pendingWithdraws" in epochData) && bnOrZero(epochData?.pendingWithdraws).lte(0) ? '-' : translate('assets.assetCards.rewards.nextEpochEnd'))
  }, [withdrawRequest, claimDeadline, status, epochData, translate])

  const countdownLabel = useMemo(() => {
    return status === 'claimable' ? 'assets.assetCards.rewards.claimableFor' : 'assets.assetCards.rewards.claimableIn'
  }, [status])

  console.log('withdrawRequest', withdrawRequest, epochData, status, claimableOnText, claimDeadline?.toDate())

  const countdown = useMemo(() => {
    switch (status){
      case 'claimable':
        if (epochData && ("bufferPeriod" in epochData)){
          if (withdrawRequest.isInstant){
            const claimableUntil = toDayjs(epochData?.epochEndDate)
            console.log(claimableUntil.toDate())
            return (<Countdown date={claimableUntil.toDate()} />)
          } else {
            const claimableUntil = toDayjs(bnOrZero(epochData?.epochEndDate).plus(bnOrZero(epochData?.bufferPeriod).times(1000)).toNumber())
            return (<Countdown date={claimableUntil.toDate()} />)
          }
        }
        break;
      case 'pending':
        if (epochData && ("bufferPeriod" in epochData)){
          if (withdrawRequest.isInstant){
            if (claimDeadline){
              // Deadline not passed yet
              if (claimDeadline.isAfter(toDayjs())){
                return (<Countdown date={claimDeadline.toDate()} />)
              } else {
                const claimableIn = toDayjs(bnOrZero(epochData?.epochEndDate).plus(bnOrZero(epochData.bufferPeriod).times(1000)).toNumber())
                console.log(epochData?.epochEndDate, epochData.bufferPeriod, claimableIn.toDate())
                return (<Countdown date={claimableIn.toDate()} />)
              }
            } else {
              return (<Text textStyle={'heading'} fontSize={'h4'}>{claimableOnText}</Text>)
            }
          } else {
            const claimableIn = !!epochData.isEpochRunning ? toDayjs(epochData?.epochEndDate) : toDayjs(bnOrZero(epochData?.epochEndDate).plus(bnOrZero(epochData.epochDuration).times(1000)).plus(bnOrZero(epochData?.bufferPeriod).times(1000)).toNumber())
            return (<Countdown date={claimableIn.toDate()} />)
          }
        }
        break;
      default:
        if (!claimDeadline){
          return (<Text textStyle={'heading'} fontSize={'h4'}>{claimableOnText}</Text>)
        }
        return (
          <Countdown date={claimDeadline.toDate()} />
        )
    }
  }, [withdrawRequest, status, epochData, claimDeadline, claimableOnText])

  const contractSendMethod = useMemo(() => {
    if (withdrawRequest.isInstant){
      if (!vault || !("getClaimInstantContractSendMethod" in vault)) return null
      return vault?.getClaimInstantContractSendMethod()
    }
    if (!vault || !("getClaimContractSendMethod" in vault)) return null
    return vault?.getClaimContractSendMethod()
  }, [vault, withdrawRequest])

  const isDisabled = useMemo(() => {
    return status !== 'claimable'
  }, [status])

  if (!asset || !vault || !contractSendMethod || !("underlyingToken" in vault)){
    return null
  }

  const amount = fixTokenDecimals(withdrawRequest.amount, (vault?.underlyingToken?.decimals || 18))
  
  return isMobile ? (
    <Card
      p={6}
    >
      <VStack
        spacing={4}
        width={'100%'}
        alignItems={'flex-start'}
      >
        <HStack
          width={'full'}
          justifyContent={'space-between'}
        >
          <AssetLabel assetId={asset?.underlyingId} />
        </HStack>
        <HStack
          width={'full'}
          justifyContent={'space-between'}
        >
          <VStack
            spacing={1}
            alignItems={'flex-start'}
          >
            <Translation translation={'defi.status'} textStyle={'captionSmall'} />
            <HStack
              spacing={1}
              justifyContent={'flex-start'}
            >
              <Translation translation={`transactionRow.${status}`} color={`status.${status}`} fontSize={'h4'} textStyle={'heading'} />
            </HStack>
          </VStack>
          <VStack
            spacing={1}
            alignItems={'flex-end'}
          >
            <Translation translation={'transactionRow.amount'} textStyle={'captionSmall'} />
            <TokenAmount assetId={asset?.id} showIcon={false} amount={amount} decimals={2} textStyle={'heading'} fontSize={'h3'} />
          </VStack>
        </HStack>
        <TransactionButton text={'defi.claim'} vaultId={asset.id as string} assetId={asset.id as string} contractSendMethod={contractSendMethod} actionType={'claim'} amount={amount.toFixed(2)} width={'100%'} disabled={isDisabled} />
      </VStack>
    </Card>
  ) : (
    <Card
      p={6}
      px={8}
      width={'100%'}
    >
      <Stack
        width={'100%'}
        spacing={[0, 6]}
        direction={['column', 'row']}
        flexWrap={['wrap', 'nowrap']}
        justifyContent={['flex-start', 'space-between']}
      >
        <AssetLabel assetId={asset?.underlyingId} />

        <VStack
          pb={[2, 0]}
          spacing={[1, 2]}
          width={['50%','auto']}
          alignItems={'flex-start'}
          justifyContent={'flex-start'}
        >
          <Translation translation={'common.type'} textStyle={'captionSmall'} />
          <Translation translation={`assets.status.epoch.${withdrawRequest.isInstant ? 'instant' : 'standard'}`} fontSize={'h4'} textStyle={'heading'} />
        </VStack>

        <VStack
          pb={[2, 0]}
          spacing={[1, 2]}
          width={['50%','auto']}
          alignItems={'flex-start'}
          justifyContent={'flex-start'}
        >
          <Translation translation={'transactionRow.amount'} textStyle={'captionSmall'} />
          <TokenAmount assetId={asset?.underlyingId} showIcon={false} amount={amount} decimals={2} textStyle={'heading'} fontSize={'h4'} />
        </VStack>

        <VStack
          pb={[2, 0]}
          spacing={[1, 2]}
          width={['50%','auto']}
          alignItems={'flex-start'}
          justifyContent={'flex-start'}
        >
          <Translation translation={'defi.status'} textStyle={'captionSmall'} />
          <Translation translation={`transactionRow.${status}`} color={`status.${status}`} fontSize={'h4'} textStyle={'heading'} />
        </VStack>
        
        <VStack
          pb={[2, 0]}
          spacing={[1, 2]}
          width={['50%','auto']}
          alignItems={'flex-start'}
          justifyContent={'flex-start'}
        >
          <Translation translation={countdownLabel} textStyle={'captionSmall'} />
          {countdown}
        </VStack>

        <TransactionButton text={'defi.claim'} vaultId={asset.id as string} assetId={asset.id as string} contractSendMethod={contractSendMethod} actionType={'claim'} amount={amount.toFixed(2)} width={['100%', '150px']} disabled={isDisabled} />
      </Stack>
    </Card>
  )
}

type EpochWithdrawRequestArgs = {
  assetId: AssetId
}

export const EpochWithdrawRequest: React.FC<EpochWithdrawRequestArgs> = ({
  assetId
}) => {
  const { account } = useWalletProvider()
  const { vaultsAccountData, selectors: { selectAssetById, selectVaultById } } = usePortfolioProvider()

  const asset = useMemo(() => {
    return selectAssetById && selectAssetById(assetId)
  }, [selectAssetById, assetId])

  const vault = useMemo(() => {
    return selectVaultById && selectVaultById(assetId)
  }, [selectVaultById, assetId])

  const withdrawRequests = useMemo(() => {
    return vaultsAccountData?.creditVaultsWithdrawRequests?.[asset?.id]
  }, [asset, vaultsAccountData])

  if (!account?.address || !asset || !vault || !(vault instanceof CreditVault) || !("getClaimContractSendMethod" in vault) || isEmpty(withdrawRequests)){
    return null
  }

  return (
    <AssetProvider
      assetId={asset?.id}
      wrapFlex={false}
    >
      <VStack
        spacing={6}
        width={'100%'}
        id={'vault-rewards'}
        alignItems={'flex-start'}
      >
        <Translation translation={'defi.withdrawRequests'} component={Text} textStyle={'heading'} fontSize={'h3'} />
        <VStack
          spacing={4}
          width={'full'}
          alignItems={'flex-start'}
        >
        {
          withdrawRequests?.map( (withdrawRequest: CreditVaultWithdrawRequest, index: number) => (<WithdrawRequest key={index} withdrawRequest={withdrawRequest} />) )
        }
        </VStack>
      </VStack>
    </AssetProvider>
  )
}