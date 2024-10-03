// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./InitializedDiamondDistribution.sol";
import "../vendor/diamond/facets/DiamondLoupeFacet.sol";
import "../facets/EIP712InspectorFacet.sol";
import "../vendor/diamond/facets/OwnershipFacet.sol";
import "../facets/RankifyInstanceMainFacet.sol";
import "../facets/RankifyInstanceRequirementsFacet.sol";
import "../facets/RankifyInstanceGameMastersFacet.sol";
import "../facets/RankifyInstanceGameOwnersFacet.sol";
import "../initializers/RankifyInstanceInit.sol";
import "../vendor/diamond/interfaces/IDiamondCut.sol";
import "@peeramid-labs/eds/src/libraries/LibSemver.sol";

/**
 * @title ArguableVotingTournament Distribution
 * @notice This contract implements a diamond distribution for Ethereum Distribution System. It is reponsible to create new instance of ArguableVotingTournament.
 * @dev It is expected to be used ONLY by the Distributor contract.
 * @author Peeramid Labs, 2024
 */
contract ArguableVotingTournament is InitializedDiamondDistribution {
    DiamondLoupeFacet private immutable _loupeFacet;
    EIP712InspectorFacet private immutable _inspectorFacet;
    RankifyInstanceMainFacet private immutable _RankifyMainFacet;
    RankifyInstanceRequirementsFacet private immutable _RankifyReqsFacet;
    RankifyInstanceGameMastersFacet private immutable _RankifyGMFacet;
    RankifyInstanceGameOwnersFacet private immutable _RankifyOwnerFacet;
    OwnershipFacet private immutable _OwnershipFacet;
    address private immutable _initializer;

    bytes32 private immutable distributionName;
    uint256 private immutable distributionVersion;

    function stringToSelector(string memory signature) private pure returns (bytes4) {
        return bytes4(keccak256(bytes(signature)));
    }

    /**
     * @dev Constructor for the ArguableVotingTournament contract.
     *
     * Note Initializer function will be added as a regular facet to the Diamond Proxy,
     * Since it is expected that initialization is done by distributor contract, the initializer will not be run, hence
     * it is up for distributor to remove this facet upon succesfull initialization.
     */
    constructor(
        address initializer,
        bytes4 initializerSelector,
        bytes32 _distributionName,
        LibSemver.Version memory version,
        address loupeFacet,
        address inspectorFacet,
        address RankifyMainFacet,
        address RankifyReqsFacet,
        address RankifyGMFacet,
        address RankifyOwnerFacet,
        address OwnershipFacetAddr
    ) InitializedDiamondDistribution(address(this), bytes32(0), initializerSelector) {
        _initializer = initializer;
        _loupeFacet = DiamondLoupeFacet(loupeFacet);
        _inspectorFacet = EIP712InspectorFacet(inspectorFacet);
        _RankifyMainFacet = RankifyInstanceMainFacet(RankifyMainFacet);
        _RankifyReqsFacet = RankifyInstanceRequirementsFacet(RankifyReqsFacet);
        _RankifyGMFacet = RankifyInstanceGameMastersFacet(RankifyGMFacet);
        _RankifyOwnerFacet = RankifyInstanceGameOwnersFacet(RankifyOwnerFacet);
        _OwnershipFacet = OwnershipFacet(OwnershipFacetAddr);

        distributionName = _distributionName;
        distributionVersion = LibSemver.toUint256(version);
    }

    /**
     * @dev see Ethereum Distribution System IDistribute for interface specification.
     * @return instances Array[9]: [diamond proxy, 8x diamond facets..]
     * @return distributionName: bytes32 encoded name to be used in EIP712 signing flow
     * @return distributionVersion: uint256 encoded distribution version. Can be parsed to eip712 signature with EDS LibSemver
     */
    function instantiate(bytes memory) external override returns (address[] memory instances, bytes32, uint256) {
        (address[] memory _instances, , ) = super._instantiate();
        address diamond = _instances[0];
        IDiamondCut.FacetCut[] memory facetCuts = new IDiamondCut.FacetCut[](8);

        bytes4[] memory loupeSelectors = new bytes4[](4);
        loupeSelectors[0] = DiamondLoupeFacet.facets.selector;
        loupeSelectors[1] = DiamondLoupeFacet.facetFunctionSelectors.selector;
        loupeSelectors[2] = DiamondLoupeFacet.facetAddresses.selector;
        loupeSelectors[3] = DiamondLoupeFacet.facetAddress.selector;
        facetCuts[0] = IDiamondCut.FacetCut({
            facetAddress: address(_loupeFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: loupeSelectors
        });

        bytes4[] memory EIP712InspectorFacetSelectors = new bytes4[](2);
        EIP712InspectorFacetSelectors[0] = EIP712InspectorFacet.inspectEIP712Hashes.selector;
        EIP712InspectorFacetSelectors[1] = EIP712InspectorFacet.currentChainId.selector;

        facetCuts[1] = IDiamondCut.FacetCut({
            facetAddress: address(_inspectorFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: EIP712InspectorFacetSelectors
        });
        bytes4[] memory RankifyInstanceMainFacetSelectors = new bytes4[](28);
        RankifyInstanceMainFacetSelectors[0] = RankifyInstanceMainFacet.cancelGame.selector;
        RankifyInstanceMainFacetSelectors[1] = RankifyInstanceMainFacet.gameCreator.selector;
        RankifyInstanceMainFacetSelectors[2] = stringToSelector("createGame(address,uint256,uint256)");
        RankifyInstanceMainFacetSelectors[3] = stringToSelector("createGame(address,uint256,uint256,address[])");
        RankifyInstanceMainFacetSelectors[4] = stringToSelector("createGame(address,uint256)");
        RankifyInstanceMainFacetSelectors[5] = RankifyInstanceMainFacet.leaveGame.selector;
        RankifyInstanceMainFacetSelectors[6] = RankifyInstanceMainFacet.joinGame.selector;
        RankifyInstanceMainFacetSelectors[7] = RankifyInstanceMainFacet.openRegistration.selector;
        RankifyInstanceMainFacetSelectors[8] = RankifyInstanceMainFacet.startGame.selector;
        RankifyInstanceMainFacetSelectors[9] = RankifyInstanceMainFacet.onERC1155BatchReceived.selector;
        RankifyInstanceMainFacetSelectors[10] = RankifyInstanceMainFacet.onERC1155Received.selector;
        RankifyInstanceMainFacetSelectors[11] = RankifyInstanceMainFacet.onERC721Received.selector;
        RankifyInstanceMainFacetSelectors[12] = RankifyInstanceMainFacet.getContractState.selector;
        RankifyInstanceMainFacetSelectors[13] = RankifyInstanceMainFacet.getTurn.selector;
        RankifyInstanceMainFacetSelectors[14] = RankifyInstanceMainFacet.getGM.selector;
        RankifyInstanceMainFacetSelectors[15] = RankifyInstanceMainFacet.getScores.selector;
        RankifyInstanceMainFacetSelectors[16] = RankifyInstanceMainFacet.isOvertime.selector;
        RankifyInstanceMainFacetSelectors[17] = RankifyInstanceMainFacet.isGameOver.selector;
        RankifyInstanceMainFacetSelectors[18] = RankifyInstanceMainFacet.getPlayersGame.selector;
        RankifyInstanceMainFacetSelectors[19] = RankifyInstanceMainFacet.isLastTurn.selector;
        RankifyInstanceMainFacetSelectors[20] = RankifyInstanceMainFacet.isRegistrationOpen.selector;
        RankifyInstanceMainFacetSelectors[21] = RankifyInstanceMainFacet.getGameRank.selector;
        RankifyInstanceMainFacetSelectors[22] = RankifyInstanceMainFacet.getPlayers.selector;
        RankifyInstanceMainFacetSelectors[23] = RankifyInstanceMainFacet.canStartGame.selector;
        RankifyInstanceMainFacetSelectors[24] = RankifyInstanceMainFacet.canEndTurn.selector;
        RankifyInstanceMainFacetSelectors[25] = RankifyInstanceMainFacet.isPlayerTurnComplete.selector;
        RankifyInstanceMainFacetSelectors[26] = RankifyInstanceMainFacet.getPlayerVotedArray.selector;
        RankifyInstanceMainFacetSelectors[27] = RankifyInstanceMainFacet.getPlayersMoved.selector;

        facetCuts[2] = IDiamondCut.FacetCut({
            facetAddress: address(_RankifyMainFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: RankifyInstanceMainFacetSelectors
        });
        bytes4[] memory RankifyInstanceRequirementsFacetSelectors = new bytes4[](3);
        RankifyInstanceRequirementsFacetSelectors[0] = RankifyInstanceRequirementsFacet.setJoinRequirements.selector;
        RankifyInstanceRequirementsFacetSelectors[1] = RankifyInstanceRequirementsFacet.getJoinRequirements.selector;
        RankifyInstanceRequirementsFacetSelectors[2] = RankifyInstanceRequirementsFacet
            .getJoinRequirementsByToken
            .selector;

        facetCuts[3] = IDiamondCut.FacetCut({
            facetAddress: address(_RankifyReqsFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: RankifyInstanceRequirementsFacetSelectors
        });

        bytes4[] memory RankifyInstanceGameMastersFacetSelectors = new bytes4[](3);
        RankifyInstanceGameMastersFacetSelectors[0] = RankifyInstanceGameMastersFacet.submitVote.selector;
        RankifyInstanceGameMastersFacetSelectors[1] = RankifyInstanceGameMastersFacet.submitProposal.selector;
        RankifyInstanceGameMastersFacetSelectors[2] = RankifyInstanceGameMastersFacet.endTurn.selector;

        facetCuts[4] = IDiamondCut.FacetCut({
            facetAddress: address(_RankifyGMFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: RankifyInstanceGameMastersFacetSelectors
        });

        bytes4[] memory RankifyInstanceGameOwnersFacetSelectors = new bytes4[](8);

        RankifyInstanceGameOwnersFacetSelectors[0] = RankifyInstanceGameOwnersFacet.setGamePrice.selector;
        RankifyInstanceGameOwnersFacetSelectors[1] = RankifyInstanceGameOwnersFacet.setJoinGamePrice.selector;
        RankifyInstanceGameOwnersFacetSelectors[2] = RankifyInstanceGameOwnersFacet.setRankTokenAddress.selector;
        RankifyInstanceGameOwnersFacetSelectors[3] = RankifyInstanceGameOwnersFacet.setTimePerTurn.selector;
        RankifyInstanceGameOwnersFacetSelectors[4] = RankifyInstanceGameOwnersFacet.setMaxPlayersSize.selector;
        RankifyInstanceGameOwnersFacetSelectors[5] = RankifyInstanceGameOwnersFacet.setMinPlayersSize.selector;
        RankifyInstanceGameOwnersFacetSelectors[6] = RankifyInstanceGameOwnersFacet.setTimeToJoin.selector;
        RankifyInstanceGameOwnersFacetSelectors[7] = RankifyInstanceGameOwnersFacet.setMaxTurns.selector;
        facetCuts[5] = IDiamondCut.FacetCut({
            facetAddress: address(_RankifyOwnerFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: RankifyInstanceGameOwnersFacetSelectors
        });

        bytes4[] memory OwnershipFacetSelectors = new bytes4[](2);
        OwnershipFacetSelectors[0] = _OwnershipFacet.transferOwnership.selector;
        OwnershipFacetSelectors[1] = _OwnershipFacet.owner.selector;

        facetCuts[6] = IDiamondCut.FacetCut({
            facetAddress: address(_OwnershipFacet),
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: OwnershipFacetSelectors
        });
        bytes4[] memory initializerSelectors = new bytes4[](1);
        initializerSelectors[0] = RankifyInstanceInit.init.selector;
        facetCuts[7] = IDiamondCut.FacetCut({
            facetAddress: _initializer,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: initializerSelectors
        });

        super.initialize(DiamondCutFacet(diamond), facetCuts, "");
        address[] memory returnValue = new address[](9);
        returnValue[0] = diamond;
        returnValue[1] = facetCuts[0].facetAddress;
        returnValue[2] = facetCuts[1].facetAddress;
        returnValue[3] = facetCuts[2].facetAddress;
        returnValue[4] = facetCuts[3].facetAddress;
        returnValue[5] = facetCuts[4].facetAddress;
        returnValue[6] = facetCuts[5].facetAddress;
        returnValue[7] = facetCuts[6].facetAddress;
        returnValue[8] = facetCuts[7].facetAddress;

        return (returnValue, distributionName, distributionVersion);
    }

    function contractURI() public pure virtual override returns (string memory) {
        return string(abi.encodePacked(super.contractURI(), ";", "ArguableVotingTournament"));
    }

    function sources() internal view virtual override returns (address[] memory, bytes32, uint256) {
        (address[] memory srcs, , ) = super.sources();
        return (srcs, distributionName, distributionVersion);
    }
}
