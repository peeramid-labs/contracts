// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import {IRepository, Tag} from "./IRepository.sol";
import {ISourceController} from "./ISourceController.sol";

/**
 * @title IInstantiator
 * @notice The Instantiator contract is responsible for instantiating new instances from SourceController
 * @dev This interface is intended to use ISourceController as a source of authority for instantiating new instances
 * @dev While this acts as registry of active instances, SourceController is registry of required versions
 * @dev Hence in order to ensure proper authorization for target
 * @dev Each time an instance is calling a target, `instanceCheck` should be called.
 * @dev Implementation of `instanceCheck` should verify version requirements with SourceController
 * @dev WARNING: Repository ources MUST contain IDistribution compliant sources
 * @author Peersky
 */
interface IInstantiator {
    /**
     * @dev Error thrown when an instance has an invalid version.
     * @param instance The address of the instance.
     * @param has The current version tag of the instance.
     * @param needs The required version tag for the instance.
     */
    error InvalidVersion(address instance, Tag has, Tag needs);

    /**
     * @dev Error thrown when an invalid repository is provided.
     * @param repository The address of the repository.
     */
    error InvalidRepository(address repository);

    /**
     * @dev Error thrown when an address is not an instance.
     * @param instance The address to check.
     */
    error NotAnInstance(address instance);

    /**
     * @dev Emitted when a new instance is successfully instantiated.
     * @param instanceId id of the new instance.
     * @param repository The address of the repository used for instantiation.
     * @param version The version tag of the new instance.
     * @param args The arguments used for instantiation.
     */
    event Instantiated(uint256 indexed instanceId, IRepository indexed repository, Tag indexed version, bytes[][] args);

    /**
     * @dev Emitted when an instance is removed.
     * @param instance The address of the removed instance.
     */
    event Removed(address indexed instance);

    /**
     * @dev Instantiates a new contract instance using the provided repository and arguments.
     * @param repository The repository used for instantiation.
     * @param args The arguments used for instantiation.
     * @dev NB for "constructable" source types, the first argument should be constructor code.
     * @return instanceId of the newly instantiated instance.
     */
    function instantiate(IRepository repository, bytes[][] calldata args) external returns (uint256 instanceId);

    /**
     * @dev Instantiates a new contract instance using the provided repository, version, and arguments.
     * @param repository The repository used for instantiation.
     * @param version The version tag required for instantiation.
     * @param args The arguments used for instantiation.
     * @return instanceId of the newly instantiated instance.
     */
    function instantiateExact(
        IRepository repository,
        Tag calldata version,
        bytes[][] calldata args
    ) external returns (uint256 instanceId);

    /**
     * @dev Checks if the provided address is a valid instance.
     * @param instance The address to check.
     * @return if the address is a valid instance, the instance id is returned, otherwise 0.
     */
    function tryInstanceId(address instance) external view returns (uint256);

    /**
     * @dev Checks if the provided address is a valid instance and passes both instance requirements and SourceController refquirements.
     * @param instance The address to check.
     * @return True if the address is a valid instance and passes the instance check, false otherwise.
     */
    function instanceCheck(address instance) external view returns (bool);

    /**
     * @dev Retrieves the version tag of the provided instance.
     * @param instance The address of the instance.
     * @return version The version tag of the instance.
     */
    function instanceVersion(address instance) external view returns (Tag memory version);

    /**
     * @dev Removes an instance from the system.
     * @param instance The address of the instance to remove.
     */
    function remove(address instance) external;

    /**
     * @dev Retrieves the source control contract associated with the provided instance.
     * @param instance The address of the instance.
     * @return ISourceController The source control contract associated with the instance.
     */
    function getSourceControl(address instance) external view returns (ISourceController);

    /**
     * @dev Retrieves the instance contracts associated with the provided instance id.
     * @param instanceId The id of the instance.
     * @return instaneContracts associated with the instance id.
     */
    function getInstance(uint256 instanceId) external view returns (address[] memory instaneContracts);

    /**
     * @dev Retrieves the number of instances in the system.
     * @return The number of instances in the system.
     */
    function getInstancesNum() external view returns (uint256);

    /**
     * @dev Retrieves the instance id associated with the provided instance address.
     * @param instance The address of the instance.
     * @return The instance id associated with the instance address.
     */
    function getActiveInstancesIds() external view returns (uint256[] memory);
}
