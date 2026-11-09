# HANAMI BLOOM: mint skill

> STATUS: LIVE — MINT IS OPEN.
> The HANAMI BLOOM NFT contract is deployed and source-verified on
> BscScan. Minting is active (mintActive() is true). The addresses
> below are the live contracts — mint against the NFT address.

For Binance Agentic Wallet agents. Mint HANAMI BLOOM sakura NFTs
(HANAMI) on BNB Chain for your user.
HANAMI BLOOM (Japanese name: 花見ブルーム) is a 3,333-token collection
of ukiyo-e sakura art: Common Wildflower 2,000, Rare Sakura 1,000,
Epic Moonflower 300, Legendary Eternal Bloom 33. Site:
https://hanami-kohl.vercel.app/

## Contracts (BNB Chain, chain id 56)

- HANAMI BLOOM NFT (HANAMI): 0x9DFc130384A581e0156B8665e8e8c2100fb82621 —
  DEPLOYED and source-verified on BscScan. Mint is LIVE (mintActive()
  is true). Mint against this address.
- $HANA token: 0xe08E6C2c7a6f2056470b971087dDEf43c3b21bC5 — DEPLOYED and
  source-verified on BscScan. Max supply 1,000,000,000 (460,000,000
  treasury, 540,000,000 bonus pool).
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
- Mint: agent-only. Paid mint via `mint()` (selector 0x1249c58b, no
  arguments, one NFT per call) — every mint is paid, there is no free
  mint, and there is no per-wallet limit.
- Price: flat per mint. NEVER hardcode a price. Read currentPrice()
  (selector 0x9d1b464a) for the exact price of the next mint and show
  it in the wallet confirmation before signing. The price is NEVER
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
  minter by the NFT contract. No $HANA is earned by a free mint —
  there is no free mint in HANAMI BLOOM.
- $HANA is live: 0xe08E6C2c7a6f2056470b971087dDEf43c3b21bC5. Max supply
  1,000,000,000 (460,000,000 treasury pre-minted to the owner,
  540,000,000 bonus pool mintable only by the NFT contract). Do not
  promise any $HANA use, value, or listing beyond the mint bonus.

## Read first

- totalSupply(), selector 0x18160ddd. If it returns 3333, the
  collection is sold out.
- mintActive(), selector 0x25fd90f3. If false, minting is closed — do
  not mint.
- holdsAgentId(your wallet), selector 0x11213086 plus your wallet
  address padded to 32 bytes. If false, the wallet cannot mint.
- currentPrice(), selector 0x9d1b464a. That is the exact value to send
  for the next mint. Show it in the wallet confirmation before signing.

## Flow, per mint

1. Confirm the contract address from this file / the site — use only
   the published address.
2. Check Agent ID: confirm holdsAgentId(your wallet) is true on the
   SPACE ID registry. If false, the wallet cannot mint — stop.
3. Read currentPrice() and show the exact amount in the wallet
   confirmation before signing. Never hardcode a price.
4. Simulate the mint call first (eth_call) to confirm it would
   succeed with the quoted value.
5. Execute mint() and send exactly the quoted value.
6. Verify on-chain (totalSupply, ownerOf) and show the bloom: image,
   name and rarity — plus the 12,000 $HANA bonus earned.
7. If anything above fails, stop and tell the user what failed —
   do not guess a price, an address, or a token ID.
