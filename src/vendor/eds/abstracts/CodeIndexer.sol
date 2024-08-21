// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ICodeIndex.sol";

abstract contract CodeIndexer {
    ICodeIndex constant indexContract = ICodeIndex(0xC0D31d4e7987f2eD6bf5225bb28bc14a84858F42);

    constructor() {}

    function getContractsIndex() internal pure returns (ICodeIndex) {
        return indexContract;
    }

    function index(address source) internal {
        indexContract.register(source);
    }
}
