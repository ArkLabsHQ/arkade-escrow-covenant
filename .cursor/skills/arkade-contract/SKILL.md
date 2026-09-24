---
name: arkade-contract
description: >
  Load an arkadec artifact and spend any Arkade contract through the TypeScript
  SDK. Use when starting a new contract project (an options vault, an escrow, or
  another covenant), or when writing a .ark file, programFromArtifact,
  client.contract, constructor arguments, covenant outputs, tapleaf spends,
  vtxo scripts, or indexer subscriptions.
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

`programFromArtifact` keeps what the compiler emitted. If the live operator rejects one of those choices, change that field and fail the build when anything else differs. The known case: `older(n)` is emitted as a block CSV, and public arkd rejects a block-type exit leaf. Set that same integer to BIP68 seconds. Leave every other opcode alone.

`checkTime` compiles to `OP_CHECKTIME` (`0xdc`). The SDK build must know that opcode.

## 2. Open a session

Three clients. The operator is `arkadeOperator`, not `ark` or `arkProvider`.

```ts
const arkadeOperator = new RestArkProvider(arkadeUrl);
const indexer = new RestIndexerProvider(arkadeUrl);
const emulator = new RestEmulatorProvider(emulatorUrl);

const client = await arkade.Arkade.connect({
    arkade: arkadeOperator,
    indexer,
    emulator,
    identity: signerKey, // a SingleKey the server session uses
    network: networks.mutinynet,
});
```

`client.serverKey` is the operator key returned by that session. It is not one of the keys in the contract.

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

That is not the output script. The output script is `pkScript`: `OP_1` pushed in front of the same 32 bytes, hex `5120…`. Use `pkScript` on transaction outputs, on `getVtxos({ scripts })`, and on `subscribeForScripts`. Use `tweakedPublicKey` only where the contract compares the 32-byte program.

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

## 5. Read the coins

Ask the indexer with the full output script, not the 32-byte program:

```ts
const { vtxos } = await indexer.getVtxos({
    scripts: [hex.encode(contract.pkScript)],
});
```

The same list contains spent and unspent coins. An empty unspent set does not mean the contract was never funded. `isSpent` / `spentBy` means some function already ran. The spending transaction's tapleaf tells you which one.

For a live update, subscribe once and refresh when a vtxo appears or is spent:

```ts
const id = await indexer.subscribeForScripts([hex.encode(contract.pkScript)]);
for await (const event of indexer.getSubscription(id, abort.signal)) {
    if (event.newVtxos?.length || event.spentVtxos?.length || event.sweptVtxos?.length) {
        // read getVtxos again
    }
}
```

Do not poll Esplora or Mempool for a virtual transaction id. `GET /api/tx/<vtxo txid>` returns 404. That id is not a Bitcoin transaction. Ask Mempool only about a transaction that has been unrolled, and only when the user is looking at that exit.

## 6. Time

`checkTime(deadline)` reads the emulator clock, in unix seconds. The operator rebuilds an off-chain spend with `nLockTime` 0, so `tx.time` does not enforce that deadline. The emulator can accept the spend early.

`older(n)` is a BIP68 CSV on the output being spent. The counter starts when that output is mined on Bitcoin, not when the virtual coin is created. Before unroll, the output does not exist on chain and the clock has not started. Read the operator minimum with `arkadeOperator.getInfo()` (`unilateralExitDelay`). The value is a multiple of 512.

Arm the spend control as soon as the indexer read returns. Do not wait for a Bitcoin exit lookup before that. While that read is in flight, show a loader on the button instead of a grey disabled control.
