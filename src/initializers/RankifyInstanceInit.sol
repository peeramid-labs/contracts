// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/

import {LibDiamond} from "../vendor/diamond/libraries/LibDiamond.sol";
import {IDiamondLoupe} from "../vendor/diamond/interfaces/IDiamondLoupe.sol";
import {IDiamondCut} from "../vendor/diamond/interfaces/IDiamondCut.sol";
import {IERC173} from "../vendor/diamond/interfaces/IERC173.sol";
import {IERC165} from "../vendor/diamond/interfaces/IERC165.sol";
import {LibEIP712WithStorage} from "../libraries/LibEIP712Storage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {IRankifyInstanceCommons} from "../interfaces/IRankifyInstanceCommons.sol";
import {IRankToken} from "../interfaces/IRankToken.sol";
import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {LibQuadraticVoting} from "../libraries/LibQuadraticVoting.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {LibRankify} from "../libraries/LibRankify.sol";
// import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

// It is expected that this contract is customized if you want to deploy your diamond
// with data from a deployment script. Use the init function to initialize state variables
// of your diamond. Add parameters to the init funciton if you need to.

contract RankifyInstanceInit is Initializable {
    function _buildDomainSeparator(
        bytes32 typeHash,
        bytes32 nameHash,
        bytes32 versionHash
    ) private view returns (bytes32) {
        return keccak256(abi.encode(typeHash, nameHash, versionHash, block.chainid, address(this)));
    }

    function InstanceState() internal pure returns (LibRankify.InstanceState storage bog) {
        bytes32 position = LibTBG.getDataStorage();
        assembly {
            bog.slot := position
        }
    }

    struct contractInitializer {
        uint256 timePerTurn;
        uint256 maxPlayersSize;
        uint256 minPlayersSize;
        address rewardToken;
        uint256 timeToJoin;
        uint256 gamePrice;
        uint256 joinGamePrice;
        uint256 maxTurns;
        uint256 numWinners;
        uint256 voteCredits;
        address paymentToken;
    }

    // You can add parameters to this function in order to pass in
    // data to set your own state variables
    function init(string memory name, string memory version, contractInitializer memory initData) external initializer {
        // adding ERC165 data
        // LibDiamond.enforceIsContractOwner();
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
        bytes32 hashedName = keccak256(bytes(name));
        bytes32 hashedVersion = keccak256(bytes(version));
        bytes32 typeHash = keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
        LibEIP712WithStorage.LibEIP712WithStorageStorage storage ss = LibEIP712WithStorage.EIP712WithStorage();
        ss._HASHED_NAME = hashedName;
        ss._HASHED_VERSION = hashedVersion;
        ss._CACHED_CHAIN_ID = block.chainid;
        ss._CACHED_DOMAIN_SEPARATOR = _buildDomainSeparator(typeHash, hashedName, hashedVersion);
        ss._CACHED_THIS = address(this);
        ss._TYPE_HASH = typeHash;

        LibRankify.InstanceState storage _RInstance = InstanceState();
        _RInstance.voting = LibQuadraticVoting.precomputeValues(initData.voteCredits, initData.minPlayersSize);
        _RInstance.gamePrice = initData.gamePrice;
        _RInstance.joinGamePrice = initData.joinGamePrice;
        require(initData.paymentToken != address(0), "initializer.paymentToken not set");
        _RInstance.gamePaymentToken = initData.paymentToken;
        IRankToken rankContract = IRankToken(initData.rewardToken);
        require(
            rankContract.supportsInterface(type(IRankToken).interfaceId),
            "RankifyInstance->init: rank token address does not support Rank interface"
        );
        _RInstance.rankTokenAddress = initData.rewardToken;
        _RInstance.contractInitialized = true;

        // add your own state variables
        // EIP-2535 specifies that the `diamondCut` function takes two optional
        // arguments: address _init and bytes calldata _calldata
        // These arguments are used to execute an arbitrary function using delegatecall
        // in order to set state variables in the diamond during deployment or an upgrade
        // More info here: https://eips.ethereum.org/EIPS/eip-2535#diamond-interface
    }
}
