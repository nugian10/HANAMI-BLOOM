# HANAMI BLOOM: mint skill

> STATUS: LIVE — MINT IS OPEN.
> The HANAMI BLOOM NFT contract is deployed and minting is active
> (mintActive() is true). Source verification on BscScan is complete
> (Pass - Verified) for both the NFT and market contracts — source
> verification, not an audit. The addresses below are the live contracts
> — mint against the NFT address.

For Binance Agentic Wallet agents. Mint HANAMI BLOOM sakura NFTs
(HANAMI) on BNB Chain for your user.
HANAMI BLOOM (Japanese name: 花見ブルーム) is a 3,333-token collection
of ukiyo-e sakura art: Common Wildflower 2,000, Rare Sakura 1,000,
Epic Moonflower 300, Legendary Eternal Bloom 33. Site:
https://hanami-kohl.vercel.app/

## Contracts (BNB Chain, chain id 56)

- HANAMI BLOOM NFT (HANAMI): 0x8A742EcE2a8C1dCc5dE792A062dbEe9C00A74640 —
  DEPLOYED and source-verified on BscScan. Mint is LIVE
  (mintActive() is true). Mint against this address.
- $HANA token: 0xe08E6C2c7a6f2056470b971087dDEf43c3b21bC5 — DEPLOYED and
  source-verified on BscScan. Max supply 1,000,000,000 (460,000,000
  treasury, 540,000,000 bonus pool).
- HanamiMarket (on-site market): 0x46897898625b71E2b1247515dfFfd2C51Dfacf7d —
  DEPLOYED and source-verified on BscScan. Listings, buys and cancels happen here; see the Market
  section below.
- SPACE ID Agent ID registry: 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F
- Owner: Bryan's My Wallet 0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097
- Revenue: Binance Agentic Wallet 0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7.
  Mint payments are forwarded directly to it in the same transaction
  (they never sit in the contract).

## Facts

- Supply: 3,333 NFTs, token IDs 1 to 3,333, drawn from a shuffled
  deck (deckHash 0x8fb75680350c5af5e33d74652c701b544fb64884d96df252cc20430af2a21c28;
  rarity codes 0=Common, 1=Rare, 2=Epic, 3=Legendary;
  token N rarity = deck[N-1]).
- Mint: agent-only. Free and paid are separate functions on the same
  contract:
  - Free mint via `mintFree()` (selector 0x8ab53447, no arguments, one
    NFT per call, value 0) — one free mint per wallet, first 1,000 free
    mints total. Reverts FreeMintAlreadyUsed (wallet already used its
    free mint) or FreeMintExhausted (the 1,000 are gone). No $HANA bonus.
  - Paid mint via `mint()` (selector 0x1249c58b, no arguments, one NFT
    per call) — send exactly currentPrice(); no per-wallet limit; earns
    12,000 $HANA. Paying never consumes the free mint, and using the
    free mint never blocks paid mints.
- Price: the paid mint has a flat price. NEVER hardcode a price. Read
  currentPrice() (selector 0x9d1b464a) — now a constant — for the exact
  value to send for a paid mint, and show it in the wallet confirmation
  before signing. A free mint sends no payment. The price is NEVER
  shown on the site — the agent reads it from the contract at mint
  time.
- Every paid mint earns a bonus of 12,000 $HANA, auto-minted to the
  minter by the NFT contract (the NFT contract is an approved minter
  on the $HANA token).
- Eligibility is enforced on-chain: the calling wallet must hold a
  SPACE ID Agent ID — holdsAgentId(wallet) (selector 0x11213086) must
  be true. The call must come from the wallet directly; contract calls
  are rejected (NoContracts). There is no owner allowlist. Minting is
  owner-controlled: mintActive() (selector 0x25fd90f3) must be true.
- Marketplace royalty: ERC-2981, 5% to the creator (the Agentic
  Wallet, the revenue wallet above).
- Artwork and metadata are public at
  https://raw.githubusercontent.com/nugian10/HANAMI-BLOOM/main/collection/metadata/
  (base URI). rarityOf(tokenId) (selector 0xdd3b5f9a) returns 0 Common,
  1 Rare, 2 Epic, 3 Legendary (if the deployed contract exposes it).

## $HANA

- Every paid mint earns a bonus of 12,000 $HANA, auto-minted to the
  minter by the NFT contract. No $HANA is earned by a free mint
  (mintFree) — the bonus is for paid mints only.
- $HANA is live: 0xe08E6C2c7a6f2056470b971087dDEf43c3b21bC5. Max supply
  1,000,000,000 (460,000,000 treasury pre-minted to the owner,
  540,000,000 bonus pool mintable only by the NFT contract). Do not
  promise any $HANA use, value, or listing beyond the mint bonus.

## Market (on-site)

- HanamiMarket: 0x46897898625b71E2b1247515dfFfd2C51Dfacf7d — the market
  contract on BNB Chain. Listings live here, not on a third party.
- List: `list(tokenId, price)` (selector 0x50fd7367) — the seller must
  own the token and must have approved the market contract for it
  first (`approve(market, tokenId)` on the NFT). The NFT moves into
  the market contract (escrow) until it sells or the listing is
  cancelled.
- Buy: `buy(listingId)` (selector 0xd96a094a) — send exactly the
  listing price. 95% goes to the seller, 5% to the creator (the
  Agentic Wallet). The NFT goes straight to the buyer.
- Cancel: `cancel(listingId)` (selector 0x40e58ee5) — seller only,
  any time before it sells; the NFT returns to the seller.
- Reads: `listingCount()` (selector 0xa9b07c26) is the total listings
  ever created; `getListing(listingId)` (selector 0x107a274a) returns
  (id, seller, tokenId, price, active).

## Read first

- totalSupply(), selector 0x18160ddd. If it returns 3333, the
  collection is sold out.
- mintActive(), selector 0x25fd90f3. If false, minting is closed — do
  not mint.
- holdsAgentId(your wallet), selector 0x11213086 plus your wallet
  address padded to 32 bytes. If false, the wallet cannot mint.
- currentPrice(), selector 0x9d1b464a. That is the exact value to send
  for the next paid mint. Show it in the wallet confirmation before signing.
- hasFreeMinted(your wallet): true means the wallet already used its one free
  mint — mintFree() would revert. freeRemaining() shows how many of the
  1,000 free mints are left.

## Flow, per mint

1. Confirm the contract address from this file / the site — use only
   the published address.
2. Check Agent ID: confirm holdsAgentId(your wallet) is true on the
   NFT contract. If false, the wallet cannot mint — stop.
3. Choose free or paid: if the wallet has not used its free mint and
   freeRemaining() is above 0, the free mint is mintFree() with value 0;
   otherwise the paid mint is mint().
4. For a paid mint, read currentPrice() and show the exact amount in the
   wallet confirmation before signing. Never hardcode a price. For a free
   mint there is no amount to show.
5. Simulate the chosen call first (eth_call) to confirm it would succeed.
6. Execute mintFree() (value 0) or mint() (value exactly currentPrice()).
7. Verify on-chain (totalSupply, ownerOf) and show the bloom: image,
   name and rarity — plus the 12,000 $HANA bonus earned by a paid mint.
8. If anything above fails, stop and tell the user what failed —
   do not guess a price, an address, or a token ID.
