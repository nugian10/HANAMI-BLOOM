# HANAMI BLOOM — site

Static site for HANAMI BLOOM (Japanese name: 花見ブルーム;
hero/titles: 花見 BLOOM), a 3,333-piece ukiyo-e sakura NFT collection
on BNB Chain (56), ERC-721, agent-only mint via SPACE ID Agent ID.

## Status

- Contract NOT deployed yet. NFT address is the zero-address
  placeholder `0x0000000000000000000000000000000000000000` in
  `config.js`, `live-count.js`, `check.html`, `mint.html`, `llms.txt`
  and `agent-skill.md`. Update all of them with the real address
  when the contract deploys (search for the zero address).
- Mint: COMING SOON. No free mint, no per-wallet limit.
- $HANA token: contract phase comes later; bonus is 12,000 $HANA per
  paid mint (see `agent-skill.md` and `llms.txt`). No other $HANA
  amounts are promised anywhere on the site.
- NFT symbol is PROVISIONAL: "HANAMI" (see `config.js`).

## Hosting

- Vercel project `hanami`, domain `hanami-kohl.vercel.app`, protection OFF.
- `vercel.json` sets `cleanUrls: true`. Deploy is handled by the
  coordinator — this repo does not deploy.

## Pages

- `index.html` — hero, 4 rarity cards, how-it-works, $HANA note,
  facts, roadmap, market teaser, FAQ.
- `mint.html` — agent-only explanation, agent prompt (placeholder
  address, reads `currentPrice()` on-chain), Agent ID checker
  (reads `holdsAgentId` on the SPACE ID registry via public RPC).
- `check.html` — check an NFT by token ID (1–3,333) and a wallet
  (balanceOf + Agent ID); both show "contract not deployed" and make
  no contract calls until the real address is set.
- `gallery.html` — one preview per rarity with supply counts.
- `market.html` — Element link (collection not indexed yet — contract
  not deployed), step-by-step listing guide, 5% royalty note.

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
  every 30s once deployed; with the placeholder address it makes no
  calls and shows "–" / coming soon.
- `style.css` — ukiyo-e palette (indigo, sakura pink, cream).
- `images/` — 4 approved artwork previews (WebP).
- `robots.txt`, `sitemap.xml`, `llms.txt`, `agents.json`,
  `.well-known/agents.json`, `favicon.svg`, `vercel.json`.

## Verification

- `node --check` on every `.js` file.
- Grep for BNB price figures across the site — must return 0 matches.
- Validate every `.json` file parses.
- Check every `data-i18n` key exists in both JA and EN in `i18n.js`.
