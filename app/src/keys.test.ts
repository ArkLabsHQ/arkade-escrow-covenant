import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { bech32 } from "@scure/base";

import { escrowsFromBackup, parseEscrowList, secretToKey, storedKeysFromText, upsertEscrow } from "./spend.ts";

const hex = (fill: string) => fill.repeat(64).slice(0, 64);

describe("storedKeysFromText", () => {
    it("reads the three secret keys", () => {
        const stored = storedKeysFromText(
            JSON.stringify({
                buyer: hex("ab"),
                seller: hex("cd"),
                oracle: hex("ef").toUpperCase(),
            }),
        );
        assert.equal(stored.oracle, hex("ef"));
        assert.equal(stored.buyer, hex("ab"));
        assert.equal(stored.seller, hex("cd"));
    });

    it("derives the mutinynet BIP86 key from a 12-word mnemonic", async () => {
        const phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        const key = secretToKey(phrase);
        const mainnet = secretToKey(phrase, { mainnet: true });
        assert.equal((await key.xOnlyPublicKey()).length, 32);
        assert.notEqual(key.toHex(), mainnet.toHex());
        assert.equal(secretToKey(phrase).toHex(), key.toHex());
    });

    it("rejects words that are not a mnemonic", () => {
        assert.throws(() => secretToKey("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon"), /not a valid BIP39 phrase/);
    });

    it("reads an nsec back into the same key", async () => {
        const raw = new Uint8Array(32).fill(7);
        const nsec = bech32.encode("nsec", bech32.toWords(raw));
        const key = secretToKey(nsec);
        assert.equal(key.toHex(), Buffer.from(raw).toString("hex"));
        assert.equal((await key.xOnlyPublicKey()).length, 32);
    });

    it("keeps reading keys when the file also lists escrows", () => {
        const stored = storedKeysFromText(
            JSON.stringify({
                buyer: hex("ab"),
                seller: hex("cd"),
                oracle: hex("ef"),
                escrows: [{ address: "tark1example" }],
            }),
        );
        assert.equal(stored.buyer, hex("ab"));
    });

    it("rejects a key that is not 32 bytes", () => {
        assert.throws(
            () => storedKeysFromText(JSON.stringify({ buyer: "aa", seller: hex("cd"), oracle: hex("ef") })),
            /buyer key must be 64 hex characters/,
        );
    });
});

const escrow = {
    address: "tark1qqexample",
    network: "mutinynet" as const,
    buyer: "tark1buyer",
    seller: "tark1seller",
    amount: "5000",
    timeout: "2026-09-23T18:00",
    exit: "2048",
};

describe("saved escrows", () => {
    it("keeps one record per address, newest first", () => {
        const updated = upsertEscrow([escrow], { ...escrow, amount: "9000" });
        assert.equal(updated.length, 1);
        assert.equal(updated[0]?.amount, "9000");
    });

    it("drops a record that cannot rebuild an address", () => {
        const parsed = parseEscrowList([escrow, { address: "tark1only" }, null]);
        assert.deepEqual(parsed, [escrow]);
    });

    it("reads escrows from a key backup and ignores a file without them", () => {
        assert.deepEqual(escrowsFromBackup(JSON.stringify({ escrows: [escrow] })), [escrow]);
        assert.deepEqual(escrowsFromBackup(JSON.stringify({ buyer: hex("ab") })), []);
        assert.deepEqual(escrowsFromBackup("not json"), []);
    });
});
