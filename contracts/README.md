# HANAMI BLOOM — Kontrak

ERC-721 "HANAMI BLOOM" / "HANAMI" (3.333 NFT) + token $HANA (BEP-20),
BNB Smart Chain (56). Solidity 0.8.24, OpenZeppelin 5.4.0,
optimizer 200 runs, evmVersion cancun.

## Status

- **v2 (0x9DFc130384A581e0156B8665e8e8c2100fb82621) — LIVE tapi digantikan.**
  Flat 0.0003 BNB/mint, tanpa free mint. Total mint 0. Jangan mint di v2 lagi.
- **Kontrak baru (belum deploy): HanamiBloomNFTv3 + HanamiMarket.**
  Free 1.000 mint pertama (1 per wallet), sisanya paid 0.0003 BNB/mint,
  token $HANA v2 dipakai lagi (0xe08E6C2c7a6f2056470b971087dDEf43c3b21bC5),
  market on-site (bukan Element). Deploy dari `site/deploy.html`.

## File

| File | Isi |
| --- | --- |
| `contracts/HanamiBloomNFTv3.sol` | ERC-721 baru: free 1.000 (1/wallet), paid 0.0003 BNB/mint, 1 NFT per call, agent-only via SPACE ID Agent ID, royalty ERC-2981 5% ke Agentic Wallet, $HANA 12.000 hanya untuk paid mint |
| `contracts/HanamiBloomNFT.sol` | v2 (digantikan) — flat 0.0003 BNB/mint, tanpa free mint, tanpa cap per wallet |
| `contracts/HanamiMarket.sol` | Market on-site: list / beli / batal, escrow, BNB saja, penjual 95% + royalti 5% ke Agentic, tanpa listing fee |
| `contracts/HanaToken.sol` | ERC-20 "HANA", cap 1.000.000.000, treasury 460.000.000 pre-mint ke owner, bonus pool 540.000.000 (headroom cap), bonus 12.000 HANA per paid mint |
| `contracts/mocks/MockAgentIdRegistry.sol` | Mock registry Agent ID + MockGenericCaller + MockForceSend (test saja) |
| `scripts/generate-bitmap.cjs` | Bangun bitmap rarity 27 kata dari `scripts/deck.json` → `collection/rarity-bitmap.json` |
| `scripts/verify-deck.cjs` | Verifikasi deckHash + replay penuh 3.333 draw Fisher-Yates |
| `scripts/measure-deploy-gas.js` | Ukur gas deploy v2 + setMinter + aktivasi (harga live BSC + CoinGecko) |
| `scripts/measure-v3-gas.js` | Ukur gas deploy v3 + market + setMinter + aktivasi |
| `scripts/build-deploy-page.cjs` | Bangun `site/deploy.html` dari `scripts/deploy.template.html` + artifact |
| `test/Hanami.test.js` | 23 test Hardhat (v2 + token) |
| `test/hanami-v3.test.js` | 15 test Hardhat (v3: free 1.000, cap, $HANA hanya paid) |
| `test/hanami-market.test.js` | 13 test Hardhat (market: list/beli/batal, bagi 95/5) |

Total: **51 test, semua lolos** (`npx hardhat test`).

## Pilihan penyimpanan: hash-only deck (murah)

Hanya `deckHash` (keccak256 dari compact JSON deck) + bitmap rarity
2-bit/token (27 kata uint256) yang disimpan on-chain. Deck lengkap
(3.333 entri) TIDAK disimpan on-chain — deck, seed, dan deckHash
dipublikasikan off-chain di `collection/collection.json` dan
`scripts/deck.json`, jadi siapa pun bisa rebuild deck dan verifikasi
deckHash. Ini desain yang sama dengan THYRK/Zigzoo v2 dan jauh lebih
murah daripada menyimpan deck penuh on-chain.

- deckHash: `0x8fb75680350c5af5e33d74652c701b544fb64884d96df252cc20430af2a21c28`
  (keccak256 dari isi file `scripts/deck.json` persis apa adanya —
  terverifikasi cocok oleh `scripts/verify-deck.cjs`).
