import { useRef, useState } from "react";
import { Accordion } from "@base-ui/react/accordion";
import { Dialog } from "@base-ui/react/dialog";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { Toaster } from "sonner";

import { AMOUNT_PRESETS, formatSats, fundingUrl, shortAddress, useEscrow, type RailItem } from "./use-escrow.ts";

export function App() {
    const { model, actions, networks } = useEscrow();
    const amountRef = useRef<HTMLInputElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    return (
        <div className="page">
            <header className="top">
                <h1>Escrow</h1>
                <div className="segment" role="group" aria-label="Network">
                    {networks.map((network) => (
                        <button
                            key={network.name}
                            type="button"
                            aria-pressed={model.network === network.name}
                            onClick={() => actions.setNetwork(network.name)}
                        >
                            {network.label}
                        </button>
                    ))}
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

            {model.otherNetwork ? <p className="hint">{model.otherNetwork}</p> : null}

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
                                document.querySelector<HTMLElement>(model.composer === "load" ? "#load-address" : "#buyer") ?? true
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
                                    ? "The address already contains the buyer, the seller, the amount, and the refund time."
                                    : "The buyer pays in. Release pays the seller. A refund pays the buyer."}
                            </Dialog.Description>

                            {model.composer === "load" ? (
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
                                            onChange={(event) => actions.setField("loadAddress", event.target.value)}
                                        />
                                    </label>
                                    <p className="hint">
                                        Use the same buyer, seller, amount, and refund time, or restore a saved file after it opens.
                                    </p>
                                    <button className="btn primary wide" type="submit">
                                        Open this escrow
                                    </button>
                                </form>
                            ) : (
                                <form
                                    className="stack-form"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        actions.submitCreate();
                                    }}
                                >
                                    <fieldset className="party">
                                        <legend>Buyer</legend>
                                        <p className="hint">This address pays the escrow. A refund returns here.</p>
                                        <label className="field">
                                            <span>Arkade address</span>
                                            <input
                                                id="buyer"
                                                value={model.buyer}
                                                autoComplete="off"
                                                spellCheck={false}
                                                placeholder="tark1…"
                                                required
                                                onChange={(event) => actions.setField("buyer", event.target.value)}
                                            />
                                        </label>
                                    </fieldset>
                                    <fieldset className="party">
                                        <legend>Seller</legend>
                                        <p className="hint">Release pays this address.</p>
                                        <label className="field">
                                            <span>Arkade address</span>
                                            <input
                                                id="seller"
                                                value={model.seller}
                                                autoComplete="off"
                                                spellCheck={false}
                                                placeholder="tark1…"
                                                required
                                                onChange={(event) => actions.setField("seller", event.target.value)}
                                            />
                                        </label>
                                    </fieldset>
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
                                                    actions.chooseCustom();
                                                    requestAnimationFrame(() => amountRef.current?.focus());
                                                    return;
                                                }
                                                actions.chooseAmount(next);
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
                                                onChange={(event) => actions.setField("amount", event.target.value)}
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
                                            onChange={(event) => actions.setField("timeout", event.target.value)}
                                        />
                                    </label>
                                    <p className="hint">You can refund the buyer after this time.</p>
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
                            />

                            {model.torn ? (
                                <p className="hint">Release and refund stay off until these details match this address.</p>
                            ) : (
                                <div className="payout">
                                    <h2>Pay out</h2>
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
                            <Accordion.Root className="more">
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
                                            <small>Buyer, seller, and oracle</small>
                                        </Accordion.Trigger>
                                    </Accordion.Header>
                                    <Accordion.Panel className="more-panel">
                                        <div className="group">
                                            <AddressRow label="Buyer" value={model.keyBuyer} />
                                            <AddressRow label="Seller" value={model.keySeller} />
                                            <AddressRow label="Oracle" value={model.oracle} />
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
                        </Dialog.Popup>
                    </Dialog.Viewport>
                </Dialog.Portal>
            </Dialog.Root>

            <Toaster position="bottom-center" toastOptions={{ duration: 3200 }} />
        </div>
    );
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

function AddressRow({ label, value, href }: { label: string; value: string; href?: string }) {
    return (
        <div className={href ? "row funding-row" : "row"}>
            <span className="row-label">{label}</span>
            <span className="row-value">
                <span className="addr">{value ? shortAddress(value) : "Not set"}</span>
                {value ? <CopyButton value={value} /> : null}
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

function CopyButton({ value }: { value: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            className="copy"
            type="button"
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
    if (status === "Parameters differ") return "bad";
    return "";
}
