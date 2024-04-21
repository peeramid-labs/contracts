// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {IAppFactory} from "../interfaces/IAppFactory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AppFactoryOwnable is IAppFactory, Ownable {
    using Address for address;
    struct VersionedTemplateStruct {
        mapping(uint256 => IAppFactory.TemplateStruct) verionedTemplates; // version = major << 128 + minor << 64 + patch
        uint64 majorReleases; //
        mapping(uint64 => uint64) minorReleases; // minor releases per major version
        mapping(uint64 => mapping(uint64 => uint64)) patchReleases; // patch releases per major + minor version
    }

    mapping(bytes32 => VersionedTemplateStruct) templateStore;
    mapping(address => IAppFactory.RegistryRecord) public instances;

    function getNewVersionNumberFromReleaseType(
        VersionedTemplateStruct storage template,
        IAppFactory.ReleaseTypeEnum releaseType
    ) internal view returns (uint256) {
        if (releaseType == IAppFactory.ReleaseTypeEnum.MAJOR) {
            return (template.majorReleases + 1) << 128;
        } else if (releaseType == IAppFactory.ReleaseTypeEnum.MINOR) {
            return (template.majorReleases << 128) + ((template.minorReleases[template.majorReleases] + 1) << 64);
        } else if (releaseType == IAppFactory.ReleaseTypeEnum.PATCH) {
            return
                (template.majorReleases << 128) +
                (template.minorReleases[template.majorReleases] << 64) +
                (template.patchReleases[template.majorReleases][template.minorReleases[template.majorReleases]] + 1);
        }
        return 0;
    }

    function newTemplate(
        bytes32 templateURI,
        address src,
        address initializerContract,
        bytes4[] memory initializerFnSelectors,
        IAppFactory.ReleaseTypeEnum releaseType,
        bytes32 metadata
    ) public onlyOwner returns (uint256) {
        VersionedTemplateStruct storage template = templateStore[templateURI];
        uint256 newVersion = getNewVersionNumberFromReleaseType(template, releaseType);
        template.verionedTemplates[newVersion] = IAppFactory.TemplateStruct({
            src: src,
            initializer: initializerContract,
            initializationSelectors: initializerFnSelectors,
            metadata: metadata
        });
        if (releaseType == IAppFactory.ReleaseTypeEnum.MAJOR) {
            template.majorReleases++;
        } else if (releaseType == IAppFactory.ReleaseTypeEnum.MINOR) {
            template.minorReleases[template.majorReleases]++;
        } else if (releaseType == IAppFactory.ReleaseTypeEnum.PATCH) {
            template.patchReleases[template.majorReleases][template.minorReleases[template.majorReleases]]++;
        }
        emit TemplateAdded(templateURI, src, msg.sender);

        emit NewTemplateVersion(
            templateURI,
            releaseType,
            string(abi.encodePacked(newVersion)),
            string(abi.encodePacked(newVersion))
        );
        return newVersion;
    }

    function instantiate(
        bytes32 templateURI,
        uint64[3] memory version,
        bytes[] calldata instantiationPayload
    ) public returns (address) {
        VersionedTemplateStruct storage template = templateStore[templateURI];
        IAppFactory.TemplateStruct memory templateStruct = template.verionedTemplates[
            (version[0] << (128 + version[1])) << (64 + version[2])
        ];

        string memory versionString = string.concat(
            Strings.toString(version[0]),
            ".",
            Strings.toString(version[1]),
            ".",
            Strings.toString(version[2])
        );

        require(templateStruct.src != address(0), "AF: template not found");
        address instance = Clones.clone(templateStruct.src);
        bytes[] memory initializationResults = new bytes[](instantiationPayload.length);
        if (templateStruct.initializer != address(0)) {
            for (uint256 i = 0; i < instantiationPayload.length; i++) {
                initializationResults[i] = instance.functionCall(
                    abi.encodeWithSelector(templateStruct.initializationSelectors[i], instantiationPayload[i])
                );
            }
        }
        instances[instance] = IAppFactory.RegistryRecord({templateURI: templateURI, templateVersion: version});
        emit AppInstantiated(templateURI, versionString, msg.sender, initializationResults);
        return instance;
    }

    function getMajorReleaseCnt(bytes32 templateURI) public view returns (uint256) {
        return templateStore[templateURI].majorReleases;
    }

    function getMinorReleaseCnt(bytes32 templateURI, uint256 majorVersion) public view returns (uint256) {
        return templateStore[templateURI].minorReleases[uint64(majorVersion)];
    }

    function getPatchReleaseCnt(
        bytes32 templateURI,
        uint64 majorVersion,
        uint64 minorVersion
    ) public view returns (uint256) {
        return templateStore[templateURI].patchReleases[uint64(majorVersion)][uint64(minorVersion)];
    }

    function getLatestTemplate(bytes32 templateURI) public view returns (IAppFactory.TemplateStruct memory) {
        VersionedTemplateStruct storage template = templateStore[templateURI];
        return
            template.verionedTemplates[
                (template.majorReleases << 128) +
                    (template.minorReleases[template.majorReleases] << 64) +
                    template.patchReleases[template.majorReleases][template.minorReleases[template.majorReleases]]
            ];
    }

    function getTemplate(bytes32 templateURI, uint64 version) public view returns (IAppFactory.TemplateStruct memory) {
        VersionedTemplateStruct storage template = templateStore[templateURI];
        return template.verionedTemplates[version];
    }

    function getTemplateOfInstance(address maybeInstance) public view returns (IAppFactory.TemplateStruct memory) {
        VersionedTemplateStruct storage template = templateStore[instances[maybeInstance].templateURI];
        return
            template.verionedTemplates[
                (template.majorReleases << (128 + template.minorReleases[template.majorReleases])) <<
                    (64 +
                        template.patchReleases[template.majorReleases][template.minorReleases[template.majorReleases]])
            ];
    }

    function getMinorReleaseCnt(bytes32 templateURI, uint64 majorVersion) external view override returns (uint256) {
        return templateStore[templateURI].minorReleases[majorVersion];
    }
}
