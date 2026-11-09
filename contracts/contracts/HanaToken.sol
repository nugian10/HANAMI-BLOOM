// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

// ============================================================
// $HANA — the HANAMI BLOOM utility token (BEP-20 / ERC-20)
// BNB Smart Chain Mainnet (Chain ID 56)
// ------------------------------------------------------------
// - Name "HANA", symbol "HANA", 18 decimals.
// - Max supply 1,000,000,000, enforced on-chain by
//   ERC20Capped. NOTHING may mint above the cap.
// - TREASURY: 460,000,000 $HANA is pre-minted to the owner
//   in the constructor. BONUS_POOL: 540,000,000 $HANA is
//   the headroom left under the cap for mint bonuses
//   (12,000 $HANA per paid NFT mint, via HanamiBloomNFT).
//   At most 3,333 mints x 12,000 = 39,996,000 $HANA can
//   ever be minted as bonuses — far below the 540M pool.
// - How $HANA is created:
//     paid NFT mint : 12,000 $HANA per mint (via HanamiBloomNFT)
//     treasury      : 460,000,000 $HANA to the owner at deploy
// - Minting is restricted to authorized minters (the
//   HanamiBloomNFT contract). The owner manages the minter
//   list; the owner itself cannot mint.
// - No other features: no repost / claim system, no burn
//   rewards, no redeem, no upgrade.
// - Owner = Bryan's "My Wallet"
//   0x0262e8e5E4584D8AB840fD950a6E2E0A414d4097.
//   Deploy this contract FIRST, then HanamiBloomNFT with
//   this contract's address, then call
//   setMinter(nft, true).
//
// This contract is SOURCE-VERIFIABLE on BscScan.
// It is NOT an independent audit — keep that disclosure.
// ============================================================

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HanaToken is ERC20, ERC20Burnable, ERC20Capped, Ownable {
    /// @notice Hard cap: 1,000,000,000 $HANA. Enforced by
    /// ERC20Capped on every mint.
    uint256 public constant MAX_SUPPLY = 1_000_000_000 ether;

    /// @notice Treasury pre-minted to the owner at deploy.
    uint256 public constant TREASURY = 460_000_000 ether;

    /// @notice Informative constant: headroom left under
    /// the cap after the treasury (1B - 460M = 540M).
    /// Bonus minting can never exceed this in practice:
    /// 3,333 mints x 12,000 = 39,996,000 $HANA max.
    uint256 public constant BONUS_POOL = 540_000_000 ether;

    /// @notice Addresses allowed to mint (HanamiBloomNFT).
    /// Managed by the owner.
    mapping(address => bool) public minters;

    event MinterSet(address indexed minter, bool allowed);

    error NotMinter();

    constructor(address initialOwner)
        ERC20("HANA", "HANA")
        ERC20Capped(MAX_SUPPLY)
        Ownable(initialOwner)
    {
        _mint(initialOwner, TREASURY);
    }

    /// @notice Cap enforcement: ERC20Capped checks totalSupply
    /// + value <= cap on every mint (via _update).
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }

    /// @notice Authorize / revoke a minter (HanamiBloomNFT).
    /// Owner-only.
    function setMinter(address minter, bool allowed) external onlyOwner {
        minters[minter] = allowed;
        emit MinterSet(minter, allowed);
    }

    /// @notice Mint $HANA to `to`. Only authorized minters
    /// (HanamiBloomNFT for paid-mint bonuses).
    /// The cap is enforced by ERC20Capped.
    function mint(address to, uint256 amount) external {
        if (!minters[msg.sender]) revert NotMinter();
        _mint(to, amount);
    }
}
