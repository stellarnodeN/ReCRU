# RecruSearch

A Solana Anchor-based program and web application for managing studies, participants, and rewards using NFTs and SPL tokens.

## Features
- Create and manage studies on Solana
- Register participants with or without credentials
- Consent management (including NFT minting for consent)
- Reward claiming with SPL token transfers
- Prevents double consent for the same participant and study
- Written in Rust (on-chain) and TypeScript (off-chain tests)

## Directory Structure
```
.
├── Anchor.toml                # Anchor configuration
├── Cargo.toml                 # Rust workspace manifest
├── package.json               # Node.js dependencies for tests
├── tsconfig.json              # TypeScript config
├── app/                       # (Optional) Frontend or app code
├── migrations/                # Anchor migration scripts
│   └── deploy.ts
├── programs/
│   └── recrusearch/           # Solana program source
│       ├── Cargo.toml
│       ├── Xargo.toml
│       ├── src/
│       │   ├── contexts.rs
│       │   ├── instructions.rs
│       │   ├── lib.rs
│       │   ├── state.rs
│       │   └── state_test.rs
│       └── tests/
│           ├── instruction_handlers.rs
│           └── state_test.rs
├── target/                    # Build artifacts
├── test-ledger/               # Local validator ledger (if running)
├── tests/
│   └── recrusearch.ts         # Off-chain integration tests
```

## Prerequisites
- [Rust](https://www.rust-lang.org/tools/install)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI](https://book.anchor-lang.com/getting_started/installation.html)
- [Node.js & Yarn](https://nodejs.org/) (for TypeScript tests)

## Setup Instructions

### 1. Install dependencies
```bash
# Rust dependencies
rustup component add rustfmt

# Node dependencies
yarn install
```

### 2. Localnet Development
#### Start local validator
```bash
solana-test-validator
```

#### Set CLI to localnet
```bash
solana config set --url http://127.0.0.1:8899
```

#### Create and fund a local wallet
```bash
solana-keygen new --outfile ~/.config/solana/id.json
solana config set --keypair ~/.config/solana/id.json
solana airdrop 2
```

#### Build and deploy the program
```bash
anchor build
anchor deploy
```

#### Run tests
```bash
anchor test
```

### 3. Devnet Deployment
#### Set CLI to devnet
```bash
solana config set --url https://api.devnet.solana.com
```

#### Fund your devnet wallet
```bash
solana airdrop 2
```

#### Build and deploy to devnet
```bash
anchor build
anchor deploy --provider.cluster devnet
```

## Troubleshooting
- **ELF error: Multiple or no text sections**: Remove any `-function-sections` linker flags from your build config.
- **Program is not deployed**: Ensure you have run `anchor deploy` to the correct cluster.
- **Connection refused**: Make sure the validator is running and your CLI is set to the correct URL.

## License
Specify your license in `package.json` and/or add a `LICENSE` file.

---

For more details, see the [Anchor Book](https://book.anchor-lang.com/) and [Solana Docs](https://docs.solana.com/).
