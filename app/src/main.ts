import { hex } from "@scure/base";

import { arkade, EsploraProvider, OnchainWallet, type VirtualCoin } from "@arkade-os/sdk";

import {
    bitcoinMinedAt,
    coinsForAddress,
    DEMO_NETWORKS,
    describeExitClock,
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
    releaseMessage,
    secretToKey,
    shortHex,
    spendCancel,
    spendComplete,
    spendExitOnchain,
    unrollOnce,
    type DemoNetwork,
    type PreparedEscrow,
} from "./spend.ts";

const form = document.querySelector("form");
const networkSelect = required<HTMLSelectElement>("#network");
const walletLink = required<HTMLAnchorElement>("#wallet");
const buyerInput = required<HTMLInputElement>("#buyer");
const sellerInput = required<HTMLInputElement>("#seller");
const amountInput = required<HTMLInputElement>("#amount");
const timeoutInput = required<HTMLInputElement>("#timeout");
const exitInput = required<HTMLInputElement>("#exit");
const prepareButton = required<HTMLButtonElement>("#prepare");
const loadAddressInput = required<HTMLInputElement>("#load-address");
const loadEscrowButton = required<HTMLButtonElement>("#load-escrow");
const loadStatus = required<HTMLElement>("#load-status");
const contractSection = required<HTMLElement>("#contract");
const addressCode = required<HTMLElement>("#address");
const copyButton = required<HTMLButtonElement>("#copy");
const balanceLine = required<HTMLElement>("#balance");
const coinSelect = required<HTMLSelectElement>("#coin");
const completeButton = required<HTMLButtonElement>("#complete");
const cancelButton = required<HTMLButtonElement>("#cancel");
const unilateralButton = required<HTMLButtonElement>("#unilateral");
const unrollButton = required<HTMLButtonElement>("#unroll");
const exitClock = required<HTMLElement>("#exit-clock");
const feeLine = required<HTMLElement>("#fee-wallet");
const oracleLine = required<HTMLElement>("#oracle");
const keysLine = required<HTMLElement>("#keys");
const buyerSecret = required<HTMLInputElement>("#buyer-secret");
const sellerSecret = required<HTMLInputElement>("#seller-secret");
const importSecretsButton = required<HTMLButtonElement>("#import-secrets");
const hopsLine = required<HTMLElement>("#hops");
const downloadKeysButton = required<HTMLButtonElement>("#download-keys");
const downloadKeysAdvanced = required<HTMLButtonElement>("#download-keys-advanced");
const restoreKeysButton = required<HTMLButtonElement>("#restore-keys");
const restoreFile = required<HTMLInputElement>("#restore-file");
const log = required<HTMLElement>("#log");
const entry = required<HTMLElement>("#entry");
const rail = required<HTMLOListElement>("#rail");
const otherNetwork = required<HTMLElement>("#other-network");
const composer = required<HTMLElement>("#composer");
const loadFields = required<HTMLElement>("#load-fields");
const createFields = required<HTMLElement>("#create-fields");
const showLoadButton = required<HTMLButtonElement>("#show-load");
const showCreateButton = required<HTMLButtonElement>("#show-create");
const composerBack = required<HTMLButtonElement>("#composer-back");
const backup = required<HTMLElement>("#backup");
const coinLabel = required<HTMLElement>("#coin-label");

let keys = loadKeys();
const feeKey = loadFeeKey();
let prepared: PreparedEscrow | undefined;
let coins: VirtualCoin[] = [];
let fingerprint = "";
let busy = false;
let exitOpen = false;
let exitClockToken = 0;
const minedAtByTxid = new Map<string, number | null>();
let hopCache = { key: "", at: 0, text: "" };
const statusByAddress = new Map<string, string>();
const COVERED = "arkade-escrow-file-covers";

networkSelect.replaceChildren(
    ...DEMO_NETWORKS.map((demo) => {
        const option = document.createElement("option");
        option.value = demo.name;
        option.textContent = demo.label;
        return option;
    }),
);
buyerInput.value = localStorage.getItem("arkade-escrow-buyer") ?? "";
sellerInput.value = localStorage.getItem("arkade-escrow-seller") ?? "";
amountInput.value = localStorage.getItem("arkade-escrow-amount") ?? "10000";
const storedExit = localStorage.getItem("arkade-escrow-exit");
exitInput.value = !storedExit || storedExit === "0" ? "2048" : storedExit;
timeoutInput.value = localStorage.getItem("arkade-escrow-timeout") ?? localInput(nowSeconds() - 60);
networkSelect.value = localStorage.getItem("arkade-escrow-network") ?? "mutinynet";
updateWalletLink();

