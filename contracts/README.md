# HANAMI BLOOM — Kontrak

ERC-721 "HANAMI BLOOM" / "HANAMI" (3.333 NFT) + token $HANA (BEP-20),
BNB Smart Chain (56). Solidity 0.8.24, OpenZeppelin 5.4.0,
optimizer 200 runs, evmVersion cancun.

## File

| File | Isi |
| --- | --- |
| `contracts/HanamiBloomNFT.sol` | ERC-721, flat 0.0003 BNB/mint, 1 NFT per call, tanpa free mint, tanpa cap per wallet, agent-only via SPACE ID Agent ID, royalty ERC-2981 5% ke Agentic Wallet |
| `contracts/HanaToken.sol` | ERC-20 "HANA", cap 1.000.000.000, treasury 460.000.000 pre-mint ke owner, bonus pool 540.000.000 (headroom cap), bonus 12.000 HANA per paid mint |
| `contracts/mocks/MockAgentIdRegistry.sol` | Mock registry Agent ID + MockGenericCaller + MockForceSend (test saja) |
| `scripts/generate-bitmap.cjs` | Bangun bitmap rarity 27 kata dari `scripts/deck.json` → `collection/rarity-bitmap.json` |
| `scripts/verify-deck.cjs` | Verifikasi deckHash + replay penuh 3.333 draw Fisher-Yates |
| `scripts/measure-deploy-gas.js` | Ukur gas deploy + setMinter + aktivasi (harga live BSC + CoinGecko) |
| `test/Hanami.test.js` | 23 test Hardhat |

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

## Biaya deploy (diukur 10 Nov 2026, Hardhat local, gas price live 0,05 gwei, BNB Rp 12.401.357 CoinGecko)

| Langkah | Gas | BNB | Rp |
| --- | --- | --- | --- |
| HanaToken deploy | 818.208 | 0,0000409104 | ~507 |
| HanamiBloomNFT deploy | 3.072.431 | 0,00015362155 | ~1.905 |
| setMinter(NFT, true) | 47.832 | 0,0000023916 | ~30 |
| Aktivasi setMintActive(true) | 29.854 | 0,0000014927 | ~19 |
| **TOTAL** | **3.968.325** | **0,00019841625** | **~2.461** |

Budget yang disetujui Bryan: Rp 3.000–6.000 → **DALAM BUDGET** (bahkan di
bawah batas bawah). Pada 0,1 gwei totalnya ~Rp 4.921 — tetap dalam budget.
Siapkan ~0,001 BNB di wallet deployer (My Wallet) sebagai top-up.

## URUTAN DEPLOY YANG BENAR

Jangan ikuti urutan lain — NFT butuh alamat token di constructor:

1. **Deploy HanaToken dulu** — constructor: `initialOwner` = My Wallet
   `0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097`.
   Treasury 460.000.000 $HANA langsung ter-mint ke owner.
2. **Deploy HanamiBloomNFT** — constructor:
   `initialOwner` = My Wallet, `revenueWallet` = Agentic Wallet
   `0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7`,
   `agentIdRegistry` = SPACE ID `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`,
   `baseURI` = `https://raw.githubusercontent.com/nugian10/HANAMI-BLOOM/main/collection/metadata/`,
   `deckHash` = `0x8fb75680...a21c28` (lihat atas),
   `rarityBitmap` = 27 kata dari `collection/rarity-bitmap.json`,
   `hanaToken` = alamat HanaToken dari langkah 1.
3. **`setMinter(NFT, true)` di HanaToken** (oleh owner) — tanpa ini,
   paid mint revert karena NFT belum boleh mint bonus $HANA.
4. **Aktivasi `setMintActive(true)` di NFT** (oleh owner) — mint LIVE.

## Peran wallet

- Owner = My Wallet `0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097`
  (deploy, setMinter, aktivasi, admin).
- Revenue + royalty receiver = Agentic Wallet
  `0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7` (5% ERC-2981).
- Setiap mint meneruskan 0,0003 BNB langsung ke revenue dalam call
  yang sama; overpayment direfund ke minter dalam call yang sama.

## Verifikasi

```bash
npx hardhat compile
npx hardhat test            # 23 test
node scripts/verify-deck.cjs
npx hardhat run scripts/measure-deploy-gas.js
```

Kontrak ini SOURCE-VERIFIABLE di BscScan. BUKAN audit independen —
tetap cantumkan itu di situs.
