import {
  createConfig,
  getRoutes,
  getQuote,
  getStatus,
  getChains,
  getTokens,
  executeRoute,
  getContractCallsQuote,
  type RoutesRequest,
  type QuoteRequest,
  type Route,
  type StatusResponse,
  type ChainId,
  type ExtendedChain,
  type Token,
  type RouteExtended,
  type LiFiStep,
  type ContractCallsQuoteRequest,
  type UpdateRouteHook,
} from "@lifi/sdk";
import type { Hash } from "viem";
import {
  checkAndSetTokenAllowance,
  executeTransaction,
  waitForTransactionReceipt,
} from "./lifi-utils";

const SUI_CHAIN_ID = 9270000000000000 as ChainId;

interface SuiLifiConfig {
  integrator: string;
  rpcUrls?: {
    [chainId: number]: string[];
  };
  fee?: number;
  walletClient?: WalletClient;
  accountAddress?: string;
}

interface SwapParams {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  toAddress?: string;
  slippage?: number;
}

interface BridgeParams {
  fromChainId: ChainId;
  toChainId: ChainId;
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  toAddress?: string;
  slippage?: number;
  allowBridges?: string[];
}

interface ContractCallParams {
  fromChainId: ChainId;
  toChainId: ChainId;
  fromTokenAddress: string;
  toTokenAddress: string;
  toAmount: string;
  fromAddress: string;
  contractCalls: Array<{
    fromAmount: string;
    fromTokenAddress: string;
    toContractAddress: string;
    toContractCallData: string;
    toContractGasLimit: string;
  }>;
}

interface MultihopParams {
  fromChainId: ChainId;
  intermediateChainId: ChainId;
  toChainId: ChainId;
  fromTokenAddress: string;
  intermediateTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  allowBridges?: string[];
}

interface KlimaRetireParams {
  fromChainId: ChainId;
  toChainId: ChainId;
  fromTokenAddress: string;
  retireAmount: string;
  fromAddress: string;
  klimaContractAddress: string;
  klimaSourceTokenAddress: string;
  poolTokenAddress: string;
  retiringEntityString: string;
  beneficiaryAddress: string;
  beneficiaryString: string;
  retirementMessage: string;
}

interface PolynomialDepositParams {
  fromChainId: ChainId;
  toChainId: ChainId;
  fromTokenAddress: string;
  depositAmount: string;
  fromAddress: string;
  polynomialContractAddress: string;
  polynomialTokenAddress: string;
}

interface YearnDepositParams {
  fromChainId: ChainId;
  toChainId: ChainId;
  fromTokenAddress: string;
  depositAmount: string;
  fromAddress: string;
  vaultAddress: string;
  vaultAssetAddress: string;
}

interface ToAmountBridgeParams {
  fromChainId: ChainId;
  toChainId: ChainId;
  fromTokenAddress: string;
  toTokenAddress: string;
  toAmount: string;
  fromAddress: string;
}

interface ExecuteRouteOptions {
  updateRouteHook?: UpdateRouteHook;
  acceptSlippageUpdateHook?: (
    oldSlippage: number,
    newSlippage: number,
    step: LiFiStep,
  ) => Promise<boolean>;
  infiniteApproval?: boolean;
}

interface ExecuteStepOptions {
  walletClient: unknown;
  accountAddress: string;
  updateRouteHook?: UpdateRouteHook;
}

interface WalletClient {
  account: unknown;
  sendTransaction: (params: unknown) => Promise<Hash>;
  waitForTransactionReceipt: (params: {
    hash: Hash;
    retryCount?: number;
    retryDelay?: (opts: { count: number }) => number;
  }) => Promise<unknown>;
}

export class LifiSuiService {
  private initialized = false;
  private walletClient?: WalletClient;
  private accountAddress?: string;

  constructor(config: SuiLifiConfig) {
    this.walletClient = config.walletClient as WalletClient;
    this.accountAddress = config.accountAddress;
    this.initializeConfig(config);
  }

  private initializeConfig(config: SuiLifiConfig): void {
    createConfig({
      integrator: config.integrator,
      ...(config.rpcUrls && { rpcUrls: config.rpcUrls }),
    });
    this.initialized = true;
  }

  async getSwapRoute(params: SwapParams): Promise<Route> {
    this.ensureInitialized();

    const routeRequest: RoutesRequest = {
      fromChainId: SUI_CHAIN_ID,
      toChainId: SUI_CHAIN_ID,
      fromTokenAddress: params.fromTokenAddress,
      toTokenAddress: params.toTokenAddress,
      fromAmount: params.amount,
      fromAddress: params.fromAddress,
      toAddress: params.toAddress || params.fromAddress,
      options: {
        slippage: params.slippage || 0.03,
        allowSwitchChain: false,
      },
    };

    const routeResponse = await getRoutes(routeRequest);

    if (!routeResponse.routes || routeResponse.routes.length === 0) {
      throw new Error("No routes found for swap");
    }

    return routeResponse.routes[0];
  }

