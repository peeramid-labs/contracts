// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../abstracts/InitializedDiamondDistribution.sol";
import "../../diamond/interfaces/IDiamondCut.sol";
import "../../diamond/facets/DiamondLoupeFacet.sol";
import "../../diamond/facets/DiamondCutFacet.sol";
import "hardhat/console.sol";

contract TestFacet {
    event Bar();

    function foo() public {
        emit Bar();
    }

    function ping() public pure returns (string memory) {
        return "pong";
    }
}

contract MockInitializedDiamondDistribution is InitializedDiamondDistribution {
    constructor(
        address _initializer,
        bytes4 initializerSelector
    ) InitializedDiamondDistribution(address(this), _initializer, initializerSelector) {}

    function instantiate() public override returns (address[] memory instances) {
        address[] memory _instances = super.instantiate();
        address diamond = _instances[0];
        IDiamondCut.FacetCut[] memory facetCuts = new IDiamondCut.FacetCut[](2);

        bytes4[] memory selectors = new bytes4[](1);
        // selectors[0] = TestFacet.foo.selector;
        selectors[0] = TestFacet.ping.selector;
        facetCuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(new TestFacet()), //ToDo: This must be fixed address because we work within instantiate
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
            facetAddress: address(new DiamondLoupeFacet()), //ToDo: This must be fixed address because we work within instantiate
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: loupeSelectors
        });

        bytes memory args = new bytes(0);
        super.initialize(DiamondCutFacet(diamond), facetCuts, args);
        assert(DiamondLoupeFacet(diamond).facets().length == 3); // DiamondCut Initializer, TestFacet

        return _instances;
    }

    function getMetadata() public pure virtual override returns (string memory) {
        return string(abi.encodePacked(super.getMetadata(), ";", "initializible")); //ToDo: Add IPFS link with readme!
    }
}
