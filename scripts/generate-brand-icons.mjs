#!/usr/bin/env node
/** @deprecated Use scripts/build-brand-logo.mjs */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "build-brand-logo.mjs");
const child = spawn(process.execPath, [script], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
