import { existsSync, readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")

/** Flat `a.b: value` view of the scalar keys in a simple block-style YAML file. */
export function scalars(yaml) {
  const out = {}
  const stack = []
  for (const line of yaml.split("\n")) {
    const match = /^( *)([A-Za-z0-9_]+):(?: (.*))?$/.exec(line)
    if (!match) continue
    const [, indent, key, raw = ""] = match
    while (stack.length && stack.at(-1).indent >= indent.length) stack.pop()
    const path = [...stack.map((entry) => entry.key), key].join(".")
    if (raw === "") stack.push({ indent: indent.length, key })
    else out[path] = raw.trim().replace(/^"(.*)"$/, "$1")
  }
  return out
}

/**
 * offer.facts.json is the one set of facts. The product manifest, listing
 * manifest, template manifest and package version may restate them but never drift.
 */
export function checkOfferFacts(root = ROOT) {
  const read = (path) => readFileSync(resolve(root, path), "utf8")
  const facts = JSON.parse(read("offer.facts.json"))
  const product = scalars(read("product.manifest.yaml"))
  const listing = scalars(read("marketplace.listing.yaml"))
  const template = JSON.parse(read("template.manifest.json"))
  const pkg = JSON.parse(read("package.json"))
  const expectations = [
    ["product.manifest.yaml product_id", product.product_id, facts.product_id],
    ["product.manifest.yaml sku_id", product.sku_id, facts.sku_id],
    ["product.manifest.yaml brand_id", product.brand_id, facts.brand_id],
    ["product.manifest.yaml name", product.name, facts.title],
    ["product.manifest.yaml version", product.version, facts.version],
    ["product.manifest.yaml commercial.price_state", product["commercial.price_state"], facts.price.state],
    ["product.manifest.yaml commercial.merchant", product["commercial.merchant"], facts.merchant.state],
    ["product.manifest.yaml activation_event", product.activation_event, facts.activation_event.core],
    ["product.manifest.yaml kit_activation_event", product.kit_activation_event, facts.activation_event.kit],
    ["product.manifest.yaml offer_facts", product.offer_facts, "offer.facts.json"],
    ["marketplace.listing.yaml offer_facts", listing.offer_facts, "offer.facts.json"],
    ["marketplace.listing.yaml product_id", listing.product_id, facts.product_id],
    ["marketplace.listing.yaml sku_id", listing.sku_id, facts.sku_id],
    ["marketplace.listing.yaml title", listing.title, facts.title],
    ["marketplace.listing.yaml version", listing.version, facts.version],
    ["marketplace.listing.yaml short_description", listing.short_description, facts.promise],
    ["marketplace.listing.yaml price_state", listing.price_state, `free_core_paid_extension_${facts.price.state}`],
    ["marketplace.listing.yaml support_url", listing.support_url, facts.support.free_core_channel],
    ["template.manifest.json name", template.name, facts.title],
    ["template.manifest.json version", template.version, facts.version],
    ["template.manifest.json license", template.license, facts.core.license],
    ["package.json version", pkg.version, facts.version],
    ["package.json license", pkg.license, facts.core.license],
  ]
  const drift = expectations
    .filter(([, actual, expected]) => actual !== expected)
    .map(([where, actual, expected]) => `${where}: ${JSON.stringify(actual)} ≠ offer.facts.json ${JSON.stringify(expected)}`)
  if (facts.price.state !== "locked" && facts.price.amount !== null) {
    drift.push("offer.facts.json price.amount must stay null until price.state is locked")
  }
  if (new URL(facts.canonical_offer_url).origin !== new URL(listing.canonical_offer_url).origin) {
    drift.push("offer.facts.json canonical_offer_url must live on the listing's canonical origin")
  }
  const cmoFactsPath = resolve(root, "docs/release/FACTS.md")
  if (existsSync(cmoFactsPath)) {
    const cmo = read("docs/release/FACTS.md")
    const relManifest = JSON.parse(read("release/package-manifest.json"))
    const kitManifestPath = resolve(root, "commercial/kit/kit.manifest.json")
    const requiredTokens = [
      `\`${facts.product_id}\``,
      `\`${facts.sku_id}\``,
      `\`${pkg.version}\``,
      `\`${pkg.dependencies.next}\``,
      `\`${facts.price.state}\` (\`amount: ${JSON.stringify(facts.price.amount)}\`)`,
      `\`${facts.refund.state}\` (\`window_days: ${facts.refund.window_days}\``,
      `\`${relManifest.files.length}\` files`,
    ]
    if (existsSync(kitManifestPath)) {
      const kitManifest = JSON.parse(read("commercial/kit/kit.manifest.json"))
      requiredTokens.push(`\`${kitManifest.files.length}\` files`)
    }
    for (const token of requiredTokens) {
      if (!cmo.includes(token)) {
        drift.push(`docs/release/FACTS.md is stale: missing ${token}`)
      }
    }
  }
  return drift
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const drift = checkOfferFacts()
  if (drift.length) {
    console.error(drift.join("\n"))
    process.exitCode = 1
  } else {
    console.log("Offer facts agree across product, listing, template and package manifests")
  }
}
