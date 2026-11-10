// Measure HanamiBloomNFTv3 deployment gas on the local network.
// Deploys the v3 NFT with the REAL deckHash + rarity bitmap +
// baseURI, plus the owner-only setMinter(nft, true) on a fresh
// local HanaToken and the setMintActive(true) activation tx.
// The live $HANA token (0xe08E...) is REUSED on mainnet, so
// no token deploy gas is measured here.
//
// NOTE: owner/revenue here are the local Hardhat signers, NOT
// the real My Wallet / Agentic Wallet — gasUsed does not depend
// on the address values. The real deploy uses owner = My Wallet
// 0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097 and revenue =
// Agentic Wallet 0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7.
//
// Run: npx hardhat run scripts/measure-v3-gas.js
const fs = require("node:fs");
const path = require("node:path");
const { ethers } = require("hardhat");

async function main() {
  const PROJECT = path.join(__dirname, "..", "..");
  const MANIFEST = JSON.parse(fs.readFileSync(path.join(PROJECT, "collection", "collection.json"), "utf8"));
  const BITMAP = JSON.parse(fs.readFileSync(path.join(PROJECT, "collection", "rarity-bitmap.json"), "utf8"));
  const DECK_HASH = MANIFEST.deckHash;
  const BASE_URI = MANIFEST.baseURI;
  const BITMAP_WORDS = BITMAP.bitmap.map((w) => BigInt(w));

  const [deployer] = await ethers.getSigners();
  const REVENUE = "0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7";

  const Mock = await ethers.getContractFactory("MockAgentIdRegistry");
  const mock = await Mock.deploy();
  await mock.waitForDeployment();

  const Token = await ethers.getContractFactory("HanaToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();

  const Nft = await ethers.getContractFactory("HanamiBloomNFTv3");
  const deployTx = await Nft.getDeployTransaction(
    deployer.address,
    REVENUE,
    await mock.getAddress(),
    BASE_URI,
    DECK_HASH,
    BITMAP_WORDS,
    await token.getAddress()
  );
  const estimate = await ethers.provider.estimateGas(deployTx);
  const nft = await Nft.deploy(
    deployer.address,
    REVENUE,
    await mock.getAddress(),
    BASE_URI,
    DECK_HASH,
    BITMAP_WORDS,
    await token.getAddress()
  );
  const deployReceipt = await nft.waitForDeployment().then(() => nft.deploymentTransaction().wait());

  console.log(`HanamiBloomNFTv3 deploy gas (estimate): ${estimate.toString()}`);
  console.log(`HanamiBloomNFTv3 deploy gas (actual):   ${deployReceipt.gasUsed.toString()}`);

  const setMinterTx = await token.setMinter(await nft.getAddress(), true);
  const setMinterReceipt = await setMinterTx.wait();
  console.log(`setMinter(v3, true) gas:                ${setMinterReceipt.gasUsed.toString()}`);

  const activateTx = await nft.setMintActive(true);
  const activateReceipt = await activateTx.wait();
  console.log(`setMintActive(true) gas:               ${activateReceipt.gasUsed.toString()}`);

  const total = deployReceipt.gasUsed + setMinterReceipt.gasUsed + activateReceipt.gasUsed;
  console.log(`TOTAL (deploy + setMinter + activate):  ${total.toString()} gas`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
