# Rankify smart contracts
![rankToken_resize](https://github.com/rankify-it/contracts/assets/61459744/82d4496e-7e46-47ee-8f2f-2fca6d3c30b8)


## What is it about? 

This is a gamified implementation of "Continious voting" protocol where participants assumed to engage over large periouds of time in a series of rounds and even diffenrent instances. Final goal being - to allow creating ladder where winners are ultemately selected for their ability to propose best ideas, that their group accepts in a blind voting/proposal cycle and which is averaged over large number of rounds, and, frankly - can be played indefinately. 

### Manifesto

Think of today governance systems and how projects are extremely dependent on a centralized authority of core develoepers, organizations - on their creators etc. This happens because de-facto way how governing happens is still based on principles of leadership that are defined in same rules as thousands years ago. 
In a modern technology world there are ways to improve such systems and processes. We are able to build more robust, sustainable and lasting collectives by basing them on algorithms. Hence in this project - it is a **social experiment** on finding such a system that would proove it's effectiveness and would be hence in demand by any institution from family-friends to larger enterprise or DAOs. 

#### Assumptions 
In this manifesto we assume that **More effective governance systems are possible**, that eventually **effeciveness is the key for adoption** and that this is the only way for **DAOs** to see large scale adoption. It is asserted also that Distributed-Ledger technology is de-facto graal for building such a system, because this allows to build trust and verify trust in trully trustless enviroments. 

#### Building better world 
All contents of this work are related primarly towards allowing growth of not just Ethereum ecosystem. Belive in better world for everyone and that this Application can become a worlds first mass-adopted system. Hence requirements are put as follows: it must be **simple** to use, **require as less wallet actions as possible**, **fun and easy** and even allow **vote-to-earn** mechanisms in some cases. 

### How it works? 

#### Ideally (not everything is yet implemented):
There will be DAO who custodies the Governance Technology Research & Development; It will act as custodian for a **InstanceFactory** that is able to emit new Instances contracts. Each **instance** has its **subject**, that is being voted on, and a game settings such as max/min players, time per turn etc; 
For each such instance, at least one **Rank Token** will be deployed from same factory as well; This is an ERC1155 extension that allows to level up tokens as well as some extended functionality which we will touch on later. This token acts as a representation of **rank** of the bearer for a particular voting subject of the **instance**. **Token id** - represents rank level; In order to get higher level rank tokens players need to have previous rank token in their possesion; This creates a ladder, where you need to either win a lot of games. Optionally making the rank tokens **tradable** enables users for **vote-to-earn** mechanism, where they could potentially sell their high-ranking token to somone who wants to have a "social lift". This is a subject to explore as tokenazible "lobbying". 

To allow maximum participation, DAO will create games that can be joined by **anyone** who can fulfill basic payment requirement, however **game creators** are able to impose additional requirements, such as betting, locking, possesing as start, or paying game creator - to make games more exciting and also to allow scoping access to a particular game. 

Hence player can play a game of "best music" with his friends, but if he later on wants to proove his musical taste capacity somewhere in the world - he can show the rank of the token, therefore justifying his level. Furthermore such mechanisms can be explored as "burning reputation" in exchange for goods or services. Which might sound wierd, but if we give it a thought - werent we doing this some times in our lives? 

The fact that there can be multiple such games also creates ability to get a **multidimensional** pattern of players competences. 

And as a **byproduct** we are getting lists, sorted by highest score, that represent best ideas of some particular group over set of rounds. 

It's worth of noting that important concept for such a system is to ensure not just voting privacy, but also proposing privacy, together with emposing some rules (since there are subjects - at least subject must be followed). Which is untrivial task and so far the implementation falls-back to using web2 servers that will run as **Game Masters**  to ensure proposer/voter semi-privacy (after round is over we will publish accounts) and proposal moderation. This is short-medium term solution
**ZK-Proofs** and eventually **FHE** and/or **TEE** should as a long term goal allow us to have fully trustless setup where we will achieve at least Full verification of data integrity or at best case - full encapsulation of data from any 3rd party viewer. 

#### What do we have today 
We can create a game, and simple dApp for that; Factory still to be implemented, as well as DAO contract and ZKProofs/Signature workflows; 


### Who will use it 
For blockchain-native people this can be used as extension to any DAO system. You could determine subjects of competence (i.e. financial or technical topics) and multiply DAO participant weights against their Rank Token. 

However worth mentioning that this is going to be a first really end-user blockchain app, that is really able to change everyday life of regular people by playing such games and gradually learning way of blockchain governances. 

## Contracts

### RankifyInstance
It is a diamond contract that consit of 
- [RankifyInstanceMainFacet.sol](./src/facets/RankifyInstanceMainFacet.sol) - main functionality availible to players and for read operations
- [RankifyInstanceGameMastersFacet.sol](./src/facets/RankifyInstanceGameMastersFacet.sol) - game master access only methods
- [RankifyInstanceGameOwnersFacet.sol](./src/facets/RankifyInstanceGameOwnersFacet.sol) - game owner access only
- [RankifyInstanceRequirementsFacet.sol](./src/facets/RankifyInstanceRequirementsFacet.sol) - requirements module additional functionality 
- [IRankifyInstanceCommons.sol](./src/interfaces/IRankifyInstanceCommons.sol) - some common structures shared across facets and libraries

On the background these facets refer to a libraries that implement storage and logic, main to note are:
- [LibTurnBasedGame.sol](./src/libraries/LibTurnBasedGame.sol) - generalized functionality of a turn based game (welcome to reuse for your project :) )
- [LibQuadraticVoting.sol](./src/libraries/LibQuadraticVoting.sol) - generalized functionality of quadradtic voting for case of multiple proposals/proposers and pre-defined vote credits
- [LibRankify.sol](./src/libraries/LibRankify.sol) - game instance functionality itself
- [LibCoinVending.sol](./src/libraries/LibCoinVending.sol) - Library that manages requirements, funds/refunds and adds ability to lock/bet/pay/burn when game reaches certain conditions

### Rank token 
It's an extension of ERC1155 that adds following functionality: 
- [IRankToken.sol](./src/interfaces/IRankToken.sol) - adds ability to level up tokens, set up a instance who it is connected to for emitting new tokens and ability to find accoount rank level
- [CompositeERC1155.sol](./src/abstracts/CompositeERC1155.sol) - adds ability to compose multiple rank tokens tokens in one. This we need to provide ability to create games that represent a "vector" of different "dimensions"
- [LockableERC1155.sol](./src/abstracts/LockableERC1155.sol) - adds ability to lock tokens without changing their owner. This allows to correctly display owners rank even if he is in the game, or if he composed his token in a composite

### [Rankify token ](./src/tokens/rankify.sol) 
It is just an ERC20 token, it will be owned by governing organization and will be emitted to control quotas for joining games (you will need to pay this token to join the game) 


### Smart contract security model 

From a high level overview there is splitt of highly complex and sophisticated **RankifyInstance** from actual assets - **Rank tokens**, this is a primary reason why they are not encapsulated under one proxy. Diamond Proxy is needed for GameInstance because of planned upgrades for ZKP privacy and other improvements, and also because of size constraints on EVM bytecode.

While all this, the DAO and Rankify Token contracts will be kept as simple as possible and isolated from depending on these contracts (at least until they are well established and battle tested) 







