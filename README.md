# ZK-IntentBook 🛡️⚡

> **Privacy-Preserving, Intent-Based Trading on DeepBook**

A next-generation trading frontend for Sui's DeepBook that prioritizes user privacy through encrypted intents, competitive solver execution, and zero-knowledge proof verification. Trade without MEV, front-running, or exposing your strategy.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Sui](https://img.shields.io/badge/Sui-Testnet-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-16-black)

---

## 🌟 Features

### 🔐 Privacy-First Trading

- **Encrypted Intents**: Your trading parameters are encrypted client-side before leaving your browser
- **On-Chain Privacy**: Only commitment hashes are posted on-chain, keeping your strategy private
- **MEV Protection**: No front-running or sandwich attacks - your intent is invisible to the mempool

### ⚡ Intent-Based Architecture

- **High-Level Orders**: Specify _what_ you want, not _how_ to execute it
- **Solver Competition**: Multiple solvers compete to find the best execution path
- **Flexible Parameters**: Set price bounds, deadlines, and MEV protection preferences

### 🔬 ZK Proof Verification

- **Plonky3 Integration**: Fast STARK proofs generated off-chain
- **On-Chain Verification**: Move smart contracts verify execution correctness
- **Trustless Execution**: Cryptographic guarantees without revealing trade details

### 💰 DeepBook Integration

- **Native CLOB**: Direct integration with Sui's high-performance order book
- **Referral Fees**: Earn fees on all trades executed through the platform
- **Multiple Pools**: Support for SUI/USDC, DEEP/USDC, WAL/USDC, and more

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Simple Swap  │  │  Advanced    │  │Private Intent│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                           ↓                                  │
│                  Intent Encryption                           │
│                  Commitment Hash                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Sui Blockchain                            │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Intent Registry  │  │  ZK Verifier     │                │
│  │ (Move Contract)  │  │  (Move Contract) │                │
│  └──────────────────┘  └──────────────────┘                │
│           ↓                      ↑                           │
│  ┌──────────────────────────────────────┐                   │
│  │      DeepBook V3 (CLOB)              │                   │
│  │  • Order Matching                    │                   │
│  │  • Balance Management                │                   │
│  │  • Referral Fees                     │                   │
│  └──────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────────┐
│                   Solver Network                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Solver 1    │  │  Solver 2    │  │  Solver 3    │      │
│  │ • Decrypt    │  │ • Decrypt    │  │ • Decrypt    │      │
│  │ • Optimize   │  │ • Optimize   │  │ • Optimize   │      │
│  │ • Execute    │  │ • Execute    │  │ • Execute    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                           ↓                                  │
│                  ZK Proof Generation                         │
│                  (Plonky3 Prover)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ or **Bun** 1.0+
- **Sui Wallet** (Suiet, Sui Wallet, or Stashed)
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/zk-intentbook.git
cd zk-intentbook

# Install dependencies
bun install
# or
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run the development server
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
zk-intentbook/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Home page
│
├── src/
│   ├── client/                   # Browser-only code
│   │   ├── components/
│   │   │   ├── features/         # Trading components
│   │   │   │   ├── TradingMode.tsx
│   │   │   │   ├── SimpleSwap.tsx
│   │   │   │   ├── AdvancedTrading.tsx
│   │   │   │   └── PrivateIntent.tsx
│   │   │   ├── layouts/
│   │   │   │   └── MainLayout.tsx
│   │   │   └── ui/               # shadcn/ui components
│   │   ├── hooks/
│   │   │   ├── useWallet.ts      # Wallet integration
│   │   │   └── useOrderBook.ts   # Order book data
│   │   ├── providers/
│   │   │   ├── WalletProvider.tsx
│   │   │   └── ThemeProvider.tsx
│   │   └── state/
│   │       └── intentStore.ts    # Zustand store
│   │
│   ├── server/                   # Server-only code
│   │   ├── actions/              # Server actions
│   │   ├── services/             # Business logic
│   │   ├── security/             # Encryption utilities
│   │   └── config/
│   │       └── sui.ts            # Sui client config
│   │
│   └── shared/                   # Universal code
│       ├── types/                # TypeScript types
│       ├── schemas/              # Zod validation
│       ├── constants/            # Assets & pools
│       └── utils/                # Helper functions
│
├── contracts/                    # Sui Move contracts
│   ├── Move.toml
│   └── sources/
│       ├── intent_registry.move
│       ├── zk_verifier.move
│       └── settlement.move
│
├── zk-prover/                   # Rust Plonky3 prover
│   ├── Cargo.toml
│   └── src/
│       └── circuits/
│
└── solver/                      # Solver service
    ├── package.json
    └── src/
