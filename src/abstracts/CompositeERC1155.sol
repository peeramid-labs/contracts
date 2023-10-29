// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.20;
import "../libraries/LibReentrancyGuard.sol";
import "./LockableERC1155.sol";

abstract contract CompositeERC1155 is LockableERC1155 {
    address[] private dimensions;
    uint256[] private weights;

    constructor(string memory uri_, address[] memory dimensionTokens, uint256[] memory tokenWeights) ERC1155(uri_) {
        require(dimensionTokens.length == tokenWeights.length, "Array lengths must be equal");
        dimensions = dimensionTokens;
        weights = tokenWeights;
    }

    function _mint(address to, uint256 tokenId, uint256 value, bytes memory data) internal virtual override {
        for (uint256 i = 0; i < dimensions.length; i++) {
            LockableERC1155(dimensions[i]).lock(to, tokenId, value * weights[i]);
        }
        super._mint(to, tokenId, value, data);
    }

    function _burn(address from, uint256 id, uint256 amount) internal override {
        for (uint256 i = 0; i < dimensions.length; i++) {
            CompositeERC1155(dimensions[i]).burn(from, id, amount * weights[i]);
        }
        super._burn(from, id, amount);
    }

    function decompose(address from, uint256 id, uint256 amount) public virtual {
        for (uint256 i = 0; i < dimensions.length; i++) {
            LockableERC1155(dimensions[i]).unlock(from, id, amount * weights[i]);
        }
        _burn(from, id, amount);
    }

    function burn(address account, uint256 id, uint256 value) public virtual {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not token owner or approved"
        );

        _burn(account, id, value);
    }

    function getComponents() public virtual returns (address[] memory, uint256[] memory) {
        return (dimensions, weights);
    }
}
