# Veil

**Confidential invoice financing, settled atomically on Canton.**

Built for the [Canton Foundation Hackathon](https://canton.foundation/)  Private DeFi & Capital Markets / TradeFi, RWA & Tokenized Assets tracks.

---

## The problem

Invoice factoring , where a business sells an unpaid invoice to a financier for immediate cash, at a discount is a multi-trillion-dollar global market. But today it's opaque and slow:

- Suppliers can't easily get competitive bids from multiple financiers, because doing so on a public ledger would broadcast their financing terms, their buyer relationships, and their cost of capital to competitors.
- Buyers shouldn't need to know who financed their supplier's invoice, or at what discount — that's a private commercial arrangement between their supplier and a third party.
- Financiers don't want their bid pricing visible to competing financiers, or they stop bidding aggressively.

A public blockchain makes this *worse*, not better — every transaction is visible to everyone. **Privacy isn't a nice-to-have here, it's the precondition for the market to function at all.**

## What Veil does

Veil is a blind-auction invoice financing marketplace where:

1. A **Supplier** issues an invoice; the **Buyer** co-signs to confirm it's genuine and payable.
2. The Supplier opens it for financing. Multiple **Financiers** submit competing bids (an advance rate / discount they're willing to offer).
3. **Each bid is private** — visible only to the bidding Financier and the Supplier. Other financiers cannot see competing bids. The Buyer cannot see any bid. The marketplace operator cannot see any bid.
4. The Supplier accepts the best offer. A `FinancingAgreement` is created — the Buyer can now see *that* the invoice is financed and *who* to pay, but never learns the discount rate the Supplier accepted.
5. At maturity, the Buyer pays the Financier directly. Deal closed.

This is enforced **structurally**, by Canton's sub-transaction privacy model — not by an application-layer access control list that a misconfigured server could leak. Each party's ledger view is genuinely restricted to what they're a signatory or observer of.

## Why this needs Canton specifically

On a public chain (or a chain with full ledger visibility), every bid would be visible to every participant — the entire point of a blind auction collapses. Canton's privacy model means:

- A `Bid` contract's `signatory` is the Financier, `observer` is the Supplier. No one else is on the contract — full stop. Canton doesn't broadcast it to other nodes.
- A `FinancingAgreement`'s `observer` is the Buyer — they see the deal exists, but the contract fields they need (who to pay, how much, when) are separate from the discount-rate field that stays private to Supplier + Financier.
- All of this settles **atomically** — bid acceptance, financing agreement creation, and (in a production build) the actual fund transfer happen as one Canton transaction, so there's no window where one party has fulfilled their side and the other hasn't.

This is **proven, not just claimed** — see [Verifying the privacy model](#verifying-the-privacy-model) below.

## Architecture

```
Supplier ──issues, Buyer co-signs──▶ Invoice
                                        │
                          Supplier opens for financing
                                        ▼
                                  OpenInvoice  (Operator becomes observer)
                                        │
                ┌───────────────────────┼───────────────────────┐
                ▼                       ▼                       ▼
         Financier1's Bid        Financier2's Bid          (more bids...)
         (private: Financier1    (private: Financier2
          + Supplier only)        + Supplier only)
                                        │
                         Supplier accepts best bid
                                        ▼
                              FinancingAgreement
                    (signatories: Supplier + winning Financier
                     observer: Buyer — sees deal exists,
                     never sees the accepted discount rate)
                                        │
                      Financier confirms funding ──▶ Funded
                                        │
                    Buyer pays at maturity ──▶ Settled
```

### Who sees what

| | Invoice terms | All bids | Winning bid's rate | That a deal closed | Final settlement |
|---|---|---|---|---|---|
| **Supplier** | ✅ | ✅ (own invoice) | ✅ | ✅ | ✅ |
| **Buyer** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Winning Financier** | ✅ | ❌ (only own bid) | ✅ | ✅ | ✅ |
| **Losing Financier** | ❌ | ❌ (only own bid) | ❌ | ❌ | ❌ |
| **Marketplace Operator** | ❌ (listing only) | ❌ | ❌ | ❌ | ❌ |

## Tech stack

- **Daml** (SDK 2.10.4) — smart contract layer, deployed to a Canton participant node
- Three core templates: `Invoice` / `OpenInvoice` (`daml/Invoice.daml`), `Bid` / `FinancingAgreement` (`daml/Auction.daml`)
- Daml Script (`daml/Setup.daml`) — seeds demo parties and runs the full lifecycle end-to-end as an automated, assertion-checked test

## Verifying the privacy model

This isn't a design claim — it's tested. `daml/Setup.daml` runs the full lifecycle (issue → open → two competing private bids → accept → fund → settle) and asserts, after each step, exactly what each party can and cannot see:

```haskell
-- Financier1 cannot see Financier2's bid, and vice versa
assertMsg "Financier1 should see exactly 1 bid (its own)" (length f1Bids == 1)
assertMsg "Financier2 should see exactly 1 bid (its own)" (length f2Bids == 1)

-- Buyer cannot see ANY bids
assertMsg "Buyer should see zero bids" (null buyerBids)

-- The losing financier has zero visibility into the deal that closed
assertMsg "Losing financier should have no visibility into winning deal" (isNone f1View)
```

Run it yourself:

```bash
daml build
daml test
```

Expected output: `daml/Setup.daml:setup: ok, 2 active contracts, 7 transactions.` — every privacy assertion passes.

To run it against a live local Canton sandbox instead of the in-memory test runner:

```bash
daml start
```

This builds, launches the sandbox, runs the init script, and opens Navigator so you can inspect each party's ledger view directly in the browser.

## Project structure

```
veil/
├── daml.yaml              # Project config (SDK 2.10.4)
├── daml/
│   ├── Invoice.daml        # Invoice + OpenInvoice templates
│   ├── Auction.daml        # Bid + FinancingAgreement templates (the privacy core)
│   └── Setup.daml          # Demo data + automated privacy-proof test
└── README.md
```

## Roadmap 

- [ ] Atomic cash settlement via Canton Coin / `daml-finance` `Holding` (currently `FinancingAgreement_ConfirmFunding` and `_SettleAtMaturity` model the *agreement* state transition; production would tie these to a real token transfer in the same transaction)
- [ ] React frontend with three role-based dashboards (Supplier, Financier, Buyer) — in progress
- [ ] Multi-financier auction UI with live bid countdown
- [ ] Invoice NFT/tokenization for secondary market resale of financed receivables
- [ ] Integration with a real KYC/onboarding flow for production participant nodes

## Team

Built by [Marvellous Rain](https://github.com/marvybaby) for the Canton Foundation Hackathon, 2026.

## License

MIT