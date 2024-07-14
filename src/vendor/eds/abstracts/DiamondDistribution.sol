// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../abstracts/CloneDistribution.sol";
import "../../diamond/DiamondClonable.sol";
import "../../diamond/facets/DiamondCutFacet.sol";
import "../distributions/CodeHashDistribution.sol";
import "../../diamond/libraries/LibDiamond.sol";
import "../../diamond/interfaces/IDiamondCut.sol";

abstract contract DiamondDistribution is CodeHashDistribution {
    address immutable initializer;
    bytes4 immutable initializerSelector;

    constructor(
        bytes32 diamondSourceId,
        bytes32 diamondSourceMetadata,
        bytes32 initializerId,
        bytes4 _initializerSelector
    ) CodeHashDistribution(diamondSourceId, diamondSourceMetadata) {
        address _initializer = getContractsIndex().get(initializerId);
        if (_initializer == address(0)) revert("DiamondDistribution: Initializer not found in index");
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

    function getMetadata() public view virtual override returns (string memory) {
        return string(abi.encodePacked(super.getMetadata(), ";", "DiamondDistribution")); //ToDo: Add IPFS link with readme!
    }
}
