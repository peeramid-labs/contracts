// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ICodeIndex.sol";
interface IIndexUser {
    function getContractsIndex() external view returns (ICodeIndex);
}
