// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.20;
import "../libraries/LibReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ILockableERC1155} from "../interfaces/ILockableERC1155.sol";
error insufficient(uint256 id, uint256 balance, uint256 required);

abstract contract LockableERC1155 is ERC1155, ILockableERC1155 {
    mapping(address => mapping(uint256 => uint256)) lockedAmounts;

    function lock(address account, uint256 id, uint256 amount) public virtual {
        if (balanceOf(account, id) < lockedAmounts[account][id] + amount)
            require(false, 'insufficient');
            // revert insufficient(id, lockedAmounts[account][id], amount);
        lockedAmounts[account][id] += amount;
        emit TokensLocked(account, id, amount);
    }

    function unlock(address account, uint256 id, uint256 amount) public virtual {
        if (lockedAmounts[account][id] < amount) require(false, 'insufficient');//revert insufficient(id, lockedAmounts[account][id], amount);
        lockedAmounts[account][id] -= amount;
        emit TokensUnlocked(account, id, amount);
    }

    function unlockedBalanceOf(address account, uint256 id) public view returns (uint256) {
        return balanceOf(account, id) - lockedAmounts[account][id];
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        for (uint256 i = 0; i < ids.length; i++) {
            if (from != address(0)) {
                if (lockedAmounts[from][ids[i]] + amounts[i] > balanceOf(from, ids[i])) {
                    require(false,'insufficient');//revert insufficient(ids[i], unlockedBalanceOf(from, ids[i]), amounts[i]);
                }
            }
        }
        super._afterTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
