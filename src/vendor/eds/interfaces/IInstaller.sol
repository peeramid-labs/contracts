// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IDistributor} from "./IDistributor.sol";
import "../layers/ILayer.sol";

interface IInstaller is ILayer {
    error InvalidDistributor(IDistributor distributor);
    event DistributorAdded(IDistributor indexed distributor);
    event DistributorRemoved(IDistributor indexed distributor);
    function addDistributor(IDistributor distributor) external;
    function removeDistributor(IDistributor distributor) external;
    function isDistributor(IDistributor distributor) external view returns (bool);
    function getDistibutors() external view returns (IDistributor[] memory);

    event Installed(address indexed instance, bytes32 indexed distributionId, bytes32 indexed permissions, bytes args);
    event Uninstalled(address indexed instance);
    function install(
        IDistributor distributor,
        bytes32 distributionId,
        bytes calldata args
    ) external returns (address instanceId);
    function uninstall(address instance) external;

    function getInstance(uint256 instanceId) external view returns (address[] memory instaneContracts);
    function getInstancesNum() external view returns (uint256);

    function isInstance(address instance) external view returns (bool);
    function distributorOf(address instance) external view returns (IDistributor);

    function target() external pure returns (address);
    error NotAnInstance(address instance);
}
