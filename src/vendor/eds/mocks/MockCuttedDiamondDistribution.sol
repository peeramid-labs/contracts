// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../abstracts/CuttedDiamondDistribution.sol";
import "../../diamond/interfaces/IDiamondCut.sol";

contract TestFacet {
    event Bar();

    function foo() public {
        emit Bar();
    }

    function ping() public pure returns (string memory) {
        return "pong";
    }
}

contract MockCuttedDiamondDistribution is CuttedDiamondDistribution {
    constructor(
        address _initializer,
        bytes4 initializerSelector
    ) CuttedDiamondDistribution(address(this), _initializer, initializerSelector) {}

    function instantiate() public override returns (address[] memory instances) {
        address[] memory instances = super.instantiate();
        IDiamondCut.FacetCut[] memory facetCuts = new IDiamondCut.FacetCut[](1);

        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = TestFacet.foo.selector;
        selectors[1] = TestFacet.ping.selector;
        facetCuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(new TestFacet()), //ToDo: This must be fixed address because we work within instantiate
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });
        bytes memory args = new bytes(0);
        super.initialize(facetCuts, args);
    }

    function sources() internal view virtual override returns (address[] memory) {
        return super.sources();
    }

    function getMetadata() public pure virtual override returns (string memory) {
        return string(abi.encodePacked(super.getMetadata(), ";", "initializible")); //ToDo: Add IPFS link with readme!
    }
}
