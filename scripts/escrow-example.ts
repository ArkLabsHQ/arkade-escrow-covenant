/**
 * Build an escrow on Mutinynet and, once it has a coin, spend it.
 * Run from the repo root: node --experimental-strip-types scripts/escrow-example.ts
 *
 * The three private keys are fixed so the snippet is copy-pasteable.
 * Replace them before sending real funds. The buyer key is also the identity
 * that talks to the operator.
 */
import {
    arkade,
    DefaultVtxo,
    networks,
    RestArkProvider,
    RestEmulatorProvider,
    RestIndexerProvider,
    SingleKey,
} from "@arkade-os/sdk";

import { cancelOutputs, completeOutputs } from "../app/src/outputs.ts";
import { escrowProgram } from "../app/src/program.ts";

const buyerKey = SingleKey.fromHex("0000000000000000000000000000000000000000000000000000000000000001");
const sellerKey = SingleKey.fromHex("0000000000000000000000000000000000000000000000000000000000000002");
const oracleKey = SingleKey.fromHex("0000000000000000000000000000000000000000000000000000000000000003");

const amount = 10_000n;
const timeoutAt = BigInt(Math.floor(Date.now() / 1000) - 60);
const exit = 512n;

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
const buyerAddress = buyerVtxo.address(networks.mutinynet.hrp, client.serverKey);
const sellerAddress = sellerVtxo.address(networks.mutinynet.hrp, client.serverKey);

const program = escrowProgram();
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

console.log("fund", contract.address);
console.log("buyer payout", buyerAddress.encode());
console.log("seller payout", sellerAddress.encode());

const coins = await contract.getUtxos();
const coin = coins[0];
if (!coin) {
    console.log("no coins yet. Fund the address above, then re-run with complete or cancel.");
    process.exit(0);
}

const spend = process.argv[2];
if (spend === "complete") {
    const signature = await oracleKey.signMessage(message, "schnorr");
    const released = await contract.functions
        .complete(message, signature)
        .from(coin)
        .to(completeOutputs(BigInt(coin.value), amount, sellerAddress.pkScript, buyerAddress.pkScript))
        .send();
    console.log("complete", released.txid);
} else if (spend === "cancel") {
    const refunded = await contract.functions
        .cancel()
        .from(coin)
        .to(cancelOutputs(BigInt(coin.value), buyerAddress.pkScript))
        .send();
    console.log("cancel", refunded.txid);
} else {
    console.log(`${coins.length} coin(s). Re-run with complete or cancel.`);
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
    const copy = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(copy).set(bytes);
    return new Uint8Array(await crypto.subtle.digest("SHA-256", copy));
}
