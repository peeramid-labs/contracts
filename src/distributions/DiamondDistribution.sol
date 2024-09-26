// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@peeramid-labs/eds/src/abstracts/CloneDistribution.sol";
import "../vendor/diamond/DiamondCloneable.sol";
import "../vendor/diamond/facets/DiamondCutFacet.sol";

contract DiamondDistribution is CloneDistribution {
    address immutable _reference;

    constructor(address owner) {
        address diamondCutFacet = address(new DiamondCutFacet());
        // Deploy the diamond proxy contract
        address diamondProxy = address(new DiamondCloneable(owner, diamondCutFacet));
        _reference = diamondProxy;
    }

    function sources() internal view virtual override returns (address[] memory, bytes32 name, uint256 version) {
        address[] memory _sources = new address[](1);
        _sources[0] = _reference;
        return (_sources, bytes32(abi.encodePacked("DiamondDistribution")), uint256(0));
    }

    function getMetadata() public pure virtual override returns (string memory) {
        return "Diamond Distributor"; //ToDo: Add IPFS link with readme!
    }
}
