import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { describeExitClock, exitAnchor, exitOpensAt } from "./spend.ts";

describe("exitAnchor", () => {
    it("uses the commitment while the coin is still offchain", () => {
        assert.deepEqual(
            exitAnchor({
                txid: "aa".repeat(32),
                commitmentTxIds: ["d044aea8ccc651d7e9fd578f7ecbdca977f6a58350013f6104e13215b00e8f96"],
            }),
            {
                txid: "d044aea8ccc651d7e9fd578f7ecbdca977f6a58350013f6104e13215b00e8f96",
                unrolled: false,
            },
        );
    });

    it("uses the coin itself after it is unrolled", () => {
        assert.deepEqual(exitAnchor({ txid: "bb".repeat(32), isUnrolled: true, commitmentTxIds: ["cc"] }), {
            txid: "bb".repeat(32),
            unrolled: true,
        });
    });
});

describe("exitOpensAt", () => {
    it("counts the CSV from the mined Bitcoin output", () => {
        const mined = Date.parse("2026-09-23T15:39:38Z") / 1000;
        assert.equal(exitOpensAt(mined, 2048n), Date.parse("2026-09-23T16:13:46Z") / 1000);
    });
});

describe("describeExitClock", () => {
    const txid = "d044aea8ccc651d7e9fd578f7ecbdca977f6a58350013f6104e13215b00e8f96";
    const minedAt = Date.parse("2026-09-23T15:39:38Z") / 1000;

    it("stays closed until the mined output is old enough", () => {
        const described = describeExitClock({
            txid,
            minedAt,
            exitSeconds: 2048n,
            now: minedAt + 2047,
        });
        assert.equal(described.open, false);
        assert.match(described.text, /opens the exit at 2026-09-23T16:13:46Z/);
    });

    it("opens from the mine time, including a virtual coin created later", () => {
        const described = describeExitClock({
            txid,
            minedAt,
            exitSeconds: 2048n,
            now: Date.parse("2026-09-23T17:56:58Z") / 1000,
        });
        assert.equal(described.open, true);
        assert.match(described.text, /not when the virtual coin is created/);
    });

    it("does not start the clock before the output is mined", () => {
        const described = describeExitClock({ txid, minedAt: null, exitSeconds: 2048n, now: minedAt });
        assert.equal(described.open, false);
        assert.match(described.text, /not mined yet/);
    });
});
