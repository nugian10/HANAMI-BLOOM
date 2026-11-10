const fs = require("node:fs");
const path = require("node:path");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// HanamiMarket tests — against the REAL v2 HanamiBloomNFT artifact.
// The live v2 pair (Bryan, 10 Nov 2026) is the canonical contract:
//   NFT  0x9DFc130384A581e0156B8665e8e8c2100fb82621
//   $HANA 0xe08E6C2c7a6f2056470b971087dDEf43c3b21bC5
// Those addresses live on BNB mainnet, not on the local Hardhat
// network, so the test deploys fresh instances of the same v2
// artifacts with the same constructor args. A fresh HanaToken is
// deployed locally for the same reason; the market itself never
// touches $HANA. Minting uses the v2 escape hatch
// setAgentIdCheckRequired(false), which the v2 contract provides.

const PROJECT = path.join(__dirname, "..", "..");
const MANIFEST = JSON.parse(fs.readFileSync(path.join(PROJECT, "collection", "collection.json"), "utf8"));
const BITMAP = JSON.parse(fs.readFileSync(path.join(PROJECT, "collection", "rarity-bitmap.json"), "utf8"));

const DECK_HASH = MANIFEST.deckHash;
const BASE_URI = MANIFEST.baseURI;
const BITMAP_WORDS = BITMAP.bitmap.map((w) => BigInt(w));

const OWNER = "0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097"; // My Wallet
const REVENUE = "0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7"; // Agentic Wallet
const REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F"; // SPACE ID

