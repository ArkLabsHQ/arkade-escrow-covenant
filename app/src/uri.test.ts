import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { bip321FundingUri } from "./spend.ts";

const address = `ark1${"q".repeat(58)}`;

describe("bip321FundingUri", () => {
    it("builds a satoshi BIP321 URI and keeps the full address", () => {
        assert.equal(bip321FundingUri(address, "1234"), `bitcoin:?ark=${address}&amount=1234`);
        assert.equal(bip321FundingUri(`  ${address}  `, 1234), `bitcoin:?ark=${address}&amount=1234`);
        assert.equal(bip321FundingUri(`tark1${"p".repeat(20)}`, 1234n), `bitcoin:?ark=tark1${"p".repeat(20)}&amount=1234`);
    });

    it("percent-encodes the address and the amount", () => {
        assert.equal(
            bip321FundingUri("ark1qq a&b=c?", "1000"),
            "bitcoin:?ark=ark1qq%20a%26b%3Dc%3F&amount=1000",
        );
        assert.equal(bip321FundingUri(address, "0001234"), `bitcoin:?ark=${address}&amount=1234`);
    });

    it("does not convert the amount to BTC or add other query params", () => {
        const uri = bip321FundingUri(address, "100000000");
        assert.equal(uri, `bitcoin:?ark=${address}&amount=100000000`);
        assert.equal(new URL(uri).searchParams.get("ark"), address);
        assert.equal(new URL(uri).searchParams.get("amount"), "100000000");
        assert.deepEqual([...new URL(uri).searchParams.keys()], ["ark", "amount"]);
    });

    it("returns nothing when the address or amount cannot be a pay link", () => {
        assert.equal(bip321FundingUri("  ", "1234"), "");
        assert.equal(bip321FundingUri(address, ""), "");
        assert.equal(bip321FundingUri(address, "1.5"), "");
        assert.equal(bip321FundingUri(address, -1), "");
        assert.equal(bip321FundingUri(address, -1n), "");
    });
});
