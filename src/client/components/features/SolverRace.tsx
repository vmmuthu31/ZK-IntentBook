"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  RotateCcw,
  Users,
  Shield,
  Cpu,
  Activity,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSolverStatus,
  type SolverInfo,
} from "@/server/actions/solver.actions";

interface Solver {
  id: string;
  name: string;
  avatar: string;
  proofTime: number | null;
  status: "waiting" | "proving" | "verified" | "failed" | "winner";
  failReason?: string;
  gasEstimate: number;
  reputation: number;
}

const SOLVER_AVATARS: Record<string, string> = {
  FastProver: "⚡",
  DeepSolve: "🧠",
  "ZK-Master": "🔐",
  QuickSettle: "🚀",
};

function mapSolverInfoToSolver(info: SolverInfo): Solver {
  return {
    id: info.id,
    name: info.name,
    avatar: SOLVER_AVATARS[info.name] || "🔷",
    proofTime: info.proofTime,
    status: info.isActive ? "waiting" : "waiting",
    gasEstimate: 0.0012,
    reputation: Math.round(info.successRate),
  };
}

function SolverRow({
  solver,
  isRacing,
}: {
  solver: Solver;
  isRacing: boolean;
}) {
  const [progressValue] = useState(() => Math.random() * 80 + 10);

  const statusColors = {
    waiting: "bg-slate-600",
    proving: "bg-blue-500 animate-pulse",
    verified: "bg-green-500",
    failed: "bg-red-500",
    winner: "bg-linear-to-r from-amber-400 to-yellow-500",
  };

  const statusText = {
    waiting: "Waiting...",
    proving: "Generating Proof...",
    verified: "Proof Verified ✓",
    failed: solver.failReason || "Failed",
    winner: "🏆 Winner!",
  };

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all duration-300",
        solver.status === "winner"
          ? "bg-linear-to-r from-amber-900/30 to-yellow-900/30 border-amber-500/50"
          : solver.status === "failed"
            ? "bg-red-900/10 border-red-500/20"
            : solver.status === "verified"
              ? "bg-green-900/10 border-green-500/20"
              : "bg-slate-800/50 border-white/5",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{solver.avatar}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{solver.name}</span>
              <Badge variant="outline" className="text-xs">
                {solver.reputation}% rep
              </Badge>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Gas: ~{solver.gasEstimate} SUI
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {solver.proofTime !== null && (
            <div className="text-right">
              <div className="text-xs text-slate-400">Proof Time</div>
              <div
                className={cn(
                  "font-mono font-bold",
                  solver.status === "winner"
                    ? "text-amber-400"
                    : solver.status === "failed"
                      ? "text-red-400"
                      : "text-green-400",
                )}
              >
                {solver.proofTime}ms
              </div>
            </div>
          )}

          <Badge className={cn("px-3 py-1", statusColors[solver.status])}>
            {solver.status === "proving" && (
              <Cpu className="h-3 w-3 mr-1 animate-spin" />
            )}
            {solver.status === "verified" && (
              <CheckCircle className="h-3 w-3 mr-1" />
            )}
            {solver.status === "failed" && <XCircle className="h-3 w-3 mr-1" />}
            {solver.status === "winner" && <Trophy className="h-3 w-3 mr-1" />}
            <span className="text-xs">{statusText[solver.status]}</span>
          </Badge>
        </div>
      </div>

      {solver.status === "proving" && (
        <div className="mt-3">
          <Progress value={progressValue} className="h-1" />
        </div>
      )}
    </div>
  );
}

const SOLVER_WS_URL =
  process.env.NEXT_PUBLIC_SOLVER_WS_URL || "ws://localhost:3002";

const DEFAULT_SOLVERS: Solver[] = [
  {
    id: "solver-1",
    name: "FastProver",
    avatar: "⚡",
    proofTime: null,
    status: "waiting",
    gasEstimate: 0.0012,
    reputation: 98,
  },
  {
    id: "solver-2",
    name: "DeepSolve",
    avatar: "🧠",
    proofTime: null,
    status: "waiting",
    gasEstimate: 0.0014,
    reputation: 95,
  },
  {
    id: "solver-3",
    name: "ZK-Master",
    avatar: "🔐",
    proofTime: null,
    status: "waiting",
    gasEstimate: 0.0011,
    reputation: 92,
  },
];

