// SPDX-License-Identifier: AGPL-3.0-or-later
/// @notice This is a modified source from Aragon X, where interfaces were generalized to be more generic and reusable.
pragma solidity ^0.8.0;
import {IRepository} from "./IRepository.sol";
import {IVTag} from "./IVTag.sol";

interface IVRegistry is IRepository, IVTag {
    /// @notice Registers a contract with a specific version.
    /// @param source The address of the contract to register.
    /// @param version The version of the contract.
    function register(address source, Version calldata version) external;

    /// @notice Registers a contract with a specific version.
    /// @param source The address of the contract to register.
    /// @param version The version of the contract.
    function invalidate(address source, Version calldata version) external;

    /// @dev Checks if a given address is registered in the IVRegistry.
    /// @param source The address to check.
    /// @return A boolean indicating whether the address is registered or not.
    function entries(address source) external view returns (bool);
}
