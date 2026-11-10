const fs = require("node:fs");
const path = require("node:path");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// HanamiBloomNFTv3 tests — the rebuild Bryan confirmed 10 Nov 2026,
// with free and paid SEPARATED at his instruction (18:29 WIB):
//   mintFree() — FREE, max 1 free mint per wallet, 1,000 total.
//   mint()     — PAID only, flat 0.0003 BNB, no wallet cap.
// One contract, one deck (3,333). A wallet may call mint()
// any time — before or after its free mint — and paying never
// consumes the free mint; using the free mint never blocks
// paid mints. Free mints earn NO $HANA bonus; paid mints earn
// 12,000 $HANA. currentPrice() is a constant (0.0003 BNB),
// no longer caller-dependent.
// The v2 contract (Hanami.test.js) is untouched; these tests
// deploy a fresh v3 instance with the same deckHash, rarity
// bitmap, baseURI and a fresh local HanaToken (the live v2
// token 0xe08E... does not exist on the local network).

const PROJECT = path.join(__dirname, "..", "..");
const MANIFEST = JSON.parse(fs.readFileSync(path.join(PROJECT, "collection", "collection.json"), "utf8"));
const BITMAP = JSON.parse(fs.readFileSync(path.join(PROJECT, "collection", "rarity-bitmap.json"), "utf8"));
const DECK = JSON.parse(fs.readFileSync(path.join(PROJECT, "scripts", "deck.json"), "utf8"));

const DECK_HASH = MANIFEST.deckHash;
const BASE_URI = MANIFEST.baseURI;
const BITMAP_WORDS = BITMAP.bitmap.map((w) => BigInt(w));
const EXPECTED_HASH = "0x8fb75680350c5af5e33d74652c701b544fb64884d96df252cc20430af2a21c28";

const OWNER = "0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097"; // My Wallet
const REVENUE = "0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7"; // Agentic Wallet
const REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F"; // SPACE ID
const PRICE = ethers.parseEther("0.0003");
const BONUS = ethers.parseEther("12000");
const FREE_CAP = 1000;

