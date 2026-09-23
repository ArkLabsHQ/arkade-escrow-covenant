import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { hex } from "@scure/base";

import { EsploraProvider, OnchainWallet, type VirtualCoin } from "@arkade-os/sdk";

import {
    bitcoinMinedAt,
    coinsForAddress,
    DEMO_NETWORKS,
    describeExitClock,
    exitOpensAt,
    exitAnchor,
    escrowsFromBackup,
    exportStoredKeys,
    feeWallet,
    keysFromStored,
    lastEscrowAddress,
    loadFeeKey,
    loadKeys,
    readEscrows,
    saveEscrow,
    writeEscrows,
    payoutFromAddress,
    saveStoredKeys,
    storedKeysFromText,
    minimumExitDelay,
    prepareEscrow,
    RELEASE_LABEL,
    listUnrollHops,
    secretToKey,
    spendCancel,
    spendComplete,
    spendExitOnchain,
    unrollOnce,
    type DemoNetwork,
    type PreparedEscrow,
} from "./spend.ts";

export const AMOUNT_PRESETS = [1_000, 5_000, 10_000, 50_000] as const;

export type RailItem = {
    address: string;
    amount: string;
    buyer: string;
    seller: string;
    status: string;
    current: boolean;
};

export type CoinOption = { id: string; label: string };

export type EscrowModel = {
    network: string;
    buyer: string;
    seller: string;
    amount: string;
    timeout: string;
    exit: string;
    composer: "create" | "load" | null;
    loadAddress: string;
    contractOpen: boolean;
    torn: boolean;
    balance: string;
    refundWhen: string;
    loadStatus: string;
    funding: string;
    buyerView: string;
    sellerView: string;
    coins: CoinOption[];
    coinId: string;
    exitClock: string;
    feeAddress: string;
    feeBalance: string;
    keyBuyer: string;
    keySeller: string;
    oracle: string;
    buyerSecret: string;
    sellerSecret: string;
    hops: string;
    log: string[];
    rail: RailItem[];
    otherNetwork: string;
    empty: boolean;
    backup: boolean;
    busy: boolean;
    releaseBusy: boolean;
    completeDisabled: boolean;
    cancelDisabled: boolean;
    unrollDisabled: boolean;
    exitDisabled: boolean;
    walletHref: string;
    walletLabel: string;
    customAmount: boolean;
};

const COVERED = "arkade-escrow-file-covers";

function nowSeconds(): number {
    return Math.floor(Date.now() / 1000);
}

function localInput(unix: number): string {
    const date = new Date(unix * 1000);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function covered(): string[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(COVERED) ?? "[]") as unknown;
        return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
    } catch {
        return [];
    }
}

function markCovered(addresses: string[]): void {
    localStorage.setItem(COVERED, JSON.stringify([...new Set([...covered(), ...addresses])]));
}

function statusWord(watched: VirtualCoin[]): string {
    if (watched.length === 0) return "Waiting for funds";
    if (watched.some((coin) => coin.isUnrolled)) return "On Bitcoin";
    return "Funded";
}

function exitSentence(minedAt: number | null, open: boolean, exitSeconds: bigint): string {
    if (minedAt === null) return "Unroll first. The wait starts once Bitcoin mines this escrow.";
    if (open) return "You can exit on chain now.";
    const when = new Date(exitOpensAt(minedAt, exitSeconds) * 1000).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
    return `You can exit on chain after ${when}.`;
}

