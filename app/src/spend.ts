import { base64, hex } from "@scure/base";
import {
    arkade,
    ArkAddress,
    assertSubmittedArkTxid,
    matchServerCheckpoints,
    networks,
    RestArkProvider,
    RestEmulatorProvider,
    RestIndexerProvider,
    SingleKey,
    timelockToSequence,
    Transaction,
    type Network,
} from "@arkade-os/sdk";

import { cancelOutputs, completeOutputs, unilateralOutputs, type PayOutput } from "./outputs.ts";
import { escrowProgram } from "./program.ts";

const program = escrowProgram();

export const RELEASE_LABEL = "release-to-seller";

export interface DemoNetwork {
    name: "mutinynet" | "bitcoin";
    label: string;
    network: Network;
    arkUrl: string;
    emulatorUrl: string;
    walletUrl: string;
    /** Esplora API. Used to read when a Bitcoin output was mined. */
    explorerUrl: string;
}

export const DEMO_NETWORKS: DemoNetwork[] = [
    {
        name: "mutinynet",
        label: "Mutinynet",
        network: networks.mutinynet,
        arkUrl: "https://mutinynet.arkade.sh",
        emulatorUrl: "https://emulator.mutinynet.arkade.sh",
        walletUrl: "https://mutinynet.arkade.money",
        explorerUrl: "https://mempool.mutinynet.arkade.sh/api",
    },
    {
        name: "bitcoin",
        label: "Bitcoin",
        network: networks.bitcoin,
        arkUrl: "https://arkade.computer",
        emulatorUrl: "https://emulator.arkade.computer",
        walletUrl: "https://bitcoin.arkade.money",
        explorerUrl: "https://mempool.space/api",
    },
];

export interface DemoKeys {
    buyer: SingleKey;
    seller: SingleKey;
    oracle: SingleKey;
}

const KEY_STORAGE = "arkade-escrow-demo-keys";

export interface StoredKeys {
    buyer: string;
    seller: string;
    oracle: string;
}

/** The three secret keys this page holds. Same file the download button writes. */
export function storedKeysFromText(text: string): StoredKeys {
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error("that file is not JSON");
    }
    if (!parsed || typeof parsed !== "object") throw new Error("that file is not a key backup");
    const record = parsed as Record<string, unknown>;
    const stored = {} as StoredKeys;
    for (const name of ["buyer", "seller", "oracle"] as const) {
        const value = record[name];
        if (typeof value !== "string" || !/^[0-9a-fA-F]{64}$/.test(value.trim())) {
            throw new Error(`${name} key must be 64 hex characters`);
        }
        stored[name] = value.trim().toLowerCase();
    }
    return stored;
}

export function keysFromStored(stored: StoredKeys): DemoKeys {
    return {
        buyer: SingleKey.fromHex(stored.buyer),
        seller: SingleKey.fromHex(stored.seller),
        oracle: SingleKey.fromHex(stored.oracle),
    };
}

export function exportStoredKeys(keys: DemoKeys): StoredKeys {
    return {
        buyer: keys.buyer.toHex(),
        seller: keys.seller.toHex(),
        oracle: keys.oracle.toHex(),
    };
}

export function saveStoredKeys(stored: StoredKeys): void {
    localStorage.setItem(KEY_STORAGE, JSON.stringify(stored));
}

export function loadKeys(): DemoKeys {
    const saved = localStorage.getItem(KEY_STORAGE);
    if (saved) return keysFromStored(storedKeysFromText(saved));
    const keys = {
        buyer: SingleKey.fromRandomBytes(),
        seller: SingleKey.fromRandomBytes(),
        oracle: SingleKey.fromRandomBytes(),
    };
    localStorage.setItem(
        KEY_STORAGE,
        JSON.stringify({
            buyer: keys.buyer.toHex(),
            seller: keys.seller.toHex(),
            oracle: keys.oracle.toHex(),
        }),
    );
    return keys;
}

export async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
    // digest() takes an ArrayBuffer.
    const copy = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(copy).set(bytes);
    return new Uint8Array(await crypto.subtle.digest("SHA-256", copy));
}

/** 32-byte attestation. The contract commits sha256 of this, and the oracle signs it. */
export async function releaseMessage(): Promise<Uint8Array> {
    return sha256(new TextEncoder().encode(RELEASE_LABEL));
}

export interface Payout {
    /** 32-byte witness program the covenant compares. */
    program: Uint8Array;
    /** Output script that pays that program. */
    pkScript: Uint8Array;
}

export function payoutFromAddress(address: string, hrp: string, serverKey: Uint8Array): Payout {
    let decoded: ArkAddress;
    try {
        decoded = ArkAddress.decode(address.trim());
    } catch {
        throw new Error("that is not an Arkade address");
    }
    if (decoded.hrp !== hrp) {
        throw new Error(`that address is for ${decoded.hrp}, this operator uses ${hrp}`);
    }
    if (!equalBytes(decoded.serverPubKey, serverKey)) {
        throw new Error("that address belongs to a different Arkade operator");
    }
    return { program: decoded.vtxoTaprootKey, pkScript: decoded.pkScript };
}

