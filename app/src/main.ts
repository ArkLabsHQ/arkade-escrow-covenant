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
const restoreKeysButton = required<HTMLButtonElement>("#restore-keys");
const restoreFile = required<HTMLInputElement>("#restore-file");
const log = required<HTMLElement>("#log");

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
networkSelect.addEventListener("change", () => {
    updateWalletLink();
    markStale();
    void raiseExitToOperator();
    void showFeeWallet();
});
void (async () => {
    await raiseExitToOperator();
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
    void run("create", createEscrow);
});
loadEscrowButton.addEventListener("click", () => void run("load", () => loadByAddress(loadAddressInput.value)));
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
restoreKeysButton.addEventListener("click", () => restoreFile.click());
restoreFile.addEventListener("change", () => {
    const file = restoreFile.files?.[0];
    restoreFile.value = "";
    if (file) void run("restore", () => restoreKeys(file));
});

window.setInterval(() => {
    if (prepared && fingerprint === currentFingerprint()) void refreshCoins(false);
}, 4000);

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
        prepared = undefined;
        coins = [];
        fingerprint = "";
        contractSection.hidden = true;
        throw new Error("the oracle and exit keys in this page do not rebuild that escrow");
    }
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
    await refreshCoins(true);
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
        await createEscrow(found.address);
        loadStatus.textContent = `Resumed ${found.address}.`;
        note(`resumed ${found.address}`);
        return;
    }
    const watched = await coinsForAddress(selectedNetwork(), trimmed);
    prepared = undefined;
    fingerprint = "";
    coins = watched;
    addressCode.textContent = trimmed;
    contractSection.hidden = false;
    fillCoinSelect();
    balanceLine.textContent = describeCoins();
    exitClock.textContent = "";
    hopsLine.textContent = "";
    const unrolled = watched.some((coin) => coin.isUnrolled);
    const line =
        watched.length === 0
            ? "The indexer has no unspent coins at that address."
            : `${describeCoins()} ${unrolled ? "The funding transaction is on Bitcoin." : "It is still off chain."} This browser does not have the contract that built the address, so the spend buttons stay off until you restore the key file that created it.`;
    loadStatus.textContent = line;
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
}

async function refreshCoins(announce: boolean): Promise<void> {
    if (!prepared) return;
    coins = await prepared.contract.getUtxos();
    fillCoinSelect();
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
    if (coins.length === 0)
        return "No coins yet. Send sats to the address above from Arkade.Money.";
    const total = coins.reduce((sum, coin) => sum + coin.value, 0);
    return `${coins.length} coin${coins.length === 1 ? "" : "s"}, ${total} sats.`;
}

function downloadKeys(): void {
    const body = `${JSON.stringify({ ...exportStoredKeys(keys), escrows: readEscrows() }, null, 2)}\n`;
    const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "arkade-escrow-keys.json";
    link.click();
    URL.revokeObjectURL(url);
    note("downloaded the oracle and exit keys");
}

async function restoreKeys(file: File): Promise<void> {
    const text = await file.text();
    const stored = storedKeysFromText(text);
    const escrows = escrowsFromBackup(text);
    saveStoredKeys(stored);
    if (escrows.length > 0) writeEscrows(escrows);
    keys = keysFromStored(stored);
    prepared = undefined;
    coins = [];
    fingerprint = "";
    contractSection.hidden = true;
    hopsLine.textContent = "";
    await showKeys();
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
    try {
        await action();
    } catch (error) {
        note(`${label} failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        busy = false;
        prepareButton.disabled = false;
        syncButtons();
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
