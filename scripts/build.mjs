import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

await esbuild.build({
    entryPoints: [path.join(root, "app/src/main.tsx")],
    bundle: true,
    format: "esm",
    outfile: path.join(dist, "app.js"),
    platform: "browser",
    target: "es2022",
    jsx: "automatic",
    sourcemap: true,
    logLevel: "info",
});

mkdirSync(dist, { recursive: true });
cpSync(path.join(root, "app/index.html"), path.join(dist, "index.html"));
writeFileSync(path.join(dist, ".nojekyll"), "");
