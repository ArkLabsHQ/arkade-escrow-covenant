import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { hex } from "@scure/base";

import { EsploraProvider, OnchainWallet, type VirtualCoin } from "@arkade-os/sdk";

import {
    bitcoinMinedAt,
    coinsForAddress,
    escrowFacts,
    leafMarksForEscrow,
    leafMarksFromCompiled,
    DEMO_NETWORKS,
    describeExitClock,
    exitOpensAt,
    exitAnchor,
    escrowsFromBackup,
    forgetEscrow,
    mergeEscrows,
    selectBackupEscrow,
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
    arkadeAddressUrl,
    escrowView,
    listUnrollHops,
    secretToKey,
    spendCancel,
    spendComplete,
    spendExitOnchain,
    unrollOnce,
    type DemoNetwork,
    type EscrowFacts,
    type PreparedEscrow,
} from "./spend.ts";

export const AMOUNT_PRESETS = [1_000, 5_000, 10_000, 50_000] as const;

export type RailItem = {
    address: string;
    amount: string;
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
    loadError: string;
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
    oracleSecret: string;
    settingsOpen: boolean;
    pendingRemove: { address: string; amount: string; saved: boolean } | null;
    hops: string;
    log: string[];
    rail: RailItem[];
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

function viewFor(facts: EscrowFacts, timeout: string) {
    const parsed = Date.parse(timeout);
    const when = Number.isNaN(parsed)
        ? ""
        : new Date(parsed).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    const live = facts.spendable.length > 0 ? facts.spendable : facts.unrolled;
    return escrowView({
        coins: live.length,
        unrolled: facts.spendable.length === 0 && facts.unrolled.length > 0,
        refundDue: !Number.isNaN(parsed) && parsed <= Date.now(),
        when,
        closed: live.length === 0 ? facts.closed : null,
    });
}

function statusWord(facts: EscrowFacts, timeout: string): string {
    return viewFor(facts, timeout).status;
}

const EMPTY_FACTS: EscrowFacts = { spendable: [], unrolled: [], closed: null };

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
    const demo = DEMO_NETWORKS[0];
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
        loadError: "",
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
        oracleSecret: "",
        settingsOpen: false,
        pendingRemove: null,
        hops: "",
        log: [],
        rail: [],
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
    const factsRef = useRef<EscrowFacts>(EMPTY_FACTS);
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
        if (modelRef.current.torn && !preparedRef.current) return;
        const current = modelRef.current;
        const view = viewFor(factsRef.current, current.timeout);
        const stale = !!preparedRef.current && fingerprintRef.current !== currentFingerprint();
        patch({
            buyerView: current.buyer.trim(),
            sellerView: current.seller.trim(),
            balance: stale ? "The form changed. Create the escrow again before spending." : describeCoins(),
            refundWhen: stale ? "" : view.refund,
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
                status: statusByAddress.current.get(escrow.address) ?? "Checking",
                current: escrow.address === open,
            })),
        });
    }

    function syncEntry(): void {
        patch({ empty: readEscrows().length === 0 });
        paintRail();
    }

    function syncButtons(): void {
        const armed =
            !busyRef.current && !!preparedRef.current && fingerprintRef.current === currentFingerprint();
        const view = viewFor(factsRef.current, modelRef.current.timeout);
        const coin =
            coinsRef.current.find((item) => `${item.txid}:${item.vout}` === modelRef.current.coinId) ??
            coinsRef.current[0];
        patch({
            completeDisabled: !armed || !view.release,
            cancelDisabled: !armed || !view.refundNow,
            unrollDisabled: !armed || !coin || coin.isUnrolled,
            exitDisabled: !armed || !coin?.isUnrolled || !exitOpenRef.current,
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
        const view = viewFor(factsRef.current, modelRef.current.timeout);
        if (view.status === "Waiting for funds") {
            return `Send ${formatSats(modelRef.current.amount)} sats from Arkade.Money.`;
        }
        if (view.status === "On Bitcoin") {
            const total = factsRef.current.unrolled.reduce((sum, coin) => sum + coin.value, 0);
            return `${formatSats(total)} sats are on Bitcoin.`;
        }
        if (view.status === "Funded" || view.status === "Refund open") {
            const total = factsRef.current.spendable.reduce((sum, coin) => sum + coin.value, 0);
            return `${formatSats(total)} sats are in this escrow.`;
        }
        return view.status;
    }

    function markStale(): void {
        if (!preparedRef.current) return;
        paintFacts();
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
        const prepared = preparedRef.current;
        if (!prepared) return;
        const marks = leafMarksFromCompiled(prepared.contract.vtxoScript.compiled, prepared.contract.client.emulatorKey);
        const facts = await escrowFacts(prepared.demo, prepared.contract.address, marks);
        factsRef.current = facts;
        coinsRef.current = [...facts.spendable, ...facts.unrolled];
        fillCoinSelect();
        statusByAddress.current.set(prepared.contract.address, statusWord(facts, modelRef.current.timeout));
        paintRail();
        paintFacts();
        const total = facts.spendable.reduce((sum, coin) => sum + coin.value, 0);
        if (announce && facts.spendable.length > 0) note(`found ${formatSats(total)} sats`);
        await updateExitClock();
    }

    async function refreshRailStatuses(): Promise<void> {
        const demo = selectedNetwork();
        const list = readEscrows().filter((item) => item.network === demo.name);
        await Promise.all(
            list.map(async (escrow) => {
                if (statusByAddress.current.get(escrow.address) === "Parameters differ") return;
                if (preparedRef.current?.contract.address === escrow.address && fingerprintRef.current === currentFingerprint()) {
                    statusByAddress.current.set(escrow.address, statusWord(factsRef.current, escrow.timeout));
                    return;
                }
                try {
                    const parsed = Date.parse(escrow.timeout);
                    if (Number.isNaN(parsed)) throw new Error("refund time is not a date");
                    const marks = await leafMarksForEscrow({
                        demo,
                        buyerAddress: escrow.buyer,
                        sellerAddress: escrow.seller,
                        amount: BigInt(escrow.amount),
                        timeoutAt: BigInt(Math.floor(parsed / 1000)),
                        keys: keysRef.current,
                    });
                    statusByAddress.current.set(
                        escrow.address,
                        statusWord(await escrowFacts(demo, escrow.address, marks), escrow.timeout),
                    );
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
        const prepared = await prepareEscrow({
            demo,
            buyerAddress: modelRef.current.buyer,
            sellerAddress: modelRef.current.seller,
            amount,
            timeoutAt,
            exit: exitDelay,
            keys: keysRef.current,
        });
        if (expectedAddress && prepared.contract.address !== expectedAddress) {
            throw new RebuildMismatch(prepared.contract.address, expectedAddress);
        }
        preparedRef.current = prepared;
        factsRef.current = EMPTY_FACTS;
        coinsRef.current = [];
        fingerprintRef.current = currentFingerprint();
        patch({
            funding: prepared.contract.address,
            torn: false,
            loadStatus: "",
            loadError: "",
            buyerView: modelRef.current.buyer.trim(),
            sellerView: modelRef.current.seller.trim(),
            balance: "",
            refundWhen: "",
        });
        showContract();
        if (prepared.emulatorVersion.startsWith("v0.0.7")) {
            note("this emulator is older than v0.0.8, so refund will be rejected");
        }
        statusByAddress.current.delete(prepared.contract.address);
        saveEscrow({
            address: prepared.contract.address,
            network: demo.name,
            buyer: modelRef.current.buyer.trim(),
            seller: modelRef.current.seller.trim(),
            amount: modelRef.current.amount,
            timeout: modelRef.current.timeout,
            exit: modelRef.current.exit,
        });
        patch({ loadAddress: prepared.contract.address });
        closeComposer();
        syncBackup();
        await refreshCoins(true);
        void refreshRailStatuses();
    }

    function fillKnownEscrow(address: string): void {
        const found = readEscrows().find((item) => item.address === address.trim());
        if (!found) return;
        patch({
            network: found.network,
            buyer: found.buyer,
            seller: found.seller,
            amount: found.amount,
            timeout: found.timeout,
            exit: found.exit,
            customAmount: !AMOUNT_PRESETS.some((preset) => String(preset) === found.amount),
            loadError: "",
        });
        updateWallet(found.network);
    }

    async function loadByAddress(address: string, source: "form" | "saved" = "form"): Promise<void> {
        // A backup drop happens while this sheet is open. The sheet's fields are still
        // empty, so rebuilding here would decode those fields and report "that is not an Arkade address".
        const fromForm = source !== "saved" && modelRef.current.composer === "load";
        try {
            const trimmed = address.trim();
            if (!trimmed) throw new Error("Enter the escrow address.");
            if (!fromForm) fillKnownEscrow(trimmed);
            await createEscrow(trimmed);
            patch({ loadStatus: "", loadError: "" });
        } catch (error) {
            if (fromForm) {
                patch({ loadError: readableError(error), composer: "load" });
                return;
            }
            const rebuilt = error instanceof RebuildMismatch ? error.rebuilt : undefined;
            const reason = error instanceof Error ? error.message : String(error);
            await showUnmatched(address.trim(), rebuilt, reason);
        }
    }

    function explainUnmatched(rebuilt: string | undefined, reason: string): void {
        const copy = unmatchedCopy(rebuilt, reason);
        patch({
            torn: true,
            loadStatus: copy.detail,
            balance: copy.headline,
            refundWhen: "",
            exitClock: "",
            hops: "",
        });
    }

    async function retryMatch(): Promise<void> {
        const address = modelRef.current.funding.trim();
        if (!address) throw new Error("Missing the escrow address.");
        try {
            await createEscrow(address);
        } catch (error) {
            const rebuilt = error instanceof RebuildMismatch ? error.rebuilt : undefined;
            const reason = error instanceof Error ? error.message : String(error);
            explainUnmatched(rebuilt, reason);
        }
    }

    async function showUnmatched(address: string, rebuilt: string | undefined, reason: string): Promise<void> {
        const watched = await coinsForAddress(selectedNetwork(), address).catch(() => []);
        preparedRef.current = undefined;
        fingerprintRef.current = "";
        coinsRef.current = watched;
        factsRef.current = {
            spendable: watched.filter((coin) => !coin.isUnrolled),
            unrolled: watched.filter((coin) => coin.isUnrolled),
            closed: null,
        };
        const copy = unmatchedCopy(rebuilt, reason);
        patch({
            funding: address.trim(),
            loadStatus: copy.detail,
            balance: copy.headline,
            refundWhen: "",
            torn: true,
            exitClock: "",
            hops: "",
        });
        showContract();
        fillCoinSelect();
        statusByAddress.current.set(address, "Parameters differ");
        closeComposer();
        syncBackup();
        paintRail();
        note(copy.detail);
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
        await refreshCoins(true);
    }

    async function refund(): Promise<void> {
        const current = requirePrepared();
        const coin = selectedCoin();
        const { buyer } = payouts(current);
        const txid = await spendCancel(current, coin, buyer);
        note(`Refunded the buyer. ${shortAddress(txid)}`);
        await refreshCoins(true);
    }

    async function unroll(): Promise<void> {
        const current = requirePrepared();
        const coin = selectedCoin();
        const progress = await unrollOnce(current.demo, coin, feeKeyRef.current);
        if (progress.kind === "done") note(`Unrolled. ${shortAddress(progress.txid)}`);
        else if (progress.kind === "waiting") note(`Waiting for ${shortAddress(progress.txid)} to be mined.`);
        else note(`Broadcast ${shortAddress(progress.txid)}`);
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
        await refreshCoins(true);
    }

    async function importSecrets(): Promise<void> {
        const buyerText = modelRef.current.buyerSecret.trim();
        const sellerText = modelRef.current.sellerSecret.trim();
        if (!buyerText && !sellerText) throw new Error("paste a buyer or seller key");
        if (buyerText) keysRef.current = { ...keysRef.current, buyer: secretToKey(buyerText) };
        if (sellerText) keysRef.current = { ...keysRef.current, seller: secretToKey(sellerText) };
        saveStoredKeys(exportStoredKeys(keysRef.current));
        preparedRef.current = undefined;
        coinsRef.current = [];
        factsRef.current = EMPTY_FACTS;
        fingerprintRef.current = "";
        patch({ buyerSecret: "", sellerSecret: "", hops: "", contractOpen: false });
        await showKeys();
        syncEntry();
        const which = buyerText && sellerText ? "buyer and seller keys" : buyerText ? "buyer key" : "seller key";
        note(`Replaced the ${which}.`);
    }

    async function importOracle(): Promise<void> {
        const text = modelRef.current.oracleSecret.trim();
        if (!text) throw new Error("Paste an oracle key.");
        keysRef.current = { ...keysRef.current, oracle: secretToKey(text) };
        saveStoredKeys(exportStoredKeys(keysRef.current));
        preparedRef.current = undefined;
        coinsRef.current = [];
        factsRef.current = EMPTY_FACTS;
        fingerprintRef.current = "";
        patch({ oracleSecret: "", hops: "", contractOpen: false, torn: false });
        await showKeys();
        syncEntry();
        note("Replaced the oracle key. Escrows made with the previous oracle will not match.");
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
    }

    function savePendingCard(): void {
        const pending = modelRef.current.pendingRemove;
        if (!pending) return;
        const escrow = readEscrows().find((item) => item.address === pending.address);
        if (!escrow) return;
        const body = `${JSON.stringify({ ...exportStoredKeys(keysRef.current), escrows: [escrow] }, null, 2)}\n`;
        const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "arkade-escrow.json";
        link.click();
        URL.revokeObjectURL(url);
        markCovered([escrow.address]);
        patch({ pendingRemove: { ...pending, saved: true } });
    }

    function confirmRemove(): void {
        const pending = modelRef.current.pendingRemove;
        if (!pending) return;
        forgetEscrow(pending.address);
        statusByAddress.current.delete(pending.address);
        const open = modelRef.current.funding === pending.address;
        if (open) {
            preparedRef.current = undefined;
            coinsRef.current = [];
            factsRef.current = EMPTY_FACTS;
            fingerprintRef.current = "";
        }
        patch({
            pendingRemove: null,
            ...(open ? { contractOpen: false, funding: "", torn: false, hops: "" } : {}),
        });
        syncEntry();
    }

    async function loadBackupFile(file: File): Promise<void> {
        patch({ loadError: "" });
        try {
            const text = await file.text();
            const stored = storedKeysFromText(text);
            const escrows = escrowsFromBackup(text);
            const first = selectBackupEscrow(escrows, modelRef.current.network);
            if (!first) throw new Error("That file has no escrow.");
            saveStoredKeys(stored);
            writeEscrows(mergeEscrows(readEscrows(), escrows));
            markCovered(escrows.map((escrow) => escrow.address));
            keysRef.current = keysFromStored(stored);
            preparedRef.current = undefined;
            coinsRef.current = [];
            factsRef.current = EMPTY_FACTS;
            fingerprintRef.current = "";
            patch({
                network: first.network,
                loadAddress: first.address,
                hops: "",
                torn: false,
                loadError: "",
            });
            updateWallet(first.network);
            await showKeys();
            syncEntry();
            await loadByAddress(first.address, "saved");
        } catch (error) {
            patch({ loadError: readableError(error), composer: "load" });
        }
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
        factsRef.current = EMPTY_FACTS;
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

    function setField(key: "buyer" | "seller" | "amount" | "timeout" | "exit" | "loadAddress" | "buyerSecret" | "sellerSecret" | "oracleSecret", value: string): void {
        patch({ [key]: value, loadError: "" });
        if (key === "amount") {
            patch({ customAmount: !AMOUNT_PRESETS.some((preset) => String(preset) === value) });
        }
        if (key === "loadAddress") fillKnownEscrow(value);
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
        setField,
        chooseAmount(amount: string) {
            patch({ amount, customAmount: false, loadError: "" });
            markStale();
        },
        chooseCustom() {
            patch({ customAmount: true, loadError: "" });
        },
        openComposer(mode: "create" | "load") {
            patch({
                composer: mode,
                loadError: "",
                customAmount: !AMOUNT_PRESETS.some((preset) => String(preset) === modelRef.current.amount),
            });
            if (mode === "load") fillKnownEscrow(modelRef.current.loadAddress);
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
        retryMatch() {
            void run("match", retryMatch);
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
        importOracle() {
            void run("oracle", importOracle);
        },
        openSettings() {
            patch({ settingsOpen: true });
        },
        closeSettings() {
            patch({ settingsOpen: false, oracleSecret: "" });
        },
        downloadKeys,
        async restoreKeys(file: File) {
            await run("restore", () => restoreKeys(file));
        },
        loadBackup(file: File) {
            patch({ loadError: "" });
            if (busyRef.current) return;
            void run("backup", () => loadBackupFile(file));
        },
        askRemove(address: string) {
            const escrow = readEscrows().find((item) => item.address === address);
            if (!escrow) return;
            patch({
                pendingRemove: {
                    address: escrow.address,
                    amount: escrow.amount,
                    saved: covered().includes(escrow.address),
                },
            });
        },
        cancelRemove() {
            patch({ pendingRemove: null });
        },
        savePendingCard,
        confirmRemove,
        selectCoin(coinId: string) {
            patch({ coinId });
            void updateExitClock();
        },
    };

    return { model, actions };
}

class RebuildMismatch extends Error {
    readonly rebuilt: string;

    constructor(rebuilt: string, expected: string) {
        super(`compiled ${rebuilt}, which is not ${expected}`);
        this.rebuilt = rebuilt;
    }
}

export function loadMismatchMessage(rebuilt: string): string {
    return `These details compile to ${shortAddress(rebuilt)}, not the address you entered. Check the buyer, seller, amount, refund time, exit delay, and keys.`;
}

/** Headline and the specific reason when an opened address does not rebuild. */
export function unmatchedCopy(rebuilt: string | undefined, reason: string): { headline: string; detail: string } {
    if (rebuilt) {
        return {
            headline: "These details belong to a different address.",
            detail: loadMismatchMessage(rebuilt),
        };
    }
    const trimmed = reason.trim();
    const sentence = trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : "These details could not be compiled.";
    return {
        headline: "These details do not match this address.",
        detail: sentence.replace(/\b[A-Za-z0-9]{20,}\b/g, (token) => shortAddress(token)),
    };
}

function readableError(error: unknown): string {
    if (error instanceof RebuildMismatch) return loadMismatchMessage(error.rebuilt);
    const message = error instanceof Error ? error.message : String(error);
    const shortened = message.replace(/\b[A-Za-z0-9]{20,}\b/g, (token) => shortAddress(token));
    return shortened.charAt(0).toUpperCase() + shortened.slice(1);
}

export function shortAddress(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length <= 18) return trimmed;
    return `${trimmed.slice(0, 8)}…${trimmed.slice(-6)}`;
}

export function formatSats(value: bigint | number | string): string {
    return BigInt(value).toLocaleString("en-US");
}

export function fundingUrl(network: string, address: string): string {
    const trimmed = address.trim();
    if (!trimmed) return "";
    const demo = DEMO_NETWORKS.find((item) => item.name === network) ?? DEMO_NETWORKS[0];
    return arkadeAddressUrl(demo.spaceUrl, trimmed);
}
