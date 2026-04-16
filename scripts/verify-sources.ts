#!/usr/bin/env npx tsx
/**
 * Script de vérification live de toutes les sources du registre africain.
 *
 * Usage :
 *   npx tsx scripts/verify-sources.ts
 *
 * Vérifie :
 *   - RSS : HTTP 200 + XML valide + date du dernier item
 *   - HTML : HTTP 200 + au moins 1 URL d'article trouvée
 *
 * Affiche un tableau récapitulatif avec statut par source.
 */
import { AFRICAN_SOURCES } from "../lib/scrapers/african-sources";
import Parser from "rss-parser";

const parser = new Parser({ timeout: 15000 });

interface SourceCheck {
  id: string;
  source: string;
  country: string;
  mode: string;
  status: "OK" | "STALE" | "DEAD" | "ERROR";
  detail: string;
}

async function checkRSS(url: string): Promise<{ ok: boolean; detail: string }> {
  try {
    const feed = await parser.parseURL(url);
    const items = feed.items || [];
    if (items.length === 0) return { ok: false, detail: "0 items" };
    const latest = items[0]?.isoDate || items[0]?.pubDate || "";
    if (latest) {
      const age = Date.now() - new Date(latest).getTime();
      const days = Math.floor(age / (1000 * 60 * 60 * 24));
      if (days > 90) return { ok: false, detail: `stale: dernier item il y a ${days}j` };
      return { ok: true, detail: `${items.length} items, dernier: ${days}j ago` };
    }
    return { ok: true, detail: `${items.length} items (pas de date)` };
  } catch (err) {
    return { ok: false, detail: String(err).slice(0, 80) };
  }
}

async function checkHTML(
  listingUrl: string,
  pattern: string
): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(listingUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    const html = await res.text();
    const regex = new RegExp(pattern, "g");
    const matches = html.match(regex) || [];
    if (matches.length === 0) return { ok: false, detail: "0 article URLs trouvées" };
    return { ok: true, detail: `${matches.length} article URLs` };
  } catch (err) {
    return { ok: false, detail: String(err).slice(0, 80) };
  }
}

async function main() {
  console.log(`\n🔍 Vérification de ${AFRICAN_SOURCES.length} sources...\n`);
  const results: SourceCheck[] = [];

  for (const src of AFRICAN_SOURCES) {
    const mode = src.fetchMode === "html" ? "HTML" : "RSS";
    process.stdout.write(`  ${src.id.padEnd(30)} [${mode}] ... `);

    let check: { ok: boolean; detail: string };
    if (src.fetchMode === "html" && src.htmlConfig) {
      check = await checkHTML(src.htmlConfig.listingUrl, src.htmlConfig.articleUrlPattern);
    } else {
      check = await checkRSS(src.rssUrl);
    }

    const status = check.ok ? "OK" : check.detail.includes("stale") ? "STALE" : "DEAD";
    const icon = status === "OK" ? "✅" : status === "STALE" ? "⚠️" : "❌";
    console.log(`${icon} ${check.detail}`);
    results.push({ id: src.id, source: src.source, country: src.country, mode, status, detail: check.detail });
  }

  // Résumé
  const ok = results.filter((r) => r.status === "OK").length;
  const stale = results.filter((r) => r.status === "STALE").length;
  const dead = results.filter((r) => r.status === "DEAD" || r.status === "ERROR").length;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ ${ok} OK  |  ⚠️ ${stale} STALE  |  ❌ ${dead} DEAD  |  Total: ${results.length}`);
  console.log(`${"=".repeat(60)}\n`);

  if (dead > 0) {
    console.log("Sources mortes à retirer ou remplacer :");
    results.filter((r) => r.status === "DEAD" || r.status === "ERROR").forEach((r) => {
      console.log(`  ❌ ${r.id} (${r.country}) — ${r.detail}`);
    });
    console.log();
  }

  process.exit(dead > 0 ? 1 : 0);
}

main();
