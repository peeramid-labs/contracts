// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IManagedAssetFactory {
    function deployAsset(
        bytes32 assetUri,
        bytes32 assetType,
        bytes[] calldata instantiationPayload
    ) external payable returns (address);

    function deployAssetManager(
        address sAddr,
        bytes32 strategyId,
        bytes[] calldata instantiationPayload
    ) external payable returns (address);

    function isAssetManager(address maybeManager) external view returns (bool);

    function isManagedAsset(address maybeAsset) external view returns (bool);

    function getAsset(address manager) external view returns (address);

    function getAssetType(address asset) external view returns (bytes32);

    function getAssetUri(address asset) external view returns (bytes32);

    event AssetDeployed(address indexed asset, bytes32 indexed assetUri, bytes32 indexed assetType);
    event AssetManagerDeployed(address indexed asset, address indexed manager, bytes32 indexed strategyId);
}
