// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// ============================================================
// HANAMI MARKET — on-site marketplace for HANAMI BLOOM NFTs
// BNB Smart Chain Mainnet (Chain ID 56)
// ------------------------------------------------------------
// Escrow model, BNB only, NO listing fee:
//
// - list(tokenId, price): the seller's NFT moves into this
//   contract (escrow) until it is bought or the listing is
//   cancelled. One active listing per token at a time.
// - buy(listingId): msg.value must equal the listing price
//   EXACTLY (no over/underpayment). The price splits
//   95% to the seller, 5% to the royalty receiver
//   (Bryan's Binance Agentic Wallet). The NFT moves to
//   the buyer in the same call.
// - cancel(listingId): only the seller, only while active.
//   The NFT returns to the seller.
// - No $HANA involvement in the market: mint bonuses are
//   paid by HanamiBloomNFT only, never here.
// - Royalty is FIXED at 5% (constant). The receiver
//   address can be changed by the owner (setRoyaltyReceiver)
//   in case the Agentic Wallet address ever changes.
// - ReentrancyGuard on every state-changing function.
//
// OWNER / REVENUE:
//   Owner = Bryan's "My Wallet"
//   0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097.
//   Royalty receiver = Bryan's Binance Agentic Wallet
//   0x89c37649Ba3BAA9E1ce028612b7DE4e9c3a947B7 — the same
//   address that receives mint payments and the 5%
//   ERC-2981 royalty on Element.
//
// NOTES / LIMITS:
// - The market never touches an NFT that is not listed:
//   list() is the only way an NFT enters escrow.
// - The market does not track transfers made outside it:
//   a listed token can only leave escrow via buy() or
//   cancel() — the market OWNS the token while listed,
//   so the seller cannot move it elsewhere mid-listing.
// - Listing IDs start at 1 and increment forever; IDs
//   are never reused. Use isListed(tokenId) /
//   listingIdOf(tokenId) to find a token's listing.
//
// This contract is SOURCE-VERIFIABLE on BscScan.
// It is NOT an independent audit — keep that
// disclosure on the site.
// ============================================================

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract HanamiMarket is Ownable, ReentrancyGuard {
    /// @notice Marketplace royalty: 5% = 500 basis points.
    /// Fixed — no setter exists for the rate itself.
    uint96 public constant ROYALTY_BPS = 500;
    /// @notice Basis points denominator (100%).
    uint256 public constant BPS_DENOMINATOR = 10000;

    /// @notice The HANAMI BLOOM NFT contract (v2 on mainnet).
    IERC721 public immutable nft;

    /// @notice Receives the 5% royalty on every sale.
    /// Bryan's Binance Agentic Wallet at deploy; the owner
    /// may change it later via setRoyaltyReceiver.
    address public royaltyReceiver;

    struct Listing {
        uint256 id;
        address seller;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    /// @notice Total listings ever created (also the next
    /// listing id). IDs start at 1.
    uint256 public listingCount;

    /// @notice Listing by id (0 = never created).
    mapping(uint256 => Listing) public listings;

    /// @notice Active listing id for a tokenId, or 0 if the
    /// token has never been listed / its listing is closed.
    mapping(uint256 => uint256) public listingIdOf;

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 price
    );
    event Sold(
        uint256 indexed listingId,
        address indexed seller,
        address indexed buyer,
        uint256 tokenId,
        uint256 price,
        uint256 royalty
    );
    event Cancelled(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed tokenId
    );
    event RoyaltyReceiverUpdated(address indexed royaltyReceiver);

    error InvalidAddress();
    error InvalidPrice();
    error NotTokenOwner();
    error AlreadyListed();
    error ListingNotFound();
    error ListingNotActive();
    error NotSeller();
    error IncorrectPayment(uint256 expected, uint256 received);
    error PaymentFailed();

    constructor(
        address nft_,
        address royaltyReceiver_,
        address initialOwner
    ) Ownable(initialOwner) {
        if (
            nft_ == address(0) ||
            royaltyReceiver_ == address(0) ||
            initialOwner == address(0)
        ) {
            revert InvalidAddress();
        }
        nft = IERC721(nft_);
        royaltyReceiver = royaltyReceiver_;
    }

    // ---------- views ----------

    /// @notice The full listing record for `listingId`.
    /// Reverts ListingNotFound for an id that was never
    /// created.
    function getListing(uint256 listingId) external view returns (Listing memory) {
        if (listingId == 0 || listingId > listingCount) revert ListingNotFound();
        return listings[listingId];
    }

    /// @notice True when `tokenId` currently has an active
    /// listing in this market.
    function isListed(uint256 tokenId) external view returns (bool) {
        uint256 id = listingIdOf[tokenId];
        return id != 0 && listings[id].active;
    }

    // ---------- listing ----------

    /// @notice List a HANAMI BLOOM NFT for sale at `price`
    /// (wei, must be > 0). The caller must own the token
    /// and have approved this contract (approve or
    /// setApprovalForAll on the NFT contract). The NFT
    /// moves into escrow here until bought or cancelled.
    function list(uint256 tokenId, uint256 price) external nonReentrant {
        if (price == 0) revert InvalidPrice();
        // Checked before ownership on purpose: a listed token
        // is escrowed in this contract, so its seller no longer
        // owns it — checking ownership first would mask the
        // real reason (already listed) with NotTokenOwner.
        if (listingIdOf[tokenId] != 0 && listings[listingIdOf[tokenId]].active) {
            revert AlreadyListed();
        }
        if (nft.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        listingCount++;
        uint256 id = listingCount;
        listings[id] = Listing({
            id: id,
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            active: true
        });
        listingIdOf[tokenId] = id;

        nft.transferFrom(msg.sender, address(this), tokenId);
        emit Listed(id, msg.sender, tokenId, price);
    }

    // ---------- buying ----------

    /// @notice Buy an active listing. msg.value must equal
    /// the listing price EXACTLY. 95% goes to the seller,
    /// 5% to the royalty receiver, and the NFT goes to
    /// the buyer — all in this same call. The listing is
    /// marked sold (inactive) before any transfer, so it
    /// can never be bought twice.
    function buy(uint256 listingId) external payable nonReentrant {
        if (listingId == 0 || listingId > listingCount) revert ListingNotFound();
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingNotActive();
        if (msg.value != listing.price) {
            revert IncorrectPayment(listing.price, msg.value);
        }

        uint256 price = listing.price;
        address seller = listing.seller;
        uint256 tokenId = listing.tokenId;

        listing.active = false;
        listingIdOf[tokenId] = 0;

        uint256 royalty = (price * ROYALTY_BPS) / BPS_DENOMINATOR;
        uint256 sellerAmount = price - royalty;

        nft.transferFrom(address(this), msg.sender, tokenId);

        (bool okSeller, ) = seller.call{value: sellerAmount}("");
        if (!okSeller) revert PaymentFailed();
        (bool okRoyalty, ) = royaltyReceiver.call{value: royalty}("");
        if (!okRoyalty) revert PaymentFailed();

        emit Sold(listingId, seller, msg.sender, tokenId, price, royalty);
    }

    // ---------- cancelling ----------

    /// @notice Cancel your own active listing. Only the
    /// seller may cancel. The NFT returns to the seller.
    function cancel(uint256 listingId) external nonReentrant {
        if (listingId == 0 || listingId > listingCount) revert ListingNotFound();
        Listing storage listing = listings[listingId];
        if (!listing.active) revert ListingNotActive();
        if (listing.seller != msg.sender) revert NotSeller();

        listing.active = false;
        listingIdOf[listing.tokenId] = 0;

        nft.transferFrom(address(this), msg.sender, listing.tokenId);
        emit Cancelled(listingId, msg.sender, listing.tokenId);
    }

    // ---------- owner-only administration ----------

    /// @notice Point the 5% royalty at a different receiver
    /// (e.g. if the Agentic Wallet address ever changes).
    /// The 5% rate itself is fixed and cannot change.
    function setRoyaltyReceiver(address royaltyReceiver_) external onlyOwner {
        if (royaltyReceiver_ == address(0)) revert InvalidAddress();
        royaltyReceiver = royaltyReceiver_;
        emit RoyaltyReceiverUpdated(royaltyReceiver_);
    }
}
