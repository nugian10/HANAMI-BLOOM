#!/usr/bin/env node
/**
 * HANAMI BLOOM — off-chain deck verification.
 *
 * (a) keccak256 of the compact JSON deck file EXACTLY as it
 *     sits on disk (scripts/deck.json), compared with the
 *     deckHash in collection/collection.json. MUST match —
 *     if it does not, STOP: the deck changed and the
 *     contract's deckHash would commit to the wrong deck.
 * (b) Full replay of all 3,333 lazy Fisher-Yates draws in
 *     JS, mirroring HanamiBloomNFT._drawMain EXACTLY
 *     (same formulas, same order of operations):
 *       j = uint256(keccak256(deckHash, drawIndex)) % remaining
 *     Checks: every token ID drawn exactly once, rarity
 *     totals exactly Common 2000 / Rare 1000 / Epic 300 /
 *     Legendary 33.
 *
 * Usage:
 *   node scripts/verify-deck.cjs
 * (run from the contracts/ directory; uses ethers from
 * node_modules for keccak256)
 */
const fs = require("node:fs");
const path = require("node:path");
const { ethers } = require("ethers");

const PROJECT = path.join(__dirname, "..", "..");
const DECK_PATH = path.join(PROJECT, "scripts", "deck.json");
const MANIFEST_PATH = path.join(PROJECT, "collection", "collection.json");
const BITMAP_PATH = path.join(PROJECT, "collection", "rarity-bitmap.json");

const MAX_SUPPLY = 3333;
const EXPECTED_COUNTS = { 0: 2000, 1: 1000, 2: 300, 3: 33 };
const RARITY_NAME = ["Common", "Rare", "Epic", "Legendary"];

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const expectedHash = manifest.deckHash;
  console.log(`expected deckHash: ${expectedHash}`);

  // ---- (a) keccak256 of the deck file, byte-exact ----
  const raw = fs.readFileSync(DECK_PATH); // Buffer, exact bytes on disk
  const computed = ethers.keccak256(raw);
  console.log(`keccak256(deck.json bytes): ${computed}`);
  if (computed.toLowerCase() !== expectedHash.toLowerCase()) {
    console.error("DECK HASH MISMATCH — STOP. The deck file does not match collection.json deckHash.");
    process.exit(1);
  }
  console.log("deckHash MATCH ✓");

  const deck = JSON.parse(raw.toString("utf8"));
  if (deck.length !== MAX_SUPPLY) throw new Error(`deck length ${deck.length} != ${MAX_SUPPLY}`);
  const counts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  for (const code of deck) counts[code]++;
  console.log(`deck rarity counts: ${JSON.stringify(counts)}`);
  for (const [code, n] of Object.entries(EXPECTED_COUNTS)) {
    if (counts[code] !== n) throw new Error(`deck count mismatch rarity ${code}`);
  }

  // ---- bitmap check (rarityOf source for the replay) ----
  const bitmapDoc = JSON.parse(fs.readFileSync(BITMAP_PATH, "utf8"));
  if (bitmapDoc.deckHash.toLowerCase() !== expectedHash.toLowerCase()) {
    throw new Error("bitmap deckHash != manifest deckHash — STOP.");
  }
  if (bitmapDoc.bitmap.length !== 27) {
    throw new Error(`rarity bitmap must have 27 words, got ${bitmapDoc.bitmap.length}`);
  }
  const words = bitmapDoc.bitmap.map((w) => BigInt(w));
  function rarityOf(tokenId) {
    const word = words[Math.floor((tokenId - 1) / 128)];
    const off = BigInt(((tokenId - 1) % 128) * 2);
    return Number((word >> off) & 3n);
  }
  for (let t = 1; t <= MAX_SUPPLY; t++) {
    if (rarityOf(t) !== deck[t - 1]) throw new Error(`bitmap mismatch at token ${t}`);
  }
  console.log("bitmap matches deck for all 3333 tokens ✓");

  // ---- (b) full Fisher-Yates replay, mirroring _drawMain ----
  let remaining = MAX_SUPPLY;
  let drawIndex = 0;
  const swapped = new Map();
  const drawn = new Set();
  const drawnByRarity = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const valueAt = (i) => (swapped.has(i) ? swapped.get(i) : i + 1);

  for (let d = 0; d < MAX_SUPPLY; d++) {
    const j = Number(
      BigInt(
        ethers.solidityPackedKeccak256(["bytes32", "uint256"], [expectedHash, drawIndex])
      ) % BigInt(remaining)
    );
    drawIndex++;
    const tokenId = valueAt(j);
    const last = valueAt(remaining - 1);
    if (j !== remaining - 1) swapped.set(j, last);
    remaining--;
    if (drawn.has(tokenId)) throw new Error(`DUPLICATE token ${tokenId} at draw ${d + 1}`);
    drawn.add(tokenId);
    drawnByRarity[rarityOf(tokenId)]++;
  }
  if (remaining !== 0) throw new Error("replay ended with pool not empty");
  console.log(
    `replay: ${drawn.size} unique tokens drawn, remaining=${remaining}, ` +
      `by rarity: Common ${drawnByRarity[0]} / Rare ${drawnByRarity[1]} / ` +
      `Epic ${drawnByRarity[2]} / Legendary ${drawnByRarity[3]}`
  );
  for (const [code, n] of Object.entries(EXPECTED_COUNTS)) {
    if (drawnByRarity[code] !== n) {
      throw new Error(`replay rarity mismatch ${RARITY_NAME[code]}: got ${drawnByRarity[code]}, expected ${n}`);
    }
  }
  console.log("REPLAY OK: all 3333 tokens unique, rarity totals exact (2000/1000/300/33) ✓");
  console.log("ALL DECK CHECKS PASSED");
}

main();
