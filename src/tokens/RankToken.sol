// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.0;

contract RankToken is ERC1155, Ownable {
    string private _contractURI;

    constructor(string memory uri_, address owner, string memory cURI) ERC1155(uri_) {
        require(owner != address(0), "must specify owner of the contract");
        _contractURI = cURI;
        transferOwnership(owner);
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function setURI(string memory uri) public onlyOwner {
        _setURI(uri);
    }

    function mint(address to, uint256 amount, uint256 poolId, bytes memory data) public onlyOwner {
        require(to != address(0), "RankToken->mint: Address not specified");
        require(amount != 0, "RankToken->mint: amount not specified");
        require(poolId != 0, "RankToken->mint: pool id not specified");
        _mint(to, poolId, amount, data);
    }

    function batchMint(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyOwner {
        require(to != address(0), "RankToken->mint: Address not specified");
        require(amounts.length != 0, "RankToken->mint: amount not specified");
        require(ids.length != 0, "RankToken->mint: pool id not specified");
        _mintBatch(to, ids, amounts, data);
    }

    function levelUp(address to, uint256 id, bytes memory data) public onlyOwner {
        _burn(to, id, 1);
        _mint(to, id + 1, 1, data);
    }
}
