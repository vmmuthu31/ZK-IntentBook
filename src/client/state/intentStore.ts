"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Intent, IntentStatus, EncryptedIntent } from "@/shared/types";

interface PendingIntent {
  intent: Intent;
  encrypted: EncryptedIntent;
  status: IntentStatus;
  submittedAt: number;
}

interface IntentState {
  pendingIntents: PendingIntent[];
  historyIntents: PendingIntent[];

  addIntent: (intent: Intent, encrypted: EncryptedIntent) => void;
  updateIntentStatus: (
    id: string,
    status: IntentStatus["status"],
    execution?: IntentStatus["execution"],
  ) => void;
  removeIntent: (id: string) => void;
  clearHistory: () => void;
  getIntent: (id: string) => PendingIntent | undefined;
}

export const useIntentStore = create<IntentState>()(
  persist(
    (set, get) => ({
      pendingIntents: [],
      historyIntents: [],

      addIntent: (intent, encrypted) => {
        const pendingIntent: PendingIntent = {
          intent,
          encrypted,
          status: {
            id: intent.id,
            status: "pending",
            commitmentHash: encrypted.commitmentHash,
          },
          submittedAt: Date.now(),
        };

        set((state) => ({
          pendingIntents: [pendingIntent, ...state.pendingIntents],
        }));
      },

      updateIntentStatus: (id, status, execution) => {
        set((state) => {
          const intentIndex = state.pendingIntents.findIndex(
            (p) => p.intent.id === id,
          );

          if (intentIndex === -1) return state;

          const updatedIntents = [...state.pendingIntents];
          const updatedIntent = { ...updatedIntents[intentIndex] };

          updatedIntent.status = {
            ...updatedIntent.status,
            status,
            execution,
          };

          if (
            status === "settled" ||
            status === "expired" ||
            status === "cancelled"
          ) {
            updatedIntents.splice(intentIndex, 1);
            return {
              pendingIntents: updatedIntents,
              historyIntents: [updatedIntent, ...state.historyIntents].slice(
                0,
                50,
              ),
            };
          }

          updatedIntents[intentIndex] = updatedIntent;
          return { pendingIntents: updatedIntents };
        });
      },

      removeIntent: (id) => {
        set((state) => ({
          pendingIntents: state.pendingIntents.filter(
            (p) => p.intent.id !== id,
          ),
        }));
      },

      clearHistory: () => {
        set({ historyIntents: [] });
      },

      getIntent: (id) => {
        const state = get();
        return (
          state.pendingIntents.find((p) => p.intent.id === id) ||
          state.historyIntents.find((p) => p.intent.id === id)
        );
      },
    }),
    {
      name: "zk-intentbook-intents",
      storage: createJSONStorage(() => localStorage, {
        replacer: (key, value) => {
          if (typeof value === "bigint") {
            return { __type: "bigint", value: value.toString() };
          }
          return value;
        },
        reviver: (key, value) => {
          if (
            value &&
            typeof value === "object" &&
            "__type" in value &&
            value.__type === "bigint"
          ) {
            return BigInt((value as unknown as { value: string }).value);
          }
          return value;
        },
      }),
    },
  ),
);
