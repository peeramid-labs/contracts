// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "./LibDiamondOwner.sol";
// import { IMultipass } from "../interfaces/sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

library LibMultipass {
    /**
     * @dev resolves user from any given argument
     * Requirements:
     *  domainName must be given and must be initialized
     *  id OR username OR address must be given
     * This method first tries to resolve by address, then by user id and finally by username
     * @param domainName domain name
     * @param wallet adress of user
     * @param id user id
     * @param username username
     * @param targetDomain if this is set to valid domain name, then after sucessfull resolving account at domainName,
     *                       this method will rerun with resolving user properties in targetDomain
     */
    struct NameQuery {
        bytes32 domainName;
        address wallet;
        bytes32 name;
        bytes32 id;
        bytes32 targetDomain;
    }

    /**
     * @dev The domain name of the registrar.
     * @param registrar is the address private key of which is owned by signing server (e.g. Discord bot server)
     * @param name is unique string that is used to find this domain within domains.
     * @param freeRegistrationsNumber is the number of free registrations for this domain

     * @param fee amount of payment requried to register name in the domain
     * @param ttl time to live for changes in the domain properties
     * @param isActive when is false domain name will not respond to any changes and will not return any address
    **/
    struct Domain {
        bytes32 name; //32bytes
        uint256 fee; //32bytes
        uint256 freeRegistrationsNumber; //32bytes
        uint256 referrerReward; //32bytes
        uint256 referralDiscount; //32bytes
        bool isActive; //1byte
        address registrar; //20 bytes
        uint24 ttl; //3 bytes (not being used for now)
        uint256 registerSize; //32bytes
    }

    //  struct NameQueryBytes32 {
    //     string domainName;
    //     address wallet;
    //     bytes32 name;
    //     bytes32 id;
    //     string targetDomain;
    // }
    struct Record {
        address wallet;
        bytes32 name;
        bytes32 id;
        uint96 nonce;
        bytes32 domainName;
    }

    // struct RecordBytes32 {
    //     address wallet;
    //     bytes32 name;
    //     bytes32 id;
    //     uint96 nonce;
    // }

    bytes32 constant MULTIPASS_STORAGE_POSITION = keccak256("multipass.diamond.storage.position");

    /**
     * @dev The domain name of the registrar.
     * @param properties - domain configuration
     * @param idToAddress is mapping from unique identificator to an address
     * @param registerSize is number of registered users for this domain
     * @param nonce is incremented each time Record changes in addressToId map
     * @param nameToId is mapping from names to unique identificator. While each name required to be unique,
                        names might change on the domain, so we keep records to user identificators as immutable property of user
     * @param addressToId is mapping from an address to unique identificator
     * @param idToName is mapping from identificator to a name
    **/
    struct DomainNameService {
        Domain properties; //128 bytes
        mapping(bytes32 => address) idToAddress; //N*20bytes
        mapping(bytes32 => uint96) nonce; //N*12bytes
        mapping(address => bytes32) addressToId; //N*32 bytes
        mapping(bytes32 => bytes32) nameToId; //N*32 bytes
        mapping(bytes32 => bytes32) idToName; //N*32 bytes
        //Total: 128+N*160 Bytes
    }

    struct MultipassStorageStruct {
        mapping(uint256 => DomainNameService) domains;
        mapping(bytes32 => uint256) domainNameToIndex; //helper to get domain index by name
        uint256 numDomains;
    }

    function MultipassStorage() internal pure returns (MultipassStorageStruct storage es) {
        bytes32 position = MULTIPASS_STORAGE_POSITION;
        assembly {
            es.slot := position
        }
    }

    bytes32 internal constant _TYPEHASH =
        keccak256("registerName(bytes32 name,bytes32 id,bytes32 domainName,uint256 deadline,uint96 nonce)");
    bytes32 internal constant _TYPEHASH_REFERRAL = keccak256("proofOfReferrer(address referrerAddress)");

    // function _stringToBytes32(string memory source) internal pure returns (bytes32 result) {
    //     uint256 length = bytes(source).length;
    //     require(length <= 32, "_stringToBytes32->String longer than 32 bytes");
    //     bytes memory tempEmptyStringTest = abi.encodePacked(source);
    //     if (tempEmptyStringTest.length == 0) {
    //         return 0x0;
    //     }
    //     assembly {
    //         result := mload(add(source,32))
    //     }
    // }

    function _checkStringFits32b(string memory value) internal pure returns (bool) {
        if (bytes(value).length <= 32) {
            return true;
        } else {
            return false;
        }
    }

    function _checkNotEmpty(bytes32 value) internal pure returns (bool) {
        if (value == "") {
            return false;
        } else {
            return true;
        }
    }

    function resolveDomainIndex(bytes32 domainName) internal view returns (uint256) {
        MultipassStorageStruct storage s = MultipassStorage();
        return s.domainNameToIndex[domainName];
    }

    function _getDomainStorage(bytes32 domainName) internal view returns (DomainNameService storage) {
        MultipassStorageStruct storage s = MultipassStorage();

        return s.domains[resolveDomainIndex(domainName)];
    }

    function _initializeDomain(
        address registrar,
        uint256 freeRegistrationsNumber,
        uint256 fee,
        bytes32 domainName,
        uint256 referrerReward,
        uint256 referralDiscount
    ) internal {
        LibMultipass.MultipassStorageStruct storage ms = LibMultipass.MultipassStorage();

        uint256 domainIndex = ms.numDomains + 1;
        LibMultipass.DomainNameService storage _domain = ms.domains[domainIndex];
        _domain.properties.registrar = registrar;
        _domain.properties.freeRegistrationsNumber = freeRegistrationsNumber;
        _domain.properties.fee = fee;
        _domain.properties.name = domainName;
        _domain.properties.referrerReward = referrerReward;
        _domain.properties.referralDiscount = referralDiscount;
        ms.numDomains++;
        ms.domainNameToIndex[domainName] = domainIndex;
    }

    function _getModifyPrice(LibMultipass.Record memory userRecord) internal view returns (uint256) {
        LibMultipass.DomainNameService storage _domain = LibMultipass._getDomainStorage(userRecord.domainName);
        uint256 feeCoefficient = SafeMath.div(_domain.properties.fee, 10);
        uint256 nonceCoefficient = SafeMath.mul(userRecord.nonce, userRecord.nonce);
        return SafeMath.add(SafeMath.mul(feeCoefficient, nonceCoefficient), _domain.properties.fee);
    }

    function _resolveRecord(NameQuery memory query) private view returns (bool, Record memory) {
        if ((query.wallet == address(0)) && (query.id == bytes32(0)) && (query.name == bytes32(0))) {
            Record memory rv;
            return (false, rv);
        }

        MultipassStorageStruct storage s = MultipassStorage();
        DomainNameService storage _domain = s.domains[s.domainNameToIndex[query.domainName]];
        DomainNameService storage _targetDomain = s.domains[
            s.domainNameToIndex[query.targetDomain == bytes32(0) ? query.domainName : query.targetDomain]
        ];
        address _wallet;
        {
            // resolve wallet
            if (query.wallet != address(0)) {
                _wallet = query.wallet;
            } else if (query.id != bytes32(0)) {
                _wallet = _domain.idToAddress[query.id];
            } else if (query.name != bytes32(0)) {
                bytes32 _id = _domain.nameToId[query.name];
                _wallet = _domain.idToAddress[_id];
            }
        }

        //from wallet find and return record
        return _resolveFromAddress(_wallet, _targetDomain);
    }

    /**
    @dev resolves Record of name query in to status and identity */
    function resolveRecord(NameQuery memory query) internal view returns (bool, Record memory) {
        return _resolveRecord(query);
    }

    /** @dev this function bears no security checks, it will ignore nonce in arg and will increment
     *   nonce value stored in domain instread
     */
    function _setRecord(DomainNameService storage domain, Record memory record) internal {
        domain.addressToId[record.wallet] = record.id;
        domain.idToAddress[record.id] = record.wallet;
        domain.idToName[record.id] = record.name;
        domain.nameToId[record.name] = record.id;
        domain.nonce[record.id] += 1;
    }

    function _resolveFromAddress(
        address _address,
        DomainNameService storage _domain
    ) private view returns (bool, Record memory) {
        Record memory resolved;

        resolved.id = _domain.addressToId[_address];
        resolved.name = _domain.idToName[resolved.id];
        resolved.nonce = _domain.nonce[resolved.id];
        resolved.wallet = _address;
        resolved.domainName = _domain.properties.name;

        if (resolved.id == bytes32(0)) {
            return (false, resolved);
        }
        return (true, resolved);
    }

    function queryFromRecord(Record memory _record, bytes32 _domainName) internal pure returns (NameQuery memory) {
        NameQuery memory _query;
        _query.id = _record.id;
        _query.domainName = _domainName;
        _query.name = _record.name;
        _query.wallet = _record.wallet;
        return _query;
    }

    function shouldRegisterForFree(DomainNameService storage domain) internal view returns (bool) {
        return domain.properties.freeRegistrationsNumber > domain.properties.registerSize ? true : false;
    }

    function _registerNew(Record memory newRecord, DomainNameService storage domain) internal {
        _setRecord(domain, newRecord);
        domain.properties.registerSize += 1;
    }

    function _getContractState() internal view returns (uint256) {
        LibMultipass.MultipassStorageStruct storage ms = LibMultipass.MultipassStorage();
        return ms.numDomains;
    }

    function _getDomainStorageByIdx(uint256 index) internal view returns (DomainNameService storage) {
        MultipassStorageStruct storage s = MultipassStorage();

        return s.domains[index];
    }

    using LibMultipass for NameQuery;
}