async function deployFixture() {
  const [deployer, alice, bob, carol] = await ethers.getSigners();
  const Mock = await ethers.getContractFactory("MockAgentIdRegistry");
  const mock = await Mock.deploy();
  await mock.waitForDeployment();
  const Token = await ethers.getContractFactory("HanaToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  const Nft = await ethers.getContractFactory("HanamiBloomNFTv3");
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
  return { nft, token, mock, deployer, alice, bob, carol };
}

async function giveAgentId(mock, wallet) {
  await mock.mintTo(wallet.address);
}

function parseMinted(nft, receipt) {
  return receipt.logs
    .map((l) => { try { return nft.interface.parseLog(l); } catch { return null; } })
    .find((e) => e && e.name === "Minted");
}

describe("HanamiBloomNFTv3 — constructor & config", function () {
  it("constructor sets v3 pricing: MINT_PRICE 0.0003, FREE_MINT_CAP 1000, freeMinted 0, same deck", async function () {
    const { nft, token, deployer } = await deployFixture();
    expect(await nft.owner()).to.equal(deployer.address);
    expect(await nft.revenueWallet()).to.equal(REVENUE);
    expect(await nft.deckHash()).to.equal(DECK_HASH);
    expect(await nft.deckHash()).to.equal(EXPECTED_HASH);
    expect(await nft.baseURI()).to.equal(BASE_URI);
    expect(await nft.hanaToken()).to.equal(await token.getAddress());
    expect(await nft.mintActive()).to.equal(false);
    expect(await nft.totalSupply()).to.equal(0);
    expect(await nft.MAX_SUPPLY()).to.equal(3333);
    expect(await nft.MINT_PRICE()).to.equal(PRICE);
    expect(await nft.MINT_BONUS()).to.equal(BONUS);
    expect(await nft.FREE_MINT_CAP()).to.equal(FREE_CAP);
    expect(await nft.freeMinted()).to.equal(0);
    expect(await nft.freeRemaining()).to.equal(FREE_CAP);
    expect(await nft.agentIdCheckRequired()).to.equal(true);
    const [receiver, amount] = await nft.royaltyInfo(1, ethers.parseEther("1"));
    expect(receiver).to.equal(REVENUE);
    expect(amount).to.equal(ethers.parseEther("0.05"));
  });

  it("currentPrice is the flat 0.0003 BNB for every caller (no longer caller-dependent)", async function () {
    const { nft, alice, bob } = await deployFixture();
    await nft.setMintActive(true);
    expect(await nft.currentPrice()).to.equal(PRICE);
    expect(await nft.connect(alice).currentPrice()).to.equal(PRICE);
    expect(await nft.connect(bob).currentPrice()).to.equal(PRICE);
  });
});

describe("HanamiBloomNFTv3 — mintFree", function () {
  it("first mintFree per wallet is FREE: value 0, no payment, NO $HANA, freeMinted 1", async function () {
    const { nft, token, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    const revBefore = await ethers.provider.getBalance(REVENUE);
    const tx = await nft.connect(alice).mintFree({ value: 0 });
    const receipt = await tx.wait();
    const minted = parseMinted(nft, receipt);
    expect(minted).to.not.equal(undefined);
    expect(minted.args.free).to.equal(true);
    expect(minted.args.price).to.equal(0);
    const tokenId = minted.args.tokenId;
    expect(tokenId).to.be.greaterThan(0);
    expect(tokenId).to.be.lessThanOrEqual(3333);
    expect(await nft.ownerOf(tokenId)).to.equal(alice.address);
    expect(await nft.totalSupply()).to.equal(1);
    expect(await nft.freeMinted()).to.equal(1);
    expect(await nft.freeRemaining()).to.equal(999);
    expect(await nft.hasFreeMinted(alice.address)).to.equal(true);
    expect(await nft.mintCount(alice.address)).to.equal(1);
    // No BNB moved anywhere; the NFT contract keeps nothing.
    expect(await ethers.provider.getBalance(REVENUE)).to.equal(revBefore);
    expect(await ethers.provider.getBalance(await nft.getAddress())).to.equal(0);
    // Free mint earns NO $HANA bonus.
    expect(await token.balanceOf(alice.address)).to.equal(0);
    // Deck still drew a real token from the same deck.
    expect(await nft.rarityOf(tokenId)).to.equal(DECK[Number(tokenId) - 1]);
    expect(await nft.tokenURI(tokenId)).to.equal(`${BASE_URI}${tokenId}.json`);
  });

  it("second mintFree from the same wallet reverts FreeMintAlreadyUsed", async function () {
    const { nft, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    await nft.connect(alice).mintFree({ value: 0 });
    expect(await nft.freeMinted()).to.equal(1);
    await expect(nft.connect(alice).mintFree({ value: 0 }))
      .to.be.revertedWithCustomError(nft, "FreeMintAlreadyUsed");
    await expect(nft.connect(alice).mintFree({ value: PRICE }))
      .to.be.revertedWithCustomError(nft, "FreeMintAlreadyUsed");
    expect(await nft.freeMinted()).to.equal(1);
    expect(await nft.totalSupply()).to.equal(1);
  });

  it("a different wallet still gets its free mint after another wallet used theirs", async function () {
    const { nft, token, mock, alice, bob } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    await giveAgentId(mock, bob);
    await nft.connect(alice).mintFree({ value: 0 });
    const tx = await nft.connect(bob).mintFree({ value: 0 });
    const receipt = await tx.wait();
    expect(parseMinted(nft, receipt).args.free).to.equal(true);
    expect(await nft.freeMinted()).to.equal(2);
    expect(await nft.freeRemaining()).to.equal(998);
    expect(await token.balanceOf(bob.address)).to.equal(0);
  });

  it("BNB sent with a free mint is refunded in full (net cost = gas only)", async function () {
    const { nft, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    const balBefore = await ethers.provider.getBalance(alice.address);
    const tx = await nft.connect(alice).mintFree({ value: ethers.parseEther("0.001") });
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(alice.address);
    expect(balBefore - balAfter).to.equal(gasCost);
    expect(await ethers.provider.getBalance(await nft.getAddress())).to.equal(0);
  });

  it("mintFree reverts MintInactive before activation", async function () {
    const { nft, mock, alice } = await deployFixture();
    await giveAgentId(mock, alice);
    await expect(nft.connect(alice).mintFree({ value: 0 })).to.be.revertedWithCustomError(nft, "MintInactive");
  });

  it("mintFree reverts NoAgentId without an Agent ID", async function () {
    const { nft, alice } = await deployFixture();
    await nft.setMintActive(true);
    await expect(nft.connect(alice).mintFree({ value: 0 })).to.be.revertedWithCustomError(nft, "NoAgentId");
  });

  it("mintFree reverts NoContracts via MockGenericCaller", async function () {
    const { nft, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    const Caller = await ethers.getContractFactory("MockGenericCaller");
    const caller = await Caller.deploy();
    await caller.waitForDeployment();
    const data = nft.interface.encodeFunctionData("mintFree", []);
    expect(await caller.tryCall.staticCall(await nft.getAddress(), data, { value: 0 })).to.equal(false);
    await caller.tryCall(await nft.getAddress(), data, { value: 0 });
    expect(await nft.totalSupply()).to.equal(0);
  });
});

describe("HanamiBloomNFTv3 — mint (paid)", function () {
  it("paid mint works BEFORE the wallet's free mint is used — and the free mint stays available", async function () {
    const { nft, token, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    const revBefore = await ethers.provider.getBalance(REVENUE);
    // Pay first: free mint must NOT be consumed by paying.
    const tx = await nft.connect(alice).mint({ value: PRICE });
    const receipt = await tx.wait();
    const minted = parseMinted(nft, receipt);
    expect(minted.args.free).to.equal(false);
    expect(minted.args.price).to.equal(PRICE);
    expect(await nft.totalSupply()).to.equal(1);
    expect(await nft.freeMinted()).to.equal(0);
    expect(await nft.hasFreeMinted(alice.address)).to.equal(false);
    expect(await ethers.provider.getBalance(REVENUE)).to.equal(revBefore + PRICE);
    expect(await token.balanceOf(alice.address)).to.equal(BONUS);
    // The free mint is still there afterwards.
    const tx2 = await nft.connect(alice).mintFree({ value: 0 });
    const receipt2 = await tx2.wait();
    expect(parseMinted(nft, receipt2).args.free).to.equal(true);
    expect(await nft.freeMinted()).to.equal(1);
    expect(await nft.hasFreeMinted(alice.address)).to.equal(true);
    expect(await nft.totalSupply()).to.equal(2);
    expect(await token.balanceOf(alice.address)).to.equal(BONUS); // no extra bonus for free
  });

  it("paid mint after the free mint: 0.0003 to revenue, +12,000 $HANA, freeMinted unchanged", async function () {
    const { nft, token, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    await nft.connect(alice).mintFree({ value: 0 }); // free first
    expect(await nft.freeMinted()).to.equal(1);
    const revBefore = await ethers.provider.getBalance(REVENUE);
    const tx = await nft.connect(alice).mint({ value: PRICE });
    const receipt = await tx.wait();
    const minted = parseMinted(nft, receipt);
    expect(minted.args.free).to.equal(false);
    expect(minted.args.price).to.equal(PRICE);
    expect(await nft.totalSupply()).to.equal(2);
    expect(await nft.freeMinted()).to.equal(1); // unchanged
    expect(await nft.hasFreeMinted(alice.address)).to.equal(true);
    expect(await nft.mintCount(alice.address)).to.equal(2);
    expect(await ethers.provider.getBalance(REVENUE)).to.equal(revBefore + PRICE);
    expect(await token.balanceOf(alice.address)).to.equal(BONUS);
  });

  it("paid mint reverts IncorrectPayment when underpaying", async function () {
    const { nft, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    await expect(nft.connect(alice).mint({ value: PRICE - 1n }))
      .to.be.revertedWithCustomError(nft, "IncorrectPayment")
      .withArgs(PRICE, PRICE - 1n);
    await expect(nft.connect(alice).mint({ value: 0 }))
      .to.be.revertedWithCustomError(nft, "IncorrectPayment")
      .withArgs(PRICE, 0);
    expect(await nft.totalSupply()).to.equal(0);
  });

  it("overpayment on a paid mint is refunded in full", async function () {
    const { nft, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    const over = ethers.parseEther("0.001");
    const balBefore = await ethers.provider.getBalance(alice.address);
    const tx = await nft.connect(alice).mint({ value: over });
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(alice.address);
    expect(balBefore - balAfter).to.equal(PRICE + gasCost);
    expect(await nft.totalSupply()).to.equal(1);
    expect(await nft.freeMinted()).to.equal(0);
  });

  it("paid mint reverts MintInactive before activation", async function () {
    const { nft, mock, alice } = await deployFixture();
    await giveAgentId(mock, alice);
    await expect(nft.connect(alice).mint({ value: PRICE })).to.be.revertedWithCustomError(nft, "MintInactive");
  });

  it("paid mint reverts NoAgentId without an Agent ID", async function () {
    const { nft, alice } = await deployFixture();
    await nft.setMintActive(true);
    await expect(nft.connect(alice).mint({ value: PRICE })).to.be.revertedWithCustomError(nft, "NoAgentId");
  });

  it("paid mint reverts NoContracts via MockGenericCaller", async function () {
    const { nft, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    const Caller = await ethers.getContractFactory("MockGenericCaller");
    const caller = await Caller.deploy();
    await caller.waitForDeployment();
    const data = nft.interface.encodeFunctionData("mint", []);
    expect(await caller.tryCall.staticCall(await nft.getAddress(), data, { value: PRICE })).to.equal(false);
    await caller.tryCall(await nft.getAddress(), data, { value: PRICE });
    expect(await nft.totalSupply()).to.equal(0);
  });
});

describe("HanamiBloomNFTv3 — deck & $HANA across mixed mints", function () {
  it("token IDs are unique across free + paid mints; $HANA only for paid ones", async function () {
    const { nft, token, mock, alice, bob, carol } = await deployFixture();
    await nft.setMintActive(true);
    for (const w of [alice, bob, carol]) await giveAgentId(mock, w);
    const seen = new Set();
    // 3 free mints (one per wallet) + 3 paid mints (alice again x3).
    for (const w of [alice, bob, carol]) {
      const receipt = await (await nft.connect(w).mintFree({ value: 0 })).wait();
      const tokenId = Number(parseMinted(nft, receipt).args.tokenId);
      expect(seen.has(tokenId)).to.equal(false, `duplicate token ${tokenId}`);
      seen.add(tokenId);
    }
    for (let i = 0; i < 3; i++) {
      const receipt = await (await nft.connect(alice).mint({ value: PRICE })).wait();
      const tokenId = Number(parseMinted(nft, receipt).args.tokenId);
      expect(seen.has(tokenId)).to.equal(false, `duplicate token ${tokenId}`);
      seen.add(tokenId);
    }
    expect(seen.size).to.equal(6);
    expect(await nft.totalSupply()).to.equal(6);
    expect(await nft.freeMinted()).to.equal(3);
    expect(await nft.deckRemaining()).to.equal(3333 - 6);
    expect(await nft.mintCount(alice.address)).to.equal(4); // 1 free + 3 paid
    expect(await token.balanceOf(alice.address)).to.equal(BONUS * 3n);
    expect(await token.balanceOf(bob.address)).to.equal(0);
    expect(await token.balanceOf(carol.address)).to.equal(0);
    const rem =
      Number(await nft.commonsRemaining()) +
      Number(await nft.raresRemaining()) +
      Number(await nft.epicsRemaining()) +
      Number(await nft.legendariesRemaining());
    expect(rem).to.equal(3333 - 6);
  });
});

describe("HanamiBloomNFTv3 — free-cap boundary", function () {
  it("free allocation exhausts at exactly 1000: the 1001st wallet's mintFree reverts, paid mint still works", async function () {
    this.timeout(600000);
    const { nft } = await deployFixture();
    await nft.setMintActive(true);
    // Escape hatch: no Agent ID needed, so fresh wallets can mint.
    await nft.setAgentIdCheckRequired(false);
    const wallets = [];
    for (let i = 0; i < 1001; i++) {
      const w = ethers.Wallet.createRandom().connect(ethers.provider);
      await ethers.provider.send("hardhat_setBalance", [w.address, ethers.toBeHex(ethers.parseEther("1"))]);
      wallets.push(w);
    }
    for (let i = 0; i < 1000; i++) {
      await nft.connect(wallets[i]).mintFree({ value: 0 });
    }
    expect(await nft.freeMinted()).to.equal(1000);
    expect(await nft.freeRemaining()).to.equal(0);
    expect(await nft.totalSupply()).to.equal(1000);
    // The 1001st wallet has no free mint left: mintFree reverts.
    await expect(nft.connect(wallets[1000]).mintFree({ value: 0 }))
      .to.be.revertedWithCustomError(nft, "FreeMintExhausted");
    // Paying still works and does not move freeMinted.
    const receipt = await (await nft.connect(wallets[1000]).mint({ value: PRICE })).wait();
    expect(parseMinted(nft, receipt).args.free).to.equal(false);
    expect(await nft.freeMinted()).to.equal(1000);
    expect(await nft.totalSupply()).to.equal(1001);
  });
});

describe("HanamiBloomNFTv3 + HanamiMarket — full list / buy cycle", function () {
  it("v3 NFT lists and sells on the existing HanamiMarket with the 95/5 split", async function () {
    const { nft, token, deployer, alice, bob } = await deployFixture();
    const Market = await ethers.getContractFactory("HanamiMarket");
    const market = await Market.deploy(await nft.getAddress(), REVENUE, deployer.address);
    await market.waitForDeployment();

    // Alice free-mints a v3 NFT (agent check off for the test).
    await nft.setMintActive(true);
    await nft.setAgentIdCheckRequired(false);
    const receipt = await (await nft.connect(alice).mintFree({ value: 0 })).wait();
    const tokenId = parseMinted(nft, receipt).args.tokenId;
    expect(await token.balanceOf(alice.address)).to.equal(0); // free = no HANA

    // List at 0.01 BNB.
    const LIST_PRICE = ethers.parseEther("0.01");
    await nft.connect(alice).approve(await market.getAddress(), tokenId);
    await market.connect(alice).list(tokenId, LIST_PRICE);
    expect(await market.isListed(tokenId)).to.equal(true);
    expect(await nft.ownerOf(tokenId)).to.equal(await market.getAddress());

    // Bob buys with the exact price: 95% to Alice, 5% to Agentic.
    const aliceBefore = await ethers.provider.getBalance(alice.address);
    const revBefore = await ethers.provider.getBalance(REVENUE);
    await market.connect(bob).buy(1, { value: LIST_PRICE });
    expect(await nft.ownerOf(tokenId)).to.equal(bob.address);
    expect(await market.isListed(tokenId)).to.equal(false);
    expect(await ethers.provider.getBalance(alice.address)).to.equal(aliceBefore + ethers.parseEther("0.0095"));
    expect(await ethers.provider.getBalance(REVENUE)).to.equal(revBefore + ethers.parseEther("0.0005"));
    expect(await ethers.provider.getBalance(await market.getAddress())).to.equal(0);
  });
});
