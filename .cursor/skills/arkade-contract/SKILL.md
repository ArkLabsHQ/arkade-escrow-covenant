---
name: arkade-contract
description: >
  Load an arkadec artifact and spend any Arkade contract through the TypeScript
  SDK. Use when starting a new contract project (an options vault, an escrow, or
  another covenant), or when writing a .ark file, programFromArtifact,
  client.contract, constructor arguments, covenant outputs, tapleaf spends,
  vtxo scripts, or watching a contract with no user wallet.
---

# Arkade compiler and SDK

Use this for any contract, including a new options vault. Compile offline. Spend the artifact. The function names on `contract.functions` are the function names in the `.ark` file.

The escrow in this repo is one worked example of the same steps: `contracts/escrow.ark`, `app/src/program.ts`, `scripts/escrow-example.ts`.

## 1. Compile once

`arkadec` turns `contract.ark` into `contract.artifact.json`. Commit that JSON. The running program loads it. It does not compile `.ark`.

```ts
import { arkade } from "@arkade-os/sdk";
import artifact from "./contract.artifact.json" with { type: "json" };

const program = arkade.programFromArtifact(artifact);
```

`programFromArtifact` is not in the published SDK. It is [arkade-os/ts-sdk#958](https://github.com/arkade-os/ts-sdk/pull/958), commit `411b43f`, branch `cursor/compiler-artifact-program-bridge-0188`. Install that build. A release of `@arkade-os/sdk` from master will not have the function.

The package lives in `packages/ts-sdk` of a private monorepo, so a git dependency does not install it. This repo vendors it as `vendor/arkade-os-sdk-0.4.74-411b43f.tgz`.

That commit leaves opcodes `0xdb`–`0xdf` unassigned. `checkTime` compiles to `OP_CHECKTIME` (`0xdc`), which is on SDK master via [ts-sdk#967](https://github.com/arkade-os/ts-sdk/pull/967). `vendor/958-checktime.patch` is that opcode delta. The tarball is the #958 branch plus the patch. A new project that calls `checkTime` needs both.

`programFromArtifact` keeps what the compiler emitted. If the live operator rejects one of those choices, change that field and fail the build when anything else differs. The known case: `older(n)` is emitted as a block CSV, and public arkd rejects a block-type exit leaf. Set that same integer to BIP68 seconds. Leave every other opcode alone.

## 2. Open a session

Three clients, plus a contract manager. The operator is `arkadeOperator`, not `ark` or `arkProvider`. There is no user wallet in this session.

```ts
import {
    ContractManager,
    InMemoryContractRepository,
    InMemoryWalletRepository,
} from "@arkade-os/sdk";

const arkadeOperator = new RestArkProvider(arkadeUrl);
const indexer = new RestIndexerProvider(arkadeUrl);
const emulator = new RestEmulatorProvider(emulatorUrl);

const manager = await ContractManager.create({
    indexerProvider: indexer,
    contractRepository: new InMemoryContractRepository(),
    walletRepository: new InMemoryWalletRepository(),
});

const client = await arkade.Arkade.connect({
    arkade: arkadeOperator,
    indexer,
    emulator,
    contractManager: manager,
    network: networks.mutinynet,
});
```

Leave `identity` off. `ReadonlyWallet` is the wrong stand-in: it requires a pubkey and then watches that pubkey's receive and boarding scripts. Pass `identity` only when a leaf needs this session to sign.

`client.serverKey` is the operator key returned by that session. It is part of the taproot tree. It is not one of the keys named in the contract. The emulator is required only when a path actually spends.

## 3. Fill constructor arguments from the Ark types

`client.contract(program, args)` stores these in the taproot tree. Match the type in the `.ark` header, not the shape of a UI field.

| Ark type | Pass this |
| --- | --- |
| `pubkey` | `await key.xOnlyPublicKey()`. 32 bytes. |
| `bytes32` hash | `sha256(preimage)`. The signer signs the preimage. The contract stores the hash. |
| `bytes32` compared to `scriptPubKey` | The 32-byte witness program only. |
| `int` amount | Satoshis, as `bigint`. |
| `int` time | What that function reads. See below. |

A witness program is `DefaultVtxo.Script({ pubKey, serverPubKey: client.serverKey, csvTimelock }).tweakedPublicKey`.

That is not the output script. The output script is `pkScript`: `OP_1` pushed in front of the same 32 bytes, hex `5120…`. Use `pkScript` on transaction outputs. The contract manager subscribes to that same script. Use `tweakedPublicKey` only where the contract compares the 32-byte program.

A receive address is `vtxo.address(network.hrp, client.serverKey)`. `address` needs the operator key. The address is where a spend pays. It does not replace a `pubkey` argument. Decode it with `ArkAddress.decode` and check the HRP and `serverPubKey` before using it.

## 4. Spend a named function

```ts
const contract = client.contract(program, args);
const coin = (await contract.getUtxos())[0];

await contract.functions
    .claim(preimage)
    .from(coin)
    .to([{ script: destination.pkScript, amount: coin.value }])
    .send();
```

`.from` / `.to` / `.send()` is the path that talks to the operator and the emulator. It signs with the session identity. It does not collect every key named in the leaf.

Call the function with the inputs declared in `.ark`, in order. A function with no inputs is `functions.cancel()`. Outputs have to satisfy that function's `tx.outputs[i]` checks: value and `scriptPubKey`. If the contract stored a 32-byte witness program, that is what the check sees, while the output you build still carries the full `pkScript`.

A leaf that needs several local signatures, and no server, is not a `.send()`. Take the leaf from the compiled program, set the input sequence when the leaf has `older`, sign input 0 with each required key, and broadcast the Bitcoin or Arkade transaction yourself.

## 5. Watch the coins

Register the contract. That stores the program, the constructor args, and the server and emulator keys, and adds the full `pkScript` to the manager's one subscription. Do not call `indexer.subscribeForScripts` as well.

```ts
const contract = client.contract(program, args);
await contract.register();

const script = hex.encode(contract.pkScript);
const stop = manager.onContractEvent((event) => {
    if (event.type === "connection_reset" || event.contractScript !== script) return;
    // vtxo_received: the contract was funded
    // vtxo_spent: a function ran; the spending transaction's tapleaf says which
});
```

`contract.getUtxos()` then reads the repository. It drops spent and unrolled coins, so an empty list does not mean the contract was never funded. The spent coin arrives on `vtxo_spent`. Its `spentBy` is the spending transaction.

`register()` of the same script is a no-op and does not fetch history again. If that first fetch fails, backfill with `manager.refreshVtxos({ scripts: [script], after: 0 })`.

`wallet.restore()` will not find this contract. Nothing in a seed derives the script. The repository row is the backup. The in-memory repositories above are empty after a restart, so `register()` again with the same program, args, and keys. A durable repository reloads the row when `ContractManager.create` runs. Rebuild with `arkade.ArkadeContract.fromContract(client, row)` so a later server key does not point the watcher at a different script.

Do not set `metadata.genericallySpendable`. These coins stay out of a generic send.

Do not poll Esplora or Mempool for a virtual transaction id. `GET /api/tx/<vtxo txid>` returns 404. That id is not a Bitcoin transaction. Ask Mempool only about a transaction that has been unrolled, and only when the user is looking at that exit.

## 6. Time

`checkTime(deadline)` reads the emulator clock, in unix seconds. The operator rebuilds an off-chain spend with `nLockTime` 0, so `tx.time` does not enforce that deadline. The emulator can accept the spend early.

`older(n)` is a BIP68 CSV on the output being spent. The counter starts when that output is mined on Bitcoin, not when the virtual coin is created. Before unroll, the output does not exist on chain and the clock has not started. Read the operator minimum with `arkadeOperator.getInfo()` (`unilateralExitDelay`). The value is a multiple of 512.

Arm the spend control as soon as `getUtxos()` returns. Do not wait for a Bitcoin exit lookup before that. While that read is in flight, show a loader on the button instead of a grey disabled control.
