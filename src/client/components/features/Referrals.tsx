"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { Button } from "@/client/components/ui/button";
import { Badge } from "@/client/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/client/components/ui/table";
import { useReferrals } from "@/client/hooks/useReferrals";
import { useIntentWallet } from "@/client/hooks/useWallet";
import { POOLS } from "@/shared/constants/pools";
import { formatAmount } from "@/shared/utils/formatting";
import { Coins, TrendingUp, RefreshCw, Plus, Wallet } from "lucide-react";

export function Referrals() {
  const { connected } = useIntentWallet();
  const {
    referrals,
    isLoading,
    isCreating,
    isClaiming,
    createPoolReferral,
    claimFees,
    refetch,
    totalEarnedFees,
    totalVolume,
  } = useReferrals();
  const [selectedPool, setSelectedPool] = useState<string | null>(null);

  if (!connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Referral Earnings
          </CardTitle>
          <CardDescription>
            Connect your wallet to view and manage referral earnings
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Wallet not connected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Referral Earnings
            </CardTitle>
            <CardDescription>
              Earn fees from trades executed through ZK IntentBook
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Coins className="h-4 w-4" />
              Total Earned
            </div>
            <div className="text-2xl font-bold">
              {formatAmount(totalEarnedFees, 9)} DEEP
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              Total Volume
            </div>
            <div className="text-2xl font-bold">
              ${formatAmount(totalVolume, 6)}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Pool Referrals</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pool</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Volume</TableHead>
                <TableHead className="text-right">Earned</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(POOLS).map((pool) => {
                const referral = referrals.find((r) => r.poolId === pool.id);
                const hasReferral = referral?.referralId !== null;
                const hasFees = BigInt(referral?.earnedFees || "0") > BigInt(0);

                return (
                  <TableRow key={pool.id}>
                    <TableCell className="font-medium">{pool.name}</TableCell>
                    <TableCell>
                      {hasReferral ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Not Minted</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(referral?.totalVolume || "0", 6)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(referral?.earnedFees || "0", 9)} DEEP
                    </TableCell>
                    <TableCell className="text-right">
                      {!hasReferral ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPool(pool.id);
                            createPoolReferral(pool.id);
                          }}
                          disabled={isCreating && selectedPool === pool.id}
                        >
                          {isCreating && selectedPool === pool.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Mint
                            </>
                          )}
                        </Button>
                      ) : hasFees && referral ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            claimFees(referral.referralId!, pool.id)
                          }
                          disabled={isClaiming}
                        >
                          {isClaiming ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            "Claim"
                          )}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          No fees
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
          <p className="font-medium mb-2">How Referral Earnings Work</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Mint a referral NFT for each pool to start earning fees</li>
            <li>
              Earn a portion of trading fees from intents routed through your
              referral
            </li>
            <li>Fees are paid in DEEP tokens and can be claimed anytime</li>
            <li>
              ZK IntentBook automatically uses your referral when executing
              trades
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