```

---

## 🎯 Usage

### 1. Simple Swap

Quick token swaps with automatic routing through DeepBook:

1. Select tokens to swap
2. Enter amount
3. Review rate and fees
4. Execute swap

### 2. Advanced Trading

Professional trading interface with:

- Real-time order book visualization
- Limit and market orders
- Order history and management

### 3. Private Intent (🌟 Featured)

Submit encrypted trading intents:

1. **Configure Intent**:
   - Direction (Buy/Sell)
   - Trading pair
   - Maximum size
   - Price bounds (optional)
   - Deadline (10s - 5min)

2. **Privacy Settings**:
   - MEV Protection (enabled by default)
   - Encryption status indicators

3. **Submit**:
   - Intent encrypted in browser
   - Commitment hash posted on-chain
   - Encrypted payload sent to solvers

4. **Execution**:
   - Solvers compete for best execution
   - ZK proof generated
   - Settlement verified on-chain

---

## 🔧 Configuration

### Environment Variables

```bash
# Sui Network (mainnet, testnet, devnet)
NEXT_PUBLIC_SUI_NETWORK=testnet

# Optional: Custom RPC endpoint
NEXT_PUBLIC_SUI_RPC_URL=

# Solver & Prover Services
NEXT_PUBLIC_SOLVER_URL=http://localhost:3001
NEXT_PUBLIC_PROVER_URL=http://localhost:3002

# DeepBook Package ID (optional override)
NEXT_PUBLIC_DEEPBOOK_PACKAGE_ID=

# Intent Registry Contract (after deployment)
NEXT_PUBLIC_INTENT_REGISTRY_ID=
```

### Supported Networks

- **Testnet** (default): For development and testing
- **Mainnet**: Production deployment
- **Devnet**: Latest features and experiments

---

## 🛠️ Development

### Tech Stack

| Layer               | Technology                                |
| ------------------- | ----------------------------------------- |
| **Frontend**        | Next.js 16, React 19, TypeScript          |
| **Styling**         | Tailwind CSS 4, shadcn/ui                 |
| **Blockchain**      | Sui, @mysten/sui SDK, @mysten/deepbook-v3 |
| **Wallet**          | @suiet/wallet-kit                         |
| **State**           | Zustand                                   |
| **Validation**      | Zod                                       |
| **Encryption**      | @noble/curves, @noble/hashes              |
| **ZK Proofs**       | Plonky3 (Rust)                            |
| **Smart Contracts** | Sui Move                                  |

### Build Commands

```bash
# Development server
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Lint code
bun run lint

# Type check
tsc --noEmit
```

### Testing

```bash
# Run all tests
bun test

# Integration tests
bun test:integration

# E2E tests
bun test:e2e
```

---

## 📜 Smart Contracts

### Intent Registry

Stores commitment hashes and manages intent lifecycle:

```move
module zk_intentbook::intent_registry {
    public fun submit_commitment(
        registry: &mut IntentRegistry,
        commitment_hash: vector<u8>,
        deadline: u64,
        ctx: &mut TxContext
    );
}
```

### ZK Verifier

Verifies Plonky3 proofs on-chain:

```move
module zk_intentbook::zk_verifier {
    public fun verify_proof(
        proof: vector<u8>,
        public_inputs: vector<u8>
    ): bool;
}
```

### Deployment

```bash
cd contracts
sui move build
sui client publish --gas-budget 100000000
```

---

## 🔐 Security

### Encryption Flow

1. **Client-Side**: ECDH key exchange (X25519)
2. **Symmetric**: XChaCha20-Poly1305 encryption
3. **Commitment**: Poseidon hash for ZK-friendliness

### ZK Proof System

- **Circuit**: Verifies price bounds, liquidity, and execution correctness
- **Prover**: Off-chain Plonky3 STARK generation
- **Verifier**: On-chain Move contract (Groth16-wrapped for MVP)

### Audit Status

🚧 **Not yet audited** - This is experimental software. Use at your own risk.

---

## 🗺️ Roadmap

### Phase 1: MVP (Current)

- [x] Frontend UI with wallet integration
- [x] Intent submission interface
- [x] DeepBook SDK integration
- [ ] Basic solver implementation
- [ ] ZK proof generation (Plonky3)
- [ ] Move contract deployment

### Phase 2: Testnet Launch

- [ ] Multi-solver network
- [ ] Advanced order types (TWAP, VWAP)
- [ ] Portfolio tracking
- [ ] Historical analytics

### Phase 3: Mainnet

- [ ] Security audit
- [ ] Decentralized solver network
- [ ] Governance token
- [ ] Cross-chain intents

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the server/client/shared architecture
- Use TypeScript strict mode
- Write tests for new features
- Follow the existing code style
- Update documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Sui Foundation** - For the incredible blockchain platform
- **DeepBook Team** - For the high-performance CLOB
- **Polygon** - For Plonky3 ZK proving system
- **shadcn** - For the beautiful UI components

---

## 📞 Contact & Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/zk-intentbook/issues)
- **Discord**: [Join our community](#)
- **Twitter**: [@zkintentbook](#)
- **Documentation**: [Full docs](#)

---

## ⚠️ Disclaimer

This software is experimental and provided "as is" without warranty. Trading cryptocurrencies involves risk. Always do your own research and never invest more than you can afford to lose.

---

<div align="center">

**Built with ❤️ for the Sui ecosystem**

[Website](#) • [Docs](#) • [Twitter](#) • [Discord](#)

</div>
