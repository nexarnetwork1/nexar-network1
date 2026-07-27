# Smart Contract Integration Guide

This guide describes how Nexar Network separates blockchain logic from business logic, and how to add future smart contracts without rewriting the platform.

## Current State

| Domain | Integration | Location |
|--------|-------------|----------|
| **Presale** | Live on BSC mainnet | `lib/web3/`, `components/web3/` |
| **Marketplace payments** | Custodial HD deposit addresses | `lib/blockchain/`, `modules/settlement/` |
| **Treasury / fees** | DB-configured wallet + on-chain settlement worker | `modules/settlement/worker.ts`, `platform_settings` |
| **Cards** | Stripe (off-chain) | `lib/stripe/`, webhooks |

## Layer Separation

```
UI (app/, components/)
  ↓
Server actions (modules/*/actions.ts)     ← business rules, auth, validation
  ↓
Services (services/*.service.ts)        ← orchestration facades
  ↓
lib/payments/                           ← payment completion, guards
lib/blockchain/                         ← chain I/O only (reads, verify, deposit)
modules/settlement/                     ← on-chain writes (viem)
lib/web3/                               ← presale contract (wagmi hooks, ABI)
```

**Rule:** Server actions must not import viem/wagmi directly for marketplace flows. Use `lib/blockchain/` and `modules/settlement/`.

Presale is the reference implementation: UI reads contract state via hooks; buy/claim call contract functions only.

## Adding a New Smart Contract

1. **ABI & address** — Add verified ABI to `lib/web3/abi.ts` or a domain-specific file. Store address in `platform_settings` or env (never hardcode in UI logic).

2. **Chain layer** — Add read/write helpers under `lib/blockchain/` or `lib/web3/` that accept typed parameters and return typed results. No Supabase imports in this layer.

3. **Business layer** — Server actions in `modules/` validate auth, persist off-chain state, and call chain helpers. DB remains source of truth for orders, invoices, settlements.

4. **UI layer** — Client components use wagmi hooks or server-fetched data. All timing, caps, and eligibility come from chain reads.

5. **Settlement pattern** — For payment splits, prefer:
   - DB escrow hold → admin/release trigger → `processPendingSettlements()` for on-chain payout
   - Or a future router/splitter contract called from `modules/settlement/worker.ts`

## Marketplace → Contract Migration Path

When a payment router contract is deployed:

1. Replace `deriveSessionDepositAddress` destination with contract `pay()` entry point.
2. Move fee split logic from `executeSettlement` to contract or keep server-orchestrated calls to contract methods.
3. Keep `complete_payment` RPC unchanged — it records DB state; chain confirmation becomes a separate verification step.
4. Add event indexer (similar to `usePresaleTransactions`) for reconciliation.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `BSC_RPC_URL` | BSC JSON-RPC |
| `PAYMENT_MASTER_SEED` | HD deposit key derivation |
| `TREASURY_WALLET_ADDRESS` | Fallback treasury (DB is primary) |
| `CRON_SECRET` | Cron + super-admin session HMAC |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Wallet connect |

## Testing

- Presale: `node scripts/presale-qa.mjs` (on-chain state machine)
- Payment guards: `tests/unit/` (guards, cron-auth)
- Full payment E2E requires BSC testnet or mainnet wallet

## Do Not

- Put business rules in ABI call sites
- Hardcode wallet addresses in components
- Call `executeSettlement` before escrow release
- Mix presale contract logic into marketplace payment modules
