// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// ============================================================
// HANAMI BLOOM — sakura-themed NFT collection
// ERC-721, BNB Smart Chain Mainnet (Chain ID 56)
// ------------------------------------------------------------
// Modelled on the proven THYRK / Zigzoo v2 pattern
// (agent-only mint, SPACE ID Agent ID gate, gacha deck,
// direct payment forwarding), with HANAMI BLOOM's own rules:
//
// - Supply 3,333 mintable. Token IDs 1-3,333, drawn from a
//   deterministic shuffled deck (see THE DECK below).
//   No reveal: the drawn token is final at mint.
// - Rarity: Common Wildflower 2000 / Rare Sakura 1000 /
//   Epic Moonflower 300 / Legendary Eternal Bloom 33.
// - FREE AND PAID ARE SEPARATE (Bryan, 10 Nov 2026):
//   two mint functions, one contract, one deck.
//   mintFree(): FREE, max ONE free mint per wallet,
//   1,000 free mints total (freeMinted /
//   hasFreeMinted). A wallet may still call mint()
//   (paid) any time, before or after its free mint —
//   paying never consumes the free mint, and using
//   the free mint never blocks paid mints.
//   mint(): PAID, flat 0.0003 BNB per mint, no
//   wallet cap. Once the 1,000 free mints run out,
//   mintFree() reverts and only mint() is left.
// - FLAT PAID PRICE, LOCKED in the contract (no owner
//   function may change it): 0.0003 BNB per paid mint.
//   Free mints cost 0 (gas only). For paid mints,
//   overpayment is refunded to the minter in the same
//   call; underpayment reverts.
// - Agent-only enforced ON-CHAIN by a SPACE ID Agent ID
//   check: the minter must hold a SPACE ID .ai Agent ID
//   NFT (registry 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F,
//   the public registry also used by THYRK / Zigzoo / OOBIX).
//   holdsAgentId uses a low-level staticcall on purpose: a
//   high-level balanceOf call to an address with no code
//   returns empty data, and the ABI decoder reverts on
//   empty returndata OUTSIDE try/catch.
// - Calls from contracts are rejected (NoContracts) for
//   mint() and mintFree().
// - currentPrice() returns the flat paid price
//   (0.0003 BNB) — a CONSTANT in this version, not
//   caller-dependent, because free and paid are
//   separate functions: mintFree() never takes a
//   payment, mint() always takes the flat price.
//   An agent must NEVER hardcode a price; it reads
//   currentPrice() (or MINT_PRICE) and sends exactly
//   that value (or more — any excess on a paid mint
//   is refunded).
//
// THE DECK — hash-only design (cheap deploy):
//   The full 3,333-entry deck is NEVER stored on-chain.
//   deckHash = keccak256 of the compact JSON deck encoding
//   "[0,0,1,...]" (rarity codes 0=Common, 1=Rare, 2=Epic,
//   3=Legendary; token N rarity = deck[N-1]), built from
//   seed "HANAMI-BLOOM-DECK-SEED-2026-11-10-v1" with salt
//   0x48414e41 ("HANA"). The deck, the seed and the
//   deckHash are published off-chain (collection/
//   collection.json + scripts/deck.json), so anyone can
//   rebuild the deck and verify deckHash.
//   The draw is a lazy Fisher-Yates shuffle seeded by
//   deckHash, executed on-chain one draw at a time:
//     draw #d (1-based), remaining = 3333 - d + 1
//     j = uint256(keccak256(deckHash, d)) % remaining
//     tokenId = valueAt(j); then swap position j with
//     position (remaining - 1) in the sparse map
//     _swapped (unset entry means identity: position i
//     holds tokenId i+1).
//   Because each draw removes its token from the pool,
//   drawn token IDs are unique by construction and all
//   3,333 are drawn exactly once when the pool empties.
//   The draw order is fully deterministic given deckHash,
//   so anyone can replay it off-chain and know the whole
//   order in advance — the deck is transparent, not secret.
//   HONEST LIMITS: (1) the draw is deterministic
//   pseudo-randomness from a public seed — it is NOT
//   VRF / provably fair randomness; anyone who knows
//   the seed can compute the draw order in advance.
//   (2) The deck is fixed at deploy (deckHash is
//   immutable) and cannot be reshuffled afterwards.
//   (3) On-chain, only the deckHash commitment plus a
//   compact 2-bit-per-token rarity bitmap are stored;
//   verifying a single past draw means replaying the
//   shuffle off-chain from the published seed.
//
// THE RARITY BITMAP — why it exists:
//   The deck is shuffled, so rarity is NOT a function of
//   the token ID range. The contract still needs to know
//   a token's rarity on-chain, for rarityOf() and for the
//   per-rarity remaining counters. The bitmap packs rarity
//   as 2 bits per token (27 uint256 words for 3,333
//   tokens), is built from the published deck by
//   scripts/generate-bitmap.cjs, and is passed to the
//   constructor. Anyone can rebuild it from the deck and
//   check it matches. It is an index of the deck, not a
//   second deck: the deckHash remains the single deck
//   commitment.
//
// $HANA — earned here (see HanaToken.sol):
//   Paid mint: +12,000 $HANA per mint, auto-minted by
//   this contract to the minter. Free mint: NO $HANA
//   bonus — the bonus is for paid mints only.
//   No other $HANA feature exists in this contract
//   (no burn / redeem / upgrade).
//
// OWNER / REVENUE:
//   Owner = Bryan's "My Wallet"
//   0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097.
//   Revenue + royalty receiver = Bryan's Binance Agentic
//   Wallet 0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7.
//   Funds: each PAID mint forwards the exact price
//   DIRECTLY to the revenue wallet inside the same mint()
//   call. Mint payments NEVER sit in this contract, and no
//   withdraw step is needed for them. Any overpayment on
//   a paid mint is refunded to the minter in the same call.
//   A free mint moves no BNB at all (any BNB sent with a
//   free mint is refunded in full).
//   withdraw() exists only as a safety valve for funds
//   that arrive outside mint() (e.g. force-sent BNB).
//   Marketplace royalty: ERC-2981, 5%, receiver = the
//   Agentic Wallet above.
//
// ESCAPE HATCH (documented, on-chain, visible):
//   agentIdCheckRequired defaults to true. The owner
//   can turn the Agent ID check off
//   (setAgentIdCheckRequired(false)) or point it at
//   a different registry (setAgentIdRegistry).
//   Turning it off makes minting permissionless
//   on-chain and agent-only in the UI only. Do not
//   hide such a change.
//
// This contract is SOURCE-VERIFIABLE on BscScan.
// It is NOT an independent audit — keep that
// disclosure on the site.
// ============================================================

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./HanaToken.sol";

