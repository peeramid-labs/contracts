// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.20;

contract MockERC20 is ERC20Burnable, Ownable {
    constructor(string memory name_, string memory symbol_, address owner) ERC20(name_, symbol_) Ownable(owner) {
        require(owner != address(0), "must specify owner of the contract");
        transferOwnership(owner);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "MockERC20->mint: Address not specified");
        require(amount != 0, "MockERC20->mint: amount not specified");
        _mint(to, amount);
    }
}
