// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import {IRankToken} from "../interfaces/IRankToken.sol";
import "../abstracts/CompositeERC1155.sol";
import "hardhat/console.sol";

//ToDo: it was planned to make it track for highest token users hold (their rank), right now it's not implemented. Yet.

/**
 * @title RankToken
 * @author Peersky
 * @notice RankToken is a composite ERC1155 token that is used to track user ranks
 */
contract RankToken is CompositeERC1155, Ownable, IRankToken {
    string private _contractURI;
    mapping(address => uint256) public rank;
    uint256 public topRank;
    address private _rankingInstance;
    uint256 _levelUpThreshold;

    modifier onlyRankingInstance() {
        require(msg.sender == _rankingInstance, "only ranking contract can do that");
        _;
    }

    constructor(
        string memory uri_,
        address owner_,
        string memory cURI,
        uint256 levelUpThreshold,
        address[] memory components,
        uint256[] memory componentWeights
    ) CompositeERC1155(uri_, components, componentWeights) Ownable(owner_) {
        require(owner_ != address(0), "must specify owner of the contract");
        _contractURI = cURI;
        _levelUpThreshold = levelUpThreshold;
    }

    function getRankingInstance() public view returns (address) {
        return _rankingInstance;
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function setURI(string memory uri_) public onlyOwner {
        _setURI(uri_);
    }

    function setContractURI(string memory uri_) public onlyOwner {
        _contractURI = uri_;
    }

    // event Leader(address indexed account, uint256 indexed rank);

    function _mintRank(address to, uint256 amount, uint256 level, bytes memory data) private {
        require(to != address(0), "RankToken->mint: Address not specified");
        require(amount != 0, "RankToken->mint: amount not specified");
        require(level != 0, "RankToken->mint: pool id not specified");
        // if (level > topRank) {
        //     topRank = level;
        //     emit Leader(to, level);
        // }
        _mint(to, level, amount, data);
    }

    function mint(address to, uint256 amount, uint256 level, bytes memory data) public onlyRankingInstance {
        _mintRank(to, amount, level, data);
    }

    function updateRankingInstance(address newRankingInstance) public onlyOwner {
        require(newRankingInstance != address(0), "must specify ranking instance");
        _rankingInstance = newRankingInstance;
        emit RankingInstanceUpdated(newRankingInstance);
    }

    function lock(
        address account,
        uint256 id,
        uint256 amount
    ) public override(LockableERC1155, ILockableERC1155) onlyRankingInstance {
        super.lock(account, id, amount);
    }

    function unlock(
        address account,
        uint256 id,
        uint256 amount
    ) public override(LockableERC1155, ILockableERC1155) onlyRankingInstance {
        super.unlock(account, id, amount);
    }

    function batchMint(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyRankingInstance {
        require(to != address(0), "RankToken->mint: Address not specified");
        require(amounts.length != 0, "RankToken->mint: amount not specified");
        require(ids.length != 0, "RankToken->mint: pool id not specified");
        _mintBatch(to, ids, amounts, data);
    }

    // function levelUp(address to, uint256 level, bytes memory data) public {
    //     require(to == msg.sender || msg.sender == _rankingInstance, "levelUp: Not permitted");
    //     _burn(to, level, _levelUpThreshold);
    //     _mintRank(to, 1, level, data);
    //     emit LevelUp(to, level);
    // }

    // function findNewRank(address account, uint256 oldRank) public view returns (uint256) {
    //     for (uint256 i = oldRank; i > 0; i--) {
    //         uint256 _balanceTemp = balanceOf(account, i);
    //         if (_balanceTemp > 0) return i;
    //     }
    //     return 0;
    // }

    // event RankUpdated(address indexed account, uint256 indexed rank);

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
        // for (uint256 i = 0; i < ids.length; i++) {
        //     if (rank[to] < ids[i] && values[i] != 0) {
        //         rank[to] = ids[i];
        //         emit RankUpdated(to, ids[i]);
        //     }
        //     if (from != address(0) && (rank[from] != findNewRank(from, rank[from]))) {
        //         uint256 newRankFrom = findNewRank(from, rank[from]);
        //         rank[from] = newRankFrom;
        //         emit RankUpdated(from, newRankFrom);
        //     }

        super._update(from, to, ids, values);
    }

    // //ToDo: Rename in to rankOf(address account)
    // function getAccountRank(address account) external view returns (uint256) {
    //     return rank[account];
    // }

    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC1155) returns (bool) {
        return interfaceId == type(IRankToken).interfaceId || super.supportsInterface(interfaceId);
    }
}
