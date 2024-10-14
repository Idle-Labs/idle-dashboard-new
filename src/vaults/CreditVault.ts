import Web3 from "web3";
import ERC20 from "abis/tokens/ERC20.json";
import { Contract } from "web3-eth-contract";
import { selectUnderlyingToken } from "selectors/";
import { CacheContextProps } from "contexts/CacheProvider";
import { GenericContract } from "contracts/GenericContract";
import { ContractSendMethod, EventData } from "web3-eth-contract";
import { VaultFunctionsHelper } from "classes/VaultFunctionsHelper";
import { GenericContractsHelper } from "classes/GenericContractsHelper";
import {
  MAX_ALLOWANCE,
  tokensFolder,
  operators,
  CreditVaultConfig,
  ContractConfig,
} from "constants/";
import type {
  Abi,
  NumberType,
  VaultStatus,
  RewardEmission,
  Operator,
  RewardSenderParams,
  RewardSenders,
  BigNumber,
} from "constants/types";
import {
  BNify,
  normalizeTokenAmount,
  getObjectPath,
  fixTokenDecimals,
  catchPromise,
  asyncReduce,
  checkAddress,
  isEmpty,
  cmpAddrs,
  decodeTxParams,
} from "helpers/";
import {
  ZERO_ADDRESS,
  CDO,
  Strategy,
  Pool,
  UnderlyingTokenProps,
  Assets,
  ContractRawCall,
  EtherscanTransaction,
  Transaction,
} from "constants/";

type ConstructorProps = {
  web3: Web3;
  type: string;
  web3Rpc?: Web3 | null;
  chainId: number;
  cacheProvider?: CacheContextProps;
  vaultConfig: CreditVaultConfig;
};

export class CreditVault {
  // Global data
  readonly id: string;
  readonly web3: Web3;
  readonly chainId: number;
  readonly description: string | undefined;
  readonly web3Rpc: Web3 | null | undefined;
  readonly flags: Record<string, any> | undefined;
  readonly translations: CreditVaultConfig["translations"];
  readonly vaultFunctionsHelper: VaultFunctionsHelper;

  // Private attributes
  private readonly cacheProvider: CacheContextProps | undefined;

  // Raw config
  public readonly type: string;
  public readonly cdoConfig: CDO;
  public readonly kycRequired: boolean;
  public readonly strategyConfig: Strategy;
  public readonly tokenConfig: ContractConfig;
  public readonly variant: string | undefined;
  public readonly poolConfig: Pool | undefined;
  public readonly vaultConfig: CreditVaultConfig;
  public readonly mode: CreditVaultConfig["mode"];
  public readonly status: VaultStatus | undefined;
  public readonly rewardTokens: UnderlyingTokenProps[];
  public readonly rewardsSenders: RewardSenders | undefined;
  public readonly distributedTokens: UnderlyingTokenProps[];
  public readonly rewardsEmissions: RewardEmission[] | undefined;
  public readonly underlyingToken: UnderlyingTokenProps | undefined;
  public readonly vaultType: CreditVaultConfig["vaultType"] | undefined;

  // Contracts
  public readonly cdoContract: Contract;
  public readonly tokenContract: Contract;
  public readonly strategyContract: Contract;
  public readonly underlyingContract: Contract | undefined;

  // Read only contracts
  public readonly cdoContractRpc: Contract | undefined; // Used for calls on specific blocks

