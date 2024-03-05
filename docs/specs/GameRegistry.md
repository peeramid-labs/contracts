# Game Registry contract

## Introduction

Smart contract that is able to spawn game instances upon request as well as dependencies for them, such as rank token which is needed. It records all spawned instances in own storage, emits informational notifications and acts as secure and trusted contract that can mint rank tokens on behalf on spawned game instances.

## Motivation

In rankify it's needed to give ability community to play individual (encapsulated games) which can still refer to same or different rank token and corresponding subject. We want subjects to be plural and games - easy to create. It's also needed to have some unified storage where we can index all existing games and their subjects.
It's also needed to give trusted infrastructure for both tokens and instances so that multiple can exist and still trust each other. The obvious way for doing that is to deploy a factory that acts as registry and routes some of privileged access traffic trough itself.

## Rationale

**_Using factory as minter on rank tokens vs multiple minter roles on rank tokens_** - If we want to support multiple instances per same subject then rank tokens must be minted by multiple possible instances that have their lists isolated.
One way to do that would be to add RBAC kind of access with "Minter Role" and manage it for each token. That would imply that for each token contract minter set should be managed. In case if minter has to be added or removed it must be still done by trusted entity contract that has same level of security as does factory itself. Hence it must be either factory or it's owner. Given that we already store subjects and instances in registry of factory, we can re-use same records to implement simple access check.

**Combining rank token factory with game instance factory** - It would be possible to isolate these deployments in two different contracts. Such design would imply that rank token factory may be called by either owner or game instance factory. Hence they are sharing same security level, and since factory deploys instances already tied to a particular rank token, they would become decoupled from token factory in case if token factory was swapped. Same can be achieved by deploying one factory as diamond contract and using Instance & Token deployments factory

## Specification

- Must allow only one account (owner) to create subjects
- Must allow publicly to create instances
- Must store payment requirements for instance creation
- Must enforce payment requirements for game creation
- Must not enforce payment requirements for instances creation by owner
- Payment requirements are set only by owner
- Must be upgradable only by owner
- Should be EIP165 compliant
- Produced game instance must be diamond proxies
- Produced diamond proxies must be converted to game instances by reusing game instance facet contracts across instances
- Produced diamond proxies must be owned by owner of the factory contract
- Produced game instances must run initialization function in same instance spawning transaction
- Must take all parameters for instance constructor and initialization from transaction
- Must store deployed instances in storage, recording their address and subject address in own memory registry
- Must spawn only game instances to an existing rank token recorded in it's "subjects" storage
- Must be able to add subjects by deploying new rank token and recording it in "subjects" storage
- Must be minter of deployed rank tokens
- Must be able to remove subjects
- Must be able to remove instance
- Must emit an event when subject is added
- Must emit an event when subject is removed
- Must emit en event when subject is modified
- Must emit an event when instance is spawned
- Must emit an event when instance spawning costs are changed
- Must emit en event when instance is deleted from registry
- Must allow game instances to mint rank tokens
- Spawned game instances must mint tokens by calling factory method

## Interface specifications

```solidity
interface IGameRegistry
{
    function spawnInstance()
    function delistInstance()
    function addSubject()
    function removeSubject()
    function setInstanceCost()
    function isSubject()
    function isInstance()
    function getInstanceCost()
    function getInstances()
    function getSubjects()
    function mintRankForSubject(address subject, address to, uint256 id, uint256 amount)
    

}
```