export function SolverRace() {
  const [solvers, setSolvers] = useState<Solver[]>(DEFAULT_SOLVERS);
  const [isRacing, setIsRacing] = useState(false);
  const [racePhase, setRacePhase] = useState<
    "idle" | "starting" | "racing" | "complete"
  >("idle");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchSolvers = async () => {
      try {
        const status = await getSolverStatus();
        if (status.solvers.length > 0) {
          setSolvers(status.solvers.map(mapSolverInfoToSolver));
        }
      } catch {
        console.warn("Failed to fetch solver status");
      }
    };
    fetchSolvers();
  }, []);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(SOLVER_WS_URL);

        ws.onopen = () => {
          setWsConnected(true);
          ws.send(JSON.stringify({ type: "get_public_key" }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === "solver_update") {
              setSolvers((prev) =>
                prev.map((s) =>
                  s.id === message.solverId
                    ? {
                        ...s,
                        proofTime: message.proofTime,
                        status: message.status,
                        failReason: message.failReason,
                      }
                    : s,
                ),
              );
            }

            if (message.type === "race_complete") {
              setRacePhase("complete");
              setIsRacing(false);
              if (timerRef.current) clearInterval(timerRef.current);
            }
          } catch {
            console.warn("Failed to parse WebSocket message");
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          setWsConnected(false);
        };

        wsRef.current = ws;
      } catch {
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const resetRace = useCallback(() => {
    setIsRacing(false);
    setRacePhase("idle");
    setElapsedTime(0);
    setSolvers((prev) =>
      prev.map((s) => ({ ...s, status: "waiting" as const, proofTime: null })),
    );
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const startRace = useCallback(() => {
    resetRace();
    setIsRacing(true);
    setRacePhase("starting");

    setTimeout(() => {
      setRacePhase("racing");
      setSolvers((prev) =>
        prev.map((s) => ({ ...s, status: "proving" as const })),
      );

      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 10);
      }, 10);

      if (wsConnected && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "submit_intent",
            payload: {
              ciphertext: "demo_race",
              ephemeralPublicKey: "demo",
              nonce: "demo",
              commitment: "demo_" + Date.now(),
              userAddress: "0x0",
            },
          }),
        );
      } else {
        const solverResults = solvers.map((s, i) => ({
          id: s.id,
          time: 100 + Math.random() * 100 + i * 30,
          success: Math.random() > 0.2,
        }));

        solverResults.forEach((result) => {
          setTimeout(() => {
            setSolvers((prev) =>
              prev.map((s) =>
                s.id === result.id
                  ? {
                      ...s,
                      proofTime: Math.round(result.time),
                      status: result.success
                        ? ("verified" as const)
                        : ("failed" as const),
                      failReason: result.success
                        ? undefined
                        : "Constraint violation",
                    }
                  : s,
              ),
            );
          }, result.time);
        });

        const winnerResult = solverResults
          .filter((r) => r.success)
          .sort((a, b) => a.time - b.time)[0];

        if (winnerResult) {
          setTimeout(
            () => {
              setRacePhase("complete");
              setIsRacing(false);
              if (timerRef.current) {
                clearInterval(timerRef.current);
              }

              setSolvers((prev) =>
                prev.map((s) =>
                  s.id === winnerResult.id
                    ? { ...s, status: "winner" as const }
                    : s,
                ),
              );
            },
            Math.max(...solverResults.map((r) => r.time)) + 100,
          );
        }
      }
    }, 500);
  }, [resetRace, wsConnected, solvers]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const winner = solvers.find((s) => s.status === "winner");
  const successCount = solvers.filter(
    (s) => s.status === "verified" || s.status === "winner",
  ).length;
  const failCount = solvers.filter((s) => s.status === "failed").length;

  return (
    <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-600">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Solver Competition</CardTitle>
              <CardDescription>
                Watch solvers compete to execute your intent
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                wsConnected
                  ? "border-green-500/30 text-green-400"
                  : "border-slate-500/30 text-slate-400",
              )}
            >
              {wsConnected ? (
                <Wifi className="h-3 w-3 mr-1" />
              ) : (
                <WifiOff className="h-3 w-3 mr-1" />
              )}
              {wsConnected ? "Live" : "Offline"}
            </Badge>
            {racePhase !== "idle" && (
              <Badge
                className={cn(
                  "font-mono",
                  racePhase === "complete"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-blue-500/20 text-blue-400",
                )}
              >
                <Clock className="h-3 w-3 mr-1" />
                {(elapsedTime / 1000).toFixed(2)}s
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {racePhase === "complete" && winner && (
          <div className="p-4 rounded-xl bg-linear-to-r from-amber-900/30 to-yellow-900/30 border border-amber-500/30 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="h-8 w-8 text-amber-400" />
                <div>
                  <div className="text-sm text-amber-200">Winning Solver</div>
                  <div className="text-xl font-bold text-white flex items-center gap-2">
                    {winner.avatar} {winner.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Proof Generated</div>
                <div className="text-2xl font-bold font-mono text-amber-400">
                  {winner.proofTime}ms
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-slate-800/50 text-center">
            <div className="text-2xl font-bold text-white">
              {solvers.length}
            </div>
            <div className="text-xs text-slate-400">Solvers</div>
          </div>
          <div className="p-3 rounded-lg bg-green-900/20 text-center">
            <div className="text-2xl font-bold text-green-400">
              {successCount}
            </div>
            <div className="text-xs text-slate-400">Verified</div>
          </div>
          <div className="p-3 rounded-lg bg-red-900/20 text-center">
            <div className="text-2xl font-bold text-red-400">{failCount}</div>
            <div className="text-xs text-slate-400">Failed</div>
          </div>
        </div>

        <div className="space-y-3">
          {solvers.map((solver) => (
            <SolverRow key={solver.id} solver={solver} isRacing={isRacing} />
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={startRace}
            disabled={isRacing}
            className="flex-1 bg-cyan-600 hover:bg-cyan-500"
          >
            {isRacing ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-pulse" />
                Race in Progress...
              </>
            ) : racePhase === "complete" ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run New Race
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Solver Race
              </>
            )}
          </Button>
          {racePhase !== "idle" && (
            <Button variant="outline" onClick={resetRace} disabled={isRacing}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="p-3 rounded-lg bg-cyan-900/20 border border-cyan-500/20">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-cyan-400 mt-0.5" />
            <div className="text-xs text-cyan-200">
              <strong>Decentralized Execution:</strong> Multiple solvers compete
              to fill your intent. Only ZK-verified proofs are accepted,
              ensuring correctness without revealing your trade details.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
