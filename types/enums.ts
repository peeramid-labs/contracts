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
  created = "created",
  open = "open",
  started = "started",
  lastTurn = "last turn",
  overtime = "overtime",
  finished = "finished",
  notFound = "not found",
}
