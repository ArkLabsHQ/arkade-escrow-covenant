import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { storedKeysFromText } from "./spend.ts";

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

    it("rejects a key that is not 32 bytes", () => {
        assert.throws(
            () => storedKeysFromText(JSON.stringify({ buyer: "aa", seller: hex("cd"), oracle: hex("ef") })),
            /buyer key must be 64 hex characters/,
        );
    });
});