  async getBridgeRoute(params: BridgeParams): Promise<Route> {
    this.ensureInitialized();

    const routeRequest: RoutesRequest = {
      fromChainId: params.fromChainId,
      toChainId: params.toChainId,
      fromTokenAddress: params.fromTokenAddress,
      toTokenAddress: params.toTokenAddress,
      fromAmount: params.amount,
      fromAddress: params.fromAddress,
      toAddress: params.toAddress || params.fromAddress,
      options: {
        slippage: params.slippage || 0.03,
        ...(params.allowBridges && { bridges: { allow: params.allowBridges } }),
      },
    };

    const routeResponse = await getRoutes(routeRequest);

    if (!routeResponse.routes || routeResponse.routes.length === 0) {
      throw new Error("No bridge routes found");
    }

    return routeResponse.routes[0];
  }

  async getQuoteForRoute(params: SwapParams | BridgeParams): Promise<LiFiStep> {
    this.ensureInitialized();

    const isBridge = "fromChainId" in params;

    const quoteRequest: QuoteRequest = isBridge
      ? {
          fromChain: params.fromChainId,
          toChain: params.toChainId,
          fromToken: params.fromTokenAddress,
          toToken: params.toTokenAddress,
          fromAmount: params.amount,
          fromAddress: params.fromAddress,
        }
      : {
          fromChain: SUI_CHAIN_ID,
          toChain: SUI_CHAIN_ID,
          fromToken: params.fromTokenAddress,
          toToken: params.toTokenAddress,
          fromAmount: params.amount,
          fromAddress: params.fromAddress,
        };

    return await getQuote(quoteRequest);
  }

  async getTransactionStatus(
    txHash: string,
    bridge: string,
    fromChainId: ChainId,
    toChainId: ChainId,
  ): Promise<StatusResponse> {
    this.ensureInitialized();

    return await getStatus({
      txHash,
      bridge,
      fromChain: fromChainId,
      toChain: toChainId,
    });
  }

  async pollTransactionStatus(
    txHash: string,
    bridge: string,
    fromChainId: ChainId,
    toChainId: ChainId,
    onUpdate?: (status: StatusResponse) => void,
    maxAttempts = 60,
    intervalMs = 5000,
  ): Promise<StatusResponse> {
    this.ensureInitialized();

    let attempts = 0;
    let result: StatusResponse;

    do {
      if (attempts > 0) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }

      result = await this.getTransactionStatus(
        txHash,
        bridge,
        fromChainId,
        toChainId,
      );

      if (onUpdate) {
        onUpdate(result);
      }

      attempts++;

      if (result.status === "DONE" || result.status === "FAILED") {
        break;
      }

      if (attempts >= maxAttempts) {
        throw new Error("Transaction status polling timeout");
      }
    } while (true);

