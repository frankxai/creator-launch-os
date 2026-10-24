import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { gzipSync } from "node:zlib"

export const BUDGETS = {
  kitPageOnlyJsGzipKb: 15,
  kitNonRootJsGzipKb: 65,
  kitTotalJsGzipKb: 195,
  kitHtmlGzipKb: 25,
  mobileLcpMs: 2500,
  maxCls: 0.1,
}

export function measureBuildBudget(rootDir = process.cwd()) {
  const nextDir = resolve(rootDir, ".next")
  const buildManifestPath = resolve(nextDir, "build-manifest.json")
  const kitHtmlPath = resolve(nextDir, "server/app/kit.html")
  const notFoundHtmlPath = resolve(nextDir, "server/app/_not-found.html")
  if (!existsSync(buildManifestPath) || !existsSync(kitHtmlPath)) {
    throw new Error("Run `pnpm run build` before `pnpm run check:perf` (.next/server/app/kit.html not found)")
  }

  const buildManifest = JSON.parse(readFileSync(buildManifestPath, "utf8"))
  const rootMainSet = new Set(buildManifest.rootMainFiles ?? [])
  const sharedLayoutSet = new Set(
    existsSync(notFoundHtmlPath)
      ? Array.from(readFileSync(notFoundHtmlPath, "utf8").matchAll(/\/_next\/(static\/chunks\/[^"'\s>]+\.js)/g), (m) => m[1])
      : [],
  )

  const kitHtml = readFileSync(kitHtmlPath)
  const kitHtmlText = kitHtml.toString("utf8")
  const kitHtmlGzipKb = Number((gzipSync(kitHtml).length / 1024).toFixed(2))

  const scriptMatches = [...new Set(Array.from(kitHtmlText.matchAll(/\/_next\/(static\/chunks\/[^"'\s>]+\.js)/g), (m) => m[1]))].sort()

  let totalRawBytes = 0
  let totalGzipBytes = 0
  let nonRootRawBytes = 0
  let nonRootGzipBytes = 0
  let pageOnlyRawBytes = 0
  let pageOnlyGzipBytes = 0

  for (const rel of scriptMatches) {
    const bytes = readFileSync(resolve(nextDir, rel))
    const gz = gzipSync(bytes).length
    totalRawBytes += bytes.length
    totalGzipBytes += gz
    if (!rootMainSet.has(rel)) {
      nonRootRawBytes += bytes.length
      nonRootGzipBytes += gz
    }
    if (!rootMainSet.has(rel) && !sharedLayoutSet.has(rel)) {
      pageOnlyRawBytes += bytes.length
      pageOnlyGzipBytes += gz
    }
  }

  const metrics = {
    chunkCount: scriptMatches.length,
    kitPageOnlyJsRawKb: Number((pageOnlyRawBytes / 1024).toFixed(2)),
    kitPageOnlyJsGzipKb: Number((pageOnlyGzipBytes / 1024).toFixed(2)),
    kitNonRootJsRawKb: Number((nonRootRawBytes / 1024).toFixed(2)),
    kitNonRootJsGzipKb: Number((nonRootGzipBytes / 1024).toFixed(2)),
    kitTotalJsRawKb: Number((totalRawBytes / 1024).toFixed(2)),
    kitTotalJsGzipKb: Number((totalGzipBytes / 1024).toFixed(2)),
    kitHtmlGzipKb,
    budgets: BUDGETS,
  }

  if (metrics.kitPageOnlyJsGzipKb > BUDGETS.kitPageOnlyJsGzipKb) {
    throw new Error(`/kit page-specific JS (${metrics.kitPageOnlyJsGzipKb} kB gzip) exceeds ${BUDGETS.kitPageOnlyJsGzipKb} kB budget`)
  }
  if (metrics.kitNonRootJsGzipKb > BUDGETS.kitNonRootJsGzipKb) {
    throw new Error(`/kit non-root JS (${metrics.kitNonRootJsGzipKb} kB gzip) exceeds ${BUDGETS.kitNonRootJsGzipKb} kB budget`)
  }
  if (metrics.kitTotalJsGzipKb > BUDGETS.kitTotalJsGzipKb) {
    throw new Error(`/kit total first-load JS (${metrics.kitTotalJsGzipKb} kB gzip) exceeds ${BUDGETS.kitTotalJsGzipKb} kB budget`)
  }
  if (metrics.kitHtmlGzipKb > BUDGETS.kitHtmlGzipKb) {
    throw new Error(`/kit HTML (${metrics.kitHtmlGzipKb} kB gzip) exceeds ${BUDGETS.kitHtmlGzipKb} kB budget`)
  }

  return metrics
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const m = measureBuildBudget()
  console.log(
    `Performance budget verified: /kit page JS = ${m.kitPageOnlyJsGzipKb} kB gzip (${m.kitPageOnlyJsRawKb} kB raw, budget <= ${BUDGETS.kitPageOnlyJsGzipKb} kB), /kit non-root JS = ${m.kitNonRootJsGzipKb} kB gzip (budget <= ${BUDGETS.kitNonRootJsGzipKb} kB), /kit total JS = ${m.kitTotalJsGzipKb} kB gzip (${m.kitTotalJsRawKb} kB raw, budget <= ${BUDGETS.kitTotalJsGzipKb} kB), /kit HTML = ${m.kitHtmlGzipKb} kB gzip (budget <= ${BUDGETS.kitHtmlGzipKb} kB)`,
  )
}
