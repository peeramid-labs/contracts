// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAppFactory {
    struct TemplateStruct {
        address src;
        address initializer;
        bytes4[] initializationSelectors;
        bytes32 metadata;
    }

    struct RegistryRecord {
        bytes32 templateURI;
        uint64[3] templateVersion;
    }

    enum ReleaseTypeEnum {
        MAJOR,
        MINOR,
        PATCH
    }

    function newTemplate(
        bytes32 templateURI,
        address src,
        address initializerContract,
        bytes4[] memory initializerFnSelectors,
        ReleaseTypeEnum releaseType,
        bytes32 metadata
    ) external returns (uint256);

    function instantiate(
        bytes32 templateURI,
        uint64[3] memory version,
        bytes[] calldata instantiationPayload
    ) external returns (address);

    function getTemplateOfInstance(address maybeInstance) external view returns (TemplateStruct memory);

    function getMajorReleaseCnt(bytes32 templateURI) external view returns (uint256);

    function getMinorReleaseCnt(bytes32 templateURI, uint64 majorVersion) external view returns (uint256);

    function getPatchReleaseCnt(
        bytes32 templateURI,
        uint64 majorVersion,
        uint64 minorVersion
    ) external view returns (uint256);

    function getLatestTemplate(bytes32 templateURI) external view returns (TemplateStruct memory);

    function getTemplate(bytes32 templateURI, uint64 version) external view returns (TemplateStruct memory);

    event TemplateAdded(bytes32 indexed templateURI, address indexed source, address indexed publisher);
    event NewTemplateVersion(
        bytes32 indexed templateURI,
        ReleaseTypeEnum indexed releaseType,
        string indexed versionHash,
        string version
    );
    event AppInstantiated(
        bytes32 indexed templateURI,
        string indexed versionHash,
        address indexed instantiator,
        bytes[] initializationResult
    );
}
