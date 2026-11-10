# HANAMI BLOOM — site

Static site for HANAMI BLOOM (Japanese name: 花見ブルーム;
hero/titles: 花見 BLOOM), a 3,333-piece ukiyo-e sakura NFT collection
on BNB Chain (56), ERC-721, agent-only mint via SPACE ID Agent ID.

## Status

- LIVE (10 Nov 2026). NFT contract
  `0x8A742EcE2a8C1dCc5dE792A062dbEe9C00A74640`, market
  `0x46897898625b71E2b1247515dfFfd2C51Dfacf7d` and $HANA token
  `0xe08E6C2c7a6f2056470b971087dDEf43c3b21bC5`, all deployed.
  $HANA token is source-verified on BscScan; NFT and market
  verification is pending. Mint is ACTIVE (mintActive() is true).
- Mint: LIVE, agent-only. Free: 1 per wallet (first 1,000) via
  mintFree(); paid via mint(), no per-wallet limit.
- $HANA token: live, max supply 1,000,000,000 (460,000,000 treasury,
  540,000,000 bonus pool); bonus is 12,000 $HANA per paid mint
  (see `agent-skill.md` and `llms.txt`). No other $HANA
  amounts are promised anywhere on the site.
- NFT symbol: "HANAMI" (see `config.js`).
- Official X: https://x.com/hanami_bloom (linked in every footer).

## Hosting

- Vercel project `hanami`, domain `hanami-kohl.vercel.app`, protection OFF.
- `vercel.json` sets `cleanUrls: true`. Deploy is handled by the
  coordinator — this repo does not deploy.

## Pages

- `index.html` — hero, 4 rarity cards, how-it-works, $HANA note,
  facts, roadmap, market teaser, FAQ.
- `mint.html` — agent-only explanation, agent prompt (live contract
  address, free + paid paths, reads `currentPrice()` on-chain for
  paid mints), one-tap copy button at the top (clicking Mint copies
  the agent prompt), Agent ID checker (reads `holdsAgentId` on the
  NFT contract via public RPC).
- `check.html` — check an NFT by token ID (1–3,333) and a wallet
  (balanceOf + Agent ID); both read the live contract on-chain.
- `gallery.html` — one preview per rarity with supply counts.
- `market.html` — on-site market: live listings from the HanamiMarket
  contract, list / buy / cancel with a connected wallet, 5% royalty note.

## i18n

- Japanese (ja) is the default; English (en) second. Toggle
  日本語 / EN in the TOP header bar (desktop and mobile), never
  inside the hamburger menu. Choice saved in localStorage key
  `hanami-lang`, switches instantly without reload, persists
  across pages. Static HTML is Japanese (`<html lang="ja">`).
- Japanese naming rule: hero and titles use "花見 BLOOM";
  Japanese body text writes the project as "花見ブルーム".
  English mode uses "HANAMI BLOOM". File names, addresses and
  collection metadata stay "HANAMI BLOOM" in English.
- Rarity names (Common/Rare/Epic/Legendary), HANAMI BLOOM, $HANA,
  SPACE ID, BNB Chain stay English in every language.

## Price rule (hard)

- NO BNB price amount appears anywhere on the site — no mint price
  figure of any kind, in HTML/JS/CSS/md/txt/json. The agent reads
  `currentPrice()` from the contract at mint time.

## Files

- `config.js` — addresses, chain, deck hash, base URI, supply.
- `i18n.js` — JA/EN dictionary (fallback English).
- `live-count.js` — polls `totalSupply()` every 3s and `mintActive()`
  every 30s against the live contract; shows "–" only if the RPC
  read fails.
- `style.css` — ukiyo-e palette (indigo, sakura pink, cream).
- `images/` — 4 approved artwork previews (WebP).
- `robots.txt`, `sitemap.xml`, `llms.txt`, `agents.json`,
  `.well-known/agents.json`, `favicon.svg`, `vercel.json`.

## Verification

- `node --check` on every `.js` file.
- Grep for BNB price figures across the site — must return 0 matches.
- Validate every `.json` file parses.
- Check every `data-i18n` key exists in both JA and EN in `i18n.js`.
