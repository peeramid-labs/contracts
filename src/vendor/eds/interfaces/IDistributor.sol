// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "./IDistribution.sol";
import "../layers/ILayer.sol";
import "./IInitializer.sol";

interface IDistributor is ILayer {
    error DistributionNotFound(bytes32 id);
    error DistributionExists(bytes32 id);
    error InitializerNotFound(bytes32 id);
    event DistributedAndInitialized(bytes32 indexed distributionId, bytes indexed argsHash);
    event DistributionRemoved(IDistribution indexed id);
    event DistributionAdded(bytes32 indexed newDistributionId, bytes32 indexed initializerId);
    function getDistributions() external view returns (bytes32[] memory ids);
    function getDistributionURI(IDistribution id) external view returns (string memory);
    function instantiate(bytes32 id, bytes calldata args) external returns (address[] memory);
    function addDistribution(IDistribution newDistribution, bytes32 initializer) external;
    function removeDistribution(IDistribution id) external;
}