void showKeys();
void showFeeWallet();
syncEntry();
networkSelect.addEventListener("change", () => {
    updateWalletLink();
    markStale();
    void raiseExitToOperator();
    void showFeeWallet();
    syncEntry();
    void refreshRailStatuses();
});
void (async () => {
    await raiseExitToOperator();
    void refreshRailStatuses();
    const last = lastEscrowAddress();
    if (last && readEscrows().some((item) => item.address === last)) {
        await run("resume", () => loadByAddress(last));
    }
})();
for (const input of [buyerInput, sellerInput, amountInput, timeoutInput, exitInput]) {
    input.addEventListener("input", markStale);
}

form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!loadFields.hidden) {
        void run("load", () => loadByAddress(loadAddressInput.value));
        return;
    }
    void run("create", createEscrow);
});
loadEscrowButton.addEventListener("click", () => void run("load", () => loadByAddress(loadAddressInput.value)));
showLoadButton.addEventListener("click", () => openComposer("load"));
showCreateButton.addEventListener("click", () => openComposer("create"));
composerBack.addEventListener("click", closeComposer);
copyButton.addEventListener("click", () => {
    void navigator.clipboard.writeText(addressCode.textContent ?? "");
    note("copied the funding address");
});
completeButton.addEventListener("click", () => void run("unlock", unlock));
cancelButton.addEventListener("click", () => void run("refund", refund));
unilateralButton.addEventListener("click", () => void run("exit", exit));
unrollButton.addEventListener("click", () => void run("unroll", unroll));
coinSelect.addEventListener("change", () => void updateExitClock());
importSecretsButton.addEventListener("click", () => void run("keys", importSecrets));
downloadKeysButton.addEventListener("click", downloadKeys);
downloadKeysAdvanced.addEventListener("click", downloadKeys);
restoreKeysButton.addEventListener("click", () => restoreFile.click());
restoreFile.addEventListener("change", () => {
    const file = restoreFile.files?.[0];
    restoreFile.value = "";
    if (file) void run("restore", () => restoreKeys(file));
});

window.setInterval(() => {
    if (prepared && fingerprint === currentFingerprint()) void refreshCoins(false);
}, 8000);

async function createEscrow(expectedAddress?: string): Promise<void> {
    const demo = selectedNetwork();
    const amount = readAmount();
    const timeoutAt = readTimeout();
    const exitDelay = readExit();
    remember();
    prepared = await prepareEscrow({
        demo,
        buyerAddress: buyerInput.value,
        sellerAddress: sellerInput.value,
        amount,
        timeoutAt,
        exit: exitDelay,
        keys,
    });
    fingerprint = currentFingerprint();
    addressCode.textContent = prepared.contract.address;
    contractSection.hidden = false;
    note(
        `escrow ${prepared.contract.address} · emulator ${prepared.emulatorVersion || "unknown"} · oracle signs "${RELEASE_LABEL}"`,
    );
    if (prepared.emulatorVersion.startsWith("v0.0.7")) {
        note("this emulator is older than v0.0.8, so refund (CHECKTIME) will be rejected");
    }
    if (expectedAddress && prepared.contract.address !== expectedAddress) {
        const rebuilt = prepared.contract.address;
        prepared = undefined;
        coins = [];
        fingerprint = "";
        contractSection.hidden = true;
        contractSection.classList.remove("torn");
        throw new RebuildMismatch(rebuilt, expectedAddress);
    }
    statusByAddress.delete(prepared.contract.address);
    contractSection.classList.remove("torn");
    saveEscrow({
        address: prepared.contract.address,
        network: demo.name,
        buyer: buyerInput.value.trim(),
        seller: sellerInput.value.trim(),
        amount: amountInput.value,
        timeout: timeoutInput.value,
        exit: exitInput.value,
    });
    loadAddressInput.value = prepared.contract.address;
    closeComposer();
    syncBackup();
    await refreshCoins(true);
    void refreshRailStatuses();
}

