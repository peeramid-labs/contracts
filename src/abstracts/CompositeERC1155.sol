// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.20;
import "../libraries/LibReentrancyGuard.sol";
import "./LockableERC1155.sol";

/**
 * @title CompositeERC1155
 * @dev An abstract contract that extends LockableERC1155 and provides functionality for composite ERC1155 tokens.
 * Composite tokens can be "composed" from multiple underlying assets, which however do not change their owner
 * and in contrast to that use LockableERC1155 standard, which allows to read locked asset BalanceOf, OwnerOf methods correctly
 */
abstract contract CompositeERC1155 is LockableERC1155 {
    address[] private dimensions;
    uint256[] private weights;

    constructor(string memory uri_, address[] memory dimensionTokens, uint256[] memory tokenWeights) ERC1155(uri_) {
        require(dimensionTokens.length == tokenWeights.length, "Array lengths must be equal");
        dimensions = dimensionTokens;
        weights = tokenWeights;
    }

    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal virtual override {
        if (to == address(0)) // let it burn
        {
            for (uint256 i = 0; i < dimensions.length; i++) {
                for (uint256 j = 0; j < ids.length; j++) {
                    LockableERC1155(dimensions[i]).unlock(from, ids[j], values[j] * weights[i]);
                }
            }
        } else if (from == address(0)) {
            // let it rise
            for (uint256 i = 0; i < dimensions.length; i++) {
                for (uint256 j = 0; j < ids.length; j++) {
                    LockableERC1155(dimensions[i]).lock(to, ids[j], values[j] * weights[i]);
                }
            }
        }
        super._update(from, to, ids, values);
    }

    /**
     * @dev Decomposes a composite ERC1155 token into its individual components.
     * This function unlocks the specified amount of the composite token from each dimension,
     * and then burns the specified amount of the composite token from the caller's balance.
     * @param from The address from which the composite token is being decomposed.
     * @param id The ID of the composite token being decomposed.
     * @param amount The amount of the composite token to decompose.
     */
    function decompose(address from, uint256 id, uint256 amount) public virtual {
        for (uint256 i = 0; i < dimensions.length; i++) {
            LockableERC1155(dimensions[i]).unlock(from, id, amount * weights[i]);
        }
        _burn(from, id, amount);
    }

    /**
     * @dev Burns a specified amount of tokens from the given account.
     * This will burn all underlying (composite) assets
     *
     * Requirements:
     * - `account` must be the token owner or an approved operator.
     * - `id` and `value` must be valid token ID and amount to burn.
     * - All underlying "composite" assets implement burn as well
     *
     * @param account The address of the token owner.
     * @param id The ID of the token to burn.
     * @param value The amount of tokens to burn.
     */
    function burn(address account, uint256 id, uint256 value) public virtual {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not token owner or approved"
        );

        _burn(account, id, value);
    }

    /**
     * @dev Retrieves the components of the CompositeERC1155 contract.
     * @return An array of component addresses and an array of component weights.
     */
    function getComponents() public virtual returns (address[] memory, uint256[] memory) {
        return (dimensions, weights);
    }
}
