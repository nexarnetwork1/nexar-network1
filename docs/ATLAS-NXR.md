# ATLAS NXR — Digital Economy Layer

**Native utility token of ATLAS by NEXAR NETWORK**

> NXR is **not** just a cryptocurrency.  
> It is the optional economic engine of ATLAS. The ecosystem works fully **without** blockchain. Chain adapters are enhancement ports only.

---

## Mission

Every payment, subscription, reward, incentive, and premium service **can** use NXR — businesses may still prefer traditional rails.

---

## Architecture

| Layer | Location |
|-------|----------|
| Bounded context | `nxrToken` (id `nxr_token`) — thickened |
| Module | `modules/atlas-nxr/` |
| Database | `atlas_nxr_*` |
| Port | `AtlasNxrPort` |
| Ledger engine | `ledger.ts` (pure) |
| Reward engine | `rewards.ts` (pure) |
| Billing intents | `billing.ts` (pure) |
| Chain adapters | `blockchain-adapters.ts` (**interfaces only**) |

### Ownership

| Owns | Consumes |
|------|----------|
| NXR accounts, ledger txs, rewards, loyalty, treasury, mint/burn, premium activations, token payments | Wallet, LedgerEntry, Business, User, Invoice, Payment, Order |

Fiat `wallets` / `wallet_transactions` remain under **wallet** context.

---

## Wallet architecture (NXR)

- **Personal** & **Business** NXR accounts (token balances)
- System accounts: treasury · reward_pool · reserve · developer
- Optional `fiat_wallet_id` link to wallet master
- Transfers, deposits (mint), burns — all off-chain first

---

## Reward engine

Rules seeded: referral, marketplace cashback %, verification bonus, loyalty, achievements.  
Campaign budgets · loyalty tiers Bronze→Enterprise · cashback rates.

---

## Billing integration

Optional intents for: subscription · marketplace · app purchase · AI credits · premium features · advertising · verification · boost · developer revenue share.

Traditional payments remain supported; NXR is never required.

---

## Blockchain adapters (future)

Interfaces for: Ethereum · BNB Chain · Polygon · Solana · NEXAR Chain.  
`blockchain_enabled` defaults **false**. Domain services do not call adapters.

---

## Events

| Event | When |
|-------|------|
| `nxr.wallet_created` | Account provisioned |
| `nxr.wallet_funded` | Deposit / mint fund |
| `nxr.token_transferred` | Transfer completed |
| `nxr.reward_granted` | Reward paid |
| `nxr.subscription_paid` | Subscription via NXR |
| `nxr.marketplace_purchase_paid` | Marketplace via NXR |
| `nxr.business_verified` | Verification reward path |
| `nxr.premium_activated` | Premium feature unlocked |

Inbound: `business.created`, `user.registered`, `order.paid`, `business.verification_approved`, `payment.confirmed`.

---

## Port (`AtlasNxrPort`)

`ensureAccount` · `getAccount` · `transfer` · `pay` · `grantReward` · `fund` · `activatePremium`

---

## Related

| Document | Purpose |
|----------|---------|
| [ATLAS.md](./ATLAS.md) | Platform constitution |
| Migration | `supabase/migrations/20260804260000_atlas_nxr_foundation.sql` |
| Fiat wallet | `modules/wallet/` |
