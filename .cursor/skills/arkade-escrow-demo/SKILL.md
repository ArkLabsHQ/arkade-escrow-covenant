---
name: arkade-escrow-demo
description: >
  Build or change the Arkade Mutinynet escrow demo: load the compiled covenant,
  spend complete, cancel, and unilateral through the TypeScript SDK, and show
  funded versus closed coins on the page. Use when editing the Arkade escrow contract,
  escrowProgram, prepareEscrow, spendComplete, spendCancel, spendUnilateral,
  escrowFacts, BIP321 pay links, the escrow sheet, or indexer updates.
---

# Arkade escrow demo

This repo is the demo. Extend the files below. Do not add a second spend stack, a network switcher, or a Mempool poll.

Read these before editing:

- the Arkade escrow contract and `contracts/escrow.md` — the three functions and what each pays
- `app/src/program.ts` — `escrowProgram()`, the only runtime change to the artifact
- `app/src/outputs.ts` — `completeOutputs` and `cancelOutputs`
- `app/src/spend.ts` — `prepareEscrow`, `escrowFacts`, the three spends
- `scripts/escrow-example.ts` and the README section "Build and spend" — the pasteable script

`pnpm test` must stay green. It checks outputs, keys, the exit clock, BIP321, and that the seconds CSV is the only difference from `programFromArtifact`.

## Contract

Party A is the buyer. Party B is the seller. An oracle can release `amount` to the seller. After `timeoutAt`, cancel returns the coin to the buyer. Buyer and seller together can exit on Bitcoin after `exit` seconds.

| Function | Who must cooperate | What it pays |
| --- | --- | --- |
| `complete` | server, emulator, oracle signature | `amount` to the seller; surplus above 330 sats back to the buyer |
| `cancel` | server, emulator, `checkTime(timeoutAt)` | the whole coin to the buyer |
| `unilateral` | buyer and seller, `older(exit)` | outputs are unconstrained; both keys sign |

`complete` and `cancel` take one input. Call them on `contract.functions`, then `.from(coin).to(...).send()`. `cancel()` takes no arguments.

`unilateral` is not sent that way. `.send()` cannot collect both signatures. Build the leaf in `spendUnilateral`, set the BIP68 seconds sequence from `exit`, and sign input 0 with the buyer key and the seller key.

## Setup, then parameters

`escrowProgram()` is a setup step, once per process. It reads `contracts/escrow.artifact.json` with `arkade.programFromArtifact`. It does not compile the Arkade contract source.

`arkadec` emits `older(exit)` as a block CSV. The public Arkade operator rejects that on an exit leaf. The only edit is to set that same `$exit` integer to BIP68 seconds. `pnpm check` fails if anything else changes.

Pass the program into `client.contract`. The constructor fields are not the pasted payout addresses.

| Field | What it actually is |
| --- | --- |
| `partyAPk`, `partyBPk`, `oraclePk` | `xOnlyPublicKey()` of the buyer, seller, and oracle `SingleKey`s |
| `oracleMessageHash` | `sha256` of the message the oracle signs. The oracle signs the message, not the hash |
| `partyAScript`, `partyBScript` | the 32-byte witness program: `DefaultVtxo.Script(...).tweakedPublicKey` |
| `amount`, `timeoutAt`, `exit` | satoshis, unix seconds, and the unilateral delay in seconds |

`tweakedPublicKey` is not the output script. The output script is `pkScript` (`OP_1` plus that 32-byte key, hex `5120…`). Use `pkScript` on transaction outputs, on `getVtxos({ scripts })`, and on `subscribeForScripts`. Use `tweakedPublicKey` only for `partyAScript` and `partyBScript`.

Build a payout address with `vtxo.address(hrp, serverPubKey)`. `address` requires the operator key from the session (`client.serverKey`). A pasted buyer or seller address is only where a spend pays out. It must use the Mutinynet HRP and the same server key. It does not supply `partyAPk`.