  constructor(props: ConstructorProps) {
    const { web3, type, web3Rpc, chainId, vaultConfig, cacheProvider } = props;

    // Init global data
    this.web3 = web3;
    this.type = type;
    this.web3Rpc = web3Rpc;
    this.chainId = chainId;
    this.mode = vaultConfig.mode;
    this.flags = vaultConfig.flags;
    this.vaultConfig = vaultConfig;
    this.status = vaultConfig.status;
    this.cacheProvider = cacheProvider;
    this.vaultType = vaultConfig.vaultType;
    this.kycRequired = vaultConfig.kycRequired;
    this.description = vaultConfig.description;
    this.rewardsEmissions = vaultConfig.rewardsEmissions;
    this.vaultFunctionsHelper = new VaultFunctionsHelper({
      chainId,
      web3,
      cacheProvider,
    });
    this.underlyingToken = selectUnderlyingToken(
      chainId,
      vaultConfig.underlyingToken
    );

    this.rewardTokens = [];
    this.distributedTokens = [];

    if (vaultConfig.distributedTokens) {
      vaultConfig.distributedTokens.forEach((distributedToken: string) => {
        const underlyingToken = selectUnderlyingToken(
          chainId,
          distributedToken
        );
        if (underlyingToken) {
          this.distributedTokens.push(underlyingToken);
        }
      });
    }

    // Init tranche configs
    this.cdoConfig = vaultConfig.CDO;
    this.tokenConfig = vaultConfig.Token;
    this.strategyConfig = vaultConfig.Strategy;
    this.id = this.tokenConfig.address.toLowerCase();

    // Init CDO contract
    this.cdoContract = new web3.eth.Contract(
      this.cdoConfig.abi,
      this.cdoConfig.address
    );
    if (web3Rpc) {
      this.cdoContractRpc = new web3Rpc.eth.Contract(
        this.cdoConfig.abi,
        this.cdoConfig.address
      );
    }

    // Init Strategy contract
    this.strategyContract = new web3.eth.Contract(
      this.strategyConfig.abi,
      this.strategyConfig.address
    );

    // Init underlying token contract
    if (this.underlyingToken) {
      const abi: Abi = this.underlyingToken?.abi || (ERC20 as Abi);
      this.underlyingContract = new web3.eth.Contract(
        abi,
        this.underlyingToken.address
      );
    }

    // Init tranche tokens contracts
    this.tokenContract = new web3.eth.Contract(
      this.tokenConfig.abi,
      this.tokenConfig.address
    );
  }

  public getDistributedRewards(
    account: string,
    etherscanTransactions: EtherscanTransaction[],
    startBlock: number = 0
  ): EtherscanTransaction[] {
    if (!this.distributedTokens.length) return [];
    return etherscanTransactions.filter((tx: EtherscanTransaction) => {
      const sendersAddrs = !isEmpty(this.rewardsSenders)
        ? Object.keys(this.rewardsSenders as RewardSenders)
        : [];

      const checkTx =
        +tx.blockNumber >= +startBlock &&
        this.distributedTokens
          .map((distributedToken: UnderlyingTokenProps) =>
            distributedToken.address?.toLowerCase()
          )
          .includes(tx.contractAddress.toLowerCase()) &&
        cmpAddrs(tx.to, account);

      if (isEmpty(sendersAddrs)) return checkTx;

      const foundSenderAddress = sendersAddrs.find((addr: string) =>
        cmpAddrs(addr, tx.from.toLowerCase())
      );
      if (foundSenderAddress) {
        const senderParams: RewardSenderParams = (
          this.rewardsSenders as RewardSenders
        )[foundSenderAddress];
        if (
          (!senderParams.startBlock ||
            +tx.blockNumber >= senderParams.startBlock) &&
          (!senderParams.endBlock || +tx.blockNumber <= senderParams.endBlock)
        ) {
          return checkTx;
        }
      }
      return false;
    });
  }

