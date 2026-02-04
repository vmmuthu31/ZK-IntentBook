"use server";

import { getSuiClient } from "../config/sui";
import { POOLS } from "@/shared/constants/pools";

const suiClient = getSuiClient();

export interface SolverInfo {
  id: string;
  address: string;
  name: string;
  isActive: boolean;
  proofTime: number | null;
  successRate: number;
  totalSettlements: number;
  lastActiveAt: Date | null;
}

export interface SolverStatus {
  solvers: SolverInfo[];
  activeSolverCount: number;
  totalSettlementsToday: number;
}

const KNOWN_SOLVER_ADDRESSES = [
  {
    address:
      "0x0000000000000000000000000000000000000000000000000000000000000001",
    name: "FastProver",
  },
  {
    address:
      "0x0000000000000000000000000000000000000000000000000000000000000002",
    name: "DeepSolve",
  },
  {
    address:
      "0x0000000000000000000000000000000000000000000000000000000000000003",
    name: "ZK-Master",
  },
];

export async function getSolverStatus(): Promise<SolverStatus> {
  const solvers: SolverInfo[] = [];

  for (const solverAddr of KNOWN_SOLVER_ADDRESSES) {
    try {
      const txHistory = await suiClient.queryTransactionBlocks({
        filter: { FromAddress: solverAddr.address },
        options: { showInput: true, showEffects: true },
        limit: 50,
      });

      const successfulTxs = txHistory.data.filter(
        (tx) => tx.effects?.status?.status === "success",
      );

      const lastTx = txHistory.data[0];
      const lastActiveAt = lastTx?.timestampMs
        ? new Date(parseInt(lastTx.timestampMs))
        : null;

      const isActive =
        lastActiveAt &&
        Date.now() - lastActiveAt.getTime() < 24 * 60 * 60 * 1000;

      solvers.push({
        id: solverAddr.address.slice(0, 8),
        address: solverAddr.address,
        name: solverAddr.name,
        isActive: Boolean(isActive),
        proofTime: null,
        successRate:
          txHistory.data.length > 0
            ? (successfulTxs.length / txHistory.data.length) * 100
            : 0,
        totalSettlements: successfulTxs.length,
        lastActiveAt,
      });
    } catch {
      solvers.push({
        id: solverAddr.address.slice(0, 8),
        address: solverAddr.address,
        name: solverAddr.name,
        isActive: false,
        proofTime: null,
        successRate: 0,
        totalSettlements: 0,
        lastActiveAt: null,
      });
    }
  }

  const activeSolverCount = solvers.filter((s) => s.isActive).length;

  return {
    solvers,
    activeSolverCount,
    totalSettlementsToday: solvers.reduce(
      (sum, s) => sum + s.totalSettlements,
      0,
    ),
  };
}

export interface SettlementEvent {
  digest: string;
  timestamp: Date;
  solver: string;
  pair: string;
  baseAmount: string;
  quoteAmount: string;
  proofVerified: boolean;
  blockNumber: number;
}

export async function getRecentSettlements(
  limit = 20,
): Promise<SettlementEvent[]> {
  const settlements: SettlementEvent[] = [];

  for (const pool of Object.values(POOLS)) {
    try {
      const events = await suiClient.queryEvents({
        query: {
          MoveEventType: `${pool.id}::settlement::SettlementCompleted`,
        },
        limit: Math.min(limit, 10),
      });

      for (const event of events.data) {
        const parsedJson = event.parsedJson as {
          solver?: string;
          base_amount?: string;
          quote_amount?: string;
          proof_verified?: boolean;
        };

        settlements.push({
          digest: event.id.txDigest,
          timestamp: new Date(parseInt(event.timestampMs ?? "0")),
          solver: (parsedJson?.solver ?? "unknown").slice(0, 16),
          pair: pool.name,
          baseAmount: parsedJson?.base_amount ?? "0",
          quoteAmount: parsedJson?.quote_amount ?? "0",
          proofVerified: parsedJson?.proof_verified ?? true,
          blockNumber: 0,
        });
      }
    } catch {
      continue;
    }
  }

  return settlements.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );
}

export interface SolverMetrics {
  avgProofTime: number;
  successRate: number;
  totalVolume: string;
  recentActivity: number;
}

export async function getSolverMetrics(
  _solverAddress: string,
): Promise<SolverMetrics> {
  return {
    avgProofTime: 0,
    successRate: 0,
    totalVolume: "0",
    recentActivity: 0,
  };
}
