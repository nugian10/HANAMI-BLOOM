// Measure HANAMI BLOOM deployment gas on the local Hardhat network.
// Deploys BOTH contracts with the REAL deckHash + rarity bitmap +
// baseURI, then the owner-only setMinter(nft, true) and the
// setMintActive(true) activation tx, so the total top-up (deploy +
// minter setup + activation) can be computed.
//
// NOTE: owner/revenue here are the local Hardhat signers, NOT the
// real My Wallet / Agentic Wallet — gasUsed does not depend on the
// address values, and the real wallets cannot sign locally.
// The real deploy uses owner = My Wallet
// 0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097 and revenue =
// Agentic Wallet 0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7.
//
// Live prices: BSC gas price from the public BSC RPC
// (https://bsc-dataseed.binance.org, eth_gasPrice) and BNB/IDR
// from CoinGecko. If either fetch fails, the fallback is
// BNB = Rp 12,229,764 and gas price = 0.1 gwei, clearly marked
// as FALLBACK below.
//
// Run: npx hardhat run scripts/measure-deploy-gas.js
const fs = require("node:fs");
const path = require("node:path");
const { ethers } = require("hardhat");

const FALLBACK_BNB_IDR = 12_229_764;
const FALLBACK_GAS_GWEI = "0.1";

async function fetchJson(url, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function liveGasPriceGwei() {
  // eth_gasPrice needs a POST; fetchJson above is GET-only, so do it here.
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch("https://bsc-dataseed.binance.org/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_gasPrice", params: [] }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const wei = BigInt(json.result);
    return Number(ethers.formatUnits(wei, "gwei"));
  } finally {
    clearTimeout(t);
  }
}

async function liveBnbIdr() {
  const json = await fetchJson(
    "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=idr",
    8000
  );
  const price = json?.binancecoin?.idr;
  if (typeof price !== "number" || price <= 0) throw new Error("bad CoinGecko response");
  return price;
}

function costLine(label, gasUsed, gasGwei, bnbIdr) {
  const costWei = gasUsed * ethers.parseUnits(gasGwei.toString(), "gwei");
  const costBnb = Number(ethers.formatEther(costWei));
  console.log(
    `  ${label}: ${gasUsed.toString()} gas = ${ethers.formatEther(costWei)} BNB (~Rp ${Math.round(
      costBnb * bnbIdr
    ).toLocaleString("id-ID")})`
  );
  return costBnb;
}

