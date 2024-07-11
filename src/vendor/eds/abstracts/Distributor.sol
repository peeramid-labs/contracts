// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;
import "../interfaces/IDistribution.sol";
import "../interfaces/IDistributor.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../interfaces/ICodeIndex.sol";
import "../interfaces/IInitializer.sol";
abstract contract Distributor is IDistributor {
    using EnumerableSet for EnumerableSet.Bytes32Set;
    ICodeIndex immutable codeIndex;
    EnumerableSet.Bytes32Set private distirbutionsSet;
    mapping(bytes32 => IInitializer) private initializers;

    constructor(ICodeIndex _codeIndex) {
        codeIndex = _codeIndex;
    }

    function getDistributions() public view returns (bytes32[] memory) {
        return distirbutionsSet.values();
    }

    function getDistributionURI(bytes32 id) public view returns (string memory) {
        return IDistribution(codeIndex.get(id)).getMetadata();
    }

    function addDistribution(bytes32 newDistribution, bytes32 initializer) external {
        if (codeIndex.get(newDistribution) == address(0)) revert DistributionNotFound(newDistribution);
        if (codeIndex.get(initializer) == address(0) && initializer != bytes32(0))
            revert InitializerNotFound(initializer);
        if (distirbutionsSet.contains(newDistribution)) revert DistributionExists(newDistribution);
        distirbutionsSet.add(newDistribution);
        initializers[newDistribution] = IInitializer(codeIndex.get(newDistribution));
        emit DistributionAdded(newDistribution, initializer);
    }

    function instantiate(bytes32 id, bytes calldata args) external returns (address[] memory instances) {
        if (!distirbutionsSet.contains(id)) revert DistributionNotFound(id);
        instances = IDistribution(codeIndex.get(id)).instantiate();
        bytes4 selector = IInitializer.initialize.selector;
        // This ensures instance owner (distributor) performs initialization.
        // It is distirbutor responsibility to make sure calldata and initializer are safe to execute
        (bool success, bytes memory result) = address(initializers[id]).delegatecall(
            abi.encodeWithSelector(selector, args)
        );
        require(success, string(result));
        emit DistributedAndInitialized(id, args);
        return instances;
    }
}
