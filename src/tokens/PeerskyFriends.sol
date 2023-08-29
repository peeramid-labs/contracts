// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.0;

contract PeerskyFriends is ERC1155, Ownable
{
    constructor(string memory uri_, address owner) ERC1155(uri_)
    {
        require(owner != address(0), "must specify owner of the contract");
        transferOwnership(owner);
    }

    function setUri(string memory newUri) public onlyOwner
    {
        _setURI(newUri);
    }

    function mint(address to, uint256 amount, uint256 poolId, bytes memory data) public onlyOwner {
        require(to != address(0), "RankToken->mint: Address not specified");
        require(amount != 0,  "RankToken->mint: amount not specified");
        require(poolId != 0,  "RankToken->mint: pool id not specified");
        _mint(to, poolId,amount, data);
    }

    function batchMint(address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public onlyOwner
    {
        require(to != address(0), "RankToken->mint: Address not specified");
        require(amounts.length != 0,  "RankToken->mint: amount not specified");
        require(ids.length != 0,  "RankToken->mint: pool id not specified");
        _mintBatch(to,ids,amounts,data);
    }
    function levelUp(address to, uint256 id, bytes memory data) public onlyOwner
    {
        _burn(to, id,1);
        _mint(to,id+1,1,data);
    }
}