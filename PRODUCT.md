# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A person who already uses Arkade.Money and is creating an escrow, or coming back to one they saved in this browser.

## Product Purpose

Spend the Arkade escrow in `contracts/escrow.ark`. The first screen is the list of escrows. Success is releasing or refunding one of them.

## Capabilities and Constraints

- With no saved escrow, the only actions are create and load.
- Create is a dialog: buyer address, seller address, a preset amount or a custom amount, and a refund time.
- Load an address asks for those same details, plus the exit delay. A mismatch stays on that sheet.
- A saved escrow is a tile. Opening it shows Release and Refund.
- Unroll, unilateral exit, and keys stay under Advanced.
- The taproot is the artifact plus those parameters. Saving the key file is taught when an address exists.
- Do not invent party secrets.
