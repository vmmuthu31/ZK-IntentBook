"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction } from "lucide-react";

export function AdvancedTrading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Order Book</CardTitle>
            <Badge
              variant="outline"
              className="border-amber-500/50 text-amber-400"
            >
              <Construction className="h-3 w-3 mr-1" />
              Coming Soon
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Construction className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  Advanced order book visualization
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  With limit orders, depth charts, and more
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Recent Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-slate-400">Trade history will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Place Order</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-slate-400">Limit & Market orders</p>
                <p className="text-sm text-slate-500 mt-1">
                  Direct DeepBook integration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Open Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px] flex items-center justify-center">
              <p className="text-slate-400 text-sm">No open orders</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