function initialModel(): EscrowModel {
    const storedNetwork = localStorage.getItem("arkade-escrow-network") ?? "mutinynet";
    const demo = DEMO_NETWORKS.find((item) => item.name === storedNetwork) ?? DEMO_NETWORKS[0];
    const amount = localStorage.getItem("arkade-escrow-amount") ?? "10000";
    const storedExit = localStorage.getItem("arkade-escrow-exit");
    return {
        network: demo.name,
        buyer: localStorage.getItem("arkade-escrow-buyer") ?? "",
        seller: localStorage.getItem("arkade-escrow-seller") ?? "",
        amount,
        timeout: localStorage.getItem("arkade-escrow-timeout") ?? localInput(nowSeconds() - 60),
        exit: !storedExit || storedExit === "0" ? "2048" : storedExit,
        composer: null,
        loadAddress: "",
        contractOpen: false,
        torn: false,
        balance: "",
        refundWhen: "",
        loadStatus: "",
        funding: "",
        buyerView: "",
        sellerView: "",
        coins: [],
        coinId: "",
        exitClock: "",
        feeAddress: "",
        feeBalance: "",
        keyBuyer: "",
        keySeller: "",
        oracle: "",
        buyerSecret: "",
        sellerSecret: "",
        hops: "",
        log: [],
        rail: [],
        otherNetwork: "",
        empty: readEscrows().length === 0,
        backup: false,
        busy: false,
        releaseBusy: false,
        completeDisabled: true,
        cancelDisabled: true,
        unrollDisabled: true,
        exitDisabled: true,
        walletHref: demo.walletUrl,
        walletLabel: demo.walletUrl.replace("https://", ""),
        customAmount: !AMOUNT_PRESETS.some((preset) => String(preset) === amount),
    };
}

