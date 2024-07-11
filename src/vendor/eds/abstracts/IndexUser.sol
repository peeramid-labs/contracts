// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ICodeIndex.sol";
import "../interfaces/IIndexUser.sol";
abstract contract IndexUser is IIndexUser {
    ICodeIndex immutable index;
    constructor(ICodeIndex _index) {
        index = _index;
    }

    function getContractsIndex() public view returns (ICodeIndex) {
        return index;
    }
}
