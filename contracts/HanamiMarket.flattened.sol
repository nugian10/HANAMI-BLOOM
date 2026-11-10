// Sources flattened with hardhat v2.24.3 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts/utils/Context.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/access/Ownable.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (utils/introspection/IERC165.sol)

pragma solidity >=0.4.16;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts/token/ERC721/IERC721.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (token/ERC721/IERC721.sol)

pragma solidity >=0.6.2;

/**
 * @dev Required interface of an ERC-721 compliant contract.
 */
interface IERC721 is IERC165 {
    /**
     * @dev Emitted when `tokenId` token is transferred from `from` to `to`.
     */
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables `approved` to manage the `tokenId` token.
     */
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    /**
     * @dev Emitted when `owner` enables or disables (`approved`) `operator` to manage all of its assets.
     */
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    /**
     * @dev Returns the number of tokens in ``owner``'s account.
     */
    function balanceOf(address owner) external view returns (uint256 balance);

    /**
     * @dev Returns the owner of the `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function ownerOf(uint256 tokenId) external view returns (address owner);

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon
     *   a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;

    /**
     * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
     * are aware of the ERC-721 protocol to prevent tokens from being forever locked.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must exist and be owned by `from`.
     * - If the caller is not `from`, it must have been allowed to move this token by either {approve} or
     *   {setApprovalForAll}.
     * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon
     *   a safe transfer.
     *
     * Emits a {Transfer} event.
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Transfers `tokenId` token from `from` to `to`.
     *
     * WARNING: Note that the caller is responsible to confirm that the recipient is capable of receiving ERC-721
     * or else they may be permanently lost. Usage of {safeTransferFrom} prevents loss, though the caller must
     * understand this adds an external call which potentially creates a reentrancy vulnerability.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     * - If the caller is not `from`, it must be approved to move this token by either {approve} or {setApprovalForAll}.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 tokenId) external;

    /**
     * @dev Gives permission to `to` to transfer `tokenId` token to another account.
     * The approval is cleared when the token is transferred.
     *
     * Only a single account can be approved at a time, so approving the zero address clears previous approvals.
     *
     * Requirements:
     *
     * - The caller must own the token or be an approved operator.
     * - `tokenId` must exist.
     *
     * Emits an {Approval} event.
     */
    function approve(address to, uint256 tokenId) external;

    /**
     * @dev Approve or remove `operator` as an operator for the caller.
     * Operators can call {transferFrom} or {safeTransferFrom} for any token owned by the caller.
     *
     * Requirements:
     *
     * - The `operator` cannot be the address zero.
     *
     * Emits an {ApprovalForAll} event.
     */
    function setApprovalForAll(address operator, bool approved) external;

    /**
     * @dev Returns the account approved for `tokenId` token.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function getApproved(uint256 tokenId) external view returns (address operator);

    /**
     * @dev Returns if the `operator` is allowed to manage all of the assets of `owner`.
     *
     * See {setApprovalForAll}
     */
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}


// File @openzeppelin/contracts/utils/ReentrancyGuard.sol@v5.4.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuard {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}


// File contracts/HanamiMarket.sol

// Original license: SPDX_License_Identifier: MIT
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
