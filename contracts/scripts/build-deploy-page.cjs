#!/usr/bin/env node
// HANAMI BLOOM — build the standalone owner deploy page.
// Reads the compiled artifacts + rarity bitmap and injects them into
// scripts/deploy.template.html, writing ../site/deploy.html.
// No secrets, no network, no deploy — pure file generation.
// Run: node scripts/build-deploy-page.cjs
//
// v3 flow: the new HanamiBloomNFTv3 (free 1,000, then paid) + HanamiMarket.
// The $HANA token is REUSED (live address below) — never redeployed, so
// only its ABI is embedded (for reads + setMinter), not its bytecode.
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const ART = path.join(ROOT, "artifacts");
const SITE = path.join(ROOT, "..", "site");

const OWNER = "0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097";
const REVENUE = "0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7";
const REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F";
const BASE_URI = "https://raw.githubusercontent.com/nugian10/HANAMI-BLOOM/main/collection/metadata/";
const DECK_HASH = "0x8fb75680350c5af5e33d74652c701b544fb64884d96df252cc20430af2a21c28";
const EXISTING_TOKEN = "0xe08E6C2c7a6f2056470b971087dDEf43c3b21bC5"; // live $HANA token (v2), reused

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function main() {
  const nft = readJson(path.join(ART, "contracts", "HanamiBloomNFTv3.sol", "HanamiBloomNFTv3.json"));
  const token = readJson(path.join(ART, "contracts", "HanaToken.sol", "HanaToken.json"));
  const market = readJson(path.join(ART, "contracts", "HanamiMarket.sol", "HanamiMarket.json"));
  const bitmapDoc = readJson(path.join(ROOT, "..", "collection", "rarity-bitmap.json"));

  if (bitmapDoc.deckHash.toLowerCase() !== DECK_HASH.toLowerCase()) {
    throw new Error("rarity-bitmap.json deckHash != expected deckHash — STOP.");
  }
  if (!Array.isArray(bitmapDoc.bitmap) || bitmapDoc.bitmap.length !== 27) {
    throw new Error(`rarity bitmap must have 27 words, got ${bitmapDoc.bitmap && bitmapDoc.bitmap.length}`);
  }
  if (!nft.bytecode || nft.bytecode === "0x") throw new Error("NFT artifact has no bytecode — run npx hardhat compile first.");
  if (!market.bytecode || market.bytecode === "0x") throw new Error("Market artifact has no bytecode — run npx hardhat compile first.");

  let html = fs.readFileSync(path.join(__dirname, "deploy.template.html"), "utf8");
  const replace = (token, value) => {
    if (!html.includes(token)) throw new Error(`template placeholder missing: ${token}`);
    html = html.split(token).join(value);
  };

  replace("__OWNER__", OWNER);
  replace("__REVENUE__", REVENUE);
  replace("__REGISTRY__", REGISTRY);
  replace("__BASE_URI__", BASE_URI);
  replace("__DECK_HASH__", DECK_HASH);
  replace("__DECK_HASH_SHORT__", DECK_HASH.slice(0, 10) + "\u2026" + DECK_HASH.slice(-4));
  replace("__EXISTING_TOKEN__", EXISTING_TOKEN);
  replace("__TOKEN_ABI__", JSON.stringify(token.abi));
  replace("__NFT_ABI__", JSON.stringify(nft.abi));
  replace("__NFT_BYTECODE__", nft.bytecode);
  replace("__MARKET_ABI__", JSON.stringify(market.abi));
  replace("__MARKET_BYTECODE__", market.bytecode);
  replace("__BITMAP_JSON__", JSON.stringify(bitmapDoc.bitmap));

  // The mint price must NEVER appear on the deploy page (price-hiding rule).
  if (/0\.0003/.test(html)) throw new Error("mint price leaked into deploy.html — STOP.");

  const out = path.join(SITE, "deploy.html");
  fs.writeFileSync(out, html);
  console.log(`deploy.html written: ${out}`);
  console.log(`size: ${(fs.statSync(out).size / 1024).toFixed(1)} KB`);
  console.log(`NFT ABI entries: ${nft.abi.length}, creation bytes: ${(nft.bytecode.length - 2) / 2}`);
  console.log(`Market ABI entries: ${market.abi.length}, creation bytes: ${(market.bytecode.length - 2) / 2}`);
  console.log(`Token ABI entries: ${token.abi.length} (ABI only — token is reused, not deployed)`);
  console.log(`bitmap words: ${bitmapDoc.bitmap.length}`);
}

main();
