//As for now Solidity abi specification does not support named enums and exports them as an array, hence to keep typechain cannot suppor this and types for enums must be defined manually
export enum TokenTypes {
    NATIVE,
    ERC20,
    ERC1155,
    ERC721,
}

export enum TokenMust {
    HAVE,
    LOCK,
    BURN,
    MINT,
    BET,
    GIVE,
}

export enum gameStatusEnum {
    created = "Game created",
    open = "Registration open",
    started = "In progress",
    lastTurn = "Playing last turn",
    overtime = "PLaying in overtime",
    finished = "Finished",
    notFound = "not found",
}
