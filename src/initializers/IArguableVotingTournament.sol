// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../vendor/eds/interfaces/IInitializer.sol";
import "./RankifyInstanceInit.sol";
contract IArguableVotingTournament is IInitializer {
    struct userSettings {
        uint256 timePerTurn;
        uint256 maxPlayersSize;
        uint256 minPlayersSize;
        uint256 timeToJoin;
        uint256 maxTurns;
        uint256 voteCredits;
    }

    address immutable rankTokenAddress;
    address immutable rankifyToken;
    uint256 immutable gamePrice;
    uint256 immutable joinGamePrice;
    uint256 immutable numWinners;

    constructor(
        address _rankTokenAddress,
        address _rankifyToken,
        uint256 _gamePrice,
        uint256 _joinGamePrice,
        uint256 _numWinners
    ) {
        rankTokenAddress = _rankTokenAddress;
        rankifyToken = _rankifyToken;
        gamePrice = _gamePrice;
        joinGamePrice = _joinGamePrice;
        numWinners = _numWinners;
    }

    function initialize(bytes32 id, address[] memory instances, bytes calldata args) public {
        if (instances.length > 1) revert initializationFailed(id, "This initializer works only with one instance");

        userSettings memory userConfig = abi.decode(args, (userSettings));

        RankifyInstanceInit.contractInitializer memory initializer = RankifyInstanceInit.contractInitializer({
            timePerTurn: userConfig.timePerTurn,
            maxPlayersSize: userConfig.maxPlayersSize,
            minPlayersSize: userConfig.minPlayersSize,
            rankTokenAddress: rankTokenAddress,
            timeToJoin: userConfig.timeToJoin,
            gamePrice: gamePrice,
            joinGamePrice: joinGamePrice,
            maxTurns: userConfig.maxTurns,
            numWinners: numWinners,
            voteCredits: userConfig.voteCredits,
            rankifyToken: rankifyToken
        });
        // This is Diamond Facet on already cutted diamond. Usually it would be initialized in DIamond Cut process, but here we do it manually
        // It is expected that this contract is called by distributor as delegate call, hence it's an only owner capable doing so
        RankifyInstanceInit(instances[0]).init("RankfyInstance", "0.0.1", initializer);

        revert("Not implemented");
    }
}
