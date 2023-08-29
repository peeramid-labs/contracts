// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "./LibDiamondOwner.sol";
// import { IMultipass } from "../interfaces/sol";

library LibMultipass {
    /**
     * @dev resolves user from any given argument
     * Requirements:
     *  domainName must be given and must be initialized
     *  id OR username OR address must be given
     * This method first tries to resolve by address, then by user id and finally by username
     * @param domainName domain name
     * @param userAddress adress of user
     * @param id user id
     * @param username username
     * @param targetDomain if this is set to valid domain name, then after sucessfull resolving account at domainName,
     *                       this method will rerun with resolving user properties in targetDomain
     */
    struct NameQuery {
        string domainName;
        address userAddress;
        string name;
        string id;
        string targetDomain;
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

    struct NameQueryBytes32 {
        string domainName;
        address userAddress;
        bytes32 name;
        bytes32 id;
        string targetDomain;
    }
    struct Record {
        address wallet;
        string name;
        string id;
        uint96 nonce;
    }

    struct RecordBytes32 {
        address wallet;
        bytes32 name;
        bytes32 id;
        uint96 nonce;
    }

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
        mapping(uint256 => bytes32) TestInTheMiddle;
        mapping(bytes32 => bytes32) nameToId; //N*32 bytes
        mapping(bytes32 => bytes32) idToName; //N*32 bytes
        //Total: 128+N*160 Bytes
    }

    struct MultipassStorageStruct {
        mapping(uint256 => DomainNameService) s_domains;
        mapping(bytes32 => uint256) s_domainNameToIndex; //helper to get domain index by name
        string s_version;
        uint256 s_numDomains;
    }

    function MultipassStorage() internal pure returns (MultipassStorageStruct storage es) {
        bytes32 position = MULTIPASS_STORAGE_POSITION;
        assembly {
            es.slot := position
        }
    }

    bytes32 internal constant _TYPEHASH =
        keccak256("registerName(string name,string id,string domainName,uint256 deadline,uint96 nonce)");

    function _stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        require(bytes(source).length <= 32, "_stringToBytes32->String longer than 32 bytes");
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }

    function _checkStringFits32b(string memory value) internal pure returns (bool) {
        if (bytes(value).length <= 32) {
            return true;
        } else {
            return false;
        }
    }

    function _checkStringNotEmpty(string memory value) internal pure returns (bool) {
        if (bytes(value).length == 0) {
            return false;
        } else {
            return true;
        }
    }

    /**
    @dev resolves Record of name query in to status and identity */
    function resolveRecord(NameQuery memory query) internal view returns (bool, RecordBytes32 memory) {
        NameQueryBytes32 memory query32b;
        query32b.name = _stringToBytes32(query.name);
        query32b.id = _stringToBytes32(query.id);
        query32b.domainName = query.domainName;
        query32b.targetDomain = query.targetDomain;
        query32b.userAddress = query.userAddress;
        return _resolveRecord(query32b);
    }

    function _hash(bytes32 value) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(value));
    }

    /**
     *   @dev This does not check for bytelength. Use only for read operations
     */
    function _hash(string memory value) internal pure returns (bytes32) {
        require(_checkStringFits32b(value), "_hash-> string too long");
        return keccak256(abi.encodePacked(value));
    }

    function _getDomainStorage(string memory domainName) internal view returns (DomainNameService storage) {
        MultipassStorageStruct storage s = MultipassStorage();

        return s.s_domains[s.s_domainNameToIndex[_hash(domainName)]];
    }

    function _bytes32ToString(bytes32 value) private pure returns (string memory) {
        return string(abi.encodePacked(value));
    }

    function _resolveRecord(NameQueryBytes32 memory query) private view returns (bool, RecordBytes32 memory) {
        if ((query.userAddress == address(0)) && (query.id.length == 0) && (query.name.length == 0)) {
            RecordBytes32 memory rv;
            return (false, rv);
        }

        MultipassStorageStruct storage s = MultipassStorage();
        DomainNameService storage _domain = s.s_domains[s.s_domainNameToIndex[_hash(query.domainName)]];
        DomainNameService storage _targetDomain = s.s_domains[
            s.s_domainNameToIndex[_hash(bytes(query.targetDomain).length == 0 ? query.domainName : query.targetDomain)]
        ];

        address _wallet;
        {
            // resolve wallet
            if (query.userAddress != address(0)) {
                _wallet = query.userAddress;
            } else if (query.id.length != 0) {
                _wallet = _domain.idToAddress[_hash(query.id)];
            } else if (query.name.length != 0) {
                bytes32 _id = _domain.nameToId[_hash(query.name)];
                _wallet = _domain.idToAddress[_hash(_id)];
            }
        }
        //from wallet find and return record
        return _resolveFromAddress(_wallet, _targetDomain);
    }

    /** @dev this function bears no security checks, it will ignore nonce in arg and will increment
     *   nonce value stored in domain instread
     */
    function _setRecord(DomainNameService storage domain, RecordBytes32 memory record) private {
        domain.addressToId[record.wallet] = record.id;
        domain.idToAddress[record.id] = record.wallet;
        domain.idToName[record.id] = record.name;
        domain.nameToId[record.name] = record.id;
        domain.nonce[record.id] += record.nonce;
    }

    function _resolveFromAddress(address _address, DomainNameService storage _domain)
        private
        view
        returns (bool, RecordBytes32 memory)
    {
        RecordBytes32 memory resolved;

        resolved.id = _domain.addressToId[_address];
        resolved.name = _domain.idToName[resolved.id];
        resolved.nonce = _domain.nonce[resolved.id];
        resolved.wallet = _address;
        if (resolved.id.length == 0) {
            return (false, resolved);
        }
        return (true, resolved);
    }

    function _RecordStringify(RecordBytes32 memory input) internal pure returns (Record memory) {
        Record memory retval;
        retval.wallet = input.wallet;
        retval.name = _bytes32ToString(input.name);
        retval.id = _bytes32ToString(input.id);
        retval.nonce = input.nonce;
        return retval;
    }

    using LibMultipass for RecordBytes32;
    using LibMultipass for NameQuery;
}
