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
    resolveEmulatorPubkey,
    scriptFromTapLeafScript,
    timelockToSequence,
    Transaction,
    type Network,
    type VirtualCoin,
} from "@arkade-os/sdk";

import { cancelOutputs, completeOutputs, unilateralOutputs, type PayOutput } from "./outputs.ts";
import { escrowProgram } from "./program.ts";

const program = escrowProgram();

export const RELEASE_LABEL = "release-to-seller";

/** How a spend closed the escrow. `unknown` is spent, but the leaf was not one of ours. */
export type ClosedSpend = "cancel" | "complete" | "unilateral" | "unknown";

export type SpendPath = "cancel" | "complete" | "unilateral";

/** A tapleaf the escrow program can spend. `leaf` is the full script; `marker` is the tweaked emulator key inside it. */
export interface LeafMark {
    name: SpendPath;
    leaf?: Uint8Array;
    marker?: Uint8Array;
}

/** One status for the card and the sheet. An empty address is waiting. A spent one stays closed. */
export function escrowView(input: {
    coins: number;
    unrolled: boolean;
    refundDue: boolean;
    when: string;
    closed?: ClosedSpend | null;
}): { status: string; refund: string; release: boolean; refundNow: boolean } {
    const later = input.when ? `You can refund the buyer after ${input.when}.` : "";
    const off = { refund: "Release and refund stay off.", release: false, refundNow: false };
    if (input.coins === 0) {
        if (input.closed === "cancel") return { status: "Refunded to the buyer", ...off };
        if (input.closed === "complete") return { status: "Released to the seller", ...off };
        if (input.closed === "unilateral") {
            return {
                status: "Unilateral exit",
                refund: "The buyer and seller spent the unilateral exit.",
                release: false,
                refundNow: false,
            };
        }
        if (input.closed === "unknown") return { status: "Closed", ...off };
        return {
            status: "Waiting for funds",
            refund: input.refundDue ? "Refund stays off until the sats arrive." : later,
            release: false,
            refundNow: false,
        };
    }
    if (input.unrolled) return { status: "On Bitcoin", ...off };
    if (input.refundDue) {
        return { status: "Refund open", refund: "You can refund the buyer now.", release: true, refundNow: true };
    }
    return { status: "Funded", refund: later, release: true, refundNow: false };
}

/**
 * Collapse per-coin leaf matches. Cancel and complete disagreeing is closed
 * without a side. No recognized leaf is still closed (`unknown`), not unfunded.
 */
export function closedSpend(paths: Array<SpendPath | null>): ClosedSpend | null {
    if (paths.length === 0) return null;
    const named = paths.filter(
        (path): path is SpendPath => path === "cancel" || path === "complete" || path === "unilateral",
    );
    if (named.length === 0) return "unknown";
    if (named.some((path) => path === "unilateral")) return "unilateral";
    if (named.every((path) => path === "cancel")) return "cancel";
    if (named.every((path) => path === "complete")) return "complete";
    return "unknown";
}

/** Match tapleaf scripts from a spending transaction to the escrow's cancel or complete leaf. */
export function matchSpendLeaf(scripts: Uint8Array[], marks: LeafMark[]): SpendPath | null {
    for (const script of scripts) {
        for (const mark of marks) {
            if (mark.leaf && equalBytes(script, mark.leaf)) return mark.name;
        }
    }
    for (const script of scripts) {
        for (const mark of marks) {
            if (mark.marker && includesBytes(script, mark.marker)) return mark.name;
        }
    }
    // The unilateral leaf is `older(exit)` — OP_CHECKSEQUENCEVERIFY — and does not carry the emulator key.
    if (scripts.some((script) => scriptHasOpcode(script, 0xb2))) return "unilateral";
    return null;
}

/** Tapleaf bodies carried on a virtual-tx PSBT. The indexer returns that PSBT from `getVirtualTxs`. */
export function tapLeavesFromVirtualTx(encoded: string): Uint8Array[] {
    let tx: Transaction;
    try {
        tx = Transaction.fromPSBT(base64.decode(encoded));
    } catch {
        return [];
    }
    const scripts: Uint8Array[] = [];
    for (let i = 0; i < tx.inputsLength; i++) {
        for (const leaf of tx.getInput(i).tapLeafScript ?? []) {
            scripts.push(scriptFromTapLeafScript(leaf));
        }
    }
    return scripts;
}

export interface CovenantArgs {
    partyAPk: Uint8Array;
    partyBPk: Uint8Array;
    oraclePk: Uint8Array;
    oracleMessageHash: Uint8Array;
    partyAScript: Uint8Array;
    partyBScript: Uint8Array;
    amount: bigint;
    timeoutAt: bigint;
}

