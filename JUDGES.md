# 🏆 JUDGES.md — ZK-IntentBook

> **One-line summary:** Private, MEV-resistant trading on DeepBook using ZK proofs and a solver competition model.

---

## 📌 What This Project Does

ZK-IntentBook is a **privacy layer for Sui's DeepBook CLOB** that:

1. **Encrypts trading intents** — Users submit encrypted orders; no one sees the trade until execution
2. **Runs solver competitions** — Multiple solvers race to fill intents, competing on execution quality
3. **Verifies with ZK proofs** — Every execution is cryptographically proven correct without revealing details
4. **Integrates DeepBook referrals** — Sustainable revenue model using Sui's native fee infrastructure

---

## 🎯 Why This Should Win

### 1. **Solves a Real Problem**

MEV extraction on transparent order books costs traders millions. We provide infrastructure-level privacy without changing DeepBook itself.

### 2. **Sui-Native Architecture**

- Uses **PTBs** for atomic proof verification + settlement
- **Parallel execution** of ZK verification and trade execution
- **Move contracts** for on-chain intent registry and verification
- **zkLogin integration** for privacy-preserving identity

### 3. **Production-Ready Design**

- Revenue model via DeepBook referral fees
- Decentralized solver competition (not trusted operator)
- Works with existing DeepBook liquidity
- Frontend can earn fees by routing trades

---

## 🖥️ Demo Steps (Click-by-Click)

### Step 1: See the Problem

1. Open the app at `localhost:3000`
2. Click **"Private Intent"** tab
3. Look at the **"Public vs Private Comparison"** panel
4. Drag the trade size slider to $5,000
5. **Observe:** Public trades show MEV loss + slippage; Private shows protection

### Step 2: Submit a Private Intent

1. In the Private Intent form, select **Buy SUI/USDC**
2. Enter amount: **1000**
3. Toggle **MEV Protection** ON
4. Click **"Submit Private Intent"**
5. **See:** Intent is encrypted, commitment hash displayed

### Step 3: Watch Solver Competition

1. Scroll to **"Solver Competition"** panel
2. Click **"Start Solver Race"**
3. **Watch:** 4 solvers compete in real-time
4. See proof times, failures, and winner announcement

### Step 4: Verify Sui-Native Design

1. Open **"Why Sui?"** panel
2. **See:** PTB workflow diagram
3. **See:** Comparison with EVM chains

### Step 5: Check Referral Transparency

1. Open **"Referral Transparency"** panel
2. **See:** Trade history with referral addresses in proofs
3. **See:** Fee earnings and volume metrics

---

## ⚙️ Data Sources

| Component            | Status  | Data Source                                          |
| -------------------- | ------- | ---------------------------------------------------- |
| Move Contracts       | ✅ Real | `intent_registry`, `settlement`, `zk_verifier`       |
| Rust ZK Prover       | ✅ Real | Plonky3 circuit for intent verification              |
| TypeScript Solver    | ✅ Real | Order book matching + proof generation               |
| Intent Encryption    | ✅ Real | AES-256-GCM with hash commitments                    |
| DeepBook Integration | ✅ Real | Live DeepBook V3 testnet indexer                     |
| zkLogin              | ✅ Real | OAuth → ZK proof flow                                |
| Wallet Balances      | ✅ Real | On-chain `suix_getBalance` RPC calls                 |
| Pool Data            | ✅ Real | DeepBook indexer `/get_pools`                        |
| Price Rates          | ✅ Real | DeepBook indexer `/get_net_price`                    |
| Solver Status        | ✅ Real | On-chain transaction history queries                 |
| Referral Data        | ✅ Real | On-chain `getOwnedObjects` queries                   |
| Lending Pools        | ✅ Real | On-chain object queries with calculated APY fallback |
| MEV Comparison       | ✅ Real | Live orderbook analysis via DeepBook SDK             |

---

## 🔧 Tech Stack

| Layer          | Technology            |
| -------------- | --------------------- |
| **Blockchain** | Sui (Move contracts)  |
| **ZK System**  | Plonky3 (Rust)        |
| **DEX**        | DeepBook v3           |
| **Frontend**   | Next.js 15 + React 19 |
| **Wallet**     | @mysten/dapp-kit      |
| **Identity**   | zkLogin               |
| **Styling**    | Tailwind + shadcn/ui  |

---

## 📁 Key Files

```
contracts/
├── sources/
│   ├── intent_registry.move   # On-chain intent commitments
│   ├── settlement.move        # Trade settlement logic
│   └── zk_verifier.move       # ZK proof verification

zk-prover/
├── src/
│   ├── circuits/              # Plonky3 ZK circuits
│   ├── prover.rs              # Proof generation
│   └── api/                   # HTTP prover service

solver/
├── src/
│   ├── solver.ts              # Intent matching engine
│   ├── prover.ts              # Proof request handling
│   └── settlement.ts          # DeepBook execution

src/
├── client/components/features/
│   ├── PrivateIntent.tsx      # Main trading UI
│   ├── IntentComparator.tsx   # Public vs Private visual
│   ├── SolverRace.tsx         # Solver competition UI
│   └── WhySuiPanel.tsx        # Sui-native explainer
```

---

## 🚀 Post-Hackathon Roadmap

1. **Private Lending Intents** — Borrow/lend without revealing positions
2. **Institutional API** — Direct solver integration for market makers
3. **Cross-Pool Arbitrage** — Intent-based arbitrage across DeepBook pools
4. **Compliance Mode** — Selective disclosure for regulated entities

---

## 💡 Key Insight

> **"Solvers can be AI-powered, but the protocol does not trust AI. It only trusts ZK proofs."**

This is not an AI trading bot. This is verifiable infrastructure.

---

## 📞 Contact

- **Team:** ZK-IntentBook
- **GitHub:** [Repository Link]
- **Demo:** `npm run dev` → `localhost:3000`

---

## 🎬 60-Second Demo Script

_For live judging or video:_

> "This is a $1,000 trade on DeepBook. Normally, everyone sees your order before it executes—MEV bots can front-run you.
>
> Now watch what happens with ZK-IntentBook. I toggle Private Mode... my intent is encrypted. No one sees the price.
>
> Behind the scenes, solvers compete to fill my order. They have to prove they executed correctly using ZK proofs.
>
> The winning solver's proof is verified on-chain, the trade settles on DeepBook, and I pay less slippage.
>
> This works because Sui's PTBs let us verify the proof and settle the trade in one atomic transaction.
>
> The frontend earns referral fees. The user gets privacy. DeepBook keeps its liquidity.
>
> ZK-IntentBook: private trading infrastructure for Sui."

---

**Good luck with judging! 🏆**
