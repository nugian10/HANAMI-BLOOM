#!/usr/bin/env node
/**
 * HANAMI BLOOM — rarity bitmap generator.
 *
 * Builds the on-chain rarity bitmap from the published deck
 * (scripts/deck.json, compact JSON array of rarity codes
 * 0=Common, 1=Rare, 2=Epic, 3=Legendary; token N rarity =
 * deck[N-1]) and verifies it against the deck for all 3,333
 * tokens.
 *
 * Bitmap layout (2 bits per token, token IDs 1..3333):
 *   word w (0..26) holds token IDs w*128+1 .. w*128+128
 *   token t -> word (t-1)//128, bit offset ((t-1)%128)*2
 *   rarity codes: 0=Common, 1=Rare, 2=Epic, 3=Legendary
 *   3333 tokens -> 6666 bits -> 27 uint256 words.
 *
 * Output:
 *   collection/rarity-bitmap.json  { deckHash, bitmap: [27 hex uint256] }
 *
 * Usage:
 *   node scripts/generate-bitmap.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const PROJECT = path.join(__dirname, "..", "..");
const DECK_PATH = path.join(PROJECT, "scripts", "deck.json");
const MANIFEST_PATH = path.join(PROJECT, "collection", "collection.json");
const OUT_PATH = path.join(PROJECT, "collection", "rarity-bitmap.json");

const MAX_SUPPLY = 3333;
const WORDS = 27;
const EXPECTED_COUNTS = { 0: 2000, 1: 1000, 2: 300, 3: 33 };

function main() {
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, "utf8"));
  if (!Array.isArray(deck) || deck.length !== MAX_SUPPLY) {
    throw new Error(`deck must be an array of ${MAX_SUPPLY}, got ${deck.length}`);
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const deckHash = manifest.deckHash;

  const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const code of deck) {
    if (!Number.isInteger(code) || code < 0 || code > 3) {
      throw new Error(`invalid rarity code in deck: ${code}`);
    }
    counts[code]++;
  }
  console.log(`rarity counts: ${JSON.stringify(counts)}`);
  for (const [code, n] of Object.entries(EXPECTED_COUNTS)) {
    if (counts[code] !== n) {
      throw new Error(`count mismatch for rarity ${code}: got ${counts[code]}, expected ${n}`);
    }
  }

  const words = new Array(WORDS).fill(0n);
  for (let t = 1; t <= MAX_SUPPLY; t++) {
    const code = BigInt(deck[t - 1]);
    const idx = Math.floor((t - 1) / 128);
    const off = BigInt(((t - 1) % 128) * 2);
    words[idx] |= code << off;
  }

  // Round-trip verification: bitmap must reproduce the deck
  // for every single token.
  function bitmapRarity(tokenId) {
    const idx = Math.floor((tokenId - 1) / 128);
    const off = BigInt(((tokenId - 1) % 128) * 2);
    return Number((words[idx] >> off) & 3n);
  }
  for (let t = 1; t <= MAX_SUPPLY; t++) {
    if (bitmapRarity(t) !== deck[t - 1]) {
      throw new Error(`bitmap mismatch at token ${t}`);
    }
  }
  console.log(`bitmap verified against deck for all ${MAX_SUPPLY} tokens`);

  const out = {
    project: "HANAMI BLOOM",
    deckHash,
    words: WORDS,
    encoding:
      "2 bits per token, tokenId 1..3333, word (t-1)//128, offset ((t-1)%128)*2, codes 0=Common 1=Rare 2=Epic 3=Legendary",
    bitmap: words.map((w) => "0x" + w.toString(16).padStart(64, "0")),
  };
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`wrote ${OUT_PATH} (${WORDS} words)`);
}

main();
