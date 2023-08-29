# Tests report

## Commit hash: d0826bbe50754432a046a7731d3f99e096ecd037

```
yarn hardhat test --parallel
yarn run v1.22.18
No need to generate any newer typings.


  DiamondTest
    ✔ should have three facets -- call to facetAddresses function
    ✔ facets should have the right function selectors -- call to facetFunctionSelectors function (50ms)
    ✔ selectors should be associated to facets correctly -- multiple calls to facetAddress function
    ✔ should add test1 functions (220ms)
    ✔ should test function call
    ✔ should replace supportsInterface function (69ms)
    ✔ should add test2 functions (175ms)
    ✔ should remove some test2 functions (173ms)
    ✔ should remove some test1 functions (199ms)
    ✔ remove all functions and facets except 'diamondCut' and 'facets' (132ms)
    ✔ add most functions and facets (315ms)
    ✔ Should be able to migrate structs inside diamond storage


  LibCoinVending Test
    ✔ Should be able to create new position without tokens
    ✔ Should revert on interaction with non exsistent positions (41ms)
    When position without tokens created
      ✔ Allows to fund with correct value
      ✔ Reverts attempt to fund with not enough value
      ✔ Reverts attempt to refund
      ✔ Reverts attempt to release
      ✔ Funding takes away proper value and Refunded address gets same balance as before funding
      ✔ Release brings correct values back to funder, benificiary and payee
    When position with custom tokens is implemented
      ✔ Takes all required tokens in fund stage (68ms)
      ✔ Reverts attempt to fund with not enough tokens (212ms)
      ✔ Reverts attempt to refund
      ✔ Reverts attempt to release
      ✔ Funding takes away proper tokens and Refunded address getstokens back as before funding (138ms)
      ✔ brings correct values upon Fund & Release back to funder, benificiary and payee (148ms)


  DNSFacet.ts
    ✔ Is Owned by contract owner
    ✔ Transfer ownership can be done only by contract owner (43ms)
    ✔ Has zero domains
    ✔ Supports multipass interface
    ✔ Emits and increments when new domain initialized (41ms)
    ✔ Reverts if intializing domain name props are wrong (86ms)
    ✔ Reverts any ownerOnly call by not an owner (66ms)
    When a new domain was initialized
      ✔ Reverts if domain name already registered
      ✔ Domain name state is equal to initial values and is not active
      ✔ Incremented number of domains
      ✔ emits when domain activated
      ✔ Does not allow to register because is not active
      ✔ Emits and changes fee
      when domain was set to active
        ✔ Is set to active
        ✔ Emits on register when properties are valid
        ✔ Reverts on register if properties are invalid (38ms)
        ✔ Reverts if signature is outdated
        ✔ Allows valid registrations for free until free tier has reached (93ms)
        When user was registered
          ✔ Can find newly registered user  (42ms)
          ✔ Reverts registration if user id already exist
          ✔ Emits when register with valid referral code (40ms)
          ✔ Can modify username with a valid arguments (116ms)
          ✔ Emits and deletes user
          When second domain is initialized and active
            ✔ Reverts on referring yourself from a different domain (54ms)
            ✔ Can register same user on both domains and do cross domain lookup
        When free number of free registrations has been reached
          ✔ Should allow registering with paying ether
          ✔ Should be able withraw ammount payed (50ms)
          ✔ Should revert register if not enough ether


  BestOfGame.ts
    ✔ Is Owned by contract owner
    ✔ Has correct initial settings
    ✔ Transfer ownership can be done only by contract owner (49ms)
    ✔ has rank token assigned
    ✔ Can create game only with valid payments (182ms)
    ✔ Cannot perform actions on games that do not exist (210ms)
    ✔ Succedes to create ranked game only if sender has correspoding tier rank token
    When a game of first rank was created
      ✔ GM is correct
      ✔ Incremented number of games correctly
      ✔ Players cannot join until registration is open
      ✔ Allows only game creator to add join requirements (102ms)
      ✔ Only game creator can open registration
      When registration was open without any additional requirements
        ✔ Mutating join requirements is no longer possible
        ✔ Qualified players can join
        ✔ Game cannot be started until join blocktime has passed (55ms)
        ✔ No more than max players can join (81ms)
        ✔ Game cannot start too early
        ✔ Game methods beside join and start are inactive (187ms)
        ✔ Cannot be started if not enough players (2715ms)
        When there is minimal number and below maximum players in game
          ✔ Can start game only after joining period is over (2128ms)
          ✔ Game methods beside start are inactive (138ms)
          When game has started
            ✔ First turn has started
            ✔ Accepts only proposals and no votes (56ms)
            ✔ Processes only proposals only from game master (43ms)
            ✔ Can end turn if timeout reached with zero scores (332ms)
            When all proposals received
              ✔ Can end turn (72ms)
              When first turn was made
                ✔ throws if player submitted GM signed vote for player voting himself (501ms)
                When all players voted
                  ✔ cannot end turn because players still have time to propose (52ms)
                  ✔ Can end turn if timeout reached (675ms)
          When another game  of first rank is created
            ✔ Reverts if players from another game tries to join
        When there is not enough players and join time is out
          ✔ It throws on game start
          ✔ Allows creator can close the game (61ms)
          ✔ Allows player to leave the game
      When registration was open with additional join requirements
        ✔ Fulfills funding requirement on join (304ms)
        ✔ Returns requirements on leave (135ms)
        ✔ Returns requirements on game closed (188ms)
        ✔ Distributes rewards correctly when game is over (5736ms)
      When it is last turn and equal scores
        ✔ reverts on submit proposals (53ms)
        ✔ Next turn without winner brings Game is in overtime conditions (697ms)
        when is ovetime
          ✔ emits game Over when submited votes result unique leaders (525ms)
        When game is over
          ✔ Throws on attempt to make another turn (324ms)
          ✔ Gave rewards to winners
          ✔ Allows winner to create game of next rank (52ms)
          When game of next rank is created and opened
            ✔ Can be joined only by rank token bearers (61ms)
    When there was multiple first rank games played so higher rank game can be filled
      ✔ Winners have reward tokens (41ms)
      When game of next rank is created
        ✔ Can be joined only by bearers of rank token (79ms)
        ✔ Locks rank tokens when player joins (75ms)
        ✔ Returns rank token if player leaves game (113ms)
        ✔ Returns rank token if was game closed (182ms)
        when this game is over
          ✔ Winners have reward tokens
          ✔ Returned locked rank tokens


  105 passing (7m)

✨  Done in 418.80s.
```