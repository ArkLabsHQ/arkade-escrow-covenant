# Escrow

An Arkade escrow for Mutinynet. `contracts/escrow.ark` is the source. `contracts/escrow.artifact.json` is the `arkadec` output. The page loads that artifact and spends the funded coin through the contract's own function names: `complete`, `cancel`, and `unilateral`.

| Path | What it is |
| --- | --- |
| `contracts/escrow.ark` | Contract source. Constructor parameters and the three functions. |
| `contracts/escrow.md` | What each function pays |
| `contracts/escrow.artifact.json` | Compiled artifact |
| `app/src/program.ts` | `programFromArtifact`, then the exit CSV set to seconds |
| `app/src/outputs.ts` | Output lists those functions accept |
| `app/src/spend.ts` | `prepareEscrow`, then `spendComplete`, `spendCancel`, `spendUnilateral` |

`arkadec` compiles `older(exit)` as a block CSV. Public arkd rejects that on an exit leaf. `escrowProgram()` is the only change: the same `$exit` integer, with the BIP68 seconds bit set. `pnpm check` fails if anything else differs from `programFromArtifact`.

The artifact was produced by arkade-compiler `c37c9da`. `updatedAt` inside the JSON is the compiler's timestamp.

## Parameters

`prepareEscrow` in `app/src/spend.ts` turns page inputs into the constructor arguments of `Escrow`. Party A is the buyer. Party B is the seller.

| Constructor field | Passed as |
| --- | --- |
| `partyAPk` | Buyer x-only public key |
| `partyBPk` | Seller x-only public key |
| `oraclePk` | Oracle x-only public key |
| `oracleMessageHash` | `sha256` of the 32-byte attestation |
| `partyAScript` | 32-byte witness program of the buyer Arkade address |
| `partyBScript` | 32-byte witness program of the seller Arkade address |
| `amount` | Sats `complete` must pay the seller |
| `timeoutAt` | Unix seconds. `cancel` waits for the emulator clock |
| `exit` | Seconds, a multiple of 512, at least the operator's unilateral exit delay |

The attestation is `sha256(utf8("release-to-seller"))`. The contract commits `sha256` of that 32-byte value. The oracle later signs the 32-byte value, not the label.

`payoutFromAddress` reads `partyAScript` and `partyBScript` from Arkade addresses on this operator. The address must use the operator's human-readable part and server key. The witness program is `vtxoTaprootKey`. The output script that pays it is `pkScript`, and that is what a spend puts on the transaction.

## Generate the contract

Connect as the buyer, then instantiate the program with those fields. `client.contract` returns the address to fund.

```ts
import { arkade } from "@arkade-os/sdk";
import { escrowProgram } from "./app/src/program.ts";

const program = escrowProgram();
const client = await arkade.Arkade.connect({
    arkade: ark,
    indexer,
    emulator,
    identity: buyerKey,
    network,
});

const message = await releaseMessage(); // 32 bytes
const contract = client.contract(program, {
    partyAPk: await buyerKey.xOnlyPublicKey(),
    partyBPk: await sellerKey.xOnlyPublicKey(),
    oraclePk: await oracleKey.xOnlyPublicKey(),
    oracleMessageHash: await sha256(message),
    partyAScript: buyer.program,
    partyBScript: seller.program,
    amount,      // bigint sats
    timeoutAt,   // bigint unix seconds
    exit,        // bigint seconds
});

contract.address; // fund this
```

`prepareEscrow` is that sequence, plus the exit-delay check against `ark.getInfo().unilateralExitDelay`. Funding is a normal Arkade payment to `contract.address`. The coin is an unspent vtxo from `contract.getUtxos()`.

## Spend a funded coin

Each spend names a function on `contract.functions`, selects the coin with `.from(coin)`, sets the outputs with `.to(...)`, and submits with `.send()`. `complete` and `cancel` take one input. Output scripts are the `pkScript` values from `payoutFromAddress`, not the 32-byte witness programs stored in the contract.

