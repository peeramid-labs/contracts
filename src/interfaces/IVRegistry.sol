// SPDX-License-Identifier: AGPL-3.0-or-later
/// @notice This is a modified source from Aragon X, where interfaces were generalized to be more generic and reusable.
pragma solidity ^0.8.0;
import {IRepository} from "./IRepository.sol";
import {Tag, Version} from "./IVTag.sol";

interface IVRegistry is IRepository {
    /// @notice Registers a contract with a specific version.
    /// @param source The address of the contract to register.
    /// @param version The version of the contract.
    function register(address source, Version calldata version) external;

    /// @notice Sets the contract address of specific version to zero.
    /// @param source The address of the contract to register.
    /// @param version The version of the contract.
    function invalidate(address source, bool invalidateMinors, Version calldata version) external;

    /// @dev Checks if a given address is registered in the IVRegistry.
    /// @param version The version of the contract.
    function getVersion(Version memory version) external view returns (address);
}