async function deployFixture() {
  const [deployer, alice, bob, carol] = await ethers.getSigners();
  const Mock = await ethers.getContractFactory("MockAgentIdRegistry");
  const mock = await Mock.deploy();
  await mock.waitForDeployment();

  const Token = await ethers.getContractFactory("HanaToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();

  const Nft = await ethers.getContractFactory("HanamiBloomNFT");
  const nft = await Nft.deploy(
    deployer.address,
    REVENUE,
    await mock.getAddress(),
    BASE_URI,
    DECK_HASH,
    BITMAP_WORDS,
    await token.getAddress()
  );
  await nft.waitForDeployment();
  await token.setMinter(await nft.getAddress(), true);

  const Market = await ethers.getContractFactory("HanamiMarket");
  const market = await Market.deploy(await nft.getAddress(), REVENUE, deployer.address);
  await market.waitForDeployment();

  // Escape hatch: let test wallets mint without a SPACE ID.
  await nft.setMintActive(true);
  await nft.setAgentIdCheckRequired(false);
  const price = await nft.MINT_PRICE();
  return { nft, token, market, mock, deployer, alice, bob, carol, price };
}

async function mintOne(nft, wallet, price) {
  const tx = await nft.connect(wallet).mint({ value: price });
  const receipt = await tx.wait();
  const minted = receipt.logs
    .map((l) => { try { return nft.interface.parseLog(l); } catch { return null; } })
    .find((e) => e && e.name === "Minted");
  return Number(minted.args.tokenId);
}

describe("HanamiMarket — constructor & config", function () {
  it("constructor sets nft / royaltyReceiver / owner / royalty 5% / listingCount 0", async function () {
    const { nft, market, deployer } = await deployFixture();
    expect(await market.nft()).to.equal(await nft.getAddress());
    expect(await market.royaltyReceiver()).to.equal(REVENUE);
    expect(await market.owner()).to.equal(deployer.address);
    expect(await market.ROYALTY_BPS()).to.equal(500);
    expect(await market.listingCount()).to.equal(0);
    expect(await market.isListed(1)).to.equal(false);
  });

  it("constructor reverts on a zero address", async function () {
    const { nft, deployer } = await deployFixture();
    const Market = await ethers.getContractFactory("HanamiMarket");
    await expect(
      Market.deploy(ethers.ZeroAddress, REVENUE, deployer.address)
    ).to.be.revertedWithCustomError(Market, "InvalidAddress");
    await expect(
      Market.deploy(await nft.getAddress(), ethers.ZeroAddress, deployer.address)
    ).to.be.revertedWithCustomError(Market, "InvalidAddress");
    await expect(
      Market.deploy(await nft.getAddress(), REVENUE, ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(Market, "OwnableInvalidOwner"); // OZ Ownable checks first
  });
});

describe("HanamiMarket — list", function () {
  it("list happy path: NFT escrowed, listing created, isListed true, Listed event", async function () {
    const { nft, market, alice, price } = await deployFixture();
    const tokenId = await mintOne(nft, alice, price);
    await nft.connect(alice).approve(await market.getAddress(), tokenId);

    await expect(market.connect(alice).list(tokenId, ethers.parseEther("0.01")))
      .to.emit(market, "Listed")
      .withArgs(1, alice.address, tokenId, ethers.parseEther("0.01"));

    expect(await market.listingCount()).to.equal(1);
    expect(await nft.ownerOf(tokenId)).to.equal(await market.getAddress());
    expect(await market.isListed(tokenId)).to.equal(true);
    expect(await market.listingIdOf(tokenId)).to.equal(1);
    const l = await market.getListing(1);
    expect(l.id).to.equal(1);
    expect(l.seller).to.equal(alice.address);
    expect(l.tokenId).to.equal(tokenId);
    expect(l.price).to.equal(ethers.parseEther("0.01"));
    expect(l.active).to.equal(true);
  });

  it("list reverts: price 0, not the owner, token already listed", async function () {
    const { nft, market, alice, bob, price } = await deployFixture();
    const tokenId = await mintOne(nft, alice, price);
    await nft.connect(alice).approve(await market.getAddress(), tokenId);

    await expect(market.connect(alice).list(tokenId, 0))
      .to.be.revertedWithCustomError(market, "InvalidPrice");
    await expect(market.connect(bob).list(tokenId, ethers.parseEther("0.01")))
      .to.be.revertedWithCustomError(market, "NotTokenOwner");
    await market.connect(alice).list(tokenId, ethers.parseEther("0.01"));
    await expect(market.connect(alice).list(tokenId, ethers.parseEther("0.02")))
      .to.be.revertedWithCustomError(market, "AlreadyListed");
  });

  it("listing ids increment and two tokens can be listed at once", async function () {
    const { nft, market, alice, price } = await deployFixture();
    const t1 = await mintOne(nft, alice, price);
    const t2 = await mintOne(nft, alice, price);
    await nft.connect(alice).setApprovalForAll(await market.getAddress(), true);
    await market.connect(alice).list(t1, ethers.parseEther("0.01"));
    await market.connect(alice).list(t2, ethers.parseEther("0.02"));
    expect(await market.listingCount()).to.equal(2);
    expect(await market.listingIdOf(t1)).to.equal(1);
    expect(await market.listingIdOf(t2)).to.equal(2);
    expect(await market.isListed(t1)).to.equal(true);
    expect(await market.isListed(t2)).to.equal(true);
  });
});

describe("HanamiMarket — buy", function () {
  it("buy happy path: exact 95/5 split, NFT to buyer, listing closed, Sold event", async function () {
    const { nft, market, alice, bob, price } = await deployFixture();
    const tokenId = await mintOne(nft, alice, price);
    await nft.connect(alice).approve(await market.getAddress(), tokenId);
    const listPrice = ethers.parseEther("0.01"); // 95% = 0.0095, 5% = 0.0005
    await market.connect(alice).list(tokenId, listPrice);

    const sellerBefore = await ethers.provider.getBalance(alice.address);
    const revBefore = await ethers.provider.getBalance(REVENUE);

    await expect(market.connect(bob).buy(1, { value: listPrice }))
      .to.emit(market, "Sold")
      .withArgs(1, alice.address, bob.address, tokenId, listPrice, ethers.parseEther("0.0005"));

    expect(await nft.ownerOf(tokenId)).to.equal(bob.address);
    expect(await market.isListed(tokenId)).to.equal(false);
    expect(await market.listingIdOf(tokenId)).to.equal(0);
    const l = await market.getListing(1);
    expect(l.active).to.equal(false);
    expect(await ethers.provider.getBalance(alice.address)).to.equal(sellerBefore + ethers.parseEther("0.0095"));
    expect(await ethers.provider.getBalance(REVENUE)).to.equal(revBefore + ethers.parseEther("0.0005"));
    expect(await ethers.provider.getBalance(await market.getAddress())).to.equal(0);
  });

  it("buy reverts: underpayment, overpayment, unknown listing, double-buy", async function () {
    const { nft, market, alice, bob, price } = await deployFixture();
    const tokenId = await mintOne(nft, alice, price);
    await nft.connect(alice).approve(await market.getAddress(), tokenId);
    const listPrice = ethers.parseEther("0.01");
    await market.connect(alice).list(tokenId, listPrice);

    await expect(market.connect(bob).buy(1, { value: ethers.parseEther("0.0099") }))
      .to.be.revertedWithCustomError(market, "IncorrectPayment")
      .withArgs(listPrice, ethers.parseEther("0.0099"));
    await expect(market.connect(bob).buy(1, { value: ethers.parseEther("0.0101") }))
      .to.be.revertedWithCustomError(market, "IncorrectPayment")
      .withArgs(listPrice, ethers.parseEther("0.0101"));
    await expect(market.connect(bob).buy(99, { value: listPrice }))
      .to.be.revertedWithCustomError(market, "ListingNotFound");
    await expect(market.connect(bob).buy(0, { value: listPrice }))
      .to.be.revertedWithCustomError(market, "ListingNotFound");

    await market.connect(bob).buy(1, { value: listPrice });
    await expect(market.connect(bob).buy(1, { value: listPrice }))
      .to.be.revertedWithCustomError(market, "ListingNotActive");
  });

  it("buy can be re-listed by the new owner after a sale", async function () {
    const { nft, market, alice, bob, price } = await deployFixture();
    const tokenId = await mintOne(nft, alice, price);
    await nft.connect(alice).approve(await market.getAddress(), tokenId);
    await market.connect(alice).list(tokenId, ethers.parseEther("0.01"));
    await market.connect(bob).buy(1, { value: ethers.parseEther("0.01") });
    await nft.connect(bob).approve(await market.getAddress(), tokenId);
    await market.connect(bob).list(tokenId, ethers.parseEther("0.02"));
    expect(await market.listingCount()).to.equal(2);
    expect(await market.isListed(tokenId)).to.equal(true);
    expect(await market.listingIdOf(tokenId)).to.equal(2);
  });
});

describe("HanamiMarket — cancel", function () {
  it("cancel happy path: NFT returns to seller, listing closed, Cancelled event", async function () {
    const { nft, market, alice, price } = await deployFixture();
    const tokenId = await mintOne(nft, alice, price);
    await nft.connect(alice).approve(await market.getAddress(), tokenId);
    await market.connect(alice).list(tokenId, ethers.parseEther("0.01"));

    await expect(market.connect(alice).cancel(1))
      .to.emit(market, "Cancelled")
      .withArgs(1, alice.address, tokenId);

    expect(await nft.ownerOf(tokenId)).to.equal(alice.address);
    expect(await market.isListed(tokenId)).to.equal(false);
    expect(await market.listingIdOf(tokenId)).to.equal(0);
    expect((await market.getListing(1)).active).to.equal(false);
  });

  it("cancel reverts: non-seller, already cancelled, unknown listing", async function () {
    const { nft, market, alice, bob, price } = await deployFixture();
    const tokenId = await mintOne(nft, alice, price);
    await nft.connect(alice).approve(await market.getAddress(), tokenId);
    await market.connect(alice).list(tokenId, ethers.parseEther("0.01"));

    await expect(market.connect(bob).cancel(1))
      .to.be.revertedWithCustomError(market, "NotSeller");
    await expect(market.connect(alice).cancel(99))
      .to.be.revertedWithCustomError(market, "ListingNotFound");
    await market.connect(alice).cancel(1);
    await expect(market.connect(alice).cancel(1))
      .to.be.revertedWithCustomError(market, "ListingNotActive");
  });

  it("cancelled token can be listed again (new listing id)", async function () {
    const { nft, market, alice, price } = await deployFixture();
    const tokenId = await mintOne(nft, alice, price);
    await nft.connect(alice).approve(await market.getAddress(), tokenId);
    await market.connect(alice).list(tokenId, ethers.parseEther("0.01"));
    await market.connect(alice).cancel(1);
    // Single-token approval is spent by the escrow transfer;
    // approve again before re-listing.
    await nft.connect(alice).approve(await market.getAddress(), tokenId);
    await market.connect(alice).list(tokenId, ethers.parseEther("0.03"));
    expect(await market.listingCount()).to.equal(2);
    expect(await market.listingIdOf(tokenId)).to.equal(2);
    expect(await market.isListed(tokenId)).to.equal(true);
  });
});

describe("HanamiMarket — royalty receiver admin", function () {
  it("setRoyaltyReceiver only by owner, reverts on zero address, changes the 5% split", async function () {
    const { nft, market, alice, bob, carol, deployer, price } = await deployFixture();
    await expect(market.connect(alice).setRoyaltyReceiver(carol.address))
      .to.be.revertedWithCustomError(market, "OwnableUnauthorizedAccount");
    await expect(market.setRoyaltyReceiver(ethers.ZeroAddress))
      .to.be.revertedWithCustomError(market, "InvalidAddress");

    const tokenId = await mintOne(nft, alice, price);
    await nft.connect(alice).approve(await market.getAddress(), tokenId);
    await market.connect(alice).list(tokenId, ethers.parseEther("0.01"));

    await expect(market.setRoyaltyReceiver(carol.address))
      .to.emit(market, "RoyaltyReceiverUpdated")
      .withArgs(carol.address);
    expect(await market.royaltyReceiver()).to.equal(carol.address);

    const carolBefore = await ethers.provider.getBalance(carol.address);
    const revBefore = await ethers.provider.getBalance(REVENUE);
    await market.connect(bob).buy(1, { value: ethers.parseEther("0.01") });
    expect(await ethers.provider.getBalance(carol.address)).to.equal(carolBefore + ethers.parseEther("0.0005"));
    expect(await ethers.provider.getBalance(REVENUE)).to.equal(revBefore); // old receiver gets nothing
    expect(await deployer.address).to.not.equal(carol.address);
  });
});

describe("HanamiMarket — deployment gas", function () {
  it("reports deployment gas for the market contract", async function () {
    const { nft, deployer } = await deployFixture();
    const Market = await ethers.getContractFactory("HanamiMarket");
    const tx = await Market.getDeployTransaction(await nft.getAddress(), REVENUE, deployer.address);
    const gas = await ethers.provider.estimateGas(tx);
    console.log("        HanamiMarket deploy gas (estimate):", gas.toString());
    const market = await Market.deploy(await nft.getAddress(), REVENUE, deployer.address);
    const receipt = await market.deploymentTransaction().wait();
    console.log("        HanamiMarket deploy gas (actual):  ", receipt.gasUsed.toString());
    expect(receipt.gasUsed).to.be.greaterThan(0);
  });
});
