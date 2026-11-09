const fs = require("node:fs");
const path = require("node:path");
const { expect } = require("chai");
const { ethers } = require("hardhat");

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
const TREASURY = ethers.parseEther("460000000");
const CAP = ethers.parseEther("1000000000");

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
  return { nft, token, mock, deployer, alice, bob, carol };
}

async function giveAgentId(mock, wallet) {
  await mock.mintTo(wallet.address);
}

describe("HanamiBloomNFT — constructor & config", function () {
  it("constructor sets owner / revenue / deckHash / baseURI / royalty / token / mintActive false / totalSupply 0", async function () {
    const { nft, token, deployer } = await deployFixture();
    expect(await nft.owner()).to.equal(deployer.address);
    expect(await nft.revenueWallet()).to.equal(REVENUE);
    expect(await nft.deckHash()).to.equal(DECK_HASH);
    expect(await nft.baseURI()).to.equal(BASE_URI);
    expect(await nft.hanaToken()).to.equal(await token.getAddress());
    expect(await nft.mintActive()).to.equal(false);
    expect(await nft.totalSupply()).to.equal(0);
    expect(await nft.MAX_SUPPLY()).to.equal(3333);
    expect(await nft.MINT_PRICE()).to.equal(PRICE);
    expect(await nft.MINT_BONUS()).to.equal(BONUS);
    expect(await nft.deckDrawn()).to.equal(0);
    expect(await nft.deckRemaining()).to.equal(3333);
    expect(await nft.commonsRemaining()).to.equal(2000);
    expect(await nft.raresRemaining()).to.equal(1000);
    expect(await nft.epicsRemaining()).to.equal(300);
    expect(await nft.legendariesRemaining()).to.equal(33);
    expect(await nft.agentIdCheckRequired()).to.equal(true);
    expect(await nft.agentIdRegistry()).to.not.equal(ethers.ZeroAddress);
    const [receiver, amount] = await nft.royaltyInfo(1, ethers.parseEther("1"));
    expect(receiver).to.equal(REVENUE);
    expect(amount).to.equal(ethers.parseEther("0.05"));
  });

  it("deckHash on-chain equals the off-chain hash of deck.json", async function () {
    const { nft } = await deployFixture();
    expect(await nft.deckHash()).to.equal(EXPECTED_HASH);
    const raw = fs.readFileSync(path.join(PROJECT, "scripts", "deck.json"));
    expect(ethers.keccak256(raw)).to.equal(EXPECTED_HASH);
  });

  it("rarityOf matches the deck for every token (full 3333 loop vs bitmap)", async function () {
    const { nft } = await deployFixture();
    for (let t = 1; t <= 3333; t++) {
      expect(await nft.rarityOf(t)).to.equal(DECK[t - 1], `token ${t}`);
    }
  });

  it("rarityOf reverts for token 0 and token 3334", async function () {
    const { nft } = await deployFixture();
    await expect(nft.rarityOf(0)).to.be.revertedWithCustomError(nft, "ExceedsMaxSupply");
    await expect(nft.rarityOf(3334)).to.be.revertedWithCustomError(nft, "ExceedsMaxSupply");
  });

  it("constructor reverts on a zero address", async function () {
    const { token, deployer, mock } = await deployFixture();
    const Nft = await ethers.getContractFactory("HanamiBloomNFT");
    await expect(
      Nft.deploy(deployer.address, ethers.ZeroAddress, await mock.getAddress(), BASE_URI, DECK_HASH, BITMAP_WORDS, await token.getAddress())
    ).to.be.revertedWithCustomError(Nft, "InvalidAddress");
    await expect(
      Nft.deploy(deployer.address, REVENUE, await mock.getAddress(), BASE_URI, DECK_HASH, BITMAP_WORDS, ethers.ZeroAddress)
    ).to.be.revertedWithCustomError(Nft, "InvalidAddress");
  });
});