export interface PreparedEscrow {
    demo: DemoNetwork;
    contract: arkade.ArkadeContract;
    ark: RestArkProvider;
    emulatorVersion: string;
    message: Uint8Array;
    oracle: SingleKey;
    buyer: SingleKey;
    seller: SingleKey;
    exit: bigint;
}

export interface ExitAnchor {
    txid: string;
    /** True when this coin itself is the mined Bitcoin output. */
    unrolled: boolean;
}

/**
 * `older(exit)` is a BIP68 seconds CSV. The seconds start when the Bitcoin
 * output is mined. A virtual coin that is still offchain uses the commitment
 * it is anchored to. An unrolled coin uses its own output.
 */
export function exitAnchor(coin: {
    txid: string;
    isUnrolled?: boolean;
    commitmentTxIds?: string[];
}): ExitAnchor | undefined {
    if (coin.isUnrolled) return { txid: coin.txid, unrolled: true };
    const commitment = coin.commitmentTxIds?.find((txid) => txid.length > 0);
    if (!commitment) return undefined;
    return { txid: commitment, unrolled: false };
}

/** Unix time when a CSV of `exitSeconds` opens, counting from the mined output. */
export function exitOpensAt(minedAtUnix: number, exitSeconds: bigint): number {
    if (!Number.isSafeInteger(minedAtUnix) || minedAtUnix < 0) {
        throw new Error("mined time is not a unix second");
    }
    const delay = Number(exitSeconds);
    if (!Number.isSafeInteger(delay) || delay < 0) throw new Error("exit delay is not a whole number of seconds");
    return minedAtUnix + delay;
}

export function describeExitClock(input: {
    txid: string;
    minedAt: number | null;
    exitSeconds: bigint;
    now: number;
}): { text: string; open: boolean } {
    const short = `${input.txid.slice(0, 8)}…${input.txid.slice(-8)}`;
    if (input.minedAt === null) {
        return {
            text: `Bitcoin output ${short} is not mined yet, so the exit clock has not started.`,
            open: false,
        };
    }
    const opens = exitOpensAt(input.minedAt, input.exitSeconds);
    const mined = new Date(input.minedAt * 1000).toISOString().replace(".000Z", "Z");
    const ready = new Date(opens * 1000).toISOString().replace(".000Z", "Z");
    const delay = input.exitSeconds.toString();
    if (input.now >= opens) {
        return {
            text: `CSV starts when Bitcoin output ${short} is mined (${mined}), not when the virtual coin is created. ${delay}s from that mine time was ${ready}, so the exit is open.`,
            open: true,
        };
    }
    return {
        text: `CSV starts when Bitcoin output ${short} is mined (${mined}), not when the virtual coin is created. ${delay}s from that mine time opens the exit at ${ready}.`,
        open: false,
    };
}

/** Block time of a Bitcoin transaction, or null when it is still unconfirmed. */
export async function bitcoinMinedAt(explorerUrl: string, txid: string): Promise<number | null> {
    const response = await fetch(`${explorerUrl.replace(/\/$/, "")}/tx/${txid}`);
    if (!response.ok) throw new Error(`bitcoin output lookup failed: ${response.status}`);
    const body = (await response.json()) as { status?: { confirmed?: boolean; block_time?: number } };
    if (!body.status?.confirmed) return null;
    if (typeof body.status.block_time !== "number") throw new Error("bitcoin output has no mined time");
    return body.status.block_time;
}

/** Operator unilateral exit delay. Public arkd requires the escrow exit to be at least this. */
export async function minimumExitDelay(demo: DemoNetwork): Promise<bigint> {
    return (await new RestArkProvider(demo.arkUrl).getInfo()).unilateralExitDelay;
}