  public async getTransactions(
    account: string,
    etherscanTransactions: EtherscanTransaction[],
    getTokenPrice: boolean = true
  ): Promise<Transaction[]> {
    const transactionsByHash = etherscanTransactions.reduce(
      (
        transactions: Record<string, EtherscanTransaction[]>,
        transaction: EtherscanTransaction
      ) => {
        if (!transactions[transaction.hash]) {
          transactions[transaction.hash] = [];
        }

        transactions[transaction.hash].push(transaction);

        return transactions;
      },
      {}
    );

    // const startTimestamp = Date.now();

    const transactions: Transaction[] = await asyncReduce<
      Transaction[],
      Transaction[]
    >(
      Object.values(transactionsByHash) as Transaction[][],
      async (internalTxs: Transaction[]) => {
        const transactions = [];
        const insertedTxs: Record<string, any> = {};

        for (const tx of internalTxs) {
          // Check for right token
          const isRightToken =
            internalTxs.length > 1 &&
            internalTxs.filter(
              (iTx) =>
                iTx.contractAddress.toLowerCase() ===
                this.underlyingToken?.address?.toLowerCase()
            ).length > 0;

          const isDepositInternalTx =
            isRightToken &&
            internalTxs.find(
              (iTx) =>
                iTx.from.toLowerCase() === account.toLowerCase() &&
                iTx.to.toLowerCase() === this.id
            );
          const isRedeemInternalTx =
            isRightToken &&
            internalTxs.find(
              (iTx) =>
                iTx.contractAddress.toLowerCase() ===
                  this.underlyingToken?.address?.toLowerCase() &&
                internalTxs.filter(
                  (iTx2) => iTx2.contractAddress.toLowerCase() === this.id
                ).length &&
                iTx.to.toLowerCase() === account.toLowerCase()
            );

          const isSendTransferTx =
            internalTxs.length === 1 &&
            tx.from.toLowerCase() === account.toLowerCase() &&
            tx.contractAddress.toLowerCase() === this.id;
          const isReceiveTransferTx =
            internalTxs.length === 1 &&
            tx.to.toLowerCase() === account.toLowerCase() &&
            tx.contractAddress.toLowerCase() === this.id;

          const isDepositTx =
            isRightToken &&
            tx.from.toLowerCase() === account.toLowerCase() &&
            tx.to.toLowerCase() === this.id;
          const isRedeemTx =
            isRightToken &&
            !isDepositInternalTx &&
            tx.contractAddress.toLowerCase() ===
              this.underlyingToken?.address?.toLowerCase() &&
            internalTxs.filter(
              (iTx) => iTx.contractAddress.toLowerCase() === this.id
            ).length &&
            tx.to.toLowerCase() === account.toLowerCase();

          const isSwapOutTx =
            !isSendTransferTx &&
            !isRedeemInternalTx &&
            tx.from.toLowerCase() === account.toLowerCase() &&
            tx.contractAddress.toLowerCase() === this.id;
          const isSwapTx =
            !isReceiveTransferTx &&
            !isDepositInternalTx &&
            tx.to.toLowerCase() === account.toLowerCase() &&
            tx.contractAddress.toLowerCase() === this.id;

          // Get action by positive condition
          const actions: Record<string, boolean> = {
            deposit: !!(isReceiveTransferTx || isDepositTx || isSwapTx),
            redeem: !!(isSendTransferTx || isRedeemTx || isSwapOutTx),
          };

          const subActions: Record<string, boolean> = {
            send: isSendTransferTx,
            receive: isReceiveTransferTx,
            swapIn: isSwapTx,
            swapOut: isSwapOutTx,
          };

          const action = Object.keys(actions).find(
            (action: string) => !!actions[action]
          );
          let subAction = Object.keys(subActions).find(
            (subAction: string) => !!subActions[subAction]
          );

          if (action) {
            // Get tx referral
            if (
              action === "deposit" &&
              tx.functionName &&
              /^deposit(AA|BB)Ref/.test(tx.functionName)
            ) {
              subAction = "depositWithRef";
              const decodedParams = decodeTxParams(
                this.web3,
                tx,
                this.cdoContract
              );
              if (
                decodedParams?.length &&
                this.checkReferralAllowed(decodedParams[1])
              ) {
                tx.referral = decodedParams[1];
              }
            }

            const txHashKey = `${tx.hash}_${action}`;

            // Get idle token tx and underlying token tx
            const idleTokenToAddress =
              action === "redeem"
                ? isSendTransferTx
                  ? null
                  : ZERO_ADDRESS
                : account;
            const idleTokenTx = internalTxs.find(
              (iTx) =>
                iTx.contractAddress.toLowerCase() === this.id &&
                (!idleTokenToAddress ||
                  iTx.to.toLowerCase() === idleTokenToAddress.toLowerCase())
            );
            const idleAmount = idleTokenTx
              ? fixTokenDecimals(idleTokenTx.value, 18)
              : BNify(0);

            const underlyingTokenTx = internalTxs.find((iTx) => {
              const underlyingTokenDirectionAddress =
                action === "redeem" ? iTx.to : iTx.from;
              const underlyingAmount = fixTokenDecimals(
                iTx.value,
                this.underlyingToken?.decimals
              );
              return (
                iTx.contractAddress.toLowerCase() ===
                  this.underlyingToken?.address?.toLowerCase() &&
                underlyingTokenDirectionAddress.toLowerCase() ===
                  account.toLowerCase() &&
                underlyingAmount.gte(idleAmount)
              );
            });

            const underlyingTokenTxAmount = underlyingTokenTx
              ? fixTokenDecimals(
                  underlyingTokenTx.value,
                  this.underlyingToken?.decimals
                )
              : null;
            let idlePrice = underlyingTokenTxAmount?.gt(0)
              ? underlyingTokenTxAmount.div(idleAmount)
              : BNify(1);

            let underlyingAmount = BNify(0);
            if (!underlyingTokenTxAmount) {
              const pricesCalls = this.getPricesCalls();

              if (getTokenPrice) {
                const cacheKey = `tokenPrice_${this.chainId}_${this.id}_${tx.blockNumber}`;
                try {
                  // @ts-ignore
                  const callback = async () =>
                    await catchPromise(
                      pricesCalls[0].call.call({}, parseInt(tx.blockNumber))
                    );
                  const tokenPrice = this.cacheProvider
                    ? await this.cacheProvider.checkAndCache(
                        cacheKey,
                        callback,
                        0
                      )
                    : await callback();
                  idlePrice = tokenPrice
                    ? fixTokenDecimals(
                        tokenPrice,
                        this.underlyingToken?.decimals
                      )
                    : BNify(1);
                } catch (err) {}
              }

              underlyingAmount = idlePrice.times(idleAmount);
              // console.log('tokenPrice', this.id, tx.blockNumber, tx.hash, tokenPrice, idlePrice.toString(), underlyingAmount.toString())
            } else {
              underlyingAmount = underlyingTokenTxAmount;
            }

            // console.log(this.id, action, tx.hash, idlePrice.toString(), underlyingAmount.toString(), idleAmount.toString(), tx)

            if (!insertedTxs[txHashKey]) {
              transactions.push({
                ...tx,
                action,
                subAction,
                idlePrice,
                idleAmount,
                assetId: this.id,
                underlyingAmount,
                chainId: this.chainId,
              });

              // Save inserted txs to avoid duplicated
              insertedTxs[txHashKey] = 1;
            }
          }
        }

        return transactions;
      },
      (acc, val) => [...acc, ...val],
      []
    );

    // console.log('transactions', this.id, transactions)
    // console.log(`Token Prices retrieved for ${this.id} in %d seconds`, (Date.now()-startTimestamp)/1000)

    return transactions;
  }