async function main() {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "..", "collection", "collection.json"), "utf8")
  );
  const bitmapDoc = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "..", "collection", "rarity-bitmap.json"), "utf8")
  );
  if (bitmapDoc.deckHash !== manifest.deckHash) {
    throw new Error("bitmap deckHash != manifest deckHash — STOP.");
  }
  if (bitmapDoc.bitmap.length !== 27) {
    throw new Error(`rarity bitmap must have 27 words, got ${bitmapDoc.bitmap.length}`);
  }
  const deckHash = manifest.deckHash;
  const rarityBitmap = bitmapDoc.bitmap;
  const baseURI = manifest.baseURI;

  // --- live prices (with clearly-marked fallback) ---
  let gasGwei = null;
  let bnbIdr = null;
  let gasFallback = false;
  let priceFallback = false;
  try {
    gasGwei = await liveGasPriceGwei();
    console.log(`Live BSC gas price: ${gasGwei} gwei (bsc-dataseed eth_gasPrice)`);
  } catch (e) {
    gasFallback = true;
    gasGwei = Number(FALLBACK_GAS_GWEI);
    console.log(`FALLBACK gas price: ${gasGwei} gwei (BSC RPC fetch failed: ${e.message})`);
  }
  try {
    bnbIdr = await liveBnbIdr();
    console.log(`Live BNB price: Rp ${Math.round(bnbIdr).toLocaleString("id-ID")} (CoinGecko)`);
  } catch (e) {
    priceFallback = true;
    bnbIdr = FALLBACK_BNB_IDR;
    console.log(`FALLBACK BNB price: Rp ${bnbIdr.toLocaleString("id-ID")} (CoinGecko fetch failed: ${e.message})`);
  }
  console.log(`Using gas price ${gasGwei} gwei${gasFallback ? " [FALLBACK]" : ""}, BNB Rp ${Math.round(bnbIdr).toLocaleString("id-ID")}${priceFallback ? " [FALLBACK]" : ""}`);

  const [owner, revenue] = await ethers.getSigners();

  // --- HanaToken ---
  const TokenFactory = await ethers.getContractFactory("contracts/HanaToken.sol:HanaToken");
  const token = await TokenFactory.deploy(owner.address);
  const tokenReceipt = await token.deploymentTransaction().wait();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("HanaToken deploy gasUsed:", tokenReceipt.gasUsed.toString());
  const tokenBnb = costLine("HanaToken deploy", tokenReceipt.gasUsed, gasGwei, bnbIdr);
  const tokenArt = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "artifacts", "contracts", "HanaToken.sol", "HanaToken.json"),
      "utf8"
    )
  );
  console.log("HanaToken creation bytecode bytes:", (tokenArt.bytecode.length - 2) / 2);
  console.log("HanaToken runtime bytecode bytes:", (tokenArt.deployedBytecode.length - 2) / 2);
  console.log("HanaToken treasury to owner:", ethers.formatEther(await token.balanceOf(owner.address)), "HANA");

  // --- HanamiBloomNFT (real deckHash + bitmap) ---
  const NftFactory = await ethers.getContractFactory("contracts/HanamiBloomNFT.sol:HanamiBloomNFT");
  const nft = await NftFactory.deploy(
    owner.address,
    revenue.address,
    "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F",
    baseURI,
    deckHash,
    rarityBitmap,
    tokenAddress
  );
  const nftReceipt = await nft.deploymentTransaction().wait();
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("HanamiBloomNFT deploy gasUsed:", nftReceipt.gasUsed.toString());
  const nftBnb = costLine("HanamiBloomNFT deploy", nftReceipt.gasUsed, gasGwei, bnbIdr);
  const nftArt = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "artifacts", "contracts", "HanamiBloomNFT.sol", "HanamiBloomNFT.json"),
      "utf8"
    )
  );
  console.log("HanamiBloomNFT creation bytecode bytes:", (nftArt.bytecode.length - 2) / 2);
  console.log("HanamiBloomNFT runtime bytecode bytes:", (nftArt.deployedBytecode.length - 2) / 2);
  console.log("deckHash on-chain:", await nft.deckHash());
  console.log("deckHash expected:", deckHash);
  console.log("match:", (await nft.deckHash()) === deckHash);
  console.log("rarityOf(1) (bitmap check):", await nft.rarityOf(1));
  console.log("currentPrice would revert while inactive (expected):", await nft.mintActive().then((a) => !a));

  // --- setMinter(nft, true) on the token (owner-only) ---
  const minterTx = await token.connect(owner).setMinter(nftAddress, true);
  const minterReceipt = await minterTx.wait();
  console.log("setMinter gasUsed:", minterReceipt.gasUsed.toString());
  const minterBnb = costLine("setMinter", minterReceipt.gasUsed, gasGwei, bnbIdr);

  // --- Activation tx: setMintActive(true), paid by the owner. ---
  const actTx = await nft.connect(owner).setMintActive(true);
  const actReceipt = await actTx.wait();
  console.log("activation (setMintActive) gasUsed:", actReceipt.gasUsed.toString());
  const actBnb = costLine("activation", actReceipt.gasUsed, gasGwei, bnbIdr);

  const total = tokenReceipt.gasUsed + nftReceipt.gasUsed + minterReceipt.gasUsed + actReceipt.gasUsed;
  const totalWei = total * ethers.parseUnits(gasGwei.toString(), "gwei");
  const totalBnbNum = Number(ethers.formatEther(totalWei));
  console.log("TOTAL (token + NFT + setMinter + activation) gas:", total.toString());
  console.log(`TOTAL: ${ethers.formatEther(totalWei)} BNB (~Rp ${Math.round(totalBnbNum * bnbIdr).toLocaleString("id-ID")})`);
  console.log("Budget Rp 3.000-6.000:", totalBnbNum * bnbIdr <= 6000 ? "DALAM BUDGET ✓" : "DI ATAS BUDGET — periksa gas price");
  console.log("Top-up recommendation: siapkan ~0.001 BNB di wallet deployer (My Wallet).");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
