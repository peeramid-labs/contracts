// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.0;

contract Agenda is ERC20Burnable, Ownable {
    uint256 numTokens;

    constructor(address owner) ERC20("Agenda", "AGNDA") {
        require(owner != address(0), "must specify owner of the contract");
        transferOwnership(owner);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "mint:Address not specified");
        require(amount != 0, "mint: amount not specified");
        _mint(to, amount);
    }
}
