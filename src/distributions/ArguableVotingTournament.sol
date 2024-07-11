// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;

// import "../vendor/eds/abstracts/InitializedDiamondDistribution.sol";

// import "../vendor/diamond/facets/DiamondLoupeFacet.sol";
// import "../facets/EIP712InspectorFacet.sol";
// import "../vendor/diamond/facets/OwnershipFacet.sol";
// import "../facets/RankifyInstanceMainFacet.sol";
// import "../facets/RankifyInstanceRequirementsFacet.sol";
// import "../facets/RankifyInstanceGameMastersFacet.sol";
// import "../facets/RankifyInstanceGameOwnersFacet.sol";
// import "../vendor/diamond/interfaces/IDiamondCut.sol";
// import "../vendor/diamond/interfaces/IDiamondLoupe.sol";
// contract ArguableVotingTournament is InitializedDiamondDistribution {
//     function stringToSelector(string memory signature) private pure returns (bytes4) {
//         return bytes4(keccak256(bytes(signature)));
//     }
//     constructor() InitializedDiamondDistribution(address(this), address(0), bytes4(0)) {
//         DiamondCutFacet instance = DiamondCutFacet(super.instantiate());
//         IDiamondCut.FacetCut[] memory facetCuts = new IDiamondCut.FacetCut[](5);

//         bytes4[] memory loupeSelectors = new bytes4[](4);
//         loupeSelectors[0] = DiamondLoupeFacet.facets.selector;
//         loupeSelectors[1] = DiamondLoupeFacet.facetFunctionSelectors.selector;
//         loupeSelectors[2] = DiamondLoupeFacet.facetAddresses.selector;
//         loupeSelectors[3] = DiamondLoupeFacet.facetAddress.selector;

//         facetCuts[0] = IDiamondCut.FacetCut({
//             facetAddress: address(new DiamondLoupeFacet()),
//             action: IDiamondCut.FacetCutAction.Add,
//             functionSelectors: loupeSelectors
//         });

//         bytes4[] memory EIP712InspectorFacetSelectors = new bytes4[](2);
//         EIP712InspectorFacetSelectors[0] = EIP712InspectorFacet.inspectEIP712Hashes.selector;
//         EIP712InspectorFacetSelectors[1] = EIP712InspectorFacet.currentChainId.selector;

//         facetCuts[1] = IDiamondCut.FacetCut({
//             facetAddress: address(new EIP712InspectorFacet()),
//             action: IDiamondCut.FacetCutAction.Add,
//             functionSelectors: EIP712InspectorFacetSelectors
//         });

//         bytes4[] memory OwnershipFacetSelectors = new bytes4[](2);
//         OwnershipFacetSelectors[0] = OwnershipFacet.transferOwnership.selector;
//         OwnershipFacetSelectors[1] = OwnershipFacet.owner.selector;

//         bytes4[] memory RankifyInstanceMainFacetSelectors = new bytes4[](28);
//         RankifyInstanceMainFacetSelectors[0] = RankifyInstanceMainFacet.cancelGame.selector;
//         RankifyInstanceMainFacetSelectors[1] = RankifyInstanceMainFacet.gameCreator.selector;
//         RankifyInstanceMainFacetSelectors[2] = stringToSelector("createGame(address,uint256,uint256)");
//         RankifyInstanceMainFacetSelectors[3] = stringToSelector("createGame(address,uint256,uint256,address[])");
//         RankifyInstanceMainFacetSelectors[4] = stringToSelector("createGame(address,uint256)");
//         RankifyInstanceMainFacetSelectors[5] = RankifyInstanceMainFacet.leaveGame.selector;
//         RankifyInstanceMainFacetSelectors[6] = RankifyInstanceMainFacet.joinGame.selector;
//         RankifyInstanceMainFacetSelectors[7] = RankifyInstanceMainFacet.openRegistration.selector;
//         RankifyInstanceMainFacetSelectors[8] = RankifyInstanceMainFacet.startGame.selector;
//         RankifyInstanceMainFacetSelectors[9] = RankifyInstanceMainFacet.onERC1155BatchReceived.selector;
//         RankifyInstanceMainFacetSelectors[10] = RankifyInstanceMainFacet.onERC1155Received.selector;
//         RankifyInstanceMainFacetSelectors[11] = RankifyInstanceMainFacet.onERC721Received.selector;
//         RankifyInstanceMainFacetSelectors[12] = RankifyInstanceMainFacet.getContractState.selector;
//         RankifyInstanceMainFacetSelectors[13] = RankifyInstanceMainFacet.getTurn.selector;
//         RankifyInstanceMainFacetSelectors[14] = RankifyInstanceMainFacet.getGM.selector;
//         RankifyInstanceMainFacetSelectors[15] = RankifyInstanceMainFacet.getScores.selector;
//         RankifyInstanceMainFacetSelectors[16] = RankifyInstanceMainFacet.isOvertime.selector;
//         RankifyInstanceMainFacetSelectors[17] = RankifyInstanceMainFacet.isGameOver.selector;
//         RankifyInstanceMainFacetSelectors[18] = RankifyInstanceMainFacet.getPlayersGame.selector;
//         RankifyInstanceMainFacetSelectors[19] = RankifyInstanceMainFacet.isLastTurn.selector;
//         RankifyInstanceMainFacetSelectors[20] = RankifyInstanceMainFacet.isRegistrationOpen.selector;
//         RankifyInstanceMainFacetSelectors[21] = RankifyInstanceMainFacet.gameCreator.selector;
//         RankifyInstanceMainFacetSelectors[22] = RankifyInstanceMainFacet.getGameRank.selector;
//         RankifyInstanceMainFacetSelectors[23] = RankifyInstanceMainFacet.getPlayers.selector;
//         RankifyInstanceMainFacetSelectors[24] = RankifyInstanceMainFacet.canStartGame.selector;
//         RankifyInstanceMainFacetSelectors[25] = RankifyInstanceMainFacet.canEndTurn.selector;
//         RankifyInstanceMainFacetSelectors[26] = RankifyInstanceMainFacet.isPlayerTurnComplete.selector;
//         RankifyInstanceMainFacetSelectors[27] = RankifyInstanceMainFacet.getPlayerVotedArray.selector;
//         RankifyInstanceMainFacetSelectors[28] = RankifyInstanceMainFacet.getPlayersMoved.selector;

