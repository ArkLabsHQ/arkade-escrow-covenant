import { base64, bech32, hex } from "@scure/base";
import {
    arkade,
    ArkAddress,
    assertSubmittedArkTxid,
    matchServerCheckpoints,
    networks,
    EsploraProvider,
    OnchainWallet,
    RestArkProvider,
    RestEmulatorProvider,
    MnemonicIdentity,
    RestIndexerProvider,
    SingleKey,
    Unroll,
    timelockToSequence,
    Transaction,
    type Network,
    type VirtualCoin,
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

const ESCROW_STORAGE = "arkade-escrow-records";
const LAST_ESCROW = "arkade-escrow-last";

/** Parameters that rebuild an escrow address. The oracle key lives with the other keys. */
export interface StoredEscrow {
    address: string;
    network: "mutinynet" | "bitcoin";
    buyer: string;
    seller: string;
    amount: string;
    timeout: string;
    exit: string;
}

export function parseEscrowList(value: unknown): StoredEscrow[] {
    if (!Array.isArray(value)) return [];
    const list: StoredEscrow[] = [];
    for (const item of value) {
        if (!item || typeof item !== "object") continue;
        const record = item as Record<string, unknown>;
        const network = record.network;
        if (network !== "mutinynet" && network !== "bitcoin") continue;
        const fields = ["address", "buyer", "seller", "amount", "timeout", "exit"] as const;
        if (fields.some((name) => typeof record[name] !== "string" || !(record[name] as string).trim())) continue;
        list.push({
            address: (record.address as string).trim(),
            network,
            buyer: (record.buyer as string).trim(),
            seller: (record.seller as string).trim(),
            amount: (record.amount as string).trim(),
            timeout: (record.timeout as string).trim(),
            exit: (record.exit as string).trim(),
        });
    }
    return list;
}

export function upsertEscrow(list: StoredEscrow[], escrow: StoredEscrow): StoredEscrow[] {
    return [escrow, ...list.filter((item) => item.address !== escrow.address)];
}

export function escrowsFromBackup(text: string): StoredEscrow[] {
    try {
        const parsed = JSON.parse(text) as { escrows?: unknown };
        return parseEscrowList(parsed?.escrows);
    } catch {
        return [];
    }
}

export function readEscrows(): StoredEscrow[] {
    const raw = localStorage.getItem(ESCROW_STORAGE);
    if (!raw) return [];
    try {
        return parseEscrowList(JSON.parse(raw));
    } catch {
        return [];
    }
}

export function writeEscrows(list: StoredEscrow[]): void {
    localStorage.setItem(ESCROW_STORAGE, JSON.stringify(list));
}

export function saveEscrow(escrow: StoredEscrow): void {
    writeEscrows(upsertEscrow(readEscrows(), escrow));
    localStorage.setItem(LAST_ESCROW, escrow.address);
}

export function lastEscrowAddress(): string {
    return localStorage.getItem(LAST_ESCROW) ?? "";
}

/** Unspent virtual coins locked to an Arkade address. Works without the contract parameters. */
export async function coinsForAddress(demo: DemoNetwork, address: string): Promise<VirtualCoin[]> {
    const decoded = ArkAddress.decode(address.trim());
    const script = `5120${hex.encode(decoded.vtxoTaprootKey)}`;
    const { vtxos } = await new RestIndexerProvider(demo.arkUrl).getVtxos({ scripts: [script] });
    return vtxos.filter((coin) => !coin.isSpent && !coin.spentBy);
}

/**
 * Buyer or seller secret.
 * A 64-character hex key, a Nostr nsec, or the BIP39 words from an Arkade wallet.
 * Words use the same BIP86 key the wallet uses: coin type 0 on bitcoin, coin type 1 on mutinynet.
 */
export function secretToKey(text: string, opts?: { mainnet?: boolean }): SingleKey {
    const trimmed = text.trim().replace(/\s+/g, " ");
    if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return SingleKey.fromHex(trimmed.toLowerCase());
    const lower = trimmed.toLowerCase();
    const words = lower.split(" ");
    if (words.length >= 12 && words.every((word) => /^[a-z]+$/.test(word))) {
        let identity: MnemonicIdentity;
        try {
            identity = MnemonicIdentity.fromMnemonic(lower, { isMainnet: opts?.mainnet ?? false });
        } catch {
            throw new Error("that mnemonic is not a valid BIP39 phrase");
        }
        const secret = (identity as unknown as { derivedKey: Uint8Array }).derivedKey;
        return SingleKey.fromPrivateKey(secret);
    }
    if (!lower.startsWith("nsec1")) throw new Error("paste an nsec, a 64-character hex key, or a 12-word mnemonic");
    let decoded: { prefix: string; words: number[] };
    try {
        decoded = bech32.decode(lower as `${string}1${string}`);
    } catch {
        throw new Error("that nsec could not be decoded");
    }
    if (decoded.prefix !== "nsec") throw new Error("that is not an nsec");
    const bytes = Uint8Array.from(bech32.fromWords(decoded.words));
    if (bytes.length !== 32) throw new Error("nsec is not a 32-byte key");
    return SingleKey.fromPrivateKey(bytes);
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
 * `older(exit)` spends this coin. The CSV starts when the transaction that
 * created it is mined. A commitment further down the chain is only an ancestor.
 */
export function exitAnchor(coin: { txid: string; isUnrolled?: boolean }): ExitAnchor {
    return { txid: coin.txid, unrolled: coin.isUnrolled === true };
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
            text: `Funding transaction ${short} is not on Bitcoin yet. Unroll it. The CSV starts when its output is mined.`,
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
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`bitcoin output lookup failed: ${response.status}`);
    const body = (await response.json()) as { status?: { confirmed?: boolean; block_time?: number } };
    if (!body.status?.confirmed) return null;
    if (typeof body.status.block_time !== "number") throw new Error("bitcoin output has no mined time");
    return body.status.block_time;
}

const FEE_STORAGE = "arkade-escrow-fee-key";

/** On-chain key that pays the anchor child for each unroll package. */
export function loadFeeKey(): SingleKey {
    const saved = localStorage.getItem(FEE_STORAGE);
    if (saved && /^[0-9a-fA-F]{64}$/.test(saved.trim())) return SingleKey.fromHex(saved.trim());
    const key = SingleKey.fromRandomBytes();
    localStorage.setItem(FEE_STORAGE, key.toHex());
    return key;
}

export async function feeWallet(demo: DemoNetwork, key: SingleKey): Promise<OnchainWallet> {
    return OnchainWallet.create(key, demo.name, new EsploraProvider(demo.explorerUrl));
}

export type UnrollProgress =
    | { kind: "broadcast"; txid: string }
    | { kind: "waiting"; txid: string }
    | { kind: "done"; txid: string };

/**
 * Broadcast the next off-chain ancestor of `coin`, packaged with a fee child
 * that spends its pay-to-anchor. One call is one hop. A hop already in the
 * mempool comes back as `waiting` until it is mined.
 */
export async function unrollOnce(
    demo: DemoNetwork,
    coin: { txid: string; vout: number },
    key: SingleKey,
): Promise<UnrollProgress> {
    const indexer = new RestIndexerProvider(demo.arkUrl);
    const explorer = new EsploraProvider(demo.explorerUrl);
    const bumper = await feeWallet(demo, key);
    const session = await Unroll.Session.create({ txid: coin.txid, vout: coin.vout }, bumper, explorer, indexer);
    const step = await session.next();
    if (step.type === Unroll.StepType.DONE) {
        await step.do();
        return { kind: "done", txid: step.vtxoTxid };
    }
    if (step.type === Unroll.StepType.WAIT) return { kind: "waiting", txid: step.txid };
    await step.do();
    return { kind: "broadcast", txid: step.tx.id };
}

export interface UnrollHop {
    txid: string;
    kind: string;
    /** confirmed, in the mempool, or still only on the indexer. */
    onchain: "confirmed" | "mempool" | "offchain";
}

/** Indexer chain from the on-chain root out to this coin, with Bitcoin status. */
export async function listUnrollHops(
    demo: DemoNetwork,
    coin: { txid: string; vout: number },
): Promise<UnrollHop[]> {
    const indexer = new RestIndexerProvider(demo.arkUrl);
    const explorer = new EsploraProvider(demo.explorerUrl);
    const { chain } = await indexer.getVtxoChain(coin);
    const hops: UnrollHop[] = [];
    for (const step of [...chain].reverse()) {
        const kind = step.type.replace("INDEXER_CHAINED_TX_TYPE_", "").toLowerCase();
        if (kind === "commitment") {
            hops.push({ txid: step.txid, kind, onchain: "confirmed" });
            continue;
        }
        let onchain: UnrollHop["onchain"] = "offchain";
        try {
            const status = await explorer.getTxStatus(step.txid);
            onchain = status.confirmed ? "confirmed" : "mempool";
        } catch {
            onchain = "offchain";
        }
        hops.push({ txid: step.txid, kind, onchain });
    }
    return hops;
}

/**
 * Spend the unrolled escrow output on Bitcoin. Both nsecs sign the 2-of-2
 * leaf. The coins go to `address`. Nothing is sent to the Arkade server.
 */
export async function spendExitOnchain(
    prepared: PreparedEscrow,
    coin: { txid: string; vout: number; value: number },
    address: string,
): Promise<string> {
    const names = Object.keys(prepared.contract.program.functions);
    const index = names.indexOf("unilateral");
    if (index < 0) throw new Error("contract has no unilateral leaf");
    const leaf = prepared.contract.leafScript(index);
    const sequence = timelockToSequence({ type: "seconds", value: prepared.exit });
    const explorer = new EsploraProvider(prepared.demo.explorerUrl);
    const rate = Math.max(1, (await explorer.getFeeRate()) ?? 1);
    const value = BigInt(coin.value);
    const build = (fee: bigint) => {
        const send = value - fee;
        if (send < 546n) throw new Error(`this coin has ${value} sats, which cannot pay a ${fee} sat fee`);
        const tx = new Transaction({ version: 2 });
        tx.addInput({
            txid: coin.txid,
            index: coin.vout,
            sequence,
            tapLeafScript: [leaf],
            witnessUtxo: { amount: value, script: prepared.contract.pkScript },
        });
        tx.addOutputAddress(address, send, prepared.demo.network);
        return tx;
    };
    let fee = 1000n;
    let tx = build(fee);
    for (const key of [prepared.buyer, prepared.seller]) tx = await key.sign(tx, [0]);
    tx.finalize();
    const needed = BigInt(Math.ceil(tx.vsize * rate));
    if (needed > fee) {
        fee = needed;
        tx = build(fee);
        for (const key of [prepared.buyer, prepared.seller]) tx = await key.sign(tx, [0]);
        tx.finalize();
    }
    const broadcast = await explorer.broadcastTransaction(tx.hex);
    return typeof broadcast === "string" && broadcast.trim() ? broadcast.trim() : tx.id;
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
