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
import {IMultipass} from "../interfaces/IMultipass.sol";
import {LibEIP712WithStorage} from "../libraries/LibEIP712Storage.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../modifiers/OnlyOwnerDiamond.sol";

// It is expected that this contract is customized if you want to deploy your diamond
// with data from a deployment script. Use the init function to initialize state variables
// of your diamond. Add parameters to the init funciton if you need to.

contract MultipassInit is OnlyOwnerDiamond {
    function _buildDomainSeparator(
        bytes32 typeHash,
        bytes32 nameHash,
        bytes32 versionHash
    ) private view returns (bytes32) {
        return keccak256(abi.encode(typeHash, nameHash, versionHash, block.chainid, address(this)));
    }

    function init(string memory name, string memory version) external onlyOwner {
        // adding ERC165 data
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

        ds.supportedInterfaces[type(IMultipass).interfaceId] = true;

        // add your own state variables
        // EIP-2535 specifies that the `diamondCut` function takes two optional
        // arguments: address _init and bytes calldata _calldata
        // These arguments are used to execute an arbitrary function using delegatecall
        // in order to set state variables in the diamond during deployment or an upgrade
        // More info here: https://eips.ethereum.org/EIPS/eip-2535#diamond-interface
    }
}
