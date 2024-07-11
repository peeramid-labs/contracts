// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../abstracts/CloneDistributor.sol";
import "../../diamond/DiamondClonable.sol";
import "../../diamond/facets/DiamondCutFacet.sol";
import "../distributions/DiamondDistribution.sol";
import "../../diamond/libraries/LibDiamond.sol";
import "../../diamond/interfaces/IDiamondCut.sol";
import "hardhat/console.sol";
abstract contract InitializedDiamondDistribution is DiamondDistribution {
    address immutable initializer;
    bytes4 immutable initializerSelector;

    constructor(address owner, address _initializer, bytes4 _initializerSelector) DiamondDistribution(owner) {
        initializer = _initializer;
        initializerSelector = _initializerSelector;
    }

    function initialize(
        DiamondCutFacet instance,
        IDiamondCut.FacetCut[] memory _diamondCut,
        bytes memory args
    ) internal virtual {
        bytes memory _calldata = abi.encodeWithSelector(initializerSelector, args);
        instance.diamondCut(_diamondCut, initializer, _calldata);
    }

    function getSources() public view virtual override returns (address[] memory) {
        address[] memory srcs = super.getSources();
        address[] memory _sources = new address[](2);
        assert(srcs.length == 1);
        _sources[0] = srcs[0];
        _sources[1] = initializer;
        return srcs;
    }

    function getMetadata() public pure virtual override returns (string memory) {
        return string(abi.encodePacked(super.getMetadata(), ";", "InitializedDiamondDistribution")); //ToDo: Add IPFS link with readme!
    }
}