  public getBlockNumber(): number {
    return this.vaultConfig.blockNumber;
  }

  public getBalancesCalls(params: any[] = []): any[] {
    return [
      {
        assetId: this.id,
        call: this.tokenContract.methods.balanceOf(...params),
      },
    ];
  }

  public getPricesCalls(): any[] {
    const contract = this.cdoContractRpc || this.cdoContract;
    return [
      {
        assetId: this.id,
        decimals: this.underlyingToken?.decimals || 18,
        call: contract.methods.virtualPrice(this.id),
      },
    ];
  }

  public getPricesUsdCalls(contracts: GenericContract[]): ContractRawCall[] {
    if (!this.underlyingToken) return [];

    const genericContractsHelper = new GenericContractsHelper({
      chainId: this.chainId,
      web3: this.web3,
      contracts,
    });
    const conversionRateParams = genericContractsHelper.getConversionRateParams(
      this.underlyingToken
    );
    if (!conversionRateParams) return [];

    return [
      {
        assetId: this.id,
        params: conversionRateParams,
        call: conversionRateParams.call,
      },
    ];
  }

  public getFeesCalls(): ContractRawCall[] {
    return [
      {
        assetId: this.id,
        call: this.cdoContract.methods.fee(),
      },
    ];
  }

  public getLimitsCalls(): ContractRawCall[] {
    return [
      {
        assetId: this.id,
        call: this.cdoContract.methods.limit(),
        decimals: this.underlyingToken?.decimals || 18,
      },
    ];
  }

  public getTotalSupplyCalls(): ContractRawCall[] {
    return [
      {
        assetId: this.id,
        call: this.tokenContract.methods.totalSupply(),
      },
    ];
  }

  public async getHistoricalData(): Promise<any> {
    return {
      vaultId: this.id,
      rates: [],
      prices: [],
    };
  }

  public async getHistoricalPrices(): Promise<any> {
    return {
      vaultId: this.id,
      prices: [],
    };
  }

  public async getHistoricalAprs(): Promise<any> {
    return {
      vaultId: this.id,
      rates: [],
    };
  }

  public getPausedCalls(): ContractRawCall[] {
    return [
      {
        assetId: this.id,
        call: this.cdoContract.methods.paused(),
      },
    ];
  }

