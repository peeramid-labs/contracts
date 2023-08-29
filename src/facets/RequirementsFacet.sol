// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {LibTBG} from "../libraries/LibTurnBasedGame.sol";
import {LibCoinVending} from "../libraries/LibCoinVending.sol";
import {LibBestOf} from "../libraries/LibBestOf.sol";

contract RequirementsFacet {
    using LibTBG for uint256;
    using LibBestOf for uint256;
    using LibTBG for LibTBG.GameInstance;
    event RequirementsConfigured(uint256 indexed gameId, LibCoinVending.ConfigPosition config);

    function setJoinRequirements(uint256 gameId, LibCoinVending.ConfigPosition memory config) public {
        gameId.enforceIsGameCreator();
        gameId.enforceIsPreRegistrationStage();
        LibCoinVending.configure(bytes32(gameId), config);
        emit RequirementsConfigured(gameId, config);
    }

    function getJoinRequirements(uint256 gameId) public view returns (LibCoinVending.ConditionReturn memory) {
        return LibCoinVending.getPosition(bytes32(gameId));
    }

    function getJoinRequirementsByToken(
        uint256 gameId,
        address contractAddress,
        uint256 contractId,
        LibCoinVending.ContractTypes contractType
    ) public view returns (LibCoinVending.ContractCondition memory) {
        return LibCoinVending.getPositionByContract(bytes32(gameId), contractAddress, contractId, contractType);
    }
}
