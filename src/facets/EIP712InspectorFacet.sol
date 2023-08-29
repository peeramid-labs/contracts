// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "../libraries/LibEIP712Storage.sol";

contract EIP712InspectorFacet {
    function inspectEIP712Hashes()
        public
        view
        returns (
            bytes32 _CACHED_DOMAIN_SEPARATOR,
            uint256 _CACHED_CHAIN_ID,
            address _CACHED_THIS,
            bytes32 _HASHED_NAME,
            bytes32 _HASHED_VERSION,
            bytes32 _TYPE_HASH
        )
    {
        LibEIP712WithStorage.LibEIP712WithStorageStorage storage ss = LibEIP712WithStorage.EIP712WithStorage();

        return (
            ss._CACHED_DOMAIN_SEPARATOR,
            ss._CACHED_CHAIN_ID,
            ss._CACHED_THIS,
            ss._HASHED_NAME,
            ss._HASHED_VERSION,
            ss._TYPE_HASH
        );
    }

    function currentChainId() public view returns (uint256) {
        return block.chainid;
    }
}