  public getAprRatioCalls(): ContractRawCall[] {
    return [
      {
        assetId: this.id,
        call: this.cdoContract.methods.trancheAPRSplitRatio(),
      },
    ];
  }

  public getCurrentAARatioCalls(): ContractRawCall[] {
    return [
      {
        assetId: this.id,
        call: this.cdoContract.methods.getCurrentAARatio(),
      },
    ];
  }

  public getBaseAprCalls(): ContractRawCall[] {
    if (!this.strategyContract) return [];
    return [
      {
        assetId: this.id,
        call: this.strategyContract.methods.getApr(),
      },
    ];
  }

  public getAprsCalls(): ContractRawCall[] {
    if (!this.strategyContract) return [];
    return [
      {
        decimals: 18,
        assetId: this.id,
        call: this.strategyContract.methods.getApr(),
      },
    ];
  }

  public getEpochData(): ContractRawCall[] {
    if (!this.cdoContract || !this.strategyContract) return [];
    return [
      {
        assetId: this.id,
        call: this.cdoContract.methods.epochEndDate(),
      },
      {
        assetId: this.id,
        call: this.cdoContract.methods.isEpochRunning(),
      },
      {
        assetId: this.id,
        call: this.cdoContract.methods.expectedEpochInterest(),
      },
      {
        assetId: this.id,
        call: this.cdoContract.methods.instantWithdrawDeadline(),
      },
      {
        assetId: this.id,
        call: this.cdoContract.methods.allowInstantWithdraw(),
      },
      {
        assetId: this.id,
        call: this.cdoContract.methods.bufferPeriod(),
      },
      {
        assetId: this.id,
        call: this.strategyContract.methods.getApr(),
        data: {
          field: "epochApr",
        },
      },
      {
        assetId: this.id,
        call: this.strategyContract.methods.borrower(),
      },
      {
        assetId: this.id,
        call: this.strategyContract.methods.manager(),
      },
      {
        assetId: this.id,
        call: this.cdoContract.methods.instantWithdrawAprDelta(),
      },
      {
        assetId: this.id,
        call: this.cdoContract.methods.lastEpochApr(),
      },
      {
        assetId: this.id,
        call: this.cdoContract.methods.lastEpochInterest(),
      },
      {
        assetId: this.id,
        call: this.cdoContract.methods.epochDuration(),
      },
      {
        assetId: this.id,
        call: this.cdoContract.methods.disableInstantWithdraw(),
      },
      {
        assetId: this.id,
        call: this.cdoContract.methods.instantWithdrawDelay(),
      },
      {
        assetId: this.id,
        call: this.cdoContract.methods.defaulted(),
      },
      {
        assetId: this.id,
        call: this.strategyContract.methods.pendingWithdraws(),
      },
      {
        assetId: this.id,
        call: this.strategyContract.methods.pendingInstantWithdraws(),
      },
    ];
  }

  public getUserInstantWithdrawRequestCalls(
    account: string
  ): ContractRawCall[] {
    if (!this.strategyContract) return [];
    return [
      {
        assetId: this.id,
        call: this.strategyContract.methods.instantWithdrawsRequests(account),
      },
    ];
  }

  public getUserLastWithdrawRequestCalls(account: string): ContractRawCall[] {
    if (!this.strategyContract) return [];
    return [
      {
        assetId: this.id,
        call: this.strategyContract.methods.lastWithdrawRequest(account),
      },
    ];
  }

  public getUserWithdrawRequestCalls(account: string): ContractRawCall[] {
    if (!this.strategyContract) return [];
    return [
      {
        assetId: this.id,
        call: this.strategyContract.methods.withdrawsRequests(account),
      },
    ];
  }

  public getUserMaxWithdrawableCalls(account: string): ContractRawCall[] {
    if (!this.cdoContract) return [];
    return [
      {
        assetId: this.id,
        call: this.cdoContract.methods.maxWithdrawable(account, this.id),
      },
    ];
  }

  public isWalletAllowed(account: string): ContractRawCall[] {
    return [
      {
        assetId: this.id,
        call: this.cdoContract.methods.isWalletAllowed(account),
      },
    ];
  }