describe("HanamiBloomNFT — mint guards", function () {
  it("mint reverts MintInactive before activation", async function () {
    const { nft, mock, alice } = await deployFixture();
    await giveAgentId(mock, alice);
    await expect(nft.connect(alice).mint({ value: PRICE })).to.be.revertedWithCustomError(nft, "MintInactive");
  });

  it("mint reverts NoAgentId without an Agent ID", async function () {
    const { nft, alice } = await deployFixture();
    await nft.setMintActive(true);
    await expect(nft.connect(alice).mint({ value: PRICE })).to.be.revertedWithCustomError(nft, "NoAgentId");
  });

  it("mint reverts NoContracts via MockGenericCaller", async function () {
    const { nft, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    const Caller = await ethers.getContractFactory("MockGenericCaller");
    const caller = await Caller.deploy();
    await caller.waitForDeployment();
    const data = nft.interface.encodeFunctionData("mint", []);
    // The inner mint() reverts (NoContracts), so tryCall must
    // return ok=false instead of reverting, and no NFT is minted.
    expect(await caller.tryCall.staticCall(await nft.getAddress(), data, { value: PRICE })).to.equal(false);
    await caller.tryCall(await nft.getAddress(), data, { value: PRICE });
    expect(await nft.totalSupply()).to.equal(0);
  });

  it("mint reverts IncorrectPayment when underpaying", async function () {
    const { nft, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    await expect(nft.connect(alice).mint({ value: PRICE - 1n }))
      .to.be.revertedWithCustomError(nft, "IncorrectPayment")
      .withArgs(PRICE, PRICE - 1n);
    await expect(nft.connect(alice).mint({ value: 0 })).to.be.revertedWithCustomError(nft, "IncorrectPayment");
  });

  it("holdsAgentId is true with an Agent ID, false without", async function () {
    const { nft, mock, alice, bob } = await deployFixture();
    expect(await nft.holdsAgentId(alice.address)).to.equal(false);
    await giveAgentId(mock, alice);
    expect(await nft.holdsAgentId(alice.address)).to.equal(true);
    expect(await nft.holdsAgentId(bob.address)).to.equal(false);
  });

  it("currentPrice is 0.0003 BNB once active", async function () {
    const { nft, alice } = await deployFixture();
    await nft.setMintActive(true);
    expect(await nft.connect(alice).currentPrice()).to.equal(PRICE);
  });
});

describe("HanamiBloomNFT — successful mint", function () {
  it("exact payment mints 1 NFT, forwards 0.0003 to revenue, pays 12000 HANA bonus", async function () {
    const { nft, token, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    const revBefore = await ethers.provider.getBalance(REVENUE);
    const tx = await nft.connect(alice).mint({ value: PRICE });
    const receipt = await tx.wait();
    const minted = receipt.logs
      .map((l) => { try { return nft.interface.parseLog(l); } catch { return null; } })
      .find((e) => e && e.name === "Minted");
    expect(minted).to.not.equal(undefined);
    const tokenId = minted.args.tokenId;
    expect(tokenId).to.be.greaterThan(0);
    expect(tokenId).to.be.lessThanOrEqual(3333);
    expect(await nft.ownerOf(tokenId)).to.equal(alice.address);
    expect(await nft.totalSupply()).to.equal(1);
    expect(await nft.deckDrawn()).to.equal(1);
    expect(await nft.deckRemaining()).to.equal(3332);
    expect(await nft.mintCount(alice.address)).to.equal(1);
    expect(await nft.rarityOf(tokenId)).to.equal(DECK[Number(tokenId) - 1]);
    expect(await nft.tokenURI(tokenId)).to.equal(`${BASE_URI}${tokenId}.json`);
    expect(await nft.tokenSeed(tokenId)).to.not.equal(ethers.ZeroHash);
    // Payment forwarded in full to the revenue wallet.
    expect(await ethers.provider.getBalance(REVENUE)).to.equal(revBefore + PRICE);
    // NFT contract keeps nothing from the mint.
    expect(await ethers.provider.getBalance(await nft.getAddress())).to.equal(0);
    // Bonus: 12,000 HANA to the minter.
    expect(await token.balanceOf(alice.address)).to.equal(BONUS);
    // Rarity counter of the drawn token decreased by exactly 1.
    const r = Number(await nft.rarityOf(tokenId));
    const remaining = [await nft.commonsRemaining(), await nft.raresRemaining(), await nft.epicsRemaining(), await nft.legendariesRemaining()];
    const expected = [2000, 1000, 300, 33];
    expected[r] -= 1;
    expect(remaining.map(Number)).to.deep.equal(expected);
  });

  it("overpayment is refunded in full", async function () {
    const { nft, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    const over = ethers.parseEther("0.001");
    const balBefore = await ethers.provider.getBalance(alice.address);
    const tx = await nft.connect(alice).mint({ value: over });
    const receipt = await tx.wait();
    const gasCost = receipt.gasUsed * receipt.gasPrice;
    const balAfter = await ethers.provider.getBalance(alice.address);
    // Alice paid 0.001 but got 0.0007 back: net cost = price + gas.
    expect(balBefore - balAfter).to.equal(PRICE + gasCost);
    expect(await nft.totalSupply()).to.equal(1);
  });

  it("token IDs are unique across many mints and the same wallet can mint repeatedly (no cap)", async function () {
    const { nft, token, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    const seen = new Set();
    const N = 25;
    for (let i = 0; i < N; i++) {
      const tx = await nft.connect(alice).mint({ value: PRICE });
      const receipt = await tx.wait();
      const minted = receipt.logs
        .map((l) => { try { return nft.interface.parseLog(l); } catch { return null; } })
        .find((e) => e && e.name === "Minted");
      const tokenId = Number(minted.args.tokenId);
      expect(seen.has(tokenId)).to.equal(false, `duplicate token ${tokenId}`);
      seen.add(tokenId);
    }
    expect(seen.size).to.equal(N);
    expect(await nft.totalSupply()).to.equal(N);
    expect(await nft.mintCount(alice.address)).to.equal(N);
    expect(await token.balanceOf(alice.address)).to.equal(BONUS * BigInt(N));
    // Rarity counters sum to remaining deck.
    const rem =
      Number(await nft.commonsRemaining()) +
      Number(await nft.raresRemaining()) +
      Number(await nft.epicsRemaining()) +
      Number(await nft.legendariesRemaining());
    expect(rem).to.equal(3333 - N);
  });

  it("royaltyInfo is 5% to the Agentic Wallet", async function () {
    const { nft } = await deployFixture();
    const [receiver, amount] = await nft.royaltyInfo(1, ethers.parseEther("1"));
    expect(receiver).to.equal(REVENUE);
    expect(amount).to.equal(ethers.parseEther("0.05"));
    const [, amount2] = await nft.royaltyInfo(999, ethers.parseEther("0.0003"));
    expect(amount2).to.equal(ethers.parseEther("0.000015"));
  });
});

describe("HanamiBloomNFT — owner-only admin", function () {
  it("setMintActive only by owner", async function () {
    const { nft, alice } = await deployFixture();
    await expect(nft.connect(alice).setMintActive(true)).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    await nft.setMintActive(true);
    expect(await nft.mintActive()).to.equal(true);
    await nft.setMintActive(false);
    expect(await nft.mintActive()).to.equal(false);
  });

  it("setBaseURI / setAgentIdRegistry / setAgentIdCheckRequired only by owner", async function () {
    const { nft, mock, alice } = await deployFixture();
    await expect(nft.connect(alice).setBaseURI("https://example.com/")).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    await expect(nft.connect(alice).setAgentIdRegistry(await mock.getAddress())).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    await expect(nft.connect(alice).setAgentIdCheckRequired(false)).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    await nft.setBaseURI("https://example.com/");
    expect(await nft.baseURI()).to.equal("https://example.com/");
    await nft.setAgentIdCheckRequired(false);
    expect(await nft.agentIdCheckRequired()).to.equal(false);
    await expect(nft.setAgentIdRegistry(ethers.ZeroAddress)).to.be.revertedWithCustomError(nft, "InvalidAddress");
  });

  it("mint works with the Agent ID check disabled (escape hatch)", async function () {
    const { nft, alice } = await deployFixture();
    await nft.setMintActive(true);
    await nft.setAgentIdCheckRequired(false);
    await nft.connect(alice).mint({ value: PRICE });
    expect(await nft.totalSupply()).to.equal(1);
  });

  it("withdraw safety valve sends force-sent BNB to revenue, reverts NoFunds when empty", async function () {
    const { nft, deployer, alice } = await deployFixture();
    await expect(nft.withdraw()).to.be.revertedWithCustomError(nft, "NoFunds");
    await expect(nft.connect(alice).withdraw()).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    const Force = await ethers.getContractFactory("MockForceSend");
    const force = await Force.deploy();
    await force.waitForDeployment();
    const revBefore = await ethers.provider.getBalance(REVENUE);
    await force.boom(await nft.getAddress(), { value: ethers.parseEther("0.5") });
    expect(await ethers.provider.getBalance(await nft.getAddress())).to.equal(ethers.parseEther("0.5"));
    await nft.connect(deployer).withdraw();
    expect(await ethers.provider.getBalance(await nft.getAddress())).to.equal(0);
    expect(await ethers.provider.getBalance(REVENUE)).to.equal(revBefore + ethers.parseEther("0.5"));
  });
});

describe("HanaToken", function () {
  it("treasury 460M minted to owner at deploy, cap 1B", async function () {
    const { token, deployer } = await deployFixture();
    expect(await token.name()).to.equal("HANA");
    expect(await token.symbol()).to.equal("HANA");
    expect(await token.decimals()).to.equal(18);
    expect(await token.MAX_SUPPLY()).to.equal(CAP);
    expect(await token.TREASURY()).to.equal(TREASURY);
    expect(await token.BONUS_POOL()).to.equal(ethers.parseEther("540000000"));
    expect(await token.totalSupply()).to.equal(TREASURY);
    expect(await token.balanceOf(deployer.address)).to.equal(TREASURY);
  });

  it("mint only by authorized minters; setMinter only by owner", async function () {
    const { token, nft, alice } = await deployFixture();
    await expect(token.connect(alice).mint(alice.address, BONUS)).to.be.revertedWithCustomError(token, "NotMinter");
    await expect(token.connect(alice).setMinter(alice.address, true)).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    // The NFT contract IS a minter and can pay the bonus.
    expect(await token.minters(await nft.getAddress())).to.equal(true);
    // Revoke and the NFT can no longer mint (mint would revert).
    await token.setMinter(await nft.getAddress(), false);
    expect(await token.minters(await nft.getAddress())).to.equal(false);
  });

  it("token totalSupply = 460M + 12000 x mints", async function () {
    const { nft, token, mock, alice } = await deployFixture();
    await nft.setMintActive(true);
    await giveAgentId(mock, alice);
    const N = 10;
    for (let i = 0; i < N; i++) {
      await nft.connect(alice).mint({ value: PRICE });
    }
    expect(await token.totalSupply()).to.equal(TREASURY + BONUS * BigInt(N));
    expect(await token.balanceOf(alice.address)).to.equal(BONUS * BigInt(N));
  });

  it("cap is enforced: minting above 1B reverts", async function () {
    const { token, deployer } = await deployFixture();
    await token.setMinter(deployer.address, true);
    // 460M already minted; 540M headroom exactly. One wei over reverts.
    await expect(token.mint(deployer.address, ethers.parseEther("540000001"))).to.be.revertedWithCustomError(token, "ERC20ExceededCap");
  });
});
