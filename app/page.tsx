"use client";
import { MainLayout } from "@/client/components/layouts";
import { TradingMode } from "@/client/components/features";

export default function Home() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Trade Privately on DeepBook
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Submit encrypted intents, let solvers compete for best execution,
            and verify with ZK proofs. No MEV, no front-running.
          </p>
        </div>

        <TradingMode />
      </div>
    </MainLayout>
  );
}