async function loadByAddress(address: string): Promise<void> {
    const trimmed = address.trim();
    if (!trimmed) throw new Error("paste an escrow address");
    const found = readEscrows().find((item) => item.address === trimmed);
    if (found) {
        networkSelect.value = found.network;
        updateWalletLink();
        buyerInput.value = found.buyer;
        sellerInput.value = found.seller;
        amountInput.value = found.amount;
        timeoutInput.value = found.timeout;
        exitInput.value = found.exit;
    }
    try {
        await createEscrow(trimmed);
    } catch (error) {
        const rebuilt = error instanceof RebuildMismatch ? error.rebuilt : undefined;
        const reason = error instanceof Error ? error.message : String(error);
        await showUnmatched(trimmed, rebuilt, reason);
        return;
    }
    const line = found
        ? `Resumed ${trimmed} from the saved parameters.`
        : `Rebuilt ${trimmed} from the contract artifact and the parameters on this page.`;
    loadStatus.textContent = line;
    note(line);
}

async function showUnmatched(address: string, rebuilt: string | undefined, reason: string): Promise<void> {
    const watched = await coinsForAddress(selectedNetwork(), address);
    prepared = undefined;
    fingerprint = "";
    coins = watched;
    addressCode.textContent = address;
    contractSection.hidden = false;
    fillCoinSelect();
    balanceLine.textContent = describeCoins();
    exitClock.textContent = "";
    hopsLine.textContent = "";
    const unrolled = watched.some((coin) => coin.isUnrolled);
    const coinsLine =
        watched.length === 0
            ? "The indexer has no unspent coins at that address."
            : `${describeCoins()} ${unrolled ? "The funding transaction is on Bitcoin." : "It is still off chain."}`;
    const compiled = rebuilt
        ? `Compiling the artifact with these addresses, amount, refund time, exit delay, and keys produced ${rebuilt}.`
        : `The artifact could not be compiled with the parameters on this page: ${reason}`;
    const line = `${coinsLine} ${compiled} Change a parameter and load again until the compiled address is the one you pasted.`;
    loadStatus.textContent = line;
    contractSection.classList.add("torn");
    statusByAddress.set(address, "Parameters differ");
    closeComposer();
    syncBackup();
    paintRail();
    note(line);
}

async function unlock(): Promise<void> {
    const current = requirePrepared();
    const coin = selectedCoin();
    const { seller, buyer } = payouts(current);
    const txid = await spendComplete(current, coin, seller, buyer, readAmount());
    note(`unlocked to the seller: ${txid}`);
    await refreshCoins(true);
}

async function refund(): Promise<void> {
    const current = requirePrepared();
    const coin = selectedCoin();
    const { buyer } = payouts(current);
    const txid = await spendCancel(current, coin, buyer);
    note(`refunded the buyer: ${txid}`);
    await refreshCoins(true);
}

async function unroll(): Promise<void> {
    const current = requirePrepared();
    const coin = selectedCoin();
    const progress = await unrollOnce(current.demo, coin, feeKey);
    if (progress.kind === "done") note(`unrolled ${progress.txid}`);
    else if (progress.kind === "waiting") note(`waiting for ${progress.txid} to be mined`);
    else note(`broadcast ${progress.txid}`);
    hopCache.at = 0;
    await showFeeWallet();
    await updateExitClock();
}

async function importSecrets(): Promise<void> {
    const buyerText = buyerSecret.value.trim();
    const sellerText = sellerSecret.value.trim();
    if (!buyerText && !sellerText) throw new Error("paste a buyer or seller key");
    const mainnet = selectedNetwork().name === "bitcoin";
    if (buyerText) keys = { ...keys, buyer: secretToKey(buyerText, { mainnet }) };
    if (sellerText) keys = { ...keys, seller: secretToKey(sellerText, { mainnet }) };
    saveStoredKeys(exportStoredKeys(keys));
    buyerSecret.value = "";
    sellerSecret.value = "";
    prepared = undefined;
    coins = [];
    fingerprint = "";
    contractSection.hidden = true;
    hopsLine.textContent = "";
    await showKeys();
    const which = buyerText && sellerText ? "buyer and seller keys" : buyerText ? "buyer key" : "seller key";
    syncEntry();
    note(`replaced the ${which}`);
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
    note(`on-chain exit to ${seller.address}: ${txid}`);
    await refreshCoins(true);
}

function payouts(current: PreparedEscrow): { buyer: Uint8Array; seller: Uint8Array } {
    const buyer = payoutFromAddress(
        buyerInput.value,
        current.demo.network.hrp,
        current.contract.client.serverKey,
    );
    const seller = payoutFromAddress(
        sellerInput.value,
        current.demo.network.hrp,
        current.contract.client.serverKey,
    );
    return { buyer: buyer.pkScript, seller: seller.pkScript };
}