    return result;
  }

  async getSupportedChains(): Promise<ExtendedChain[]> {
    this.ensureInitialized();

    const chains = await getChains({});

    return chains;
  }

  async getSuiChainInfo(): Promise<ExtendedChain | undefined> {
    const chains = await this.getSupportedChains();
    return chains.find((chain) => chain.id === SUI_CHAIN_ID);
  }

  async getTokensForChain(chainId: ChainId): Promise<Token[]> {
    this.ensureInitialized();

    const response = await getTokens({ chains: [chainId] });
    return response.tokens[chainId] || [];
  }

  async getSuiTokens(): Promise<Token[]> {
    return this.getTokensForChain(SUI_CHAIN_ID);
  }

  async findToken(
    chainId: ChainId,
    tokenAddress: string,
  ): Promise<Token | undefined> {
    const tokens = await this.getTokensForChain(chainId);
    return tokens.find(
      (token) => token.address.toLowerCase() === tokenAddress.toLowerCase(),
    );
  }

  async getSupportedBridgesForSui(): Promise<
    Array<{ name: string; key: string; connectedChains: ExtendedChain[] }>
  > {
    const chains = await this.getSupportedChains();
    const suiChain = chains.find((chain) => chain.id === SUI_CHAIN_ID);

    if (!suiChain) {
      return [];
    }

    const bridgeMap = new Map<
      string,
      { name: string; key: string; connectedChainIds: Set<number> }
    >();

    return Array.from(bridgeMap.values()).map((bridge) => ({
      name: bridge.name,
      key: bridge.key,
      connectedChains: chains.filter((chain) =>
        bridge.connectedChainIds.has(chain.id),
      ),
    }));
  }

  async getContractCallsQuote(params: ContractCallParams): Promise<LiFiStep> {
    this.ensureInitialized();

    const request: ContractCallsQuoteRequest = {
      fromChain: params.fromChainId,
      fromToken: params.fromTokenAddress,
      fromAddress: params.fromAddress,
      toChain: params.toChainId,
      toToken: params.toTokenAddress,
      toAmount: params.toAmount,
      contractCalls: params.contractCalls,
    };

    return await getContractCallsQuote(request);
  }

  async executeRouteWithOptions(
    route: Route,
    options?: ExecuteRouteOptions,
  ): Promise<RouteExtended> {
    this.ensureInitialized();

    return await executeRoute(route, options);
  }

  async executeStep(
    step: LiFiStep,
    options: ExecuteStepOptions,
  ): Promise<{ txHash: Hash; receipt: unknown }> {
    this.ensureInitialized();

    const walletClient = options.walletClient as WalletClient;

    await checkAndSetTokenAllowance(
      step,
      walletClient,
      options.accountAddress as `0x${string}`,
    );

    if (!step.transactionRequest) {
      throw new Error("No transaction request in step");
    }

    const txHash = await executeTransaction(
      walletClient,
      walletClient.account,
      step.transactionRequest,
    );

    const receipt = await waitForTransactionReceipt(walletClient, txHash);

    if (options.updateRouteHook) {
      console.info("Step executed - tx:", txHash);
    }

    return { txHash, receipt };
  }

  async executeStepAndWaitForCompletion(
    step: LiFiStep,
    options: ExecuteStepOptions,
  ): Promise<StatusResponse> {
    const { txHash } = await this.executeStep(step, options);

    if (step.action.fromChainId === step.action.toChainId) {
      return {
        status: "DONE",
        substatus: "COMPLETED",
        transactionId: txHash,
      } as StatusResponse;
    }

    return await this.pollTransactionStatus(
      txHash,
      step.tool,
      step.action.fromChainId,
      step.action.toChainId,
      undefined,
      60,
      5000,
    );
  }

  async executeRouteSteps(
    route: Route,
    walletClient: WalletClient,
    accountAddress: string,
    onStepUpdate?: (stepIndex: number, status: string) => void,
  ): Promise<StatusResponse[]> {
    this.ensureInitialized();

    const results: StatusResponse[] = [];

    for (let i = 0; i < route.steps.length; i++) {
      const step = route.steps[i];

      if (onStepUpdate) {
        onStepUpdate(i, "PENDING");
      }

      const result = await this.executeStepAndWaitForCompletion(step, {
        walletClient,
        accountAddress,
      });

      results.push(result);

      if (onStepUpdate) {
        onStepUpdate(i, result.status);
      }

      if (result.status === "FAILED") {
        throw new Error(`Step ${i} failed: ${result.substatus}`);
      }
    }

    return results;
  }

  async getMultihopBridgeQuote(params: MultihopParams): Promise<{
    firstLegQuote: LiFiStep;
    secondLegQuote: LiFiStep;
    totalSteps: number;
  }> {
    this.ensureInitialized();

    const secondLegQuote = await getQuote({
      fromChain: params.intermediateChainId,
      fromToken: params.intermediateTokenAddress,
      fromAmount: params.amount,
      toChain: params.toChainId,
      toToken: params.toTokenAddress,
      fromAddress: params.fromAddress,
      allowBridges: params.allowBridges,
      maxPriceImpact: 0.4,
    });

    const firstLegRequest: ContractCallsQuoteRequest = {
      fromChain: params.fromChainId,
      fromToken: params.fromTokenAddress,
      fromAddress: params.fromAddress,
      toChain: secondLegQuote.action.fromChainId,
      toToken: secondLegQuote.action.fromToken.address,
      toAmount: secondLegQuote.action.fromAmount,
      contractCalls: [
        {
          fromAmount: secondLegQuote.action.fromAmount,
          fromTokenAddress: secondLegQuote.action.fromToken.address,
          toContractAddress: secondLegQuote.transactionRequest!.to!,
          toContractCallData:
            secondLegQuote.transactionRequest!.data!.toString(),
          toContractGasLimit:
            secondLegQuote.transactionRequest!.gasLimit!.toString(),
        },
      ],
    };

    const firstLegQuote = await getContractCallsQuote(firstLegRequest);

    return {
      firstLegQuote,
      secondLegQuote,
      totalSteps: 2,
    };
  }

  async executeMultihopBridge(
    params: MultihopParams,
    walletClient: WalletClient,
    accountAddress: string,
  ): Promise<StatusResponse> {
    const { firstLegQuote } = await this.getMultihopBridgeQuote(params);

    return await this.executeStepAndWaitForCompletion(firstLegQuote, {
      walletClient,
      accountAddress,
    });
  }

  async getKlimaRetireQuote(params: KlimaRetireParams): Promise<LiFiStep> {
    this.ensureInitialized();

    const request: ContractCallsQuoteRequest = {
      fromChain: params.fromChainId,
      fromToken: params.fromTokenAddress,
      fromAddress: params.fromAddress,
      toChain: params.toChainId,
      toToken: params.klimaSourceTokenAddress,
      toAmount: params.retireAmount,
      contractCalls: [
        {
          fromAmount: params.retireAmount,
          fromTokenAddress: params.klimaSourceTokenAddress,
          toContractAddress: params.klimaContractAddress,
          toContractCallData: "0x",
          toContractGasLimit: "1300000",
        },
      ],
    };

    return await getContractCallsQuote(request);
  }

  async executeKlimaRetire(
    params: KlimaRetireParams,
    walletClient: WalletClient,
    accountAddress: string,
  ): Promise<StatusResponse> {
    const quote = await this.getKlimaRetireQuote(params);

    return await this.executeStepAndWaitForCompletion(quote, {
      walletClient,
      accountAddress,
    });
  }

  async getPolynomialDepositQuote(
    params: PolynomialDepositParams,
  ): Promise<LiFiStep> {
    this.ensureInitialized();

    const request: ContractCallsQuoteRequest = {
      fromChain: params.fromChainId,
      fromToken: params.fromTokenAddress,
      fromAddress: params.fromAddress,
      toChain: params.toChainId,
      toToken: params.polynomialTokenAddress,
      toAmount: params.depositAmount,
      contractCalls: [
        {
          fromAmount: params.depositAmount,
          fromTokenAddress: params.polynomialTokenAddress,
          toContractAddress: params.polynomialContractAddress,
          toContractCallData: "0x",
          toContractGasLimit: "200000",
        },
      ],
    };

    return await getContractCallsQuote(request);
  }

  async executePolynomialDeposit(
    params: PolynomialDepositParams,
    walletClient: WalletClient,
    accountAddress: string,
  ): Promise<StatusResponse> {
    const quote = await this.getPolynomialDepositQuote(params);

    return await this.executeStepAndWaitForCompletion(quote, {
      walletClient,
      accountAddress,
    });
  }

  async getYearnDepositQuote(params: YearnDepositParams): Promise<LiFiStep> {
    this.ensureInitialized();

    const request: ContractCallsQuoteRequest = {
      fromChain: params.fromChainId,
      fromToken: params.fromTokenAddress,
      fromAddress: params.fromAddress,
      toChain: params.toChainId,
      toToken: params.vaultAssetAddress,
      toAmount: params.depositAmount,
      contractCalls: [
        {
          fromAmount: params.depositAmount,
          fromTokenAddress: params.vaultAssetAddress,
          toContractAddress: params.vaultAddress,
          toContractCallData: "0x",
          toContractGasLimit: "100000",
        },
      ],
    };

    return await getContractCallsQuote(request);
  }

  async executeYearnDeposit(
    params: YearnDepositParams,
    walletClient: WalletClient,
    accountAddress: string,
  ): Promise<StatusResponse> {
    const quote = await this.getYearnDepositQuote(params);

    return await this.executeStepAndWaitForCompletion(quote, {
      walletClient,
      accountAddress,
    });
  }

  async getToAmountBridgeQuote(
    params: ToAmountBridgeParams,
  ): Promise<LiFiStep> {
    this.ensureInitialized();

    const request: ContractCallsQuoteRequest = {
      fromChain: params.fromChainId,
      fromToken: params.fromTokenAddress,
      fromAddress: params.fromAddress,
      toChain: params.toChainId,
      toToken: params.toTokenAddress,
      toAmount: params.toAmount,
      contractCalls: [],
    };

    return await getContractCallsQuote(request);
  }

  async executeToAmountBridge(
    params: ToAmountBridgeParams,
    walletClient: WalletClient,
    accountAddress: string,
  ): Promise<StatusResponse> {
    const quote = await this.getToAmountBridgeQuote(params);

    return await this.executeStepAndWaitForCompletion(quote, {
      walletClient,
      accountAddress,
    });
  }

  setWalletClient(walletClient: WalletClient, accountAddress: string): void {
    this.walletClient = walletClient;
    this.accountAddress = accountAddress;
  }

  getWalletClient(): WalletClient | undefined {
    return this.walletClient;
  }

  getAccountAddress(): string | undefined {
    return this.accountAddress;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("LifiSuiService not initialized");
    }
  }
}

export const createLifiSuiService = (config: SuiLifiConfig) => {
  return new LifiSuiService(config);
};