export function useEscrow() {
    const [model, setModel] = useState<EscrowModel>(initialModel);
    const modelRef = useRef(model);
    const keysRef = useRef(loadKeys());
    const feeKeyRef = useRef(loadFeeKey());
    const preparedRef = useRef<PreparedEscrow | undefined>(undefined);
    const coinsRef = useRef<VirtualCoin[]>([]);
    const fingerprintRef = useRef("");
    const busyRef = useRef(false);
    const exitOpenRef = useRef(false);
    const exitClockToken = useRef(0);
    const minedAtByTxid = useRef(new Map<string, number | null>());
    const hopCache = useRef({ key: "", at: 0, text: "" });
    const statusByAddress = useRef(new Map<string, string>());

    function patch(partial: Partial<EscrowModel>): void {
        const next = { ...modelRef.current, ...partial };
        modelRef.current = next;
        setModel(next);
    }

    function selectedNetwork(): DemoNetwork {
        const demo = DEMO_NETWORKS.find((item) => item.name === modelRef.current.network);
        if (!demo) throw new Error("unknown network");
        return demo;
    }

    function currentFingerprint(): string {
        const current = modelRef.current;
        return [
            current.network,
            current.buyer.trim(),
            current.seller.trim(),
            current.amount,
            current.timeout,
            current.exit,
        ].join("|");
    }

    function readAmount(): bigint {
        const amount = BigInt(modelRef.current.amount);
        if (amount <= 0n) throw new Error("amount must be positive");
        return amount;
    }

    function readExit(): bigint {
        const exit = BigInt(modelRef.current.exit);
        if (exit < 0n) throw new Error("unilateral delay cannot be negative");
        return exit;
    }

    function readTimeout(): bigint {
        const parsed = Date.parse(modelRef.current.timeout);
        if (Number.isNaN(parsed)) throw new Error("refund time is not a date");
        return BigInt(Math.floor(parsed / 1000));
    }

    function remember(): void {
        const current = modelRef.current;
        localStorage.setItem("arkade-escrow-buyer", current.buyer.trim());
        localStorage.setItem("arkade-escrow-seller", current.seller.trim());
        localStorage.setItem("arkade-escrow-amount", current.amount);
        localStorage.setItem("arkade-escrow-timeout", current.timeout);
        localStorage.setItem("arkade-escrow-exit", current.exit);
        localStorage.setItem("arkade-escrow-network", current.network);
    }

    function note(message: string): void {
        const readable = message.replace(/\b[A-Za-z0-9]{20,}\b/g, (token) => shortAddress(token));
        const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        patch({ log: [`${time}  ${readable}`, ...modelRef.current.log].slice(0, 40) });
    }

    function paintFacts(): void {
        const current = modelRef.current;
        const parsed = Date.parse(current.timeout);
        let refundWhen = "";
        if (!Number.isNaN(parsed)) {
            refundWhen =
                parsed <= Date.now()
                    ? "You can refund the buyer now."
                    : `You can refund the buyer after ${new Date(parsed).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`;
        }
        patch({
            buyerView: current.buyer.trim(),
            sellerView: current.seller.trim(),
            refundWhen,
        });
    }

    function paintRail(): void {
        const current = modelRef.current;
        const list = readEscrows().filter((item) => item.network === current.network);
        const open = current.contractOpen ? current.funding : "";
        patch({
            rail: list.map((escrow) => ({
                address: escrow.address,
                amount: escrow.amount,
                buyer: escrow.buyer,
                seller: escrow.seller,
                status: statusByAddress.current.get(escrow.address) ?? "Checking",
                current: escrow.address === open,
            })),
        });
    }

    function syncEntry(): void {
        const onNetwork = readEscrows().filter((item) => item.network === modelRef.current.network);
        const elsewhere = readEscrows().length - onNetwork.length;
        patch({
            empty: readEscrows().length === 0,
            otherNetwork:
                elsewhere === 0
                    ? ""
                    : `${elsewhere} escrow${elsewhere === 1 ? "" : "s"} on the other network. Switch network to see them.`,
        });
        paintRail();
    }

    function syncButtons(): void {
        const ready =
            !busyRef.current &&
            coinsRef.current.length > 0 &&
            !!preparedRef.current &&
            fingerprintRef.current === currentFingerprint();
        patch({
            completeDisabled: !ready,
            cancelDisabled: !ready,
            unrollDisabled: !ready,
            exitDisabled: !ready || !exitOpenRef.current,
        });
    }

    function syncBackup(): void {
        const address = modelRef.current.funding;
        patch({
            backup:
                modelRef.current.contractOpen &&
                !!preparedRef.current &&
                !!address &&
                !covered().includes(address),
        });
    }

    function fillCoinSelect(): void {
        const previous = modelRef.current.coinId;
        const coins = coinsRef.current.map((coin) => ({
            id: `${coin.txid}:${coin.vout}`,
            label: `${formatSats(coin.value)} sats · ${shortAddress(coin.txid)}`,
        }));
        const coinId = coins.some((coin) => coin.id === previous) ? previous : (coins[0]?.id ?? "");
        patch({ coins, coinId });
    }

    function describeCoins(): string {
        if (coinsRef.current.length === 0) return `Send ${formatSats(modelRef.current.amount)} sats from Arkade.Money.`;
        const total = coinsRef.current.reduce((sum, coin) => sum + coin.value, 0);
        return `${formatSats(total)} sats are in this escrow.`;
    }

    function markStale(): void {
        if (!preparedRef.current) return;
        patch({
            balance:
                fingerprintRef.current === currentFingerprint()
                    ? describeCoins()
                    : "The form changed. Create the escrow again before spending.",
        });
        void updateExitClock();
    }

    function updateWallet(network = modelRef.current.network): void {
        const demo = DEMO_NETWORKS.find((item) => item.name === network) ?? DEMO_NETWORKS[0];
        patch({
            walletHref: demo.walletUrl,
            walletLabel: demo.walletUrl.replace("https://", ""),
        });
    }

    function showContract(): void {
        if (!modelRef.current.contractOpen) patch({ contractOpen: true });
    }

    function hideContract(): void {
        if (modelRef.current.contractOpen) patch({ contractOpen: false });
        paintRail();
    }

    function closeComposer(): void {
        if (modelRef.current.composer) patch({ composer: null });
        syncEntry();
    }

    function selectedCoin(): VirtualCoin {
        const coin =
            coinsRef.current.find((item) => `${item.txid}:${item.vout}` === modelRef.current.coinId) ??
            coinsRef.current[0];
        if (!coin) throw new Error("fund the escrow first");
        return coin;
    }

    function requirePrepared(): PreparedEscrow {
        if (!preparedRef.current || fingerprintRef.current !== currentFingerprint()) {
            throw new Error("the form changed; create the escrow again");
        }
        return preparedRef.current;
    }

    async function showKeys(): Promise<void> {
        const keys = keysRef.current;
        const [buyer, seller, oracle] = await Promise.all([
            keys.buyer.xOnlyPublicKey(),
            keys.seller.xOnlyPublicKey(),
            keys.oracle.xOnlyPublicKey(),
        ]);
        patch({
            keyBuyer: hex.encode(buyer),
            keySeller: hex.encode(seller),
            oracle: hex.encode(oracle),
        });
    }

    async function showFeeWallet(): Promise<void> {
        try {
            const wallet = await feeWallet(selectedNetwork(), feeKeyRef.current);
            const balance = await wallet.getBalance();
            patch({ feeAddress: wallet.address, feeBalance: `${formatSats(balance)} sats` });
        } catch (error) {
            patch({
                feeAddress: "",
                feeBalance: error instanceof Error ? error.message : String(error),
            });
        }
    }

    async function refreshCoins(announce: boolean): Promise<void> {
        if (!preparedRef.current) return;
        coinsRef.current = await preparedRef.current.contract.getUtxos();
        fillCoinSelect();
        if (preparedRef.current) {
            statusByAddress.current.set(preparedRef.current.contract.address, statusWord(coinsRef.current));
        }
        paintRail();
        const total = coinsRef.current.reduce((sum, coin) => sum + coin.value, 0);
        patch({ balance: describeCoins() });
        if (announce && coinsRef.current.length > 0) note(`found ${formatSats(total)} sats`);
        await updateExitClock();
    }

    async function refreshRailStatuses(): Promise<void> {
        const demo = selectedNetwork();
        const list = readEscrows().filter((item) => item.network === demo.name);
        await Promise.all(
            list.map(async (escrow) => {
                if (statusByAddress.current.get(escrow.address) === "Parameters differ") return;
                if (preparedRef.current?.contract.address === escrow.address && fingerprintRef.current === currentFingerprint()) {
                    statusByAddress.current.set(escrow.address, statusWord(coinsRef.current));
                    return;
                }
                try {
                    statusByAddress.current.set(escrow.address, statusWord(await coinsForAddress(demo, escrow.address)));
                } catch {
                    statusByAddress.current.set(escrow.address, "Not checked");
                }
            }),
        );
        paintRail();
    }

    async function updateExitClock(): Promise<void> {
        const token = ++exitClockToken.current;
        const current = preparedRef.current;
        const coin =
            coinsRef.current.find((item) => `${item.txid}:${item.vout}` === modelRef.current.coinId) ??
            coinsRef.current[0];
        if (!current || fingerprintRef.current !== currentFingerprint() || !coin) {
            exitOpenRef.current = false;
            patch({ exitClock: "", hops: "" });
            syncButtons();
            return;
        }
        const anchor = exitAnchor(coin);
        if (!anchor) {
            exitOpenRef.current = false;
            patch({ exitClock: "This coin has no Bitcoin output yet, so the exit clock has not started.", hops: "" });
            syncButtons();
            return;
        }
        try {
            const minedAt = await cachedMinedAt(current.demo.explorerUrl, anchor.txid);
            if (token !== exitClockToken.current) return;
            const described = describeExitClock({
                txid: anchor.txid,
                minedAt,
                exitSeconds: current.exit,
                now: nowSeconds(),
            });
            exitOpenRef.current = described.open;
            patch({
                exitClock: exitSentence(minedAt, described.open, current.exit),
                hops: await hopText(current.demo, coin),
            });
        } catch (error) {
            if (token !== exitClockToken.current) return;
            exitOpenRef.current = false;
            patch({
                exitClock: `Could not read the exit clock. ${error instanceof Error ? error.message : String(error)}`,
            });
        }
        syncButtons();
    }

    async function hopText(demo: DemoNetwork, coin: { txid: string; vout: number }): Promise<string> {
        const key = `${coin.txid}:${coin.vout}`;
        if (hopCache.current.key === key && Date.now() - hopCache.current.at < 20_000) return hopCache.current.text;
        const hops = await listUnrollHops(demo, coin);
        const text = hops.map((hop, index) => `${index + 1}. ${hop.kind} ${shortAddress(hop.txid)}`).join("\n");
        hopCache.current = { key, at: Date.now(), text };
        return text;
    }

    async function cachedMinedAt(explorerUrl: string, txid: string): Promise<number | null> {
        const cached = minedAtByTxid.current.get(txid);
        if (cached !== undefined && cached !== null) return cached;
        const minedAt = await bitcoinMinedAt(explorerUrl, txid);
        if (minedAt !== null) minedAtByTxid.current.set(txid, minedAt);
        return minedAt;
    }

    async function raiseExitToOperator(): Promise<void> {
        try {
            const minimum = await minimumExitDelay(selectedNetwork());
            if (BigInt(modelRef.current.exit || "0") < minimum) patch({ exit: minimum.toString() });
        } catch {
            // Create reports the operator minimum when this lookup fails.
        }
        markStale();
    }

    async function createEscrow(expectedAddress?: string): Promise<void> {
        const demo = selectedNetwork();
        const amount = readAmount();
        const timeoutAt = readTimeout();
        const exitDelay = readExit();
        remember();
        preparedRef.current = await prepareEscrow({
            demo,
            buyerAddress: modelRef.current.buyer,
            sellerAddress: modelRef.current.seller,
            amount,
            timeoutAt,
            exit: exitDelay,
            keys: keysRef.current,
        });
        fingerprintRef.current = currentFingerprint();
        patch({ funding: preparedRef.current.contract.address, torn: false, loadStatus: "" });
        paintFacts();
        showContract();
        note(
            `escrow ${preparedRef.current.contract.address} · emulator ${preparedRef.current.emulatorVersion || "unknown"} · oracle signs "${RELEASE_LABEL}"`,
        );
        if (preparedRef.current.emulatorVersion.startsWith("v0.0.7")) {
            note("this emulator is older than v0.0.8, so refund will be rejected");
        }
        if (expectedAddress && preparedRef.current.contract.address !== expectedAddress) {
            const rebuilt = preparedRef.current.contract.address;
            preparedRef.current = undefined;
            coinsRef.current = [];
            fingerprintRef.current = "";
            hideContract();
            patch({ torn: false });
            throw new RebuildMismatch(rebuilt, expectedAddress);
        }
        statusByAddress.current.delete(preparedRef.current.contract.address);
        saveEscrow({
            address: preparedRef.current.contract.address,
            network: demo.name,
            buyer: modelRef.current.buyer.trim(),
            seller: modelRef.current.seller.trim(),
            amount: modelRef.current.amount,
            timeout: modelRef.current.timeout,
            exit: modelRef.current.exit,
        });
        patch({ loadAddress: preparedRef.current.contract.address });
        closeComposer();
        syncBackup();
        await refreshCoins(true);
        void refreshRailStatuses();
        if (!expectedAddress) {
            note("Escrow created.");
            toast.success("Escrow created.");
        }
    }

    async function loadByAddress(address: string): Promise<void> {
        const trimmed = address.trim();
        if (!trimmed) throw new Error("paste an escrow address");
        const found = readEscrows().find((item) => item.address === trimmed);
        if (found) {
            patch({
                network: found.network,
                buyer: found.buyer,
                seller: found.seller,
                amount: found.amount,
                timeout: found.timeout,
                exit: found.exit,
                customAmount: !AMOUNT_PRESETS.some((preset) => String(preset) === found.amount),
            });
            updateWallet(found.network);
        }
        try {
            await createEscrow(trimmed);
        } catch (error) {
            const rebuilt = error instanceof RebuildMismatch ? error.rebuilt : undefined;
            const reason = error instanceof Error ? error.message : String(error);
            await showUnmatched(trimmed, rebuilt, reason);
            return;
        }
        patch({ loadStatus: "" });
        const message = found ? "Opened this escrow." : "Rebuilt this escrow from these details.";
        note(message);
        toast.success(message);
    }

    async function showUnmatched(address: string, rebuilt: string | undefined, reason: string): Promise<void> {
        const watched = await coinsForAddress(selectedNetwork(), address);
        preparedRef.current = undefined;
        fingerprintRef.current = "";
        coinsRef.current = watched;
        const total = watched.reduce((sum, coin) => sum + coin.value, 0);
        const unrolled = watched.some((coin) => coin.isUnrolled);
        const coinsLine =
            watched.length === 0
                ? "Nothing has been sent here yet."
                : unrolled
                  ? `${formatSats(total)} sats are on Bitcoin.`
                  : `${formatSats(total)} sats are here, still off chain.`;
        const compiled = rebuilt
            ? `These details belong to ${shortAddress(rebuilt)}, not this escrow.`
            : `These details could not be compiled. ${reason}`;
        patch({
            funding: address.trim(),
            balance: coinsLine,
            loadStatus: compiled,
            torn: true,
            exitClock: "",
            hops: "",
        });
        paintFacts();
        showContract();
        fillCoinSelect();
        statusByAddress.current.set(address, "Parameters differ");
        closeComposer();
        syncBackup();
        paintRail();
        note(compiled);
    }

    function payouts(current: PreparedEscrow): { buyer: Uint8Array; seller: Uint8Array } {
        const buyer = payoutFromAddress(modelRef.current.buyer, current.demo.network.hrp, current.contract.client.serverKey);
        const seller = payoutFromAddress(
            modelRef.current.seller,
            current.demo.network.hrp,
            current.contract.client.serverKey,
        );
        return { buyer: buyer.pkScript, seller: seller.pkScript };
    }

    async function unlock(): Promise<void> {
        const current = requirePrepared();
        const coin = selectedCoin();
        const { seller, buyer } = payouts(current);
        const txid = await spendComplete(current, coin, seller, buyer, readAmount());
        note(`Released to the seller. ${shortAddress(txid)}`);
        toast.success("Released to the seller.");
        await refreshCoins(true);
    }

    async function refund(): Promise<void> {
        const current = requirePrepared();
        const coin = selectedCoin();
        const { buyer } = payouts(current);
        const txid = await spendCancel(current, coin, buyer);
        note(`Refunded the buyer. ${shortAddress(txid)}`);
        toast.success("Refunded the buyer.");
        await refreshCoins(true);
    }

    async function unroll(): Promise<void> {
        const current = requirePrepared();
        const coin = selectedCoin();
        const progress = await unrollOnce(current.demo, coin, feeKeyRef.current);
        if (progress.kind === "done") {
            note(`Unrolled. ${shortAddress(progress.txid)}`);
            toast.success("Unrolled onto Bitcoin.");
        } else if (progress.kind === "waiting") {
            note(`Waiting for ${shortAddress(progress.txid)} to be mined.`);
            toast("Waiting for Bitcoin to mine the previous transaction.");
        } else {
            note(`Broadcast ${shortAddress(progress.txid)}`);
            toast.success("Broadcast the next unroll transaction.");
        }
        hopCache.current.at = 0;
        await showFeeWallet();
        await updateExitClock();
    }

    async function exit(): Promise<void> {
        const current = requirePrepared();
        const coin = selectedCoin();
        const minedAt = await bitcoinMinedAt(current.demo.explorerUrl, coin.txid);
        if (minedAt === null) throw new Error("unroll the funding transaction before the on-chain exit");
        const seller = await OnchainWallet.create(
            current.seller,
            current.demo.name,
            new EsploraProvider(current.demo.explorerUrl),
        );
        const txid = await spendExitOnchain(current, coin, seller.address);
        note(`On-chain exit to ${shortAddress(seller.address)}. ${shortAddress(txid)}`);
        toast.success("Exited on chain.");
        await refreshCoins(true);
    }

    async function importSecrets(): Promise<void> {
        const buyerText = modelRef.current.buyerSecret.trim();
        const sellerText = modelRef.current.sellerSecret.trim();
        if (!buyerText && !sellerText) throw new Error("paste a buyer or seller key");
        const mainnet = selectedNetwork().name === "bitcoin";
        if (buyerText) keysRef.current = { ...keysRef.current, buyer: secretToKey(buyerText, { mainnet }) };
        if (sellerText) keysRef.current = { ...keysRef.current, seller: secretToKey(sellerText, { mainnet }) };
        saveStoredKeys(exportStoredKeys(keysRef.current));
        preparedRef.current = undefined;
        coinsRef.current = [];
        fingerprintRef.current = "";
        patch({ buyerSecret: "", sellerSecret: "", hops: "", contractOpen: false });
        await showKeys();
        syncEntry();
        const which = buyerText && sellerText ? "buyer and seller keys" : buyerText ? "buyer key" : "seller key";
        note(`Replaced the ${which}.`);
        toast.success("Keys updated.");
    }

    function downloadKeys(): void {
        const body = `${JSON.stringify({ ...exportStoredKeys(keysRef.current), escrows: readEscrows() }, null, 2)}\n`;
        const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "arkade-escrow-keys.json";
        link.click();
        URL.revokeObjectURL(url);
        markCovered(readEscrows().map((escrow) => escrow.address));
        syncBackup();
        note("Saved arkade-escrow-keys.json. Keep that file. It restores this escrow in another browser.");
        toast.success("Saved a copy.");
    }

    async function restoreKeys(file: File): Promise<void> {
        const text = await file.text();
        const stored = storedKeysFromText(text);
        const escrows = escrowsFromBackup(text);
        saveStoredKeys(stored);
        if (escrows.length > 0) {
            writeEscrows(escrows);
            markCovered(escrows.map((escrow) => escrow.address));
        }
        keysRef.current = keysFromStored(stored);
        preparedRef.current = undefined;
        coinsRef.current = [];
        fingerprintRef.current = "";
        patch({ contractOpen: false, hops: "", composer: null });
        await showKeys();
        syncEntry();
        const address = escrows[0]?.address ?? lastEscrowAddress();
        if (address && readEscrows().some((item) => item.address === address)) {
            await loadByAddress(address);
            return;
        }
        note("Restored the oracle and exit keys. Paste an escrow address to resume.");
        toast.success("Restored the key file.");
    }

    async function run(label: string, action: () => Promise<void>): Promise<void> {
        busyRef.current = true;
        patch({
            busy: true,
            releaseBusy: label === "unlock",
            completeDisabled: true,
            cancelDisabled: true,
            unrollDisabled: true,
            exitDisabled: true,
        });
        try {
            await action();
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            note(`${label} failed: ${message}`);
            toast.error(message.replace(/\b[A-Za-z0-9]{20,}\b/g, (token) => shortAddress(token)));
        } finally {
            busyRef.current = false;
            patch({ busy: false, releaseBusy: false });
            syncButtons();
            syncBackup();
        }
    }

    function setField(key: "buyer" | "seller" | "amount" | "timeout" | "exit" | "loadAddress" | "buyerSecret" | "sellerSecret", value: string): void {
        patch({ [key]: value });
        if (key === "amount") {
            patch({ customAmount: !AMOUNT_PRESETS.some((preset) => String(preset) === value) });
        }
        if (key === "buyer" || key === "seller" || key === "amount" || key === "timeout" || key === "exit") markStale();
    }

    useEffect(() => {
        void showKeys();
        void showFeeWallet();
        syncEntry();
        void (async () => {
            await raiseExitToOperator();
            await refreshRailStatuses();
        })();
        const timer = window.setInterval(() => {
            if (preparedRef.current && fingerprintRef.current === currentFingerprint()) void refreshCoins(false);
        }, 8000);
        return () => window.clearInterval(timer);
        // Mount only. Later calls go through actions.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const actions = {
        setNetwork(network: string) {
            patch({ network });
            updateWallet(network);
            markStale();
            void raiseExitToOperator();
            void showFeeWallet();
            syncEntry();
            void refreshRailStatuses();
        },
        setField,
        chooseAmount(amount: string) {
            patch({ amount, customAmount: false });
            markStale();
        },
        chooseCustom() {
            patch({ customAmount: true });
        },
        openComposer(mode: "create" | "load") {
            patch({
                composer: mode,
                customAmount: !AMOUNT_PRESETS.some((preset) => String(preset) === modelRef.current.amount),
            });
        },
        closeComposer() {
            closeComposer();
        },
        closeContract() {
            hideContract();
        },
        submitCreate() {
            void run("create", () => createEscrow());
        },
        submitLoad() {
            void run("load", () => loadByAddress(modelRef.current.loadAddress));
        },
        openEscrow(address: string) {
            void run("load", () => loadByAddress(address));
        },
        release() {
            void run("unlock", unlock);
        },
        refund() {
            void run("refund", refund);
        },
        unroll() {
            void run("unroll", unroll);
        },
        exit() {
            void run("exit", exit);
        },
        importSecrets() {
            void run("keys", importSecrets);
        },
        downloadKeys,
        async restoreKeys(file: File) {
            await run("restore", () => restoreKeys(file));
        },
        selectCoin(coinId: string) {
            patch({ coinId });
            void updateExitClock();
        },
        copy(value: string) {
            if (!value) return;
            void navigator.clipboard.writeText(value);
            toast("Copied");
        },
    };

    return { model, actions, networks: DEMO_NETWORKS };
}

class RebuildMismatch extends Error {
    readonly rebuilt: string;

    constructor(rebuilt: string, expected: string) {
        super(`compiled ${rebuilt}, which is not ${expected}`);
        this.rebuilt = rebuilt;
    }
}

export function shortAddress(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length <= 18) return trimmed;
    return `${trimmed.slice(0, 8)}…${trimmed.slice(-6)}`;
}

export function formatSats(value: bigint | number | string): string {
    return BigInt(value).toLocaleString("en-US");
}
