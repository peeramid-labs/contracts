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

    struct VersionedTemplateStruct {
        mapping(bytes32 => TemplateStruct) verionedTemplates;
        mapping(uint64 => uint256[]) major;
        mapping(uint64 => uint256[]) minor;
        mapping(uint64 => uint256[]) patch;
        uint256 totalReleases;
    }

    struct AssetStruct {
        bytes32 templateURI;
        bytes32 version;
        address assetAddress;
        mapping(address => uint256) managerIds;
        mapping(uint256 => address) managers;
        uint256 managerCount;
        bytes metadata;
    }

    struct ManagerStruct {
        bytes32 assetURI;
        bytes32 templateURI;
        bytes metadata;
    }

    mapping(bytes32 => TemplateStruct) assetTemplates;
    mapping(bytes32 => ManagerStruct) managerTemplates;
    mapping(bytes32 => AssetStruct) assetStore;
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
        uint256 version,
        bytes32 templateURI,
        bytes4[] memory initializerFnSelector
    ) external onlyOwner {
        uint64 patchVersion = uint64(version);
        uint64 minorVersion = uint64(version >> 64);
        uint64 majorVersion = uint64(version >> 128);
        require(managerTemplates[templateURI].totalReleases == address(0), "MAF: manager exists");
        managerTemplates[templateURI].tAddress = managerTemplate;
        managerTemplates[templateURI].initializationSelectors = initializerFnSelector;
    }

    function deployAsset(
        bytes32 assetURI,
        bytes32 templateURI,
        bytes[] calldata instantiationPayload
    ) external payable returns (address) {
        require(assetTemplates[templateURI].tAddress != address(0), "MAF: template not found");
        address asset = Clones.clone(assetTemplates[templateURI].tAddress);
        bytes[] memory results = new bytes[](instantiationPayload.length);
        assert(instantiationPayload.length > 0);
        for (uint256 i = 0; i < instantiationPayload.length; i++) {
            results[i] = asset.functionCall(
                abi.encodeWithSelector(assetTemplates[templateURI].initializationSelectors[i], instantiationPayload[i])
            );
        }
        if (msg.value > 0) Address.sendValue(payable(asset), msg.value);
        assetStore[assetURI].templateURI = assetURI;
        assetStore[assetURI].metadata = bytes(abi.encode(results));
        emit AssetDeployed(asset, assetURI, templateURI);
        return asset;
    }

    function deployAssetManager(
        bytes32 assetURI,
        bytes32 templateURI,
        bytes[] calldata instantiationPayload
    ) external payable returns (address) {
        require(managerTemplates[templateURI].tAddress != address(0), "MAF: template not found");
        address manager = Clones.clone(managerTemplates[templateURI].tAddress);
        bytes[] memory results = new bytes[](instantiationPayload.length);
        assert(instantiationPayload.length > 0);
        for (uint256 i = 0; i < instantiationPayload.length; i++) {
            results[i] = manager.functionCall(
                abi.encodeWithSelector(
                    managerTemplates[templateURI].initializationSelectors[i],
                    msg.sender,
                    instantiationPayload[i]
                )
            );
        }
        if (msg.value > 0) Address.sendValue(payable(manager), msg.value);
        uint256 managerId = assetStore[assetURI].managerCount;
        assetStore[assetURI].managers[managerId] = manager;
        assetStore[assetURI].managerIds[manager] = managerId;
        assetStore[assetURI].managerCount++;
        managerStore[manager].assetURI = assetURI;
        managerStore[manager].templateURI = templateURI;
        managerStore[manager].metadata = bytes(abi.encode(results));
        emit AssetManagerDeployed(assetStore[assetURI].assetAddress, manager, templateURI);
        return manager;
    }

    function isAssetManager(address maybeManager) external view returns (bool) {
        return managerStore[maybeManager].assetURI != bytes32(0);
    }

    function isManagedAsset(bytes32 maybeAsset) external view returns (bool) {
        return assetStore[maybeAsset].templateURI != bytes32(0);
    }

    function getAssetURI(address manager) external view returns (bytes32) {
        return managerStore[manager].assetURI;
    }

    function getAssetType(bytes32 assetURI) external view returns (bytes32) {
        return assetStore[assetURI].templateURI;
    }

    function getAssetAddress(bytes32 assetURI) external view returns (address) {
        return assetStore[assetURI].assetAddress;
    }

    function getManagerCount(bytes32 assetURI) external view returns (uint256) {
        return assetStore[assetURI].managerCount;
    }

    function getManagerById(bytes32 assetURI, uint256 id) external view returns (address) {
        return assetStore[assetURI].managers[id];
    }

    function getManagerId(bytes32 assetURI, address manager) external view returns (uint256) {
        return assetStore[assetURI].managerIds[manager];
    }
}
