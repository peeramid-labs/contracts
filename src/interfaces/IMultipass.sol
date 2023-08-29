// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../libraries/LibMultipass.sol";

interface IMultipass {
    function resolveRecord(LibMultipass.NameQuery memory query)
        external
        view
        returns (bool, LibMultipass.Record memory);

    /** @dev same as resolveRecord but returns username, id and LibMultipass.Domain as string */
    // function resolveRecordToString(LibMultipass.NameQuery memory query)
    //     external
    //     view
    //     returns (
    //         bool,
    //         LibMultipass.Record memory
    //     );

    /**
     * @dev Initializes new LibMultipass.Domain and configures it's parameters
     *
     * Requirements:
     *  registrar is not zero
     *  domainName is not empty
     *  domainIndex is either zero(auto assign) or can be one of preoccupied LibMultipass.Domain names
     *  domainName does not exist yet
     *  onlyOwner
     *  referrerReward+referralDiscount cannot be larger than fee
     *  @param registrar address of registrar
     *  @param freeRegistrationsNumber number of registrations free of fee
     *  @param fee fee in base currency of network
     *  @param domainName name of LibMultipass.Domain
     *  @param referrerReward referral fee share in base currency of network
     *  @param referralDiscount referral discount in base currency of network
     *
     *  Emits an {InitializedDomain} event.
     */
    function initializeDomain(
        address registrar,
        uint256 freeRegistrationsNumber,
        uint256 fee,
        bytes32 domainName,
        uint256 referrerReward,
        uint256 referralDiscount
    ) external;

    /**
     * @dev Activates LibMultipass.Domain name
     *
     * Requirements:
     *  msg.sender is Owner
     *
     *
     *  Emits an {DomainActivated} event.
     */
    function activateDomain(bytes32 domainName) external;

    /**
     * @dev Deactivates LibMultipass.Domain name
     *
     * Deactivated LibMultipass.Domain cannot mutate names and will return zeros
     *
     * Requirements:
     *  msg.sender is Owner OR registrar
     *
     *
     *  Emits an {DomainDeactivated} event.
     */

    function deactivateDomain(bytes32 domainName) external;

    /**
     * @dev Changes registrar address
     *
     * Requirements:
     *  msg.sender is Owner
     *
     *  Emits an {DomainFeeChanged} event.
     */
    function changeFee(bytes32 domainName, uint256 fee) external;

    /**
     * @dev Changes registrar address
     *
     * Requirements:
     *  msg.sender is Owner
     *
     *  Emits an {RegistrarChangeRequested} event.
     */
    function changeRegistrar(bytes32 domainName, address newRegistrar) external;

    /**
     * @dev deletes name
     *
     * Requirements:
     *  msg.sender is Owner
     *
     *  Emits an {DomainTTLChangeRequested} event.
     */
    function deleteName(LibMultipass.NameQuery memory query) external;

    /**
     * @dev executes all pending changes to LibMultipass.Domain that fulfill TTL
     *
     * Requirements:
     *  domainName must be set
     *  referrerFeeShare+referralDiscount cannot be larger than 2^32
     *
     *
     *  Emits an {ReferralProgramChangeRequested} event.
     */
    function changeReferralProgram(
        uint256 referrerFeeShare,
        uint256 referralDiscount,
        uint256 freeRegistrations,
        bytes32 domainName
    ) external;

    /**
     * @dev registers new name under LibMultipass.Domain
     *
     * Requirements:
     *  all arguments must be set
     *  domainName must be active
     * resolveRecord for given arguments should return no LibMultipass.Record
     *
     *
     *  Emits an {registered} event.
     */
    function register(
        LibMultipass.Record memory newRecord,
        bytes32 domainName,
        bytes memory registrarSignature,
        uint256 signatureDeadline,
        LibMultipass.NameQuery memory referrer,
        bytes memory referralCode
    ) external payable;

    /**
     * @dev modifies exsisting LibMultipass.Record
     *
     * Requirements:
     * resolveRecord for given arguments should return valid LibMultipass.Record
     * LibMultipass.Domain must be active
     * newAddress and newName should be set and be unique in current LibMultipass.Domain
     *
     * @param domainName LibMultipass.Domain
     * @param newName new name
     *
     *  Emits an {Modified} event.
     */
    function modifyUserName(
        bytes32 domainName,
        LibMultipass.NameQuery memory query,
        bytes32 newName,
        bytes memory registrarSignature,
        uint256 signatureDeadline
    ) external payable;

    /**
     * @dev returns balance of this contract
     */
    function getBalance() external view returns (uint256);

    /**
     * @dev returns LibMultipass.Domain state variables
     * @param domainName name of the LibMultipass.Domain
     * @return (name,
      fee,
      freeRegistrationsNumber,
       referrerReward,
       referralDiscount,
       isActive,
       registrar,
       ttl,
        registerSize)
     */
    function getDomainState(bytes32 domainName) external view returns (LibMultipass.Domain memory);

    /**
     * @dev returns contract state variables

     * @return (s_numDomains)
     */
    function getContractState() external view returns (uint256);

    /**
     * @dev Withraws funds stored in smart contract
     *
     * Requirements:
     *  onlyOwner
     *
     *  Emits an {fundsWithdawn} event.
     */
    function withrawFunds(address to) external;

    function getModifyPrice(LibMultipass.NameQuery memory query) external view returns (uint256);

    event fundsWithdawn(uint256 indexed amount, address indexed account);

    // event InitializedDomain(uint256 indexed index, bytes32 indexed domainName);
    event InitializedDomain(
        address indexed registrar,
        uint256 freeRegistrationsNumber,
        uint256 indexed fee,
        bytes32 indexed domainName,
        uint256 referrerReward,
        uint256 referralDiscount
    );
    event DomainActivated(bytes32 indexed domainName);
    event DomainDeactivated(bytes32 indexed domainName);

    event DomainFeeChanged(bytes32 indexed domainName, uint256 indexed newFee);
    event FreeRegistrationsChanged(uint256 indexed domainIndex, uint256 indexed newAmount);

    event RegistrarChangeRequested(bytes32 indexed domainName, address indexed registrar);
    event DomainNameChangeRequested(uint256 indexed domainIndex, bytes32 indexed NewDomainName);
    event nameDeleted(bytes32 indexed domainName, address indexed wallet, bytes32 indexed id, bytes32 name);
    event DomainTTLChangeRequested(bytes32 indexed domainName, uint256 amount);
    event ReferralProgramChanged(
        bytes32 indexed domainName,
        uint256 reward,
        uint256 discount,
        uint256 indexed freeNumber
    );
    event DomainChangesAreLive(bytes32 indexed domainName, bytes32[] indexed changes);
    event changesQeueCanceled(bytes32 indexed domainName, bytes32[] indexed changes);

    event Registered(bytes32 indexed domainName, LibMultipass.Record NewRecord);

    event Referred(LibMultipass.Record refferrer, LibMultipass.Record newRecord, bytes32 indexed domainName);

    event UserRecordModified(
        LibMultipass.Record indexed newRecord,
        bytes32 indexed oldName,
        bytes32 indexed domainName
    );
}