- Rarity: Common Wildflower 2000 / Rare Sakura 1000 /
  Epic Moonflower 300 / Legendary Eternal Bloom 33.
- Replay off-chain 3.333 draw: semua token unik, total rarity persis
  2000/1000/300/33.

## Biaya deploy v3 + market (diukur 10 Nov 2026, Hardhat local, BNB Rp 12.430.102 CoinGecko)

| Langkah | Gas | BNB @0,058 gwei | Rp @0,058 gwei |
| --- | --- | --- | --- |
| HanamiBloomNFTv3 deploy | 3.206.283 | 0,00018596441 | ~2.312 |
| HanamiMarket deploy | 918.357 | 0,00005326471 | ~662 |
| setMinter(NFT v3, true) | 47.832 | 0,00000277426 | ~34 |
| Aktivasi setMintActive(true) | 29.877 | 0,00000173287 | ~22 |
| **TOTAL** | **4.202.349** | **0,00024373625** | **~3.030** |

Pada 0,1 gwei totalnya ~Rp 5.224. Saldo My Wallet 0,003455 BNB (cek
18:23 WIB) — cukup. Token $HANA TIDAK di-deploy lagi (dipakai yang sudah
live, 0xe08E6C2c7a6f2056470b971087dDEf43c3b21bC5).

## URUTAN DEPLOY YANG BENAR (v3)

Jangan ikuti urutan lain — NFT butuh alamat token di constructor, dan
market butuh alamat NFT:

1. **Konfirmasi token $HANA yang sudah live** (`site/deploy.html` step 3,
   read-only) — alamat `0xe08E6C2c7a6f2056470b971087dDEf43c3b21bC5`,
   owner My Wallet, treasury 460.000.000 $HANA. Jangan deploy token baru.
2. **Deploy HanamiBloomNFTv3** — constructor:
   `initialOwner` = My Wallet, `revenueWallet` = Agentic Wallet
   `0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7`,
   `agentIdRegistry` = SPACE ID `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`,
   `baseURI` = `https://raw.githubusercontent.com/nugian10/HANAMI-BLOOM/main/collection/metadata/`,
   `deckHash` = `0x8fb75680...a21c28` (lihat atas),
   `rarityBitmap` = 27 kata dari `collection/rarity-bitmap.json`,
   `hanaToken` = alamat token live di langkah 1.
3. **`setMinter(NFT v3, true)` di HanaToken** (oleh owner) — tanpa ini,
   paid mint revert karena NFT belum boleh mint bonus $HANA.
4. **Verifikasi on-chain** (`site/deploy.html` step 6, read-only) —
   deckHash, owner, revenue, royalty 5%, FREE_MINT_CAP 1.000,
   freeMinted 0, minters(NFT) true.
5. **Aktivasi `setMintActive(true)` di NFT v3** (oleh owner) — mint LIVE.
6. **Deploy HanamiMarket** — constructor: `nft` = alamat NFT v3,
   `royaltyReceiver` = Agentic Wallet, `initialOwner` = My Wallet.

Setelah deploy: update `site/config.js` ke alamat NFT v3 + market,
verifikasi source di BscScan (nama kontrak NFT: HanamiBloomNFTv3),
update mint-watch ke alamat baru.

## Peran wallet

- Owner = My Wallet `0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097`
  (deploy, setMinter, aktivasi, admin).
- Revenue + royalty receiver = Agentic Wallet
  `0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7` (5% ERC-2981).
- Setiap paid mint meneruskan 0,0003 BNB langsung ke revenue dalam call
  yang sama; overpayment direfund ke minter dalam call yang sama.
  Free mint tidak memindahkan BNB dan tidak memberi $HANA.

## Verifikasi

```bash
npx hardhat compile
npx hardhat test            # 51 test
node scripts/verify-deck.cjs
node scripts/measure-v3-gas.js
node scripts/build-deploy-page.cjs   # regenerate site/deploy.html
```

Kontrak ini SOURCE-VERIFIABLE di BscScan. BUKAN audit independen —
tetap cantumkan itu di situs.
