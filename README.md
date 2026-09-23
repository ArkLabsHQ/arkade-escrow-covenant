# Escrow

A page that spends an Arkade escrow. Paste an Arkade.Money address for the buyer and the seller. Those addresses are the payout scripts. A simulated oracle in the page signs `release-to-seller`. Unlock spends `complete` and pays the seller. Refund spends `cancel`. Unilateral exit spends the 2-of-2 tapscript.

The contract and the page are separate, the way a Solidity dapp keeps `contracts/` next to the app that loads the artifact.

| Path | What it is |
| --- | --- |
| `contracts/escrow.ark` | Contract source |
| `contracts/escrow.md` | The three spend paths |
| `contracts/escrow.artifact.json` | `arkadec` artifact of that source |
| `app/src/program.ts` | Loads the artifact and sets the exit CSV to seconds |
| `app/src/outputs.ts` | What each spend pays |
| `app/src/spend.ts` | Builds the contract and submits the three spends |
| `app/index.html` | The page |

`arkadec` `older(exit)` is a block CSV. Public arkd rejects that on an exit leaf (`INVALID_VTXO_SCRIPT`, CSV block type not allowed). `app/src/program.ts` is the only edit: the same `$exit` integer, with the BIP68 seconds bit set. `pnpm check` fails if anything else differs from `programFromArtifact`.

The artifact was produced by arkade-compiler `c37c9da` (`arkadec examples/escrow/escrow.ark`). `updatedAt` inside the JSON is the compiler's timestamp.

## SDK

`@arkade-os/sdk` is vendored from [arkade-os/ts-sdk#958](https://github.com/arkade-os/ts-sdk/pull/958), commit `411b43f` (`cursor/compiler-artifact-program-bridge-0188`). That branch is `programFromArtifact`. The package lives in `packages/ts-sdk` of a private monorepo root, so a git dependency does not install it. The tarball is `vendor/arkade-os-sdk-0.4.74-411b43f.tgz`.

That commit leaves opcodes `0xdb`–`0xdf` unassigned. `cancel` compiles to `OP_CHECKTIME` (`0xdc`), which is already on master via [ts-sdk#967](https://github.com/arkade-os/ts-sdk/pull/967). `vendor/958-checktime.patch` is that two-opcode delta, and the tarball is the branch plus the patch. `PUSHEXPIRY` (`0xdb`) is included with it and is unused by this contract.

## Run

```sh
pnpm install
pnpm test
pnpm dev
```

The page is http://127.0.0.1:4173. `pnpm build` writes `dist/`. Creating an escrow saves its address and parameters in the browser, and the key download includes that list. A later session keeps the oracle key. Load compiles `contracts/escrow.artifact.json` with the addresses, amount, refund time, exit delay, and keys on the page, and spends when that taproot matches the pasted address. A saved record fills those fields. If the compiled address differs, the page still lists the indexer coins and prints the address it built. Buyer and seller keys accept an nsec, hex, or the 12 or 24 words from an Arkade wallet.


## GitHub Pages

The workflow builds `dist/` and deploys it on push to `master`. The run on 23 Sep 2026 failed in `actions/configure-pages`:

`Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions.`

The repository has no Pages site. `enablement` on that action defaults to false, and turning it on needs a token with `administration:write`. `GITHUB_TOKEN` only has `pages:write`, so the workflow cannot create the site. An admin sets Settings → Pages → Build and deployment → Source to GitHub Actions, then re-runs Deploy GitHub Pages. The site is then https://arklabshq.github.io/arkade-escrow-covenant/.
