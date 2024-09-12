// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@peeramid-labs/eds/src/interfaces/IInitializer.sol";
import "../initializers/RankifyInstanceInit.sol";
import "@peeramid-labs/eds/src/abstracts/CodeIndexer.sol";
import "@peeramid-labs/eds/src/libraries/LibSemver.sol";
contract TournamentDistributionInitializer is IInitializer, CodeIndexer {

        address immutable paymentToken;
        address immutable rewardToken;

        uint256 immutable gamePrice;
        uint256 immutable joinGamePrice;

        constructor(address _paymentToken, address _rewardToken, uint256 _gamePrice, uint256 _joinGamePrice) {
            paymentToken = _paymentToken;
            rewardToken = _rewardToken;
            gamePrice = _gamePrice;
            joinGamePrice = _joinGamePrice;
        }

        struct userSettings {
        uint256 timePerTurn;
        uint256 maxPlayersSize;
        uint256 minPlayersSize;
        uint256 timeToJoin;
        uint256 maxTurns;
        uint256 voteCredits;
    }

    function initialize(bytes32, address[] memory instances,bytes32 distributionName, uint256 distributionVersion, bytes calldata args) external override {

        if (instances.length < 3) {
            revert("This initializer needs an instance, payment and rank tokens in order to work");
        }

        RankifyInstanceInit initializerFacet = RankifyInstanceInit(instances[0]);
        userSettings memory userConfig = abi.decode(args, (userSettings));
        RankifyInstanceInit.contractInitializer memory initializer = RankifyInstanceInit.contractInitializer({
            timePerTurn: userConfig.timePerTurn,
            maxPlayersSize: userConfig.maxPlayersSize,
            minPlayersSize: userConfig.minPlayersSize,
            rewardToken: rewardToken,
            timeToJoin: userConfig.timeToJoin,
            gamePrice: gamePrice,
            joinGamePrice: joinGamePrice,
            maxTurns: userConfig.maxTurns,
            numWinners: 1,
            voteCredits: userConfig.voteCredits,
            paymentToken: paymentToken
        });
        initializerFacet.init(string(abi.encodePacked(distributionName)), LibSemver.toString(LibSemver.parse(distributionVersion)), initializer);
    }

}