// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IManagedAssetFactory {
    function deployAsset(
        bytes32 assetURI,
        bytes32 templateURI,
        bytes[] calldata instantiationPayload
    ) external payable returns (address);

    function deployAssetManager(
        bytes32 assetURI,
        bytes32 templateURI,
        bytes[] calldata instantiationPayload
    ) external payable returns (address);

    function isAssetManager(address maybeManager) external view returns (bool);

    function isManagedAsset(bytes32 maybeAsset) external view returns (bool);

    function getAssetURI(address manager) external view returns (bytes32);

    function getAssetType(bytes32 assetURI) external view returns (bytes32);

    function getAssetAddress(bytes32 assetURI) external view returns (address);

    event AssetDeployed(address indexed asset, bytes32 indexed assetUri, bytes32 indexed assetType);
    event AssetManagerDeployed(address indexed asset, address indexed manager, bytes32 indexed strategyId);
}