export async function prepareEscrow(input: {
    demo: DemoNetwork;
    buyerAddress: string;
    sellerAddress: string;
    amount: bigint;
    timeoutAt: bigint;
    exit: bigint;
    keys: DemoKeys;
}): Promise<PreparedEscrow> {
    const ark = new RestArkProvider(input.demo.arkUrl);
    const indexer = new RestIndexerProvider(input.demo.arkUrl);
    const emulator = new RestEmulatorProvider(input.demo.emulatorUrl);
    const [client, emulatorInfo, message, info] = await Promise.all([
        arkade.Arkade.connect({
            arkade: ark,
            indexer,
            emulator,
            identity: input.keys.buyer,
            network: input.demo.network,
        }),
        fetch(`${input.demo.emulatorUrl}/v1/info`).then(async (response) => {
            if (!response.ok) throw new Error(`emulator info failed: ${response.status}`);
            return response.json() as Promise<{ version?: string }>;
        }),
        releaseMessage(),
        ark.getInfo(),
    ]);
    // Public arkd rejects a block CSV on an exit leaf, and a seconds delay
    // shorter than the operator's own unilateral exit.
    if (input.exit % 512n !== 0n) {
        throw new Error("unilateral delay must be a multiple of 512 seconds");
    }
    if (input.exit < info.unilateralExitDelay) {
        throw new Error(
            `unilateral delay must be at least ${info.unilateralExitDelay} seconds on this operator`,
        );
    }
    const buyer = payoutFromAddress(input.buyerAddress, input.demo.network.hrp, client.serverKey);
    const seller = payoutFromAddress(input.sellerAddress, input.demo.network.hrp, client.serverKey);
    const [buyerPk, sellerPk, oraclePk, messageHash] = await Promise.all([
        input.keys.buyer.xOnlyPublicKey(),
        input.keys.seller.xOnlyPublicKey(),
        input.keys.oracle.xOnlyPublicKey(),
        sha256(message),
    ]);
    const contract = client.contract(program, {
        partyAPk: buyerPk,
        partyBPk: sellerPk,
        oraclePk,
        oracleMessageHash: messageHash,
        partyAScript: buyer.program,
        partyBScript: seller.program,
        amount: input.amount,
        timeoutAt: input.timeoutAt,
        exit: input.exit,
    });
    return {
        demo: input.demo,
        contract,
        ark,
        emulatorVersion: emulatorInfo.version ?? "",
        message,
        oracle: input.keys.oracle,
        buyer: input.keys.buyer,
        seller: input.keys.seller,
        exit: input.exit,
    };
}

export async function spendComplete(
    prepared: PreparedEscrow,
    coin: arkade.Utxo,
    sellerScript: Uint8Array,
    buyerScript: Uint8Array,
    amount: bigint,
): Promise<string> {
    const signature = await prepared.oracle.signMessage(prepared.message, "schnorr");
    const outputs = completeOutputs(BigInt(coin.value), amount, sellerScript, buyerScript);
    const result = await prepared.contract.functions
        .complete(prepared.message, signature)
        .from(coin)
        .to(outputs)
        .send();
    return result.txid;
}

export async function spendCancel(
    prepared: PreparedEscrow,
    coin: arkade.Utxo,
    buyerScript: Uint8Array,
): Promise<string> {
    const outputs = cancelOutputs(BigInt(coin.value), buyerScript);
    const result = await prepared.contract.functions.cancel().from(coin).to(outputs).send();
    return result.txid;
}

/**
 * Both unilateral keys live in this page. The high-level sender has one
 * identity, so this signs the leaf with each key and submits the tapscript
 * the way `ArkadeTransactionBuilder.send` does for a covenant-less path.
 */
export async function spendUnilateral(
    prepared: PreparedEscrow,
    coin: arkade.Utxo,
    sellerScript: Uint8Array,
): Promise<string> {
    const outputs = unilateralOutputs(BigInt(coin.value), sellerScript);
    const sequence = timelockToSequence({ type: "seconds", value: prepared.exit });
    const built = await prepared.contract.functions.unilateral().from(coin).to(outputs).build();
    setSequence(built.arkTx, sequence);
    for (const checkpoint of built.checkpoints) setSequence(checkpoint, sequence);

    let arkTx = built.arkTx;
    for (const key of [prepared.buyer, prepared.seller]) {
        arkTx = await key.sign(arkTx, [0]);
    }
    const submitted = built.checkpoints.map((checkpoint) => base64.encode(checkpoint.toPSBT()));
    const response = await prepared.ark.submitTx(base64.encode(arkTx.toPSBT()), submitted);
    assertSubmittedArkTxid(response, arkTx, "submitTx");
    const matched = matchServerCheckpoints(
        response.signedCheckpointTxs,
        built.checkpoints,
        "submitTx",
    );
    const finalCheckpoints: string[] = [];
    for (const { server } of matched) {
        setSequence(server, sequence);
        let signed = server;
        for (const key of [prepared.buyer, prepared.seller]) {
            signed = await key.sign(signed, [0]);
        }
        finalCheckpoints.push(base64.encode(signed.toPSBT()));
    }
    await prepared.ark.finalizeTx(response.arkTxid, finalCheckpoints);
    return response.arkTxid;
}

function setSequence(tx: Transaction, sequence: number): void {
    tx.updateInput(0, { sequence });
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
    if (left.length !== right.length) return false;
    for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return false;
    return true;
}

export function shortHex(bytes: Uint8Array): string {
    const encoded = hex.encode(bytes);
    return `${encoded.slice(0, 8)}…${encoded.slice(-8)}`;
}

export type { PayOutput };
