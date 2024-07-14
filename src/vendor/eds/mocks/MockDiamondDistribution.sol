// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../abstracts/DiamondDistribution.sol";
import "../../diamond/interfaces/IDiamondCut.sol";
import "../../diamond/facets/DiamondLoupeFacet.sol";
import "../../diamond/facets/DiamondCutFacet.sol";
import "../interfaces/ICodeIndex.sol";

contract TestFacet {
    event Bar();

    function foo() public {
        emit Bar();
    }

    function ping() public pure returns (string memory) {
        return "pong";
    }
}

contract MockDiamondDistribution is DiamondDistribution {
    address immutable testFacetAddress;
    address immutable dimondLoupeFacetAddress;

    constructor(
        bytes32 diamondSourceId,
        bytes32 testFacetId,
        bytes32 diamondLoupeFacetId,
        bytes32 initializerId,
        bytes4 initializerSelector
    )
        DiamondDistribution(
            diamondSourceId,
            bytes32(abi.encodePacked("Diamond.sol")),
            initializerId,
            initializerSelector
        )
    {
        ICodeIndex index = getContractsIndex();
        dimondLoupeFacetAddress = index.get(diamondLoupeFacetId);
        testFacetAddress = index.get(testFacetId);
        if (testFacetAddress == address(0)) revert("TestFacet not found in index");
        if (dimondLoupeFacetAddress == address(0)) revert("DiamondLoupeFacet not found in index");
    }

    function instantiate() public override returns (address[] memory instances) {
        address[] memory _instances = super.instantiate();
        address diamond = _instances[0];
        IDiamondCut.FacetCut[] memory facetCuts = new IDiamondCut.FacetCut[](2);

        bytes4[] memory selectors = new bytes4[](1);
        // selectors[0] = TestFacet.foo.selector;
        selectors[0] = TestFacet.ping.selector;
        facetCuts[0] = IDiamondCut.FacetCut({
            facetAddress: testFacetAddress,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        bytes4[] memory loupeSelectors = new bytes4[](5);
        loupeSelectors[0] = DiamondLoupeFacet.facetAddress.selector;
        loupeSelectors[1] = DiamondLoupeFacet.facetAddresses.selector;
        loupeSelectors[2] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        loupeSelectors[3] = DiamondLoupeFacet.facets.selector;
        loupeSelectors[4] = DiamondLoupeFacet.supportsInterface.selector;
        facetCuts[1] = IDiamondCut.FacetCut({
            facetAddress: dimondLoupeFacetAddress,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: loupeSelectors
        });

        bytes memory args = new bytes(0);
        super.initialize(DiamondCutFacet(diamond), facetCuts, args);
        assert(DiamondLoupeFacet(diamond).facets().length == 3); // + CutFacet

        return _instances;
    }

    function getMetadata() public view virtual override returns (string memory) {
        return string(abi.encodePacked(super.getMetadata(), ";", "initializible")); //ToDo: Add IPFS link with readme!
    }
}
