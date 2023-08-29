// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
// // import "@solidstate/contracts/token/ERC721/SolidStateERC721.sol";
// // import "@openzeppelin/contracts/token/ERC721/";
// // import {IERC4671} from "../interfaces/IERC4671-draft.sol";
// // import {IERC4671Enumerable} from "../interfaces/IERC4671Enumerable-draft.sol";
// // import {IERC4671Metadata} from "../interfaces/IERC4671Metadata-draft.sol";
// import "@solidstate/contracts/utils/AddressUtils.sol";
// // import {ERC4671BaseStorage} from "../libraries/LibERC4671draftBaseStorage.sol";
// // import "../libraries/LibERC4671draftMetadataStorage.sol";
// import "@solidstate/contracts/token/ERC721/SolidStateERC721.sol";
// import "../modifiers/OnlyOwnerDiamond.sol";
// import "../vendor/libraries/LibDiamond.sol";

// contract MultipassPassport is SolidStateERC721, OnlyOwnerDiamond {
//     function transferFrom(
//         address from,
//         address to,
//         uint256 tokenId
//     ) public payable override {
//         revert("Token is not Tradable");
//     }

//     function safeTransferFrom(
//         address from,
//         address to,
//         uint256 tokenId
//     ) public payable override {
//         revert("Token is not Tradable");
//     }

//     function approve(address operator, uint256 tokenId) public payable override {
//         // setApprovalForAll(operator, status);
//     }

//     function setApprovalForAll(address operator, bool status) public override {
//         revert("Token is not Tradable");
//     }

//     function burn(address owner) public {
//         require(
//             (ownerOf(tokenOfOwnerByIndex(owner, 1)) == msg.sender) || (LibDiamond.contractOwner() == msg.sender),
//             "Can be done only by contract owner or bearer"
//         );
//         _burn(tokenOfOwnerByIndex(owner, 1));
//     }

//     function mint(address to) public payable onlyOwner {
//         require(balanceOf(to) == 0, "Can have only one token per address");
//         _mint(to, uint256(uint160(to)));
//     }
// }