//         facetCuts[2] = IDiamondCut.FacetCut({
//             facetAddress: address(new RankifyInstanceMainFacet()),
//             action: IDiamondCut.FacetCutAction.Add,
//             functionSelectors: RankifyInstanceMainFacetSelectors
//         });

//         bytes4[] memory RankifyInstanceRequirementsFacetSelectors = new bytes4[](3);
//         RankifyInstanceRequirementsFacetSelectors[0] = RankifyInstanceRequirementsFacet.setJoinRequirements.selector;
//         RankifyInstanceRequirementsFacetSelectors[1] = RankifyInstanceRequirementsFacet.getJoinRequirements.selector;
//         RankifyInstanceRequirementsFacetSelectors[2] = RankifyInstanceRequirementsFacet
//             .getJoinRequirementsByToken
//             .selector;

//         facetCuts[3] = IDiamondCut.FacetCut({
//             facetAddress: address(new RankifyInstanceRequirementsFacet()),
//             action: IDiamondCut.FacetCutAction.Add,
//             functionSelectors: RankifyInstanceRequirementsFacetSelectors
//         });

//         bytes4[] memory RankifyInstanceGameMastersFacetSelectors = new bytes4[](4);
//         RankifyInstanceGameMastersFacetSelectors[1] = RankifyInstanceGameMastersFacet.submitVote.selector;
//         RankifyInstanceGameMastersFacetSelectors[2] = RankifyInstanceGameMastersFacet.submitProposal.selector;
//         RankifyInstanceGameMastersFacetSelectors[3] = RankifyInstanceGameMastersFacet.endTurn.selector;

//         facetCuts[4] = IDiamondCut.FacetCut({
//             facetAddress: address(new RankifyInstanceGameMastersFacet()),
//             action: IDiamondCut.FacetCutAction.Add,
//             functionSelectors: RankifyInstanceGameMastersFacetSelectors
//         });

//         bytes4[] memory RankifyInstanceGameOwnersFacetSelectors = new bytes4[](8);

//         RankifyInstanceGameOwnersFacetSelectors[1] = RankifyInstanceGameOwnersFacet.setGamePrice.selector;
//         RankifyInstanceGameOwnersFacetSelectors[2] = RankifyInstanceGameOwnersFacet.setJoinGamePrice.selector;
//         RankifyInstanceGameOwnersFacetSelectors[3] = RankifyInstanceGameOwnersFacet.setRankTokenAddress.selector;
//         RankifyInstanceGameOwnersFacetSelectors[4] = RankifyInstanceGameOwnersFacet.setTimePerTurn.selector;
//         RankifyInstanceGameOwnersFacetSelectors[5] = RankifyInstanceGameOwnersFacet.setMaxPlayersSize.selector;
//         RankifyInstanceGameOwnersFacetSelectors[6] = RankifyInstanceGameOwnersFacet.setMinPlayersSize.selector;
//         RankifyInstanceGameOwnersFacetSelectors[7] = RankifyInstanceGameOwnersFacet.setTimeToJoin.selector;
//         RankifyInstanceGameOwnersFacetSelectors[8] = RankifyInstanceGameOwnersFacet.setMaxTurns.selector;

//         facetCuts[5] = IDiamondCut.FacetCut({
//             facetAddress: address(new RankifyInstanceGameOwnersFacet()),
//             action: IDiamondCut.FacetCutAction.Add,
//             functionSelectors: RankifyInstanceGameOwnersFacetSelectors
//         });

//         super.initialize(facetCuts, "");
//     }

//     function getMetadata() public pure virtual override returns (string memory) {
//         return string(abi.encodePacked(super.getMetadata(), ";", "ArguableVotingTournament"));
//     }

//     function sources() internal view virtual override returns (address[] memory) {
//         address[] memory srcs = super.sources();
//         return srcs;
//     }
// }
