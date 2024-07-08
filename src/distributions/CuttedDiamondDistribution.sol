// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../abstracts/CloneDistributor.sol";
import "../vendor/Diamond.sol";
import "../vendor/facets/DiamondCutFacet.sol";
import "./DiamondDistribution.sol";
import "../vendor/libraries/LibDiamond.sol";
import "../vendor/interfaces/IDiamondCut.sol";

contract CuttedDiamondDistribution is DiamondDistribution {
    address immutable initializer;
    bool initialized = false;
    // bool immutable initialized;
    error NotInitialized();
    error AlreadyInitialized();

    constructor(address _initializer) DiamondDistribution() {
        initializer = _initializer;
    }

    function initialize(IDiamondCut.FacetCut[] memory _diamondCut, bytes memory _calldata) internal {
        if (initialized) {
            revert AlreadyInitialized();
        }
        DiamondCutFacet(super.sources()[0]).diamondCut(_diamondCut, initializer, _calldata);
        initialized = true;
    }

    function sources() internal view virtual override returns (address[] memory) {
        if (!initialized) {
            revert NotInitialized();
        }
        address[] memory srcs = super.sources();
        address[] memory _sources = new address[](2);
        _sources[0] = srcs[0];
        _sources[1] = initializer;
        return _sources;
    }

    function getMetadata() public pure virtual override returns (string memory) {
        return string(abi.encodePacked(super.getMetadata(), ";", "CuttedDiamondDistribution")); //ToDo: Add IPFS link with readme!
    }
}