function fillCoinSelect(): void {
    const previous = coinSelect.value;
    coinSelect.replaceChildren(
        ...coins.map((coin) => {
            const option = document.createElement("option");
            option.value = `${coin.txid}:${coin.vout}`;
            option.textContent = `${coin.value} sats · ${coin.txid.slice(0, 10)}:${coin.vout}`;
            return option;
        }),
    );
    if (coins.some((coin) => `${coin.txid}:${coin.vout}` === previous)) coinSelect.value = previous;
    coinLabel.hidden = coins.length <= 1;
}

async function refreshCoins(announce: boolean): Promise<void> {
    if (!prepared) return;
    coins = await prepared.contract.getUtxos();
    fillCoinSelect();
    if (prepared) statusByAddress.set(prepared.contract.address, statusWord(coins));
    paintRail();
    const total = coins.reduce((sum, coin) => sum + coin.value, 0);
    balanceLine.textContent = describeCoins();
    if (announce && coins.length > 0) note(`found ${total} sats`);
    await updateExitClock();
}

function selectedCoin(): VirtualCoin {
    const coin = coins.find((item) => `${item.txid}:${item.vout}` === coinSelect.value) ?? coins[0];
    if (!coin) throw new Error("fund the escrow first");
    return coin;
}

function requirePrepared(): PreparedEscrow {
    if (!prepared || fingerprint !== currentFingerprint()) {
        throw new Error("the form changed; create the escrow again");
    }
    return prepared;
}

function markStale(): void {
    if (!prepared) return;
    balanceLine.textContent =
        fingerprint === currentFingerprint()
            ? describeCoins()
            : "The form changed. Create the escrow again before spending.";
    void updateExitClock();
}

function describeCoins(): string {
    if (coins.length === 0) return `Send ${amountInput.value} sats from Arkade.Money to this address.`;
    const total = coins.reduce((sum, coin) => sum + coin.value, 0);
    return `${total} sats in this escrow.`;
}