/** Tweaked emulator keys for the cancel and complete covenants. Those keys sit inside the tapleaf. */
export function covenantLeafMarks(emulatorKey: Uint8Array, args: CovenantArgs): LeafMark[] {
    return [
        { name: "cancel", marker: arkade.computeArkadeScriptPublicKey(emulatorKey, covenantScript("cancel", args)) },
        { name: "complete", marker: arkade.computeArkadeScriptPublicKey(emulatorKey, covenantScript("complete", args)) },
    ];
}

/** Exact leaves from a compiled contract, plus the covenant marker when the emulator key is known. */
export function leafMarksFromCompiled(
    compiled: readonly { name: string; leafScript: Uint8Array; arkadeScript?: Uint8Array }[],
    emulatorKey?: Uint8Array,
): LeafMark[] {
    const marks: LeafMark[] = [];
    for (const fn of compiled) {
        const name = spendPathName(fn.name);
        if (!name) continue;
        marks.push({
            name,
            leaf: fn.leafScript,
            marker:
                emulatorKey && fn.arkadeScript
                    ? arkade.computeArkadeScriptPublicKey(emulatorKey, fn.arkadeScript)
                    : undefined,
        });
    }
    return marks;
}

function spendPathName(name: string): SpendPath | null {
    if (name === "cancel" || name === "complete" || name === "unilateral") return name;
    return null;
}

export async function leafMarksForEscrow(input: {
    demo: DemoNetwork;
    buyerAddress: string;
    sellerAddress: string;
    amount: bigint;
    timeoutAt: bigint;
    keys: DemoKeys;
}): Promise<LeafMark[]> {
    const [partyAPk, partyBPk, oraclePk, message] = await Promise.all([
        input.keys.buyer.xOnlyPublicKey(),
        input.keys.seller.xOnlyPublicKey(),
        input.keys.oracle.xOnlyPublicKey(),
        releaseMessage(),
    ]);
    return covenantLeafMarks(hex.decode(resolveEmulatorPubkey(input.demo.network)), {
        partyAPk,
        partyBPk,
        oraclePk,
        oracleMessageHash: await sha256(message),
        partyAScript: ArkAddress.decode(input.buyerAddress.trim()).vtxoTaprootKey,
        partyBScript: ArkAddress.decode(input.sellerAddress.trim()).vtxoTaprootKey,
        amount: input.amount,
        timeoutAt: input.timeoutAt,
    });
}

export interface EscrowFacts {
    /** Unspent coins still inside the covenant. */
    spendable: VirtualCoin[];
    /** Unspent coins already unrolled on Bitcoin. */
    unrolled: VirtualCoin[];
    /** Set when nothing unspent remains and at least one coin was spent offchain. */
    closed: ClosedSpend | null;
}

/**
 * Indexer read for one escrow address.
 * `getVtxos` returns spent and unspent vtxos (`isSpent`, `spentBy`, `arkTxId`, `isUnrolled`).
 * `getVirtualTxs` returns the checkpoint and ark transaction PSBTs. `spentBy` is the checkpoint;
 * its `tapLeafScript` is the cancel, complete, or unilateral leaf.
 * An unrolled coin that Bitcoin has spent is read with Esplora `getTxOutspends` and `getRawTransaction`.
 */
export async function escrowFacts(demo: DemoNetwork, address: string, marks: LeafMark[]): Promise<EscrowFacts> {
    const vtxos = await vtxosForAddress(demo, address);
    const live = vtxos.filter((coin) => !coin.isSpent && !coin.spentBy && !coin.isSwept);
    const spendable = live.filter((coin) => !coin.isUnrolled);
    const unrolled = live.filter((coin) => coin.isUnrolled);
    const spent = vtxos.filter((coin) => coin.isSpent || !!coin.spentBy);
    const onchain = await onchainExit(demo, unrolled, marks);
    const stillUnrolled = onchain.live;
    let closed: ClosedSpend | null = null;
    if (spendable.length === 0 && stillUnrolled.length === 0) {
        closed = preferClosed(await closureFromSpent(demo, spent, marks), onchain.closed);
    }
    return { spendable, unrolled: stillUnrolled, closed };
}

export function arkadeAddressUrl(spaceUrl: string, address: string): string {
    return `${spaceUrl}/address/${encodeURIComponent(address)}`;
}

/** BIP321 pay link for an Arkade address. `amount` is an integer number of satoshis. */
export function bip321FundingUri(address: string, amount: string | number | bigint): string {
    const ark = address.trim();
    const sats = canonicalSats(amount);
    if (!ark || sats === null) return "";
    return `bitcoin:?ark=${encodeURIComponent(ark)}&amount=${encodeURIComponent(sats)}`;
}

