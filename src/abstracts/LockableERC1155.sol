// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.20;
import "../libraries/LibReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ILockableERC1155} from "../interfaces/ILockableERC1155.sol";
error insufficient(uint256 id, uint256 balance, uint256 required);

/**
 * @title LockableERC1155
 * @dev This is an abstract contract that extends the ERC1155 token contract and implements the ILockableERC1155 interface.
 *      It provides functionality to lock and unlock token amounts for specific accounts and IDs.
 */
abstract contract LockableERC1155 is ERC1155, ILockableERC1155 {
    mapping(address => mapping(uint256 => uint256)) lockedAmounts;

    /**
     * @dev Locks a specified amount of tokens for a given account and token ID.
     * If the account does not have enough balance to lock the specified amount,
     * the function will revert with an "insufficient" error message.
     * Emits a `TokensLocked` event after successfully locking the tokens.
     * @param account The address of the account to lock tokens for.
     * @param id The ID of the token to lock.
     * @param amount The amount of tokens to lock.
     */
    function lock(address account, uint256 id, uint256 amount) public virtual {
        if (balanceOf(account, id) < lockedAmounts[account][id] + amount) require(false, "insufficient");
        // revert insufficient(id, lockedAmounts[account][id], amount);
        lockedAmounts[account][id] += amount;
        emit TokensLocked(account, id, amount);
    }

    /**
     * @dev Unlocks a specified amount of tokens for a given account and token ID.
     * If the locked amount is less than the specified amount, it reverts with an "insufficient" error message.
     * Emits a `TokensUnlocked` event after unlocking the tokens.
     * @param account The address of the account to unlock tokens for.
     * @param id The ID of the token to unlock.
     * @param amount The amount of tokens to unlock.
     */
    function unlock(address account, uint256 id, uint256 amount) public virtual {
        if (lockedAmounts[account][id] < amount) require(false, "insufficient"); //revert insufficient(id, lockedAmounts[account][id], amount);
        lockedAmounts[account][id] -= amount;
        emit TokensUnlocked(account, id, amount);
    }

    /**
     * @dev Returns the unlocked balance of a specific ERC1155 token for an account.
     * The unlocked balance is calculated by subtracting the locked amount from the total balance.
     * @param account The address of the account.
     * @param id The ID of the ERC1155 token.
     * @return The unlocked balance of the ERC1155 token for the account.
     */
    function unlockedBalanceOf(address account, uint256 id) public view returns (uint256) {
        return balanceOf(account, id) - lockedAmounts[account][id];
    }

    /**
     * @dev Hook function that is called before any token transfer.
     * It checks if the transfer is allowed based on the locked amounts of the tokens.
     * If the transfer is not allowed, it reverts with an error message.
     * @param operator The address performing the token transfer.
     * @param from The address from which the tokens are being transferred.
     * @param to The address to which the tokens are being transferred.
     * @param ids An array of token IDs being transferred.
     * @param amounts An array of token amounts being transferred.
     * @param data Additional data attached to the transfer.
     */
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
                    require(false, "insufficient");
                }
            }
        }
        super._afterTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