  public getNextEpochInterests(
    trancheTokens: BigNumber,
    vaultPrice: BigNumber,
    maxWithdrawable: BigNumber,
    amount?: BigNumber
  ): BigNumber {
    maxWithdrawable = fixTokenDecimals(
      maxWithdrawable,
      this.underlyingToken?.decimals || 18
    );
    const newVaultPrice = trancheTokens.gt(0)
      ? maxWithdrawable.div(trancheTokens)
      : BNify(0);

    const trancheTokenRequested = newVaultPrice.gt(0)
      ? newVaultPrice
          .minus(vaultPrice)
          .times(amount || trancheTokens)
          .div(newVaultPrice)
      : BNify(0);

    return trancheTokenRequested;
  }

  public getAssetsData(): Assets {
    return {
      [this.id]: {
        type: this.type,
        token: this.vaultConfig.name,
        decimals: this.tokenConfig.decimals,
        color: this.underlyingToken?.colors.hex,
        // icon: `${tokensFolder}${this.underlyingToken?.token}.svg`,
        underlyingId: this.underlyingToken?.address?.toLowerCase(),
        icon: `${tokensFolder}${
          this.underlyingToken?.icon || `${this.underlyingToken?.token}.svg`
        }`,
        name:
          this.underlyingToken?.label ||
          this.underlyingToken?.token ||
          this.vaultConfig.name,
      },
    };
  }

  // Transactions
  public getAllowanceOwner() {
    return this.cdoConfig.address;
  }

  public getMethodDefaultGasLimit(methodName: string): number | undefined {
    switch (methodName) {
      case "deposit":
        return 246316;
      case "withdraw":
        return 249642;
      default:
        return;
    }
  }

  public getOperatorInfo(): Operator | null {
    const operatorName = this.vaultConfig.borrower;
    return operatorName ? operators[operatorName] : null;
  }

  public getAllowanceParams(amount: NumberType): any[] {
    const decimals = this.underlyingToken?.decimals || 18;
    const amountToApprove =
      amount === MAX_ALLOWANCE
        ? MAX_ALLOWANCE
        : normalizeTokenAmount(amount, decimals);
    return [this.cdoConfig.address, amountToApprove];
  }

  public getUnlimitedAllowanceParams(): any[] {
    return this.getAllowanceParams(MAX_ALLOWANCE);
  }

  public getAllowanceContract(): Contract | undefined {
    return this.underlyingContract;
  }

  public getAllowanceContractSendMethod(
    params: any[] = []
  ): ContractSendMethod | undefined {
    const allowanceContract = this.getAllowanceContract();
    return allowanceContract?.methods.approve(...params);
  }

  public checkReferralAllowed(referral: string | undefined | null): boolean {
    if (!checkAddress(referral)) return false;
    const allowedReferrals = this.flags?.allowedReferrals || [];
    if (isEmpty(allowedReferrals)) return true;
    return (
      allowedReferrals.find((addr: string) => cmpAddrs(addr, referral)) !==
      undefined
    );
  }

  // eslint-disable-next-line
  public getDepositParams(
    amount: NumberType,
    _referral: string | undefined | null = null
  ): any[] {
    const decimals = this.underlyingToken?.decimals || 18;
    const params: any[] = [normalizeTokenAmount(amount, decimals)];
    if (this.flags?.referralEnabled && this.checkReferralAllowed(_referral)) {
      params.push(_referral);
    }
    return params;
  }

  public getFlag(flag: string): any {
    return getObjectPath(this, `flags.${flag}`);
  }

  public getClaimContractSendMethod(): ContractSendMethod | null {
    return this.cdoContract.methods.claimWithdrawRequest();
  }

  public getClaimInstantContractSendMethod(): ContractSendMethod | null {
    return this.cdoContract.methods.claimInstantWithdrawRequest();
  }

  public getDepositContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.cdoContract.methods.depositAA(...params);
  }

  public getWithdrawParams(amount: NumberType): any[] {
    return [normalizeTokenAmount(amount, this.cdoConfig.decimals), this.id];
  }

  public getWithdrawContractSendMethod(params: any[] = []): ContractSendMethod {
    return this.cdoContract.methods.requestWithdraw(...params);
  }

  public async getAccrueInterestEvents(): Promise<EventData[]> {
    return this.cdoContract.getPastEvents("AccrueInterest", {
      toBlock: "latest",
      fromBlock: this.vaultConfig.blockNumber,
    });
  }
}