Name the Arkade server client `arkadeOperator` (or `arkade`). Do not name it `arkProvider` or `ark`.

Connect all three clients: `RestArkProvider`, `RestIndexerProvider`, `RestEmulatorProvider`. Mutinynet only. Do not add a mainnet network, a network switcher, or a public mainnet emulator URL.

`exit` must be at least `getInfo().unilateralExitDelay` (this operator's floor is 512, and the value steps by 512). The CSV does not start when the virtual coin is created. It starts when the funding transaction is mined on Bitcoin, which is only after unroll.

## Coins

`getUtxos()` and an empty unspent list are not "waiting for funds". A spent escrow is closed.

`escrowFacts` reads `getVtxos` for the address script `5120` plus the hex witness program. Classify each coin:

- unspent and not unrolled — funded. Release is available. Refund is available only when `timeoutAt` has passed
- unspent and unrolled — on Bitcoin. Release and refund stay off. Exit waits for the CSV
- spent by the cancel leaf — Refunded to the buyer
- spent by the complete leaf — Released to the seller
- spent by the unilateral leaf (`OP_CHECKSEQUENCEVERIFY`) — Unilateral exit
- spent by anything else — Closed

Closed rows stay on the list as past activity. Do not show them as waiting for funds.

After that read, arm the buttons in the same turn. Do not wait for an exit-clock or hop walk before `syncButtons`.

## Do not poll Mempool

Virtual transaction ids are not Bitcoin transactions. `GET /api/tx/<vtxo txid>` on `mempool.mutinynet.arkade.sh` returns 404. That is normal. Do not call `getTxStatus` or `bitcoinMinedAt` on them.

- Update the open contract from `subscribeForScripts([hex.encode(contract.pkScript)])` and `getSubscription`. On `newVtxos`, `spentVtxos`, or `sweptVtxos`, read the indexer again. Do not `setInterval` a refresh that touches Esplora.
- `listUnrollHops` uses the indexer chain only. A commitment hop is on Bitcoin. Every other hop stays off-chain. Run it when the user opens Activity, not when the sheet opens.
- `bitcoinMinedAt` runs only after the user opens On Bitcoin and the selected coin `isUnrolled`. Cache a mined time. Cache a 404 for about a minute so reopening the section does not hammer it.
- The fee wallet's balance is part of On Bitcoin. Load it when that section opens.

While coins are still being read and Release is not armed yet, the Release button stays fully opaque, shows a spinner, and reads "Checking". A grey disabled button is the settled state (no coin, refund not open, or already spent), not the loading state. The same spinner covers the few seconds after a subscription event before the button enables.

## Page

The open sheet leads with the amount, one human sentence, and the funding address. Buyer and seller payouts, keys, and the exit clock are under Advanced. The oracle key is in Settings, not on the card.

- Shorten long addresses to the first and last bytes, with Copy.
- The funding row links to the Arkade explorer address page in a new tab.
- Copy on that row copies the BIP321 URI, not the raw address: `bitcoin:?ark=<address>&amount=<btc>`. BIP21 `amount` is BTC. 1000 sats is `0.00001`, not `1000`.
- A new escrow starts at 10,000 sats and a refund time of the current local minute. Do not persist amount or refund time in `localStorage`. Persist the exit delay.
- Load an escrow leads with dropping the backup JSON. Typing parameters is a smaller disclosure under it. If the details compile to a different address, keep the sheet open and show the mismatch.
- Remove lives at the bottom of the open sheet, after Advanced. Confirm, and offer to save `arkade-escrow.json` first. The full key backup is `arkade-escrow-keys.json`.

## Ship

GitHub Pages builds `dist/` on push to `master`. A branch or a pull request does not update the site the user is refreshing. Push `master`, then hard-refresh. The old bundle is what still logs `listUnrollHops` → `getTxStatus` at `spend.ts`.
