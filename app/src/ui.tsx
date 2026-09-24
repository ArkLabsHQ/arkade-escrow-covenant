import { useEffect, useRef, useState } from "react";
import { Accordion } from "@base-ui/react/accordion";
import { Dialog } from "@base-ui/react/dialog";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { Toaster } from "sonner";

import { bip321FundingUri } from "./spend.ts";
import {
    AMOUNT_PRESETS,
    formatSats,
    fundingUrl,
    shortAddress,
    useEscrow,
    type EscrowModel,
    type RailItem,
} from "./use-escrow.ts";

export function App() {
    const { model, actions } = useEscrow();
    const amountRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const loadErrorRef = useRef<HTMLParagraphElement>(null);
    const [manualLoad, setManualLoad] = useState(false);
    const [dropOver, setDropOver] = useState(false);

    useEffect(() => {
        if (!model.loadError) return;
        loadErrorRef.current?.scrollIntoView({ block: "nearest" });
    }, [model.loadError]);

    useEffect(() => {
        if (model.composer === "load") return;
        setManualLoad(false);
        setDropOver(false);
    }, [model.composer]);

    return (
        <div className="page">
            <header className="top">
                <h1>Escrow</h1>
                <div className="top-actions">
                    <button className="text" type="button" onClick={actions.openSettings}>
                        Settings
                    </button>
                </div>
            </header>

            {model.empty ? (
                <section className="empty">
                    <h2>No escrows yet</h2>
                    <p>Create one for a buyer and a seller, or open an address you already funded.</p>
                    <div className="toolbar">
                        <button className="btn primary" type="button" onClick={() => actions.openComposer("create")}>
                            New escrow
                        </button>
                        <button className="btn" type="button" onClick={() => actions.openComposer("load")}>
                            Load an address
                        </button>
                    </div>
                </section>
            ) : (
                <div className="toolbar">
                    <button className="btn primary" type="button" onClick={() => actions.openComposer("create")}>
                        New escrow
                    </button>
                    <button className="btn" type="button" onClick={() => actions.openComposer("load")}>
                        Load an address
                    </button>
                </div>
            )}

            {model.rail.length > 0 ? (
                <ol className="rail">
                    {model.rail.map((escrow) => (
                        <li key={escrow.address}>
                            <Ticket escrow={escrow} onOpen={() => actions.openEscrow(escrow.address)} />
                        </li>
                    ))}
                </ol>
            ) : null}

            <Dialog.Root
                open={model.composer !== null}
                onOpenChange={(open) => {
                    if (!open) actions.closeComposer();
                }}
            >
                <Dialog.Portal>
                    <Dialog.Backdrop className="backdrop" />
                    <Dialog.Viewport className="viewport">
                        <Dialog.Popup
                            className="popup"
                            initialFocus={() =>
                                document.querySelector<HTMLElement>(
                                    model.composer === "load" ? (manualLoad ? "#load-address" : "#load-drop") : "#buyer",
                                ) ?? true
                            }
                        >
                            <div className="sheet-head">
                                <Dialog.Title className="sheet-title">
                                    {model.composer === "load" ? "Load an escrow" : "New escrow"}
                                </Dialog.Title>
                                <Dialog.Close className="text" type="button">
                                    Close
                                </Dialog.Close>
                            </div>
                            <Dialog.Description className="lede">
                                {model.composer === "load"
                                    ? "Drop the backup saved from this page."
                                    : "The buyer pays in. Release pays the seller. A refund pays the buyer."}
                            </Dialog.Description>

                            {model.composer === "load" ? (
                                <div className="stack-form">
                                    <label
                                        id="load-drop"
                                        className={dropOver ? "drop over" : "drop"}
                                        onDragEnter={(event) => {
                                            event.preventDefault();
                                            setDropOver(true);
                                        }}
                                        onDragOver={(event) => {
                                            event.preventDefault();
                                            setDropOver(true);
                                        }}
                                        onDragLeave={() => setDropOver(false)}
                                        onDrop={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            setDropOver(false);
                                            const file = droppedFile(event.dataTransfer);
                                            if (file) actions.loadBackup(file);
                                        }}
                                    >
                                        <input
                                            className="drop-input"
                                            type="file"
                                            accept="application/json,.json"
                                            aria-label="Backup JSON"
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                event.target.value = "";
                                                if (file) actions.loadBackup(file);
                                            }}
                                        />
                                        <span className="drop-title">Drop the backup</span>
                                        <span className="drop-sub">or choose the JSON file</span>
                                    </label>
                                    {model.loadError ? (
                                        <p className="fault form-fault" role="alert" ref={loadErrorRef}>
                                            {model.loadError}
                                        </p>
                                    ) : null}
                                    <button
                                        className="text manual-toggle"
                                        type="button"
                                        aria-expanded={manualLoad}
                                        onClick={() => setManualLoad((open) => !open)}
                                    >
                                        Enter parameters manually
                                    </button>
                                    {manualLoad ? (
                                        <form
                                            className="stack-form"
                                            onSubmit={(event) => {
                                                event.preventDefault();
                                                actions.submitLoad();
                                            }}
                                        >
                                            <label className="field">
                                                <span>Escrow address</span>
                                                <input
                                                    id="load-address"
                                                    value={model.loadAddress}
                                                    autoComplete="off"
                                                    spellCheck={false}
                                                    placeholder="tark1…"
                                                    required
                                                    onChange={(event) => actions.setField("loadAddress", event.target.value)}
                                                />
                                            </label>
                                            <TermsFields
                                                model={model}
                                                amountRef={amountRef}
                                                showExit
                                                onField={actions.setField}
                                                onAmount={actions.chooseAmount}
                                                onCustom={actions.chooseCustom}
                                            />
                                            <button className="btn primary wide" type="submit" disabled={model.busy}>
                                                Open this escrow
                                            </button>
                                        </form>
                                    ) : null}
                                </div>
                            ) : (
                                <form
                                    className="stack-form"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        actions.submitCreate();
                                    }}
                                >
                                    <TermsFields
                                        model={model}
                                        amountRef={amountRef}
                                        showExit={false}
                                        onField={actions.setField}
                                        onAmount={actions.chooseAmount}
                                        onCustom={actions.chooseCustom}
                                    />
                                    <button className="btn primary wide" type="submit" disabled={model.busy}>
                                        Create escrow
                                    </button>
                                </form>
                            )}
                            <p className="hint wallet">
                                Wallet <a href={model.walletHref} target="_blank" rel="noreferrer">{model.walletLabel}</a>
                            </p>
                        </Dialog.Popup>
                    </Dialog.Viewport>
                </Dialog.Portal>
            </Dialog.Root>

            <Dialog.Root
                open={model.contractOpen}
                onOpenChange={(open) => {
                    if (!open) actions.closeContract();
                }}
            >
                <Dialog.Portal>
                    <Dialog.Backdrop className="backdrop" />
                    <Dialog.Viewport className="viewport">
                        <Dialog.Popup className={model.torn ? "popup torn" : "popup"}>
                            <div className="sheet-head">
                                <Dialog.Title className="sheet-title">Escrow</Dialog.Title>
                                <Dialog.Close className="text" type="button">
                                    Close
                                </Dialog.Close>
                            </div>

                            {model.torn ? (
                                <div className="hero">
                                    <p className="hero-sentence">{model.balance}</p>
                                    <Dialog.Description className="fault">{model.loadStatus}</Dialog.Description>
                                </div>
                            ) : (
                                <div className="hero">
                                    <p className="amount">
                                        {formatSats(model.amount || "0")} <small>sats</small>
                                    </p>
                                    <p className="status-line">{model.balance}</p>
                                    <Dialog.Description className="sentence">{model.refundWhen}</Dialog.Description>
                                </div>
                            )}

                            <AddressRow
                                label="Funding"
                                value={model.funding}
                                href={fundingUrl(model.network, model.funding)}
                                payHref={bip321FundingUri(model.funding, model.amount)}
                            />

                            {model.torn ? (
                                <form
                                    className="stack-form"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        actions.retryMatch();
                                    }}
                                >
                                    <TermsFields
                                        model={model}
                                        amountRef={amountRef}
                                        showExit
                                        onField={actions.setField}
                                        onAmount={actions.chooseAmount}
                                        onCustom={actions.chooseCustom}
                                    />
                                    <button className="btn primary wide" type="submit" disabled={model.busy}>
                                        Match this address
                                    </button>
                                </form>
                            ) : (
                                <div className="payout" aria-busy={model.checking || model.releaseBusy}>
                                    <h2>Pay out</h2>
                                    {model.checking ? (
                                        <p className="check" role="status">
                                            <span className="check-bar" aria-hidden="true" />
                                            Checking this escrow
                                        </p>
                                    ) : (
                                        <>
                                            <button
                                                className="btn primary wide"
                                                type="button"
                                                disabled={model.completeDisabled}
                                                aria-busy={model.releaseBusy}
                                                onClick={actions.release}
                                            >
                                                Release to the seller
                                            </button>
                                            <button className="btn wide" type="button" disabled={model.cancelDisabled} onClick={actions.refund}>
                                                Refund the buyer
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {model.backup ? (
                                <div className="notice">
                                    <p>Save a copy before you leave. Another browser cannot release or refund without it.</p>
                                    <button className="btn wide" type="button" onClick={actions.downloadKeys}>
                                        Save a copy
                                    </button>
                                </div>
                            ) : null}

                            {model.coins.length > 1 ? (
                                <label className="field">
                                    <span>Coin</span>
                                    <select value={model.coinId} onChange={(event) => actions.selectCoin(event.target.value)}>
                                        {model.coins.map((coin) => (
                                            <option key={coin.id} value={coin.id}>
                                                {coin.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            ) : null}

                            <p className="advanced-label">Advanced</p>
                            <Accordion.Root className="more" onValueChange={(value) => actions.inspectAdvanced(value)}>
                                <Accordion.Item className="more-item" value="bitcoin">
                                    <Accordion.Header>
                                        <Accordion.Trigger className="more-trigger" type="button">
                                            <span>On Bitcoin</span>
                                            <small>{exitSummary(model.exitClock)}</small>
                                        </Accordion.Trigger>
                                    </Accordion.Header>
                                    <Accordion.Panel className="more-panel">
                                        {model.exitClock ? <p className="hint">{model.exitClock}</p> : null}
                                        <label className="field">
                                            <span>Seconds to wait after it is mined</span>
                                            <input
                                                id="exit"
                                                type="number"
                                                min={512}
                                                step={512}
                                                required
                                                value={model.exit}
                                                onChange={(event) => actions.setField("exit", event.target.value)}
                                            />
                                        </label>
                                        <div className="pair">
                                            <button className="btn" type="button" disabled={model.unrollDisabled} onClick={actions.unroll}>
                                                Unroll
                                            </button>
                                            <button className="btn" type="button" disabled={model.exitDisabled} onClick={actions.exit}>
                                                Exit on chain
                                            </button>
                                        </div>
                                        <div className="fee">
                                            <span>Fee</span>
                                            <span className="row-value">
                                                {model.feeAddress ? <span className="addr">{shortAddress(model.feeAddress)}</span> : null}
                                                {model.feeAddress ? <CopyButton value={model.feeAddress} /> : null}
                                                <span>{model.feeBalance}</span>
                                            </span>
                                        </div>
                                    </Accordion.Panel>
                                </Accordion.Item>

                                <Accordion.Item className="more-item" value="keys">
                                    <Accordion.Header>
                                        <Accordion.Trigger className="more-trigger" type="button">
                                            <span>Keys</span>
                                            <small>Buyer and seller</small>
                                        </Accordion.Trigger>
                                    </Accordion.Header>
                                    <Accordion.Panel className="more-panel">
                                        <div className="group">
                                            <AddressRow label="Buyer" value={model.keyBuyer} />
                                            <AddressRow label="Seller" value={model.keySeller} />
                                        </div>
                                        <label className="field">
                                            <span>Buyer key</span>
                                            <input
                                                type="password"
                                                autoComplete="off"
                                                spellCheck={false}
                                                placeholder="nsec, hex, or 12 words"
                                                value={model.buyerSecret}
                                                onChange={(event) => actions.setField("buyerSecret", event.target.value)}
                                            />
                                        </label>
                                        <label className="field">
                                            <span>Seller key</span>
                                            <input
                                                type="password"
                                                autoComplete="off"
                                                spellCheck={false}
                                                placeholder="nsec, hex, or 12 words"
                                                value={model.sellerSecret}
                                                onChange={(event) => actions.setField("sellerSecret", event.target.value)}
                                            />
                                        </label>
                                        <p className="hint">Paste an nsec, hex, or the 12 words from Arkade.Money. Either field can be left blank.</p>
                                        <div className="pair">
                                            <button
                                                className="btn primary"
                                                type="button"
                                                disabled={!model.buyerSecret.trim() && !model.sellerSecret.trim()}
                                                onClick={actions.importSecrets}
                                            >
                                                Use these keys
                                            </button>
                                        </div>
                                        <div className="quiet-row">
                                            {model.backup ? null : (
                                                <button className="text" type="button" onClick={actions.downloadKeys}>
                                                    Save a copy
                                                </button>
                                            )}
                                            <button className="text" type="button" onClick={() => fileRef.current?.click()}>
                                                Restore a file
                                            </button>
                                        </div>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="application/json,.json"
                                            hidden
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                event.target.value = "";
                                                if (file) void actions.restoreKeys(file);
                                            }}
                                        />
                                    </Accordion.Panel>
                                </Accordion.Item>

                                <Accordion.Item className="more-item" value="activity">
                                    <Accordion.Header>
                                        <Accordion.Trigger className="more-trigger" type="button">
                                            <span>Activity</span>
                                            <small>{activitySummary(model.log)}</small>
                                        </Accordion.Trigger>
                                    </Accordion.Header>
                                    <Accordion.Panel className="more-panel">
                                        {model.hops ? <pre className="hops">{model.hops}</pre> : null}
                                        {model.log.length === 0 ? (
                                            <p className="hint">Actions you take show up here.</p>
                                        ) : (
                                            <div className="log">
                                                {model.log.map((line, index) => (
                                                    <p key={`${index}-${line}`}>{line}</p>
                                                ))}
                                            </div>
                                        )}
                                    </Accordion.Panel>
                                </Accordion.Item>
                            </Accordion.Root>

                            {model.funding ? (
                                <button className="forget" type="button" onClick={() => actions.askRemove(model.funding)}>
                                    Remove from this browser
                                </button>
                            ) : null}
                        </Dialog.Popup>
                    </Dialog.Viewport>
                </Dialog.Portal>
            </Dialog.Root>

            <Dialog.Root
                open={model.settingsOpen}
                onOpenChange={(open) => {
                    if (!open) actions.closeSettings();
                }}
            >
                <Dialog.Portal>
                    <Dialog.Backdrop className="backdrop" />
                    <Dialog.Viewport className="viewport">
                        <Dialog.Popup className="popup" initialFocus={() => document.querySelector<HTMLElement>("#oracle-key") ?? true}>
                            <div className="sheet-head">
                                <Dialog.Title className="sheet-title">Settings</Dialog.Title>
                                <Dialog.Close className="text" type="button">
                                    Close
                                </Dialog.Close>
                            </div>
                            <Dialog.Description className="lede">
                                This browser uses one oracle for every escrow. Release asks it to sign.
                            </Dialog.Description>
                            <div className="group">
                                <AddressRow label="Oracle" value={model.oracle} />
                            </div>
                            <form
                                className="stack-form"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    actions.importOracle();
                                }}
                            >
                                <label className="field">
                                    <span>Oracle private key</span>
                                    <input
                                        id="oracle-key"
                                        type="password"
                                        autoComplete="off"
                                        spellCheck={false}
                                        placeholder="nsec, hex, or 12 words"
                                        value={model.oracleSecret}
                                        onChange={(event) => actions.setField("oracleSecret", event.target.value)}
                                    />
                                </label>
                                <p className="hint">
                                    This replaces the oracle for this browser. Escrows made with the previous key will not match until you use that key again.
                                </p>
                                <button className="btn primary wide" type="submit" disabled={model.busy || !model.oracleSecret.trim()}>
                                    Use this key
                                </button>
                            </form>
                        </Dialog.Popup>
                    </Dialog.Viewport>
                </Dialog.Portal>
            </Dialog.Root>

            <Dialog.Root
                open={model.pendingRemove !== null}
                onOpenChange={(open) => {
                    if (!open) actions.cancelRemove();
                }}
            >
                <Dialog.Portal>
                    <Dialog.Backdrop className="backdrop" />
                    <Dialog.Viewport className="viewport">
                        <Dialog.Popup className="popup" initialFocus={() => document.querySelector<HTMLElement>("#keep-card") ?? true}>
                            <div className="sheet-head">
                                <Dialog.Title className="sheet-title">Remove this card?</Dialog.Title>
                                <Dialog.Close id="keep-card" className="text" type="button">
                                    Cancel
                                </Dialog.Close>
                            </div>
                            <Dialog.Description className="lede">
                                This drops it from this browser. The escrow on Arkade stays. Save a copy if you want to load it again.
                            </Dialog.Description>
                            {model.pendingRemove ? (
                                <div className="hero">
                                    <p className="amount">
                                        {formatSats(model.pendingRemove.amount)} <small>sats</small>
                                    </p>
                                    <p className="sentence">{shortAddress(model.pendingRemove.address)}</p>
                                </div>
                            ) : null}
                            {model.pendingRemove?.saved ? <p className="hint saved-note">A copy is saved in arkade-escrow.json.</p> : null}
                            <div className="stack-form remove-actions">
                                <button className="btn wide" type="button" onClick={actions.savePendingCard}>
                                    Save a copy
                                </button>
                                <button className="btn danger wide" type="button" onClick={actions.confirmRemove}>
                                    Remove
                                </button>
                            </div>
                        </Dialog.Popup>
                    </Dialog.Viewport>
                </Dialog.Portal>
            </Dialog.Root>

            <Toaster position="bottom-center" toastOptions={{ duration: 3200 }} />
        </div>
    );
}

function TermsFields({
    model,
    amountRef,
    showExit,
    onField,
    onAmount,
    onCustom,
}: {
    model: EscrowModel;
    amountRef: React.RefObject<HTMLInputElement | null>;
    showExit: boolean;
    onField: (key: "buyer" | "seller" | "amount" | "timeout" | "exit", value: string) => void;
    onAmount: (amount: string) => void;
    onCustom: () => void;
}) {
    return (
        <>
            <div className="terms">
                <fieldset className="party">
                    <legend>Buyer</legend>
                    <p className="hint">Pays in. A refund returns here.</p>
                    <label className="field">
                        <span className="sr">Arkade address</span>
                        <input
                            id="buyer"
                            value={model.buyer}
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="tark1…"
                            required
                            onChange={(event) => onField("buyer", event.target.value)}
                        />
                    </label>
                </fieldset>
                <fieldset className="party">
                    <legend>Seller</legend>
                    <p className="hint">Release pays this address.</p>
                    <label className="field">
                        <span className="sr">Arkade address</span>
                        <input
                            id="seller"
                            value={model.seller}
                            autoComplete="off"
                            spellCheck={false}
                            placeholder="tark1…"
                            required
                            onChange={(event) => onField("seller", event.target.value)}
                        />
                    </label>
                </fieldset>
            </div>
            <div className="field">
                <span id="amount-label">Amount</span>
                <ToggleGroup
                    className="amounts"
                    aria-labelledby="amount-label"
                    value={[model.customAmount ? "custom" : model.amount]}
                    onValueChange={(value) => {
                        const next = value[0];
                        if (!next) return;
                        if (next === "custom") {
                            onCustom();
                            requestAnimationFrame(() => amountRef.current?.focus());
                            return;
                        }
                        onAmount(next);
                    }}
                >
                    {AMOUNT_PRESETS.map((amount) => (
                        <Toggle key={amount} className="chip" value={String(amount)}>
                            {formatSats(amount)}
                        </Toggle>
                    ))}
                    <Toggle className="chip" value="custom">
                        Custom
                    </Toggle>
                </ToggleGroup>
            </div>
            {model.customAmount ? (
                <label className="field">
                    <span>Custom amount (sats)</span>
                    <input
                        ref={amountRef}
                        id="amount"
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={model.amount}
                        onChange={(event) => onField("amount", event.target.value)}
                    />
                </label>
            ) : null}
            <label className="field">
                <span>Refund after</span>
                <input
                    id="timeout"
                    type="datetime-local"
                    required
                    value={model.timeout}
                    onChange={(event) => onField("timeout", event.target.value)}
                />
            </label>
            <p className="hint">You can refund the buyer after this time.</p>
            {showExit ? (
                <>
                    <label className="field">
                        <span>Exit delay (seconds)</span>
                        <input
                            id="load-exit"
                            type="number"
                            min={512}
                            step={512}
                            required
                            value={model.exit}
                            onChange={(event) => onField("exit", event.target.value)}
                        />
                    </label>
                    <p className="hint">Creation uses the delay already in this browser.</p>
                </>
            ) : null}
        </>
    );
}

function droppedFile(transfer: DataTransfer | null): File | null {
    if (!transfer) return null;
    const file = transfer.files?.[0];
    if (file) return file;
    for (const item of transfer.items ?? []) {
        if (item.kind !== "file") continue;
        const found = item.getAsFile();
        if (found) return found;
    }
    return null;
}

function Ticket({ escrow, onOpen }: { escrow: RailItem; onOpen: () => void }) {
    return (
        <button className="card" type="button" aria-current={escrow.current ? "true" : undefined} onClick={onOpen}>
            <span className="card-top">
                <span className="card-amount">
                    {formatSats(escrow.amount)} <small>sats</small>
                </span>
                <span className={`pill ${pillKind(escrow.status)}`}>{escrow.status}</span>
            </span>
        </button>
    );
}

function AddressRow({
    label,
    value,
    href,
    payHref,
}: {
    label: string;
    value: string;
    href?: string;
    payHref?: string;
}) {
    const shown = value ? shortAddress(value) : "Not set";
    return (
        <div className={href ? "row funding-row" : "row"}>
            <span className="row-label">{label}</span>
            <span className="row-value">
                {payHref ? (
                    <a className="addr" href={payHref} aria-label={`Pay ${shown}`}>
                        {shown}
                    </a>
                ) : (
                    <span className="addr">{shown}</span>
                )}
                {value ? <CopyButton value={payHref || value} label={payHref ? "Copy pay link" : "Copy"} /> : null}
                {href ? (
                    <a className="icon-link" href={href} target="_blank" rel="noreferrer" aria-label="Open in Arkade explorer">
                        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                            <path d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                    </a>
                ) : null}
            </span>
        </div>
    );
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            className="copy"
            type="button"
            aria-label={label}
            onClick={() => {
                void navigator.clipboard.writeText(value);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
            }}
        >
            {copied ? "Copied" : "Copy"}
        </button>
    );
}

function exitSummary(clock: string): string {
    if (!clock) return "Unroll, then exit";
    if (clock.startsWith("You can exit on chain now")) return "You can exit now";
    if (clock.startsWith("You can exit")) return "Waiting on Bitcoin";
    if (clock.startsWith("Unroll first")) return "Unroll first";
    return "Exit clock";
}

function activitySummary(log: string[]): string {
    if (log.length === 0) return "Nothing yet";
    return log[0].replace(/^\d{1,2}:\d{2}\s*(AM|PM)\s+/, "");
}

function pillKind(status: string): string {
    if (status === "Funded" || status === "On Bitcoin" || status === "Refund open") return "good";
    if (
        status === "Refunded to the buyer" ||
        status === "Released to the seller" ||
        status === "Unilateral exit" ||
        status === "Closed"
    ) {
        return "done";
    }
    if (status === "Parameters differ") return "bad";
    return "";
}
