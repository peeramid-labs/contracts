// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Rankify is ERC20Burnable, Ownable {
    constructor(address owner) ERC20("Rankify", "RFY") Ownable(owner) {
        require(owner != address(0), "must specify owner of the contract");
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "mint:Address not specified");
        require(amount != 0, "mint: amount not specified");
        _mint(to, amount);
    }
}
