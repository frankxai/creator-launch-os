#!/usr/bin/env node
/**
 * Validate a Storefront.v1 config.
 *
 *   node bin/validate-storefront.mjs                        # validates storefront.config.json
 *   node bin/validate-storefront.mjs path/to/config.json
 *   node bin/validate-storefront.mjs --json                 # machine-readable report
 *
 * Exit code 0 when the config is valid, 1 when it is not.
 */

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import process from "node:process"

import { validateStorefront } from "../lib/storefront/schema.mjs"

const argv = process.argv.slice(2)
const asJson = argv.includes("--json")
const target = argv.find((argument) => !argument.startsWith("--")) ?? "storefront.config.json"
const path = resolve(process.cwd(), target)

function fail(message) {
  if (asJson) {
    process.stdout.write(`${JSON.stringify({ ok: false, path, errors: [{ code: "E_UNREADABLE", path: target, message }], warnings: [] }, null, 2)}\n`)
  } else {
    process.stderr.write(`Storefront.v1 — cannot read ${target}\n  ${message}\n`)
  }
  process.exit(1)
}

let config
try {
  config = JSON.parse(readFileSync(path, "utf8"))
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}

const report = validateStorefront(config)

if (asJson) {
  process.stdout.write(`${JSON.stringify({ ...report, path }, null, 2)}\n`)
  process.exit(report.ok ? 0 : 1)
}

const line = (entry) => `  ${entry.code.padEnd(28)} ${entry.path}\n      ${entry.message}\n`

if (report.errors.length > 0) {
  process.stderr.write(`Storefront.v1 — ${report.errors.length} error${report.errors.length === 1 ? "" : "s"} in ${target}\n\n`)
  for (const entry of report.errors) process.stderr.write(line(entry))
}

if (report.warnings.length > 0) {
  const stream = report.ok ? process.stdout : process.stderr
  stream.write(`\nStorefront.v1 — ${report.warnings.length} warning${report.warnings.length === 1 ? "" : "s"}\n\n`)
  for (const entry of report.warnings) stream.write(line(entry))
}

if (report.ok) {
  const productCount = config.releases.reduce((total, release) => total + release.products.length, 0)
  const forSale = config.releases
    .flatMap((release) => release.products)
    .filter((product) => product.price && product.checkoutHandoff.rail !== "none").length

  process.stdout.write(
    `\nStorefront.v1 valid — ${config.releases.length} release${config.releases.length === 1 ? "" : "s"}, ` +
      `${productCount} product${productCount === 1 ? "" : "s"}, ${forSale} for sale, ` +
      `${config.campaigns.length} campaign${config.campaigns.length === 1 ? "" : "s"}, ` +
      `${config.studioMetrics.length} studio metric${config.studioMetrics.length === 1 ? "" : "s"}.\n`,
  )
  process.exit(0)
}

process.exit(1)
