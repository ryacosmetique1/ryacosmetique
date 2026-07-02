#!/usr/bin/env node
/**
 * Seed helper — POST /api/public/seed against a deployed environment.
 * Usage:
 *   SEED_SECRET=... SEED_URL=https://rya-cosmetique.lovable.app/api/public/seed node scripts/seed.mjs
 */
const url = process.env.SEED_URL;
const secret = process.env.SEED_SECRET;
if (!url || !secret) {
  console.error("Missing SEED_URL or SEED_SECRET");
  process.exit(1);
}
const res = await fetch(url, {
  method: "POST",
  headers: { "content-type": "application/json", "x-seed-secret": secret },
  body: "{}",
});
const text = await res.text();
console.log(res.status, text);
if (!res.ok) process.exit(1);
