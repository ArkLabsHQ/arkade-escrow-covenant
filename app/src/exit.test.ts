import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { base64 } from "@scure/base";
import { arkade, buildOffchainTx, CSVMultisigTapscript } from "@arkade-os/sdk";

import { escrowProgram } from "./program.ts";
import {
    closedSpend,
    covenantLeafMarks,
    describeExitClock,
    escrowView,
    exitAnchor,
    exitOpensAt,
    matchSpendLeaf,
    tapLeavesFromVirtualTx,
} from "./spend.ts";

describe("escrowView", () => {
    it("does not offer a refund while the escrow is still waiting for funds", () => {
        const view = escrowView({ coins: 0, unrolled: false, refundDue: true, when: "Sep 24" });
        assert.equal(view.status, "Waiting for funds");
        assert.equal(view.refundNow, false);
        assert.equal(view.refund, "Refund stays off until the sats arrive.");
    });

    it("opens a refund only after funds arrive and the time has passed", () => {
        const waiting = escrowView({ coins: 1, unrolled: false, refundDue: false, when: "Sep 24" });
        assert.equal(waiting.status, "Funded");
        assert.equal(waiting.refundNow, false);
        assert.equal(waiting.release, true);
        const open = escrowView({ coins: 1, unrolled: false, refundDue: true, when: "Sep 24" });
        assert.equal(open.status, "Refund open");
        assert.equal(open.refund, "You can refund the buyer now.");
    });

    it("turns release and refund off once the escrow is on Bitcoin", () => {
        const view = escrowView({ coins: 1, unrolled: true, refundDue: true, when: "Sep 24" });
        assert.equal(view.status, "On Bitcoin");
        assert.equal(view.release, false);
        assert.equal(view.refundNow, false);
        assert.equal(view.refund, "Release and refund stay off.");
    });

    it("keeps a cancel spend closed as refunded", () => {
        const view = escrowView({ coins: 0, unrolled: false, refundDue: true, when: "Sep 24", closed: "cancel" });
        assert.equal(view.status, "Refunded to the buyer");
        assert.equal(view.release, false);
        assert.equal(view.refundNow, false);
        assert.equal(view.refund, "Release and refund stay off.");
        assert.notEqual(view.status, "Waiting for funds");
    });

    it("keeps a complete spend closed as released", () => {
        const view = escrowView({ coins: 0, unrolled: false, refundDue: false, when: "Sep 24", closed: "complete" });
        assert.equal(view.status, "Released to the seller");
        assert.equal(view.release, false);
        assert.equal(view.refundNow, false);
        assert.equal(view.refund, "Release and refund stay off.");
    });

    it("does not treat an unrecognized spend as waiting for funds", () => {
        const view = escrowView({ coins: 0, unrolled: false, refundDue: true, when: "Sep 24", closed: "unknown" });
        assert.equal(view.status, "Closed");
        assert.equal(view.release, false);
        assert.equal(view.refundNow, false);
    });
});

describe("spend leaf", () => {
    const key = (fill: number) => new Uint8Array(32).fill(fill);
    const emulatorKey = new Uint8Array(33);
    emulatorKey[0] = 0x02;
    emulatorKey.set(key(9), 1);
    const args = {
        partyAPk: key(1),
        partyBPk: key(2),
        oraclePk: key(3),
        oracleMessageHash: key(4),
        partyAScript: key(5),
        partyBScript: key(6),
        amount: 10_000n,
        timeoutAt: 1_700_000_000n,
    };
    const compiled = new arkade.ArkadeProgramScript(
        escrowProgram(),
        { ...args, exit: 2048n, server: key(7) },
        { serverKey: key(7), emulatorKey },
    );
    const marks = covenantLeafMarks(emulatorKey, args);
    const checkpoint = CSVMultisigTapscript.encode({
        timelock: { type: "seconds", value: 512n },
        pubkeys: [key(8)],
    });

    function leavesFor(name: "cancel" | "complete"): Uint8Array[] {
        const fn = compiled.functionByName(name);
        if (!fn) throw new Error(`missing ${name}`);
        const built = buildOffchainTx(
            [
                {
                    txid: "ab".repeat(32),
                    vout: 0,
                    value: 10_000,
                    tapLeafScript: fn.tapLeafScript,
                    tapTree: compiled.encode(),
                },
            ],
            [{ script: compiled.pkScript, amount: 10_000n }],
            checkpoint,
        );
        return tapLeavesFromVirtualTx(base64.encode(built.checkpoints[0].toPSBT()));
    }

    it("reads the cancel tapleaf from the checkpoint that spent the vtxo", () => {
        const leaves = leavesFor("cancel");
        assert.equal(matchSpendLeaf(leaves, marks), "cancel");
        assert.equal(closedSpend(["cancel"]), "cancel");
        assert.equal(matchSpendLeaf(leaves, [{ name: "complete", leaf: compiled.functionByName("complete")?.leafScript }]), null);
    });

    it("reads the complete tapleaf as a release", () => {
        const leaves = leavesFor("complete");
        assert.equal(matchSpendLeaf(leaves, marks), "complete");
        assert.equal(closedSpend(["complete", null]), "complete");
        assert.equal(closedSpend(["cancel", "complete"]), "unknown");
    });

    it("reads the unilateral leaf from OP_CHECKSEQUENCEVERIFY", () => {
        const fn = compiled.functionByName("unilateral");
        if (!fn) throw new Error("missing unilateral");
        assert.equal(matchSpendLeaf([fn.leafScript], marks), "unilateral");
        assert.equal(closedSpend(["unilateral"]), "unilateral");
        const buried = Uint8Array.from([0x03, 0xb2, 0xac, 0x75, 0xac]);
        assert.equal(matchSpendLeaf([buried], []), null);
        const view = escrowView({
            coins: 0,
            unrolled: false,
            refundDue: true,
            when: "Sep 24",
            closed: "unilateral",
        });
        assert.equal(view.status, "Unilateral exit");
        assert.equal(view.release, false);
        assert.equal(view.refundNow, false);
    });
});

describe("exitAnchor", () => {
    it("uses the funding transaction, including while it is still offchain", () => {
        const txid = "2ee486d9fe9ab3a3c09192fb2f76029aa06b89d60139fbe639e976571560e510";
        assert.deepEqual(exitAnchor({ txid, isUnrolled: false }), { txid, unrolled: false });
    });

    it("keeps the same transaction after it is unrolled", () => {
        assert.deepEqual(exitAnchor({ txid: "bb".repeat(32), isUnrolled: true }), {
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

    it("does not start the clock before the funding transaction is unrolled", () => {
        const funding = "2ee486d9fe9ab3a3c09192fb2f76029aa06b89d60139fbe639e976571560e510";
        const described = describeExitClock({ txid: funding, minedAt: null, exitSeconds: 2048n, now: minedAt });
        assert.equal(described.open, false);
        assert.match(described.text, /Unroll it/);
    });
});