function canonicalSats(amount: string | number | bigint): string | null {
    if (typeof amount === "bigint") return amount >= 0n ? amount.toString() : null;
    if (typeof amount === "number") {
        if (!Number.isSafeInteger(amount) || amount < 0) return null;
        return String(amount);
    }
    const text = amount.trim();
    if (!/^[0-9]+$/.test(text)) return null;
    return BigInt(text).toString();
}

export interface DemoNetwork {
    name: "mutinynet";
    label: string;
    network: Network;
    arkUrl: string;
    emulatorUrl: string;
    walletUrl: string;
    /** Arkade explorer origin. Address pages are `${spaceUrl}/address/…`. */
    spaceUrl: string;
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
        spaceUrl: "https://explorer.mutinynet.arkade.sh",
        explorerUrl: "https://mempool.mutinynet.arkade.sh/api",
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
    network: "mutinynet";
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
        if (network !== "mutinynet") continue;
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

/** Adds backup escrows in file order. An address already saved is replaced and moved to the front. */
export function mergeEscrows(list: StoredEscrow[], incoming: StoredEscrow[]): StoredEscrow[] {
    return [...incoming].reverse().reduce((next, escrow) => upsertEscrow(next, escrow), list);
}

export function removeEscrow(list: StoredEscrow[], address: string): StoredEscrow[] {
    const trimmed = address.trim();
    return list.filter((item) => item.address !== trimmed);
}

export function forgetEscrow(address: string): void {
    const trimmed = address.trim();
    writeEscrows(removeEscrow(readEscrows(), trimmed));
    if (lastEscrowAddress() === trimmed) localStorage.removeItem(LAST_ESCROW);
}

export function escrowsFromBackup(text: string): StoredEscrow[] {
    try {
        const parsed = JSON.parse(text) as { escrows?: unknown };
        return parseEscrowList(parsed?.escrows);
    } catch {
        return [];
    }
}

/** Prefer an escrow on the network already on screen. Otherwise open the first record in the file. */
export function selectBackupEscrow(escrows: StoredEscrow[], network: string): StoredEscrow | undefined {
    return escrows.find((escrow) => escrow.network === network) ?? escrows[0];
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

/** Every vtxo the indexer has for an address, spent and unspent. */
export async function vtxosForAddress(demo: DemoNetwork, address: string): Promise<VirtualCoin[]> {
    const decoded = ArkAddress.decode(address.trim());
    const script = `5120${hex.encode(decoded.vtxoTaprootKey)}`;
    const { vtxos } = await new RestIndexerProvider(demo.arkUrl).getVtxos({ scripts: [script] });
    return vtxos;
}

/** Unspent virtual coins locked to an Arkade address. Works without the contract parameters. */
export async function coinsForAddress(demo: DemoNetwork, address: string): Promise<VirtualCoin[]> {
    const vtxos = await vtxosForAddress(demo, address);
    return vtxos.filter((coin) => !coin.isSpent && !coin.spentBy);
}

function covenantScript(name: "cancel" | "complete", args: CovenantArgs): Uint8Array {
    const asm = program.functions[name]?.arkadeScript?.asm;
    if (!asm) throw new Error(`escrow ${name} leaf has no covenant`);
    return arkade.resolveAsm(asm, args as unknown as Record<string, Uint8Array | bigint | number>);
}

async function virtualTxPayloads(demo: DemoNetwork, ids: string[]): Promise<string[]> {
    const indexer = new RestIndexerProvider(demo.arkUrl);
    const out: string[] = [];
    let pageIndex = 0;
    for (;;) {
        const { txs, page } = await indexer.getVirtualTxs(ids, { pageIndex, pageSize: 500 });
        out.push(...txs);
        if (!page || page.current >= page.total || txs.length < 500) break;
        pageIndex = page.next;
    }
    return out;
}

function preferClosed(offchain: ClosedSpend | null, onchain: ClosedSpend | null): ClosedSpend | null {
    if (offchain === "unilateral" || onchain === "unilateral") return "unilateral";
    if (!offchain) return onchain;
    if (!onchain) return offchain;
    if (offchain === onchain) return offchain;
    if (offchain === "unknown") return onchain;
    if (onchain === "unknown") return offchain;
    return "unknown";
}

/** Unrolled coins whose Bitcoin output is still unspent, and how a spent one closed. */
async function onchainExit(
    demo: DemoNetwork,
    unrolled: VirtualCoin[],
    marks: LeafMark[],
): Promise<{ live: VirtualCoin[]; closed: ClosedSpend | null }> {
    if (unrolled.length === 0) return { live: [], closed: null };
    const explorer = new EsploraProvider(demo.explorerUrl);
    const live: VirtualCoin[] = [];
    const paths: Array<SpendPath | null> = [];
    await Promise.all(
        unrolled.map(async (coin) => {
            try {
                const spends = await explorer.getTxOutspends(coin.txid);
                const output = spends[coin.vout];
                if (!output?.spent) {
                    live.push(coin);
                    return;
                }
                let path: SpendPath | null = null;
                if (output.txid) {
                    try {
                        const raw = await explorer.getRawTransaction(output.txid);
                        path = matchSpendLeaf(witnessScripts(Transaction.fromRaw(raw)), marks);
                    } catch {
                        path = null;
                    }
                }
                paths.push(path);
            } catch {
                live.push(coin);
            }
        }),
    );
    return { live, closed: paths.length > 0 ? closedSpend(paths) : null };
}

/** Tapscript bodies from a broadcast Bitcoin transaction's witness. */
function witnessScripts(tx: Transaction): Uint8Array[] {
    const scripts: Uint8Array[] = [];
    for (let i = 0; i < tx.inputsLength; i++) {
        const witness = tx.getInput(i).finalScriptWitness;
        if (!witness || witness.length < 2) continue;
        scripts.push(witness[witness.length - 2]);
    }
    return scripts;
}

async function closureFromSpent(
    demo: DemoNetwork,
    spent: VirtualCoin[],
    marks: LeafMark[],
): Promise<ClosedSpend | null> {
    if (spent.length === 0) return null;
    const ids = [
        ...new Set(
            spent.flatMap((coin) =>
                [coin.spentBy, coin.arkTxId].filter((id): id is string => !!id && /^[0-9a-fA-F]{64}$/.test(id)),
            ),
        ),
    ];
    const byId = new Map<string, Uint8Array[]>();
    if (ids.length > 0) {
        try {
            for (const encoded of await virtualTxPayloads(demo, ids)) {
                const scripts = tapLeavesFromVirtualTx(encoded);
                if (scripts.length === 0) continue;
                try {
                    byId.set(Transaction.fromPSBT(base64.decode(encoded)).id, scripts);
                } catch {
                    byId.set(`raw-${byId.size}`, scripts);
                }
            }
        } catch {
            return "unknown";
        }
    }
    const perCoin = spent.map((coin) => {
        for (const id of [coin.spentBy, coin.arkTxId]) {
            if (!id) continue;
            const found = matchSpendLeaf(byId.get(id) ?? [], marks);
            if (found) return found;
        }
        return null;
    });
    const decided = closedSpend(perCoin);
    if (decided === "cancel" || decided === "complete" || decided === "unilateral") return decided;
    const fromTxs = [...byId.values()].map((scripts) => matchSpendLeaf(scripts, marks));
    const fallback = closedSpend(fromTxs);
    if (fallback === "cancel" || fallback === "complete" || fallback === "unilateral") return fallback;
    return "unknown";
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

/** True when `opcode` is executed, not merely a byte inside a push. */
function scriptHasOpcode(script: Uint8Array, opcode: number): boolean {
    let i = 0;
    while (i < script.length) {
        const op = script[i++];
        if (op === 0) continue;
        if (op >= 1 && op <= 75) {
            if (i + op > script.length) return false;
            i += op;
            continue;
        }
        if (op === 76) {
            if (i >= script.length) return false;
            const n = script[i++];
            if (i + n > script.length) return false;
            i += n;
            continue;
        }
        if (op === 77) {
            if (i + 2 > script.length) return false;
            const n = script[i] + script[i + 1] * 256;
            i += 2;
            if (i + n > script.length) return false;
            i += n;
            continue;
        }
        if (op === 78) {
            if (i + 4 > script.length) return false;
            const n = script[i] + script[i + 1] * 256 + script[i + 2] * 65536 + script[i + 3] * 16777216;
            i += 4;
            if (i + n > script.length) return false;
            i += n;
            continue;
        }
        if (op === opcode) return true;
    }
    return false;
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
    if (left.length !== right.length) return false;
    for (let i = 0; i < left.length; i++) if (left[i] !== right[i]) return false;
    return true;
}

function includesBytes(haystack: Uint8Array, needle: Uint8Array): boolean {
    if (needle.length === 0 || needle.length > haystack.length) return false;
    for (let i = 0; i <= haystack.length - needle.length; i++) {
        let same = true;
        for (let j = 0; j < needle.length; j++) {
            if (haystack[i + j] !== needle[j]) {
                same = false;
                break;
            }
        }
        if (same) return true;
    }
    return false;
}

export function shortHex(bytes: Uint8Array): string {
    const encoded = hex.encode(bytes);
    return `${encoded.slice(0, 8)}…${encoded.slice(-8)}`;
}

export type { PayOutput };
