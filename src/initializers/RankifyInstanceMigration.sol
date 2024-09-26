// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/
import {LibRankify} from "../libraries/LibRankify.sol";
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
// import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "hardhat/console.sol";

// It is expected that this contract is customized if you want to deploy your diamond
// with data from a deployment script. Use the init function to initialize state variables
// of your diamond. Add parameters to the init funciton if you need to.

contract RankifyInstanceMigration {
    function _buildDomainSeparator(
        bytes32 typeHash,
        bytes32 nameHash,
        bytes32 versionHash
    ) private view returns (bytes32) {
        return keccak256(abi.encode(typeHash, nameHash, versionHash, block.chainid, address(this)));
    }

    function RInstanceStorage() internal pure returns (IRankifyInstanceCommons.RInstanceSettings storage bog) {
        bytes32 position = LibTBG.getDataStorage();
        assembly {
            bog.slot := position
        }
    }

    struct contractInitializer {
        uint256 timePerTurn;
        uint256 maxPlayersSize;
        uint256 minPlayersSize;
        address rankTokenAddress;
        uint256 timeToJoin;
        uint256 gamePrice;
        uint256 joinGamePrice;
        uint256 maxTurns;
        uint256 numWinners;
        uint256 voteCredits;
        string subject;
        address rankifyToken;
    }

    // You can add parameters to this function in order to pass in
    // data to set your own state variables
    function init() external {
        // adding ERC165 data
        LibDiamond.enforceIsContractOwner();
        IRankifyInstanceCommons.RInstanceSettings storage _RInstance = RInstanceStorage();
        _RInstance.voting = LibQuadraticVoting.precomputeValues(25, 5);

        // LibTBG.GameInstance storage _game = LibTBG._getGame(1);
        // game.numPrevProposals = 9;
        // _game.score[0xadb610B944ff11463f6c7B89F75cf30a9DBF680F] = 8;
        // _game.score[0xf2B9aAa289565b681D19471c82ea6373c64b8A7D] = 11;
        // _game.score[0xd11F3999B70bb274560a2DF255bF4F1B254716fC] = 4;
        // _game.score[0xDe20aC808Bc76C10065dbf1151B1688C10E50A10] = 6;
        // _game.score[0xAdFbF123888688e47c7375b99605F4e895C7A17b] = 1;
        // _game.score[0x12Bec57153B72Ae3bE893e83aFd2F3978e2460EB] = 9;
        // _game.score[0x5bA209688eddf113c0d05F78F72636a00425a234] = 4;
        // _game.score[0xc1b09A2c252ed6E446942aD5B80698268ef7C3fe] = 2;
        // _game.score[0x00678eB740bC89ef32Eac17F1DafebE67A2BC934] = 17;

        // add your own state variables
        // EIP-2535 specifies that the `diamondCut` function takes two optional
        // arguments: address _init and bytes calldata _calldata
        // These arguments are used to execute an arbitrary function using delegatecall
        // in order to set state variables in the diamond during deployment or an upgrade
        // More info here: https://eips.ethereum.org/EIPS/eip-2535#diamond-interface
    }
}