`completeOutputs`, `cancelOutputs`, and `unilateralOutputs` in `app/src/outputs.ts` build those lists. `complete` pays `amount` to the seller. A surplus above 330 sats is a second output back to the buyer. `cancel` pays the whole coin to the buyer. `unilateral` pays the seller and does not constrain outputs inside the contract.

Release. The oracle signs `message`. The function arguments are that message and the Schnorr signature.

```ts
const signature = await oracleKey.signMessage(message, "schnorr");
const outputs = completeOutputs(BigInt(coin.value), amount, seller.pkScript, buyer.pkScript);

const { txid } = await contract.functions
    .complete(message, signature)
    .from(coin)
    .to(outputs)
    .send();
```

Refund. No arguments. The emulator clock must have reached `timeoutAt`.

```ts
const outputs = cancelOutputs(BigInt(coin.value), buyer.pkScript);

const { txid } = await contract.functions
    .cancel()
    .from(coin)
    .to(outputs)
    .send();
```

Unilateral exit. The contract function takes both signatures. The page holds both keys, so `spendUnilateral` builds the leaf, sets the BIP68 seconds sequence from `exit`, and has the buyer and the seller each sign input 0 before `submitTx` and `finalizeTx`. The clock starts when the funding transaction is mined on Bitcoin, which is after unroll, not when the virtual coin appears.

```ts
const outputs = unilateralOutputs(BigInt(coin.value), seller.pkScript);
const built = await contract.functions.unilateral().from(coin).to(outputs).build();
// sign input 0 with the buyer key and the seller key, then submit
```

`spendComplete`, `spendCancel`, and `spendUnilateral` are those three calls.

## SDK

`@arkade-os/sdk` is vendored from [arkade-os/ts-sdk#958](https://github.com/arkade-os/ts-sdk/pull/958), commit `411b43f` (`cursor/compiler-artifact-program-bridge-0188`). That branch is `programFromArtifact`. The package lives in `packages/ts-sdk` of a private monorepo root, so a git dependency does not install it. The tarball is `vendor/arkade-os-sdk-0.4.74-411b43f.tgz`.

That commit leaves opcodes `0xdb`–`0xdf` unassigned. `cancel` compiles to `OP_CHECKTIME` (`0xdc`), which is already on master via [ts-sdk#967](https://github.com/arkade-os/ts-sdk/pull/967). `vendor/958-checktime.patch` is that two-opcode delta, and the tarball is the branch plus the patch. `PUSHEXPIRY` (`0xdb`) is included with it and is unused by this contract.

## Run

```sh
pnpm install
pnpm test
pnpm dev
```

The page is http://127.0.0.1:4173. `pnpm build` writes `dist/`.

New escrow collects the parameters above and calls `prepareEscrow`. The funding address is `contract.address`, also copied as `bitcoin:?ark=<address>&amount=<sats>`. Release calls `spendComplete`. Refund calls `spendCancel`. Under Advanced, Unroll publishes the funding transaction, and Exit on chain calls `spendUnilateral` after the Bitcoin CSV. A spent escrow stays on the list as Refunded to the buyer or Released to the seller. Settings holds the oracle key. Remove from this browser, after Advanced, deletes the local card and can save it as `arkade-escrow.json` first.


## GitHub Pages

The workflow builds `dist/` and deploys it on push to `master`. The run on 23 Sep 2026 failed in `actions/configure-pages`:

`Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions.`

The repository has no Pages site. `enablement` on that action defaults to false, and turning it on needs a token with `administration:write`. `GITHUB_TOKEN` only has `pages:write`, so the workflow cannot create the site. An admin sets Settings → Pages → Build and deployment → Source to GitHub Actions, then re-runs Deploy GitHub Pages. The site is then https://arklabshq.github.io/arkade-escrow-covenant/.
