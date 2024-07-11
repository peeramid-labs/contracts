// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../abstracts/CloneDistributor.sol";
import "../../diamond/Diamond.sol";
import "../../diamond/facets/DiamondCutFacet.sol";
import "../distributions/DiamondDistribution.sol";
import "../../diamond/libraries/LibDiamond.sol";
import "../../diamond/interfaces/IDiamondCut.sol";

abstract contract CuttedDiamondDistribution is DiamondDistribution {
    address immutable initializer;
    bool initialized = false;
    bytes4 immutable initializerSelector;
    // bool immutable initialized;
    error NotInitialized();
    error AlreadyInitialized();

    constructor(address owner, address _initializer, bytes4 _initializerSelector) DiamondDistribution(owner) {
        initializer = _initializer;
        initializerSelector = _initializerSelector;
    }

    function initialize(IDiamondCut.FacetCut[] memory _diamondCut, bytes memory args) internal {
        if (initialized) {
            revert AlreadyInitialized();
        }
        bytes memory _calldata = abi.encodeWithSelector(initializerSelector, args);
        DiamondCutFacet(super.sources()[0]).diamondCut(_diamondCut, initializer, _calldata);
        initialized = true;
    }

    function sources() internal view virtual override returns (address[] memory) {
        if (!initialized) {
            revert NotInitialized();
        }
        return super.sources();
    }

    function getMetadata() public pure virtual override returns (string memory) {
        return string(abi.encodePacked(super.getMetadata(), ";", "CuttedDiamondDistribution")); //ToDo: Add IPFS link with readme!
    }
}
