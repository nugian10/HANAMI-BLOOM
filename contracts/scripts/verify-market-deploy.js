// Verify the live HanamiMarket deploy on BNB Chain (56).
// Reads the deploy tx receipt + the deployed market state
// through the public BSC RPC. Run:
//   node scripts/verify-market-deploy.js
// No writes, no wallet, read-only.
const { ethers } = require("ethers");
const marketArtifact = require("../artifacts/contracts/HanamiMarket.sol/HanamiMarket.json");

const RPC = "https://bsc-dataseed.binance.org/";
const TX = "0xa745be2a75e64ceb774bb9ad833681b2f90628a91d90c549308e2c197da9f8ea";
const MARKET = "0x46897898625b71E2b1247515dfFfd2C51Dfacf7d";
const NFT = "0x8A742EcE2a8C1dCc5dE792A062dbEe9C00A74640";

const EXPECT = {
  owner: "0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097",
  revenue: "0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7",
};

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC);
  const receipt = await provider.getTransactionReceipt(TX);
  if (!receipt) { console.log("TX NOT FOUND"); process.exit(1); }
  console.log("--- deploy tx ---");
  console.log("status:", receipt.status, "| block:", receipt.blockNumber);
  console.log("from:", receipt.from);
  console.log("contractAddress:", receipt.contractAddress);
  console.log("gasUsed:", receipt.gasUsed.toString());
  console.log("contractAddress matches Bryan's address:", receipt.contractAddress?.toLowerCase() === MARKET.toLowerCase());
  console.log("from is My Wallet:", receipt.from.toLowerCase() === EXPECT.owner.toLowerCase());

  const market = new ethers.Contract(MARKET, marketArtifact.abi, provider);
  console.log("--- Market on-chain state ---");
  const checks = [
    ["nft", await market.nft(), NFT],
    ["royaltyReceiver", await market.royaltyReceiver(), EXPECT.revenue],
    ["owner", await market.owner(), EXPECT.owner],
    ["listingCount", (await market.listingCount()).toString(), "0"],
  ];
  for (const [name, got, want] of checks) {
    const ok = String(got).toLowerCase() === String(want).toLowerCase();
    console.log(`${ok ? "OK  " : "FAIL"} ${name}: ${got} (expected ${want})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