function downloadKeys(): void {
    const body = `${JSON.stringify({ ...exportStoredKeys(keys), escrows: readEscrows() }, null, 2)}\n`;
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

async function restoreKeys(file: File): Promise<void> {
    const text = await file.text();
    const stored = storedKeysFromText(text);
    const escrows = escrowsFromBackup(text);
    saveStoredKeys(stored);
    if (escrows.length > 0) {
        writeEscrows(escrows);
        markCovered(escrows.map((escrow) => escrow.address));
    }
    keys = keysFromStored(stored);
    prepared = undefined;
    coins = [];
    fingerprint = "";
    contractSection.hidden = true;
    hopsLine.textContent = "";
    await showKeys();
    closeComposer();
    syncEntry();
    const address = escrows[0]?.address ?? lastEscrowAddress();
    if (address && readEscrows().some((item) => item.address === address)) {
        await loadByAddress(address);
        return;
    }
    note("restored the oracle and exit keys. Paste an escrow address to resume.");
}

async function showFeeWallet(): Promise<void> {
    try {
        const wallet = await feeWallet(selectedNetwork(), feeKey);
        const balance = await wallet.getBalance();
        feeLine.textContent = `Fee wallet ${wallet.address} · ${balance} sats. Unroll spends this on the pay-to-anchor.`;
    } catch (error) {
        feeLine.textContent = `fee wallet failed: ${error instanceof Error ? error.message : String(error)}`;
    }
}

async function showKeys(): Promise<void> {
    const [buyer, seller, oracle, message] = await Promise.all([
        keys.buyer.xOnlyPublicKey(),
        keys.seller.xOnlyPublicKey(),
        keys.oracle.xOnlyPublicKey(),
        releaseMessage(),
    ]);
    keysLine.textContent = `buyer ${shortHex(buyer)} · seller ${shortHex(seller)}`;
    oracleLine.textContent = `oracle ${shortHex(oracle)} · message ${hex.encode(message)}`;
}

function selectedNetwork(): DemoNetwork {
    const demo = DEMO_NETWORKS.find((item) => item.name === networkSelect.value);
    if (!demo) throw new Error("unknown network");
    return demo;
}

function updateWalletLink(): void {
    const demo = selectedNetwork();
    walletLink.href = demo.walletUrl;
    walletLink.textContent = demo.walletUrl.replace("https://", "");
}

function readAmount(): bigint {
    const amount = BigInt(amountInput.value);
    if (amount <= 0n) throw new Error("amount must be positive");
    return amount;
}

async function raiseExitToOperator(): Promise<void> {
    try {
        const minimum = await minimumExitDelay(selectedNetwork());
        if (BigInt(exitInput.value || "0") < minimum) exitInput.value = minimum.toString();
    } catch {
        // Create reports the operator minimum when this lookup fails.
    }
    markStale();
}

function readExit(): bigint {
    const exit = BigInt(exitInput.value);
    if (exit < 0n) throw new Error("unilateral delay cannot be negative");
    return exit;
}

function readTimeout(): bigint {
    const parsed = Date.parse(timeoutInput.value);
    if (Number.isNaN(parsed)) throw new Error("refund time is not a date");
    return BigInt(Math.floor(parsed / 1000));
}

function currentFingerprint(): string {
    return [
        networkSelect.value,
        buyerInput.value.trim(),
        sellerInput.value.trim(),
        amountInput.value,
        timeoutInput.value,
        exitInput.value,
    ].join("|");
}

function remember(): void {
    localStorage.setItem("arkade-escrow-buyer", buyerInput.value.trim());
    localStorage.setItem("arkade-escrow-seller", sellerInput.value.trim());
    localStorage.setItem("arkade-escrow-amount", amountInput.value);
    localStorage.setItem("arkade-escrow-timeout", timeoutInput.value);
    localStorage.setItem("arkade-escrow-exit", exitInput.value);
    localStorage.setItem("arkade-escrow-network", networkSelect.value);
}

async function run(label: string, action: () => Promise<void>): Promise<void> {
    busy = true;
    prepareButton.disabled = true;
    completeButton.disabled = true;
    cancelButton.disabled = true;
    unilateralButton.disabled = true;
    unrollButton.disabled = true;
    if (label === "unlock") completeButton.setAttribute("aria-busy", "true");
    try {
        await action();
    } catch (error) {
        note(`${label} failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        busy = false;
        prepareButton.disabled = false;
        completeButton.removeAttribute("aria-busy");
        syncButtons();
        syncBackup();
    }
}

async function updateExitClock(): Promise<void> {
    const token = ++exitClockToken;
    const current = prepared;
    const coin = coins.find((item) => `${item.txid}:${item.vout}` === coinSelect.value) ?? coins[0];
    if (!current || fingerprint !== currentFingerprint() || !coin) {
        exitClock.textContent = "";
        hopsLine.textContent = "";
        exitOpen = false;
        syncButtons();
        return;
    }
    const anchor = exitAnchor(coin);
    if (!anchor) {
        exitClock.textContent = "This coin has no Bitcoin output yet, so the exit clock has not started.";
        exitOpen = false;
        syncButtons();
        return;
    }
    try {
        const minedAt = await cachedMinedAt(current.demo.explorerUrl, anchor.txid);
        if (token !== exitClockToken) return;
        const described = describeExitClock({
            txid: anchor.txid,
            minedAt,
            exitSeconds: current.exit,
            now: nowSeconds(),
        });
        exitClock.textContent = described.text;
        exitOpen = described.open;
        hopsLine.textContent = await hopText(current.demo, coin);
    } catch (error) {
        if (token !== exitClockToken) return;
        exitClock.textContent = `exit clock failed: ${error instanceof Error ? error.message : String(error)}`;
        exitOpen = false;
    }
    syncButtons();
}

async function hopText(demo: DemoNetwork, coin: { txid: string; vout: number }): Promise<string> {
    const key = `${coin.txid}:${coin.vout}`;
    if (hopCache.key === key && Date.now() - hopCache.at < 20_000) return hopCache.text;
    const hops = await listUnrollHops(demo, coin);
    const text = hops
        .map((hop, index) => `${index + 1}. ${hop.onchain.padEnd(9)} ${hop.kind.padEnd(12)} ${hop.txid}`)
        .join("\n");
    hopCache = { key, at: Date.now(), text };
    return text;
}

async function cachedMinedAt(explorerUrl: string, txid: string): Promise<number | null> {
    const cached = minedAtByTxid.get(txid);
    if (cached !== undefined && cached !== null) return cached;
    const minedAt = await bitcoinMinedAt(explorerUrl, txid);
    if (minedAt !== null) minedAtByTxid.set(txid, minedAt);
    return minedAt;
}

function syncButtons(): void {
    const ready = !busy && coins.length > 0 && !!prepared && fingerprint === currentFingerprint();
    completeButton.disabled = !ready;
    cancelButton.disabled = !ready;
    unilateralButton.disabled = !ready || !exitOpen;
    unrollButton.disabled = !ready;
}

class RebuildMismatch extends Error {
    readonly rebuilt: string;

    constructor(rebuilt: string, expected: string) {
        super(`compiled ${rebuilt}, which is not ${expected}`);
        this.rebuilt = rebuilt;
    }
}

function openComposer(mode: "create" | "load"): void {
    composer.hidden = false;
    loadFields.hidden = mode !== "load";
    createFields.hidden = mode !== "create";
    entry.hidden = true;
    (mode === "load" ? loadAddressInput : buyerInput).focus();
}

function closeComposer(): void {
    composer.hidden = true;
    syncEntry();
}

function syncEntry(): void {
    const onNetwork = readEscrows().filter((item) => item.network === networkSelect.value);
    const elsewhere = readEscrows().length - onNetwork.length;
    entry.classList.toggle("empty", readEscrows().length === 0);
    entry.hidden = !composer.hidden;
    otherNetwork.hidden = elsewhere === 0;
    otherNetwork.textContent =
        elsewhere === 0
            ? ""
            : `${elsewhere} escrow${elsewhere === 1 ? "" : "s"} on the other network. Switch network to see them.`;
    paintRail();
}

function paintRail(): void {
    const list = readEscrows().filter((item) => item.network === networkSelect.value);
    const open = !contractSection.hidden ? addressCode.textContent?.trim() : "";
    rail.replaceChildren(
        ...list.map((escrow) => {
            const item = document.createElement("li");
            const button = document.createElement("button");
            button.type = "button";
            button.className = "ticket";
            if (escrow.address === open) button.setAttribute("aria-current", "true");
            const stub = document.createElement("span");
            stub.className = "stub";
            const amount = document.createElement("b");
            amount.textContent = escrow.amount;
            const unit = document.createElement("small");
            unit.textContent = "sats";
            stub.append(amount, unit);
            const body = document.createElement("span");
            body.className = "ticket-body";
            const parties = document.createElement("span");
            parties.className = "parties";
            parties.textContent = `${shortParty(escrow.buyer)} → ${shortParty(escrow.seller)}`;
            const status = document.createElement("span");
            status.className = "status";
            status.textContent = statusByAddress.get(escrow.address) ?? "Checking";
            body.append(parties, status);
            button.append(stub, body);
            button.addEventListener("click", () => {
                void run("load", () => loadByAddress(escrow.address));
            });
            item.append(button);
            return item;
        }),
    );
    rail.hidden = list.length === 0;
}

async function refreshRailStatuses(): Promise<void> {
    const demo = selectedNetwork();
    const list = readEscrows().filter((item) => item.network === demo.name);
    await Promise.all(
        list.map(async (escrow) => {
            if (statusByAddress.get(escrow.address) === "Parameters differ") return;
            if (prepared?.contract.address === escrow.address && fingerprint === currentFingerprint()) {
                statusByAddress.set(escrow.address, statusWord(coins));
                return;
            }
            try {
                statusByAddress.set(escrow.address, statusWord(await coinsForAddress(demo, escrow.address)));
            } catch {
                statusByAddress.set(escrow.address, "Not checked");
            }
        }),
    );
    paintRail();
}

function statusWord(watched: VirtualCoin[]): string {
    if (watched.length === 0) return "Waiting for funds";
    if (watched.some((coin) => coin.isUnrolled)) return "On Bitcoin";
    return "Funded";
}

function shortParty(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length <= 14) return trimmed;
    return `…${trimmed.slice(-6)}`;
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

function syncBackup(): void {
    const address = addressCode.textContent?.trim() ?? "";
    backup.hidden = contractSection.hidden || !prepared || !address || covered().includes(address);
}

function note(message: string): void {
    const line = document.createElement("div");
    const time = new Date().toLocaleTimeString();
    line.textContent = `${time}  ${message}`;
    log.prepend(line);
}

function nowSeconds(): number {
    return Math.floor(Date.now() / 1000);
}

function localInput(unix: number): string {
    const date = new Date(unix * 1000);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function required<T extends Element>(selector: string): T {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`missing ${selector}`);
    return element as T;
}
