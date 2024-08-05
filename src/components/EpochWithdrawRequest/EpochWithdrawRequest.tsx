import { HStack, Stack, VStack, Text } from "@chakra-ui/react"
import { Amount } from "components/Amount/Amount"
import { AssetLabel } from "components/AssetLabel/AssetLabel"
import { AssetProvider, useAssetProvider } from "components/AssetProvider/AssetProvider"
import { Card } from "components/Card/Card"
import { TokenAmount } from "components/TokenAmount/TokenAmount"
import { TransactionButton } from "components/TransactionButton/TransactionButton"
import { Translation } from "components/Translation/Translation"
import { AssetId, CreditVaultWithdrawRequest } from "constants/"
import { usePortfolioProvider } from "contexts/PortfolioProvider"
import { useThemeProvider } from "contexts/ThemeProvider"
import { useWalletProvider } from "contexts/WalletProvider"
import { BNify, isEmpty, secondsToPeriod, toDayjs } from "helpers"
import { useCallback, useMemo } from "react"
import { CreditVault } from "vaults/CreditVault"


type WithdrawRequestArgs = {
  withdrawRequest: CreditVaultWithdrawRequest
}

export const WithdrawRequest: React.FC<WithdrawRequestArgs> = ({
  withdrawRequest
}) => {
  const { isMobile } = useThemeProvider()
  const { asset, vault } = useAssetProvider()

  const claimDeadline = useMemo(() => {
    if (!asset || !asset.epochData || !("instantWithdrawDeadline" in asset.epochData)) return null

    // Instant
    if (withdrawRequest.isInstant){
      return toDayjs(asset.epochData?.instantWithdrawDeadline*1000)
    }

    // Standard
    if (!!asset.epochData?.isEpochRunning){
      return null
    }

    return toDayjs(asset.epochData?.epochEndDate)
  }, [asset, withdrawRequest])

  const status = useMemo(() => {
    return claimDeadline && claimDeadline.isSameOrBefore(toDayjs()) ? 'claimable' : 'pending'
  }, [claimDeadline])

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

  if (!asset || !contractSendMethod){
    return null
  }

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
              <Translation translation={'common.pending'} textStyle={'heading'} fontSize={'h3'} />
            </HStack>
          </VStack>
          <VStack
            spacing={1}
            alignItems={'flex-end'}
          >
            <Translation translation={'transactionRow.amount'} textStyle={'captionSmall'} />
            <TokenAmount assetId={asset?.id} showIcon={false} amount={0} decimals={2} textStyle={'heading'} fontSize={'h3'} />
          </VStack>
        </HStack>
        <TransactionButton text={'defi.claim'} vaultId={asset.id as string} assetId={asset.id as string} contractSendMethod={contractSendMethod} actionType={'claim'} amount={'0'} width={'100%'} disabled={isDisabled} />
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
          <Translation translation={'transactionRow.amount'} textStyle={'captionSmall'} />
          <TokenAmount assetId={asset?.underlyingId} showIcon={false} amount={0} decimals={2} textStyle={'heading'} fontSize={'h4'} />
        </VStack>
        
        <VStack
          pb={[2, 0]}
          spacing={[1, 2]}
          width={['50%','auto']}
          alignItems={'flex-start'}
          justifyContent={'flex-start'}
        >
          <Translation translation={'assets.assetCards.rewards.claimableOn'} textStyle={'captionSmall'} />
          <Text textStyle={'heading'} fontSize={'h4'}>{claimDeadline?.format('YYYY/MM/DD HH:mm') || '-'}</Text>
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

        <TransactionButton text={'defi.claim'} vaultId={asset.id as string} assetId={asset.id as string} contractSendMethod={contractSendMethod} actionType={'claim'} amount={'0'} width={['100%', '150px']} disabled={false} />
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

  console.log('vaultsAccountData', vaultsAccountData)

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