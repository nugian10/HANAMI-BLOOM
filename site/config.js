/* HANAMI BLOOM site config — single source of truth for contract addresses.
   Japanese name of the project: 花見 (Hanami). English name: HANAMI BLOOM.
   STATUS: LIVE — NFT + market deployed 10 Nov 2026, mint ACTIVE.
   NFT + market source-verified on BscScan; $HANA token verified.
   No BNB prices anywhere: the mint price is read from the contract
   (currentPrice) at mint time. */
var HANAMI_CONFIG = {
  // BNB Chain mainnet.
  CHAIN_ID: 56,
  // NFT contract — DEPLOYED (split contract: mintFree + mint, 10 Nov 2026),
  // mint ACTIVE. Source-verified on BscScan.
  NFT_ADDRESS: "0x8A742EcE2a8C1dCc5dE792A062dbEe9C00A74640",
  // $HANA token — DEPLOYED + VERIFIED (10 Nov 2026).
  TOKEN_ADDRESS: "0xe08E6C2c7a6f2056470b971087dDEf43c3b21bC5",
  // On-site market — DEPLOYED 10 Nov 2026.
  MARKET_ADDRESS: "0x46897898625b71E2b1247515dfFfd2C51Dfacf7d",
  // Symbol (live on-chain).
  SYMBOL: "HANAMI",
  // SPACE ID Agent ID registry (agent-only gate).
  AGENT_ID_REGISTRY: "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F",
  // Royalty receiver (5%).
  ROYALTY_RECEIVER: "0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7",
  // Contract owner.
  OWNER: "0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097",
  // Deck commitment (from scripts/deck-info.json, generated 10 Nov 2026).
  DECK_HASH: "0x8fb75680350c5af5e33d74652c701b544fb64884d96df252cc20430af2a21c28",
  BASE_URI: "https://raw.githubusercontent.com/nugian10/HANAMI-BLOOM/main/collection/metadata/",
  MAX_SUPPLY: 3333
};
if (typeof module !== "undefined" && module.exports) module.exports = HANAMI_CONFIG;
