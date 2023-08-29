// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// import "./LibDiamondOwner.sol";
// import { IMultipass } from "../interfaces/sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

library LibReentrancyGuard {
    bytes32 constant TBG_STORAGE_POSITION = keccak256("reentrancyguard.storage.position");

    struct ReentrancyGuardStruct {
        bool _entered;
    }

    function reentrancyGuardStorage() internal pure returns (ReentrancyGuardStruct storage ds) {
        bytes32 position = TBG_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }
}
