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

## Build and spend

`scripts/escrow-example.ts` is a complete script. The private keys are the literals below. Nothing else is left as a placeholder. From the repo root, after `pnpm install`:

```sh
node --experimental-strip-types scripts/escrow-example.ts
node --experimental-strip-types scripts/escrow-example.ts complete
node --experimental-strip-types scripts/escrow-example.ts cancel
```

The first command prints the funding address and stops when that address has no coins. Pay that address from Arkade.Money, then run `complete` or `cancel`.

The page does the same thing with keys from `localStorage` (`loadKeys` in `app/src/spend.ts`) and with the buyer and seller addresses you paste. Those pasted addresses are only the payout scripts. The public keys below are `xOnlyPublicKey()` of the private keys. A new escrow starts at 10,000 sats and a refund time of the current minute. Those two fields are not saved in the browser.

0. Load the compiled contract. This is a setup step, once per process. `escrowProgram()` in `app/src/program.ts` reads `contracts/escrow.artifact.json` with `arkade.programFromArtifact`, then sets the unilateral exit CSV from blocks to seconds. The script imports that function. It does not compile `escrow.ark` at runtime.

```ts
import { escrowProgram } from "../app/src/program.ts";

const program = escrowProgram();
```

`client.contract` below receives `program`.

1. Three 32-byte secrets. `01`, `02`, and `03` are valid secp256k1 scalars. Replace them before locking real money.

```ts
const buyerKey = SingleKey.fromHex("0000000000000000000000000000000000000000000000000000000000000001");
const sellerKey = SingleKey.fromHex("0000000000000000000000000000000000000000000000000000000000000002");
const oracleKey = SingleKey.fromHex("0000000000000000000000000000000000000000000000000000000000000003");
```

2. Numbers the constructor stores. The page uses the current minute. This script subtracts 60 seconds so `cancel` can run as soon as a coin arrives. `exit` is 512 seconds, the smallest multiple of 512 this operator accepts.

```ts
const amount = 10_000n;
const timeoutAt = BigInt(Math.floor(Date.now() / 1000) - 60);
const exit = 512n;
```

3. The three Mutinynet clients, then a session whose identity is the buyer key. `client.serverKey` is the operator key returned by that session. It is not one of the three secrets above.

```ts
const arkadeOperator = new RestArkProvider("https://mutinynet.arkade.sh");
const indexer = new RestIndexerProvider("https://mutinynet.arkade.sh");
const emulator = new RestEmulatorProvider("https://emulator.mutinynet.arkade.sh");

const client = await arkade.Arkade.connect({
    arkade: arkadeOperator,
    indexer,
    emulator,
    identity: buyerKey,
    network: networks.mutinynet,
});
```

4. Public keys and payout scripts. 

```ts
const message = await sha256(new TextEncoder().encode("release-to-seller"));
const buyerVtxo = new DefaultVtxo.Script({
    pubKey: await buyerKey.xOnlyPublicKey(),
    serverPubKey: client.serverKey,
    csvTimelock: { type: "seconds", value: 512n },
});
const sellerVtxo = new DefaultVtxo.Script({
    pubKey: await sellerKey.xOnlyPublicKey(),
    serverPubKey: client.serverKey,
    csvTimelock: { type: "seconds", value: 512n },
});
```

`sha256` is the function at the bottom of the script. The contract commits `sha256(message)`, and the oracle signs `message`.

5. Pass those values into `client.contract`. `contract.address` is what you fund.

```ts
const contract = client.contract(program, {
    partyAPk: await buyerKey.xOnlyPublicKey(),
    partyBPk: await sellerKey.xOnlyPublicKey(),
    oraclePk: await oracleKey.xOnlyPublicKey(),
    oracleMessageHash: await sha256(message),
    partyAScript: buyerVtxo.tweakedPublicKey,
    partyBScript: sellerVtxo.tweakedPublicKey,
    amount,
    timeoutAt,
    exit,
});
```

6. After the address has a coin, `contract.getUtxos()` returns it. `complete` and `cancel` are methods on `contract.functions`. The output script is `buyerAddress.pkScript` or `sellerAddress.pkScript` from `buyerVtxo.address(networks.mutinynet.hrp, client.serverKey)`.

```ts
const coin = (await contract.getUtxos())[0];

const signature = await oracleKey.signMessage(message, "schnorr");
await contract.functions
    .complete(message, signature)
    .from(coin)
    .to(completeOutputs(BigInt(coin.value), amount, sellerAddress.pkScript, buyerAddress.pkScript))
    .send();

await contract.functions
    .cancel()
    .from(coin)
    .to(cancelOutputs(BigInt(coin.value), buyerAddress.pkScript))
    .send();
```

Call one of those, not both. `completeOutputs` pays `amount` to the seller and, when the surplus is above 330 sats, the rest to the buyer. `cancelOutputs` pays the whole coin to the buyer. `cancel()` takes no arguments. The emulator clock must be at or after `timeoutAt`.

`unilateral` is the third function. It needs both the buyer and the seller signatures, which `.send()` does not collect, so the page builds the leaf in `spendUnilateral` (`app/src/spend.ts`), sets the BIP68 seconds sequence from `exit`, and signs input 0 with each key. That clock starts when the funding transaction is mined on Bitcoin, after unroll.

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

The page calls the same `client.contract` sequence from `prepareEscrow`, using keys stored in this browser instead of the three hex literals. The funding address is `contract.address`, also copied as `bitcoin:?ark=<address>&amount=<sats>`. Release calls `spendComplete`. Refund calls `spendCancel`. Under Advanced, Unroll publishes the funding transaction, and Exit on chain calls `spendUnilateral` after the Bitcoin CSV. A spent escrow stays on the list as Refunded to the buyer or Released to the seller. Settings holds the oracle key. Remove from this browser, after Advanced, deletes the local card and can save it as `arkade-escrow.json` first.


## GitHub Pages

The workflow builds `dist/` and deploys it on push to `master`. The run on 23 Sep 2026 failed in `actions/configure-pages`:

`Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions.`

The repository has no Pages site. `enablement` on that action defaults to false, and turning it on needs a token with `administration:write`. `GITHUB_TOKEN` only has `pages:write`, so the workflow cannot create the site. An admin sets Settings → Pages → Build and deployment → Source to GitHub Actions, then re-runs Deploy GitHub Pages. The site is then https://arklabshq.github.io/arkade-escrow-covenant/.
