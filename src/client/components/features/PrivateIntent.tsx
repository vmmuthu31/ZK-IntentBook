"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Shield,
  Lock,
  Clock,
  ChevronDown,
  Eye,
  Sparkles,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { CreateIntentSchema, type CreateIntentInput } from "@/shared/schemas";
import { ASSET_LIST, POOL_LIST } from "@/shared/constants";
import { useIntentWallet } from "@/client/hooks";
import { useIntentStore } from "@/client/state/intentStore";
import { submitIntent } from "@/server/actions/intent.actions";
import { toast } from "sonner";

export function PrivateIntent() {
  const { connected, address, signIntent, signAndExecuteTransaction } =
    useIntentWallet();
  const { addIntent } = useIntentStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mevProtection, setMevProtection] = useState(true);
  const [deadline, setDeadline] = useState(30);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateIntentInput>({
    resolver: zodResolver(CreateIntentSchema),
    defaultValues: {
      intentType: "swap",
      baseAsset: ASSET_LIST[0].type,
      quoteAsset: ASSET_LIST[1].type,
      poolId: POOL_LIST[0].id,
      direction: "buy",
      maxSize: "",
      deadlineSeconds: 30,
      mevProtection: true,
    },
  });

  const direction = watch("direction");

  const onSubmit = async (data: CreateIntentInput) => {
    if (!connected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitIntent({
        intent: {
          ...data,
          deadlineSeconds: deadline,
          mevProtection,
        },
        userAddress: address,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create intent");
      }

      const { intent, encrypted, transactionBytes } = result.data;

      const signature = await signIntent(encrypted.commitmentHash);

      const { Transaction } = await import("@mysten/sui/transactions");
      const tx = Transaction.from(new Uint8Array(transactionBytes));

      const txResult = await signAndExecuteTransaction(tx);

      addIntent(intent, encrypted);

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-medium">Intent Submitted!</span>
          <span className="text-xs text-slate-400">
            Commitment: {encrypted.commitmentHash.slice(0, 10)}...
          </span>
        </div>,
      );

      setValue("maxSize", "");
      setValue("minPrice", "");
      setValue("maxPrice", "");
    } catch (error) {
      console.error("Failed to submit intent:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit intent",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3">
        <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-600">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Private Intent</CardTitle>
                  <p className="text-sm text-slate-400 mt-0.5">
                    MEV-protected, encrypted trading
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                <Lock className="h-3 w-3 mr-1" />
                Encrypted
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Direction</Label>
                  <div className="flex mt-2 bg-slate-800/50 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setValue("direction", "buy")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        direction === "buy"
                          ? "bg-green-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("direction", "sell")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        direction === "sell"
                          ? "bg-red-600 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Sell
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Trading Pair</Label>
                  <Select defaultValue="SUI_USDC">
                    <SelectTrigger className="mt-2 bg-slate-800/50 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      {POOL_LIST.map((pool) => (
                        <SelectItem
                          key={pool.name}
                          value={pool.name.replace("/", "_")}
                        >
                          {pool.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-slate-300">Maximum Size</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-slate-500" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-800 border-white/10">
                        <p>Maximum amount you&apos;re willing to trade</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="relative mt-2">
                  <Input
                    {...register("maxSize")}
                    type="text"
                    placeholder="0.00"
                    className="bg-slate-800/50 border-white/10 pr-20 text-lg"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {direction === "buy" ? "USDC" : "SUI"}
                  </div>
                </div>
                {errors.maxSize && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.maxSize.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Min Price</Label>
                    <span className="text-xs text-slate-500">Optional</span>
                  </div>
                  <Input
                    {...register("minPrice")}
                    type="text"
                    placeholder="0.00"
                    className="mt-2 bg-slate-800/50 border-white/10"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Max Price</Label>
                    <span className="text-xs text-slate-500">Optional</span>
                  </div>
                  <Input
                    {...register("maxPrice")}
                    type="text"
                    placeholder="0.00"
                    className="mt-2 bg-slate-800/50 border-white/10"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-slate-300">Deadline</Label>
                  <span className="text-sm text-white font-medium">
                    {deadline}s
                  </span>
                </div>
                <Slider
                  value={[deadline]}
                  onValueChange={(value) => {
                    setDeadline(value[0]);
                    setValue("deadlineSeconds", value[0]);
                  }}
                  min={10}
                  max={300}
                  step={10}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>10s</span>
                  <span>5min</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                />
                Advanced Options
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-cyan-400" />
                      <Label className="text-slate-300">MEV Protection</Label>
                    </div>
                    <Switch
                      checked={mevProtection}
                      onCheckedChange={(checked) => {
                        setMevProtection(checked);
                        setValue("mevProtection", checked);
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    When enabled, your order details are encrypted and only
                    revealed to trusted solvers
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-cyan-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-cyan-300 font-medium">
                      How Private Intents Work
                    </p>
                    <ul className="text-xs text-slate-400 mt-2 space-y-1">
                      <li>
                        • Your intent is encrypted before leaving your browser
                      </li>
                      <li>• Only commitment hash is posted on-chain</li>
                      <li>• Solvers compete to find the best execution</li>
                      <li>
                        • ZK proofs verify correctness without revealing details
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={!connected || isSubmitting}
                className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl transition-all disabled:opacity-50"
              >
                {!connected ? (
                  "Connect Wallet"
                ) : isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Encrypting & Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Submit Private Intent
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <PrivacyStatus />
        <PendingIntents />
      </div>
    </div>
  );
}

function PrivacyStatus() {
  return (
    <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white text-base">Privacy Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatusItem
          icon={<Lock className="h-4 w-4" />}
          label="End-to-End Encryption"
          status="active"
        />
        <StatusItem
          icon={<Shield className="h-4 w-4" />}
          label="MEV Protection"
          status="active"
        />
        <StatusItem
          icon={<Eye className="h-4 w-4" />}
          label="On-chain Privacy"
          status="active"
          description="Only commitment hash visible"
        />
        <StatusItem
          icon={<Clock className="h-4 w-4" />}
          label="Solver Network"
          status="connected"
          description="3 active solvers"
        />
      </CardContent>
    </Card>
  );
}

function StatusItem({
  icon,
  label,
  status,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  status: "active" | "connected" | "warning" | "inactive";
  description?: string;
}) {
  const statusColors = {
    active: "text-green-400",
    connected: "text-cyan-400",
    warning: "text-amber-400",
    inactive: "text-slate-500",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={statusColors[status]}>{icon}</div>
        <div>
          <p className="text-sm text-white">{label}</p>
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
      <div
        className={`h-2 w-2 rounded-full ${status === "active" || status === "connected" ? "bg-green-400" : "bg-slate-500"}`}
      />
    </div>
  );
}

function PendingIntents() {
  const { pendingIntents } = useIntentStore();

  return (
    <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white text-base">Pending Intents</CardTitle>
      </CardHeader>
      <CardContent>
        {pendingIntents.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-8 w-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No pending intents</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingIntents.map((pending) => (
              <div
                key={pending.intent.id}
                className="p-3 rounded-lg bg-slate-800/50 border border-white/5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">
                    {pending.intent.direction.toUpperCase()}{" "}
                    {pending.intent.baseAsset}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {pending.status.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {pending.encrypted.commitmentHash}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
