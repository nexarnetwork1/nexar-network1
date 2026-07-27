# Nexar Network — Payment Flow

## End-to-End Sequence

```
Customer clicks Pay
  → Server action: create_checkout()
  → Order created (pending_payment)
  → Invoice created (pending)
  → Payment session created (waiting, 5-min expiry)
  → Payment popup opens (QR, amount, countdown, status)

Customer pays (crypto or card)
  → Verification (chain watcher cron, manual verify, or Stripe webhook)
  → Fee calculated (with promotion if applicable)
  → Platform fee recorded → Treasury ledger (on-chain via settlement worker)
  → Merchant amount held in escrow (DB)
  → Invoice updated (paid)
  → Order updated (paid)
  → Settlement record pending
  → On-chain payout after escrow release (retry-settlements cron)
  → Audit log written
  → Realtime pushes status to popup
```

## Popup (No Payment Page)

The `PaymentPopup` modal is the only payment UI. It shows:

- Invoice number
- Amount and currency
- Deposit wallet / QR (crypto) or Stripe Elements (card)
- 5-minute countdown
- Status: `waiting` | `paid` | `expired`

Status updates via Supabase Realtime subscription on `payment_sessions`.

## Platform Fees

| Method | Base Rate |
|---|---|
| NXR | 3.5% |
| Other crypto (BNB, USDT) | 5.0% |
| Cards | Stripe Connect application fee (configurable) |

New merchants: 50% discount for first 3 months (auto-expires via cron).

**Critical rule:** Fees never remain in the merchant wallet. Settlement worker splits immediately after verification.

## Rollback / Saga

If settlement transfer fails after payment is verified:

1. Mark `settlement.status = 'failed'`
2. Queue retry with exponential backoff (max 5 attempts)
3. Alert admin via audit log + notification
4. Order remains in intermediate state until settlement completes or admin resolves

## Supported at Launch

- BNB (native)
- NXR (BEP-20)
- USDT (BEP-20)
- Visa / Mastercard / Google Pay / Apple Pay (via Stripe)

BTC and ETH deferred to post-launch (cross-chain infrastructure required).