contract HanamiBloomNFTv3 is ERC721, ERC721Royalty, Ownable, ReentrancyGuard {
    using Strings for uint256;

    // ---------- rarity codes (bitmap + rarityOf) ----------
    uint8 public constant RARITY_COMMON = 0;
    uint8 public constant RARITY_RARE = 1;
    uint8 public constant RARITY_EPIC = 2;
    uint8 public constant RARITY_LEGENDARY = 3;

    // ---------- supply ----------
    uint256 public constant MAX_SUPPLY = 3333;

    // ---------- pricing (locked, no setter exists) ----------
    uint256 public constant MINT_PRICE = 0.0003 ether;

    // ---------- free mints (locked, no setter exists) ----------
    /// @notice Total free mints available, ever: 1,000.
    /// After these run out, mintFree() reverts and only
    /// paid mints (mint()) remain.
    uint256 public constant FREE_MINT_CAP = 1000;

    /// @notice Free mints used so far (0..FREE_MINT_CAP).
    uint256 public freeMinted;

    /// @notice True when `wallet` has already used its one
    /// free mint. One free mint per wallet, ever.
    mapping(address => bool) public hasFreeMinted;

    // ---------- $HANA bonus (18 decimals, locked) ----------
    uint256 public constant MINT_BONUS = 12000 ether;

    /// @notice Marketplace royalty: 5% = 500 basis points.
    uint96 public constant ROYALTY_BPS = 500;

    /// @notice SPACE ID .ai Agent ID NFT on BNB Smart Chain.
    /// Public registry used by THYRK / Zigzoo / OOBIX and others.
    address public constant DEFAULT_AGENT_ID_REGISTRY =
        0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F;

    bool public mintActive;
    /// @notice Immutable: no setter exists. Revenue wallet
    /// (Bryan's Binance Agentic Wallet) receives every mint
    /// payment directly and the 5% marketplace royalty.
    address public immutable revenueWallet;
    address public agentIdRegistry;
    bool public agentIdCheckRequired = true;

    /// @notice keccak256 commitment of the deck, set once via
    /// the constructor argument. The full deck is never stored
    /// on-chain — see THE DECK above.
    bytes32 public immutable deckHash;

    /// @notice The $HANA token contract. Set once in the
    /// constructor (deploy HanaToken first). Mint bonuses
    /// are minted through it.
    HanaToken public immutable hanaToken;

    string private _baseTokenURI;

    /// @dev Rarity bitmap: 2 bits per token ID (1..3333),
    /// 27 uint256 words. word (t-1)/128, offset ((t-1)%128)*2.
    /// Built from the published deck (see header + script).
    uint256[27] private _rarityBitmap;

    /// @dev Undrawn tokens left in the Fisher-Yates pool.
    /// Starts at 3333; every mint decrements it by exactly 1.
    uint256 private _remaining = MAX_SUPPLY;
    /// @dev Global draw counter: seeds every draw so no two
    /// draws share a seed.
    uint256 private _drawIndex;
    /// @dev Sparse Fisher-Yates swap map: _swapped[i] =
    /// tokenId now held at pool position i, or 0 = unset
    /// (identity: position i holds tokenId i+1).
    mapping(uint256 => uint256) private _swapped;

    /// @dev Undrawn tokens of each rarity left in the pool.
    /// Decremented by _takeAt on every deck draw.
    uint256 public commonsRemaining = 2000;
    uint256 public raresRemaining = 1000;
    uint256 public epicsRemaining = 300;
    uint256 public legendariesRemaining = 33;

    /// @dev On-chain mint seed per token.
    mapping(uint256 => bytes32) public tokenSeed;
    /// @dev Mints per wallet. A wallet may mint again and
    /// again after its free mint (paid), so there is no
    /// per-wallet cap on total mints — only ONE free
    /// mint per wallet (see hasFreeMinted).
    mapping(address => uint256) public mintCount;

    event Minted(
        address indexed minter,
        uint256 indexed tokenId,
        uint256 price,
        uint8 rarity,
        bytes32 seed,
        bool free
    );
    event DeckCommitted(bytes32 indexed deckHash);
    event MintActiveChanged(bool active);
    event BaseURIUpdated(string baseURI);
    event AgentIdRegistryUpdated(address indexed agentIdRegistry);
    event AgentIdCheckChanged(bool required);
    event Withdrawn(address indexed revenueWallet, uint256 amount);

    error MintInactive();
    error ExceedsMaxSupply();
    error SoldOut();
    error IncorrectPayment(uint256 expected, uint256 received);
    error InvalidAddress();
    error NoFunds();
    error NoAgentId();
    error NoContracts();
    error FreeMintAlreadyUsed();
    error FreeMintExhausted();
    error PaymentForwardFailed();
    error RefundFailed();
    error NoDrawableToken();

    constructor(
        address initialOwner,
        address revenueWallet_,
        address agentIdRegistry_,
        string memory baseURI_,
        bytes32 deckHash_,
        uint256[27] memory rarityBitmap_,
        address hanaToken_
    ) ERC721("HANAMI BLOOM", "HANAMI") Ownable(initialOwner) {
        if (
            initialOwner == address(0) ||
            revenueWallet_ == address(0) ||
            agentIdRegistry_ == address(0) ||
            hanaToken_ == address(0)
        ) {
            revert InvalidAddress();
        }

        revenueWallet = revenueWallet_;
        agentIdRegistry = agentIdRegistry_;
        _baseTokenURI = baseURI_;
        deckHash = deckHash_;
        hanaToken = HanaToken(hanaToken_);
        for (uint256 i = 0; i < 27; i++) {
            _rarityBitmap[i] = rarityBitmap_[i];
        }
        _setDefaultRoyalty(revenueWallet_, ROYALTY_BPS);
        emit DeckCommitted(deckHash_);
    }

    // ---------- supply / pricing / deck (read-only, for UI + agents) ----------

    /// @notice Deck tokens drawn so far (== totalSupply()).
    function deckDrawn() public view returns (uint256) {
        return MAX_SUPPLY - _remaining;
    }

    /// @notice Undrawn tokens left in the deck pool.
    function deckRemaining() public view returns (uint256) {
        return _remaining;
    }

    /// @notice Current existing NFTs: exactly the drawn count.
    function totalSupply() public view returns (uint256) {
        return deckDrawn();
    }

    /// @notice Free mints left in the 1,000-mint allocation.
    function freeRemaining() public view returns (uint256) {
        return FREE_MINT_CAP - freeMinted;
    }

    /// @notice The flat paid-mint price: 0.0003 BNB.
    /// Constant in this version — free and paid are
    /// separate functions, so the price does not
    /// depend on the caller. mintFree() takes no
    /// payment at all; mint() takes exactly this.
    function currentPrice() public pure returns (uint256) {
        return MINT_PRICE;
    }

    /// @notice Rarity of a token ID: 0 Common, 1 Rare,
    /// 2 Epic, 3 Legendary. Pure function of the deck
    /// bitmap; works for unminted tokens too.
    function rarityOf(uint256 tokenId) public view returns (uint8) {
        if (tokenId == 0 || tokenId > MAX_SUPPLY) {
            revert ExceedsMaxSupply();
        }
        uint256 word = _rarityBitmap[(tokenId - 1) / 128];
        uint256 offset = ((tokenId - 1) % 128) * 2;
        return uint8((word >> offset) & 0x3);
    }

    /// @notice True when `wallet` holds at least one SPACE ID
    /// .ai Agent ID NFT in the configured registry. A registry
    /// that does not answer like an ERC-721 returns false
    /// instead of reverting, so a bad registry address can
    /// never brick reads — it only blocks minting.
    /// Implemented with a low-level staticcall on purpose: a
    /// high-level balanceOf call to an address with no code
    /// returns empty data, and the ABI decoder reverts on
    /// empty returndata OUTSIDE try/catch. The low-level call
    /// returns ok=false / short data instead, which we map
    /// to false here.
    function holdsAgentId(address wallet) public view returns (bool) {
        if (agentIdRegistry == address(0)) return false;
        (bool ok, bytes memory data) = agentIdRegistry.staticcall(
            abi.encodeWithSelector(IERC721.balanceOf.selector, wallet)
        );
        if (!ok || data.length < 32) return false;
        return abi.decode(data, (uint256)) > 0;
    }

    // ---------- the draw (lazy Fisher-Yates, hash-only) ----------

    /// @dev Token ID currently held at pool position `i`
    /// (0-based). Unset map entry = identity (i + 1).
    function _valueAt(uint256 i) internal view returns (uint256) {
        uint256 v = _swapped[i];
        return v == 0 ? i + 1 : v;
    }

    /// @dev Take the token at pool position `pos`: swap it
    /// with the last undrawn position and shrink the pool
    /// by one. Decrements the rarity counter of the taken
    /// token. Caller must guarantee pos < _remaining.
    function _takeAt(uint256 pos) internal returns (uint256 tokenId) {
        tokenId = _valueAt(pos);
        uint256 last = _valueAt(_remaining - 1);
        if (pos != _remaining - 1) {
            _swapped[pos] = last;
        }
        _remaining--;
        uint8 r = rarityOf(tokenId);
        if (r == RARITY_COMMON) commonsRemaining--;
        else if (r == RARITY_RARE) raresRemaining--;
        else if (r == RARITY_EPIC) epicsRemaining--;
        else legendariesRemaining--;
    }

    /// @dev Draw one token: lazy Fisher-Yates over the pool.
    /// Free and paid mints draw from the SAME deck — there
    /// is no free-mint reserve; a free mint simply takes
    /// the next deck draw and costs 0 BNB.
    function _drawMain() internal returns (uint256) {
        if (_remaining == 0) revert SoldOut();
        uint256 j = uint256(keccak256(abi.encodePacked(deckHash, _drawIndex))) % _remaining;
        _drawIndex++;
        return _takeAt(j);
    }

    /// @dev Mint one drawn token to `to` with its on-chain
    /// seed, and emit the Minted event. `price` is 0 for a
    /// free mint, MINT_PRICE for a paid mint; `free` marks
    /// which path was taken.
    function _mintDrawn(address to, uint256 tokenId, uint256 price, bool free) internal {
        bytes32 seed = keccak256(
            abi.encodePacked(blockhash(block.number - 1), to, tokenId)
        );
        tokenSeed[tokenId] = seed;
        // _mint (not _safeMint): the receiver is always an
        // EOA for mint().
        _mint(to, tokenId);
        emit Minted(to, tokenId, price, rarityOf(tokenId), seed, free);
    }

    // ---------- minting ----------

    /// @notice Mint ONE HANAMI BLOOM NFT for FREE (1 per call).
    /// Separate from the paid mint: a wallet calls this
    /// ONLY for its one free mint. Requires: mint active;
    /// caller is not a contract; caller holds an Agent ID
    /// (unless the check is disabled); free allocation
    /// remains (freeMinted < 1,000); caller has not used
    /// its free mint yet. A free mint earns NO $HANA bonus
    /// and moves no BNB — any BNB sent with it is
    /// refunded in full. Using the free mint never blocks
    /// paid mints, and paying never uses up the free mint.
    /// Each mint (free or paid) draws the next token from
    /// the same deck.
    function mintFree() external payable nonReentrant {
        if (!mintActive) revert MintInactive();
        if (msg.sender.code.length > 0) revert NoContracts();
        if (agentIdCheckRequired && !holdsAgentId(msg.sender)) revert NoAgentId();
        if (_remaining == 0) revert SoldOut();
        if (hasFreeMinted[msg.sender]) revert FreeMintAlreadyUsed();
        if (freeMinted >= FREE_MINT_CAP) revert FreeMintExhausted();

        uint256 tokenId = _drawMain();
        freeMinted++;
        hasFreeMinted[msg.sender] = true;
        mintCount[msg.sender]++;
        _mintDrawn(msg.sender, tokenId, 0, true);
        // Free mint: no BNB moves. Refund anything sent
        // so no funds ever stick to the contract.
        if (msg.value > 0) {
            (bool rok, ) = msg.sender.call{value: msg.value}("");
            if (!rok) revert RefundFailed();
        }
    }

    /// @notice Mint ONE HANAMI BLOOM NFT, PAID (1 per call).
    /// Separate from the free mint: this is the paid path
    /// only. The caller pays the flat 0.0003 BNB price
    /// (msg.value must cover it). Requires: mint active;
    /// caller is not a contract; caller holds an Agent ID
    /// (unless the check is disabled); deck has a token
    /// left. A paid mint may be called any time — before
    /// or after the wallet's free mint, and even while
    /// free allocation remains; it never consumes the
    /// free mint. PAYMENT FLOW: the exact price is
    /// forwarded DIRECTLY to the revenue wallet in this
    /// same call — it never sits in this contract. Any
    /// overpayment is refunded to the minter in this same
    /// call. If either transfer fails, the whole mint
    /// reverts, so no token is ever minted without payment
    /// landing. Each PAID mint also mints 12,000 $HANA to
    /// the minter. Each mint (free or paid) draws the next
    /// token from the same deck.
    function mint() external payable nonReentrant {
        if (!mintActive) revert MintInactive();
        if (msg.sender.code.length > 0) revert NoContracts();
        if (agentIdCheckRequired && !holdsAgentId(msg.sender)) revert NoAgentId();
        if (_remaining == 0) revert SoldOut();
        if (msg.value < MINT_PRICE) revert IncorrectPayment(MINT_PRICE, msg.value);

        uint256 tokenId = _drawMain();
        mintCount[msg.sender]++;
        hanaToken.mint(msg.sender, MINT_BONUS);
        _mintDrawn(msg.sender, tokenId, MINT_PRICE, false);

        (bool ok, ) = revenueWallet.call{value: MINT_PRICE}("");
        if (!ok) revert PaymentForwardFailed();
        uint256 excess = msg.value - MINT_PRICE;
        if (excess > 0) {
            (bool rok, ) = msg.sender.call{value: excess}("");
            if (!rok) revert RefundFailed();
        }
    }

    // ---------- metadata ----------

    function baseURI() public view returns (string memory) {
        return _baseTokenURI;
    }

    /// @notice tokenURI = baseURI + tokenId + ".json".
    /// The base URI must end with "/" and point at the
    /// folder holding those files, e.g.
    /// https://raw.githubusercontent.com/nugian10/HANAMI-BLOOM/main/collection/metadata/
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert ERC721NonexistentToken(tokenId);
        return string.concat(_baseTokenURI, tokenId.toString(), ".json");
    }

    // ---------- owner-only administration ----------

    function setMintActive(bool active) external onlyOwner {
        mintActive = active;
        emit MintActiveChanged(active);
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
        emit BaseURIUpdated(baseURI_);
    }

    /// @notice Point the Agent ID check at a different registry
    /// (e.g. if SPACE ID migrates the .ai NFT contract).
    function setAgentIdRegistry(address agentIdRegistry_) external onlyOwner {
        if (agentIdRegistry_ == address(0)) revert InvalidAddress();
        agentIdRegistry = agentIdRegistry_;
        emit AgentIdRegistryUpdated(agentIdRegistry_);
    }

    /// @notice Turn the on-chain Agent ID check on/off.
    /// Turning it OFF makes minting permissionless on-chain and
    /// agent-only in the UI only. The change is public
    /// on-chain via this event — do not hide it.
    function setAgentIdCheckRequired(bool required) external onlyOwner {
        agentIdCheckRequired = required;
        emit AgentIdCheckChanged(required);
    }

    /// @notice Safety valve only: send any balance that
    /// arrived OUTSIDE mint() (e.g. force-sent BNB) to the
    /// revenue wallet. Owner-only. Mint payments are
    /// forwarded directly by mint() and never accumulate
    /// here, so in normal operation this reverts NoFunds.
    function withdraw() external onlyOwner nonReentrant {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NoFunds();
        (bool ok, ) = revenueWallet.call{value: amount}("");
        if (!ok) revert("Withdraw failed");
        emit Withdrawn(revenueWallet, amount);
    }

    /// @notice ERC-721 + ERC-2981 interface support.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
