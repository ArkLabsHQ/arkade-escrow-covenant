import { arkade } from "@arkade-os/sdk";

import artifact from "../../contracts/escrow.artifact.json" with { type: "json" };

/**
 * The program the page spends.
 *
 * `contracts/escrow.artifact.json` is the `arkadec` output of `contracts/escrow.ark`.
 * `older(exit)` is compiled as a block CSV, and `programFromArtifact` keeps that.
 * Public arkd rejects a block-type exit leaf, so the spent program sets the BIP68
 * seconds bit on the same `$exit` integer. Nothing else in the artifact is edited.
 */
export function escrowProgram(): ReturnType<typeof arkade.programFromArtifact> {
    const program = arkade.programFromArtifact(artifact as arkade.ContractArtifact);
    const unilateral = program.functions.unilateral;
    const csv = unilateral?.tapscript?.csv;
    if (!unilateral?.tapscript || csv?.type !== "blocks" || csv.value !== "$exit") {
        throw new Error("unilateral leaf is not the block CSV arkadec emits for older(exit)");
    }
    return {
        ...program,
        functions: {
            ...program.functions,
            unilateral: {
                ...unilateral,
                tapscript: {
                    ...unilateral.tapscript,
                    csv: { type: "seconds", value: csv.value },
                },
            },
        },
    };
}
