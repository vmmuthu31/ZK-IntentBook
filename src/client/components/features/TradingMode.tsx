"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SimpleSwap } from "./SimpleSwap";
import { AdvancedTrading } from "./AdvancedTrading";
import { PrivateIntent } from "./PrivateIntent";
import { Zap, BarChart3, Shield } from "lucide-react";

export function TradingMode() {
  return (
    <Tabs defaultValue="private" className="w-full">
      <TabsList className=" w-full  bg-slate-800/50 border border-white/5 p-1 rounded-xl h-auto">
        <TabsTrigger
          value="swap"
          className="flex items-center gap-2 py-3 data-[state=active]:bg-cyan-600 data-[state=active]:text-white rounded-lg transition-all"
        >
          <Zap className="h-4 w-4" />
          <span className="hidden sm:inline">Simple Swap</span>
          <span className="sm:hidden">Swap</span>
        </TabsTrigger>
        <TabsTrigger
          value="advanced"
          className="flex items-center gap-2 py-3 data-[state=active]:bg-cyan-600 data-[state=active]:text-white rounded-lg transition-all"
        >
          <BarChart3 className="h-4 w-4" />
          <span className="hidden sm:inline">Advanced</span>
          <span className="sm:hidden">Pro</span>
        </TabsTrigger>
        <TabsTrigger
          value="private"
          className="flex items-center gap-2 py-3 data-[state=active]:bg-cyan-600 data-[state=active]:text-white rounded-lg transition-all"
        >
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">Private Intent</span>
          <span className="sm:hidden">Private</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="swap" className="mt-6">
        <SimpleSwap />
      </TabsContent>

      <TabsContent value="advanced" className="mt-6">
        <AdvancedTrading />
      </TabsContent>

      <TabsContent value="private" className="mt-6">
        <PrivateIntent />
      </TabsContent>
    </Tabs>
  );
}
