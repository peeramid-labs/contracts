// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {IRankToken} from "../interfaces/IRankToken.sol";

import "hardhat/console.sol";
pragma solidity ^0.8.0;

contract RankToken is ERC1155, Ownable, IRankToken {
    string private _contractURI;
    mapping(address => uint256) public rank;
    mapping(address => mapping(uint256 => uint256)) lockedAmounts;
    address private _rankingInstance;
    uint256 _levelUpThreshold;

    modifier onlyRankingInstance() {
        require(msg.sender == _rankingInstance, "only ranking contract can do that");
        _;
    }

    constructor(string memory uri_, address owner, string memory cURI, uint256 levelUpThreshold) ERC1155(uri_) {
        require(owner != address(0), "must specify owner of the contract");
        _contractURI = cURI;
        _levelUpThreshold = levelUpThreshold;
        transferOwnership(owner);
    }

    function getRankingInstance() public view returns (address) {
        return _rankingInstance;
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function setURI(string memory uri) public onlyOwner {
        _setURI(uri);
    }

    function setContractURI(string memory uri) public onlyOwner {
        _contractURI = uri;
    }

    function mint(address to, uint256 amount, uint256 poolId, bytes memory data) public onlyRankingInstance {
        require(to != address(0), "RankToken->mint: Address not specified");
        require(amount != 0, "RankToken->mint: amount not specified");
        require(poolId != 0, "RankToken->mint: pool id not specified");
        _mint(to, poolId, amount, data);
    }

    function updateRankingInstance(address newRankingInstance) public onlyOwner {
        require(newRankingInstance != address(0), "must specify ranking instance");
        _rankingInstance = newRankingInstance;
        emit RankingInstanceUpdated(newRankingInstance);
    }

    function lockInInstance(address account, uint256 id, uint256 amount) public onlyRankingInstance {
        require(balanceOf(account, id) >= lockedAmounts[account][id] + amount, "not enough balance");
        lockedAmounts[account][id] += amount;
        emit TokensLocked(account, id, amount);
    }

    function unlockFromInstance(address account, uint256 id, uint256 amount) public onlyRankingInstance {
        require(lockedAmounts[account][id] >= amount, "not enough locked");
        lockedAmounts[account][id] -= amount;
        emit TokensUnlocked(account, id, amount);
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

    function levelUp(address to, uint256 id, bytes memory data) public {
        require(to == msg.sender || msg.sender == _rankingInstance, "levelUp: Not permitted");
        _burn(to, id, _levelUpThreshold);
        _mint(to, id + 1, 1, data);
        emit LevelUp(to, id);
    }

    function findNewRank(address account, uint256 oldRank) public view returns (uint256) {
        for (uint256 i = oldRank; i > 0; i--) {
            uint256 _balanceTemp = balanceOf(account, i);
            if (_balanceTemp > 0) return i;
        }
        return 0;
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        for (uint256 i = 0; i < ids.length; i++) {
            if (from != address(0))
                require(
                    lockedAmounts[from][ids[i]] + amounts[i] <= balanceOf(from, ids[i]),
                    "Insufficient unlocked tokens"
                );
        }
        super._afterTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function _afterTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        for (uint256 i = 0; i < ids.length; i++) {
            if (rank[to] < ids[i] && amounts[i] != 0) {
                rank[to] = ids[i];
            }
            if (from != address(0)) rank[from] = findNewRank(from, rank[from]);
        }
        super._afterTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function getAccountRank(address account) external view returns (uint256) {
        return rank[account];
    }

    function balanceOfUnlocked(address account, uint256 id) external view returns (uint256) {
        return balanceOf(account, id) - lockedAmounts[account][id];
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC1155) returns (bool) {
        return interfaceId == type(IRankToken).interfaceId || super.supportsInterface(interfaceId);
    }
}
