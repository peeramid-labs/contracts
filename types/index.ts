import { BigNumberish, BytesLike } from "ethers";

export type SupportedChains =
  | "localhost"
  | "mumbai"
  | "polygon"
  | "ethereum"
  | "goerli";

export * as enums from "./enums";

export const ProposalTypes = {
  signProposalByGM: [
    {
      type: "uint256",
      name: "gameId",
    },
    {
      type: "uint256",
      name: "turn",
    },
    {
      type: "bytes32",
      name: "proposalHash",
    },
    {
      type: "string",
      name: "encryptedByGMProposal",
    },
  ],
};

export interface ProposalMessage {
  gameId: BigNumberish;
  proposal: string;
  turn: BigNumberish;
  salt: BytesLike;
}
