// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {IManagedAssetFactory} from "../interfaces/IManagedAssetFactory.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

contract ManagedAssetsFactory is IManagedAssetFactory, Ownable {
    using Address for address;
    struct TemplateStruct {
        address tAddress;
        bytes4[] initializationSelectors;
        bytes metadataDescriptiors;
    }

    struct AssetStruct {
        bytes32 templateURI;
        mapping(address => uint256) managerIds;
        mapping(uint256 => address) managers;
        uint256 managerCount;
        bytes metadata;
    }

    struct ManagerStruct {
        address assetAddress;
        bytes32 templateURI;
        bytes metadata;
    }

    mapping(bytes32 => TemplateStruct) assetTemplates;
    mapping(bytes32 => TemplateStruct) managerTemplates;
    mapping(address => AssetStruct) assetStore;
    mapping(address => ManagerStruct) managerStore;

    constructor(address _owner) {
        transferOwnership(_owner);
    }

    function addAssetTemplate(
        address assetTemplate,
        bytes32 templateURI,
        bytes4[] memory initializerFnSelectors
    ) external onlyOwner {
        require(assetTemplates[templateURI].tAddress == address(0), "MAF: asset exists");
        assetTemplates[templateURI].tAddress = assetTemplate;
        assetTemplates[templateURI].initializationSelectors = initializerFnSelectors;
    }

    function addManagementTemplate(
        address managerTemplate,
        bytes32 templateURI,
        bytes4[] memory initializerFnSelector
    ) external onlyOwner {
        require(managerTemplates[templateURI].tAddress == address(0), "MAF: manager exists");
        managerTemplates[templateURI].tAddress = managerTemplate;
        managerTemplates[templateURI].initializationSelectors = initializerFnSelector;
    }

    function deployAsset(
        bytes32 templateURI,
        bytes32 assetURI,
        bytes[] calldata instantiationPayload
    ) external payable returns (address) {
        require(assetTemplates[templateURI].tAddress != address(0), "MAF: template not found");
        address asset = Clones.clone(assetTemplates[templateURI].tAddress);
        bytes[] memory results = new bytes[](instantiationPayload.length);
        bytes memory metadata = instantiationPayload[0];
        assert(instantiationPayload.length > 0);
        for (uint256 i = 1; i < instantiationPayload.length; i++) {
            results[i] = asset.functionCall(
                abi.encodeWithSelector(assetTemplates[templateURI].initializationSelectors[i], instantiationPayload[i])
            );
        }
        if (msg.value > 0) Address.sendValue(payable(asset), msg.value);
        assetStore[asset].templateURI = assetURI;
        assetStore[asset].metadata = metadata;
        emit AssetDeployed(asset, assetURI, templateURI);
        return asset;
    }

    function deployAssetManager(
        address assetAddress,
        bytes32 templateURI,
        bytes[] calldata instantiationPayload
    ) external payable returns (address) {
        require(managerTemplates[templateURI].tAddress != address(0), "MAF: template not found");
        address manager = Clones.clone(managerTemplates[templateURI].tAddress);
        bytes[] memory results = new bytes[](instantiationPayload.length);
        bytes memory metadata = instantiationPayload[0];
        assert(instantiationPayload.length > 0);
        for (uint256 i = 1; i < instantiationPayload.length; i++) {
            bytes memory returnData = manager.functionCall(
                abi.encodeWithSelector(
                    managerTemplates[templateURI].initializationSelectors[i],
                    msg.sender,
                    instantiationPayload[i]
                )
            );
        }
        if (msg.value > 0) Address.sendValue(payable(manager), msg.value);
        uint256 managerId = assetStore[assetAddress].managerCount;
        assetStore[assetAddress].managers[managerId] = manager;
        assetStore[assetAddress].managerIds[manager] = managerId;
        assetStore[assetAddress].managerCount++;
        managerStore[manager].assetAddress = assetAddress;
        managerStore[manager].templateURI = templateURI;
        managerStore[manager].metadata = metadata;
        emit AssetManagerDeployed(assetAddress, manager, templateURI);
        return manager;
    }

    function isAssetManager(address maybeManager) external view returns (bool) {
        return managerStore[maybeManager].assetAddress != address(0);
    }

    function isManagedAsset(address maybeAsset) external view returns (bool) {
        return assetStore[maybeAsset].templateURI != bytes32(0);
    }

    function getAsset(address manager) external view returns (address) {
        return managerStore[manager].assetAddress;
    }

    function getAssetType(address asset) external view returns (bytes32) {
        return assetStore[asset].templateURI;
    }

    function getAssetUri(address asset) external view returns (bytes32) {
        return assetStore[asset].templateURI;
    }

    function getManagerCount(address asset) external view returns (uint256) {
        return assetStore[asset].managerCount;
    }

    function getManagerById(address asset, uint256 id) external view returns (address) {
        return assetStore[asset].managers[id];
    }

    function getManagerId(address asset, address manager) external view returns (uint256) {
        return assetStore[asset].managerIds[manager];
    }
}
