import type { LiFiStep, TransactionRequest } from "@lifi/sdk";
import { getTokenAllowance, setTokenAllowance } from "@lifi/sdk";
import type { Address, Hash, SendTransactionParameters } from "viem";

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000" as Address;

export async function checkAndSetTokenAllowance(
  step: LiFiStep,
  walletClient: any,
  accountAddress: Address,
): Promise<void> {
  if (step.action.fromToken.address === ADDRESS_ZERO) {
    return;
  }

  const approval = await getTokenAllowance(
    step.action.fromToken,
    accountAddress,
    step.estimate.approvalAddress as Address,
  );

  if (approval !== undefined && approval < BigInt(step.action.fromAmount)) {
    const txHash = await setTokenAllowance({
      walletClient,
      spenderAddress: step.estimate.approvalAddress,
      token: step.action.fromToken,
      amount: BigInt(step.action.fromAmount),
    });

    if (txHash) {
      const receipt = await walletClient.waitForTransactionReceipt({
        hash: txHash,
        retryCount: 20,
        retryDelay: ({ count }: { count: number }) =>
          Math.min(~~(1 << count) * 200, 3000),
      });

      console.info(
        `Token allowance set - amount: ${step.action.fromAmount}, tx: ${receipt.transactionHash}`,
      );
    }
  }
}

export function transformTxRequestToSendParams(
  account: any,
  txRequest?: TransactionRequest,
): SendTransactionParameters {
  if (!txRequest) {
    throw new Error("Transaction request is required");
  }

  return {
    to: txRequest.to as Address,
    account,
    data: txRequest.data as Hash,
    value: txRequest.value ? BigInt(txRequest.value) : undefined,
    gas: txRequest.gasLimit ? BigInt(txRequest.gasLimit as string) : undefined,
    gasPrice: txRequest.gasPrice
      ? BigInt(txRequest.gasPrice as string)
      : undefined,
    chain: null,
  };
}

export async function executeTransaction(
  walletClient: any,
  account: any,
  txRequest: TransactionRequest,
): Promise<Hash> {
  const sendParams = transformTxRequestToSendParams(account, txRequest);
  const hash = await walletClient.sendTransaction(sendParams);
  return hash;
}

export async function waitForTransactionReceipt(walletClient: any, hash: Hash) {
  return await walletClient.waitForTransactionReceipt({
    hash,
    retryCount: 20,
    retryDelay: ({ count }: { count: number }) =>
      Math.min(~~(1 << count) * 200, 3000),
  });
}
