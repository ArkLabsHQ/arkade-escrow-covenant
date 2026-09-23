# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A person who already uses Arkade.Money and is trying an escrow covenant on Mutinynet, or who already created one and is coming back. They sit at a desk with the wallet open beside this page. Their job is to create an escrow, see every escrow they are tracking, read its status, and release funds to the seller or refund the buyer.

Inferred from the page and the request, not a separate interview: they are comfortable pasting an address and a mnemonic, and they are not looking for a consumer marketplace.

## Product Purpose

Spend the Arkade escrow in `contracts/escrow.ark`. Success is a visible contract the user can fund, then release or refund, including a contract that was created in another session.

## Positioning

The page compiles `contracts/escrow.artifact.json` into a taproot address. The same parameters rebuild that address later. A simulated oracle in the page signs the release. Neighboring wallets can pay the address; they do not spend the covenant.

## Operating Context

Mutinynet by default, Bitcoin when selected. Payout addresses come from Arkade.Money. Buyer and seller signing keys are an nsec, hex, or a 12/24-word mnemonic. The oracle key and the contract parameters live in this browser until the user downloads them. Funding is a send from the wallet to the escrow address. The refund clock is the emulator time. The unilateral exit clock starts when the funding Bitcoin output is mined, after an unroll.

## Capabilities and Constraints

- Create an escrow from buyer and seller payout addresses, amount, and refund time.
- Track more than one escrow and show each one's status.
- Release pays the seller (`complete`). Refund pays the buyer (`cancel`).
- Load an address the user already has. A saved record fills the parameters. Otherwise the page compiles the artifact with the parameters on screen and spends only when the taproot matches.
- Unroll, unilateral exit, the exit delay, the fee wallet, and key import stay available under Advanced.
- Once an escrow is created or funded, the user must be told to download the parameters and keys. The taproot cannot be rebuilt from the address alone.
- The CSV exit delay stays a multiple of 512 seconds and at least the operator minimum. The page may default it rather than asking up front.
- Do not invent party secrets. The oracle key is generated in the browser and must be backed up with the parameters.

## Brand Commitments

The product name on the page is Escrow. Arkade and Arkade.Money are the wallet and operator names already used in the copy. No logo file is in the repo.

## Evidence on Hand

`contracts/escrow.ark`, `contracts/escrow.md`, and `contracts/escrow.artifact.json` are the contract. `app/src/spend.ts` is the spend behavior. There are no screenshots, testimonials, or brand assets. Do not invent customers, amounts, or transaction ids in the interface.

## Product Principles

- The list of escrows is the product. Creating and loading feed that list.
- Release and refund are the only everyday actions.
- Parameters that rebuild an address are a backup, taught at the moment the address exists.
- Someone who already has an address should reach it without walking through creation.
- Advanced work stays one disclosure away, not on the first screen.
