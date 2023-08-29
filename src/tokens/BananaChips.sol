// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.0;

contract BananaChips is ERC721 {

    constructor(address s) ERC721("Bowl of banana chips", "BCHIP")
    {
        _safeMint(s, 1);
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`. Empty
     * by default, can be overridden in child contracts.
     */
    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://QmNkKSgcrGZHJ2HAQxU3ZET8ywF5zXQqYDkh2xrbaD2vsQ/";
    }


}