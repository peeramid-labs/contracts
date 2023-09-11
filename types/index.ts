import { BigNumberish, BytesLike } from "ethers";

export type SupportedChains =
    | "anvil"
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
            name: "proposalNHash",
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

import Web3 from "web3/types";
import { AbiItem, AbiInput } from "web3-utils";
import { ethers } from "ethers";
import { JsonFragment } from "@ethersproject/abi";
export enum SiteMapItemType {
    EMPTY = 0,
    CONTENT,
    EXTERNAL,
    FOOTER_CATEGORY,
}
export interface SiteMapItem {
    title: string;
    path: string;
    type: SiteMapItemType;
    children?: SiteMapItem[];
}

export type SiteMap = SiteMapItem[];
export interface WebSiteConfig {
    SITEMAP: SiteMap;
    DEFAULT_LOGO: string;
    ENABLE_WEB3: boolean;
    COPYRIGHT_NAME: string;
    DISCORD?: string;
    TWITTER?: string;
    GITHUB?: string;
}

export interface WalletStatesInterface {
    ONBOARD: String;
    CONNECT: String;
    CONNECTED: String;
    UNKNOWN_CHAIN: String;
}

export interface ChainInterface {
    chainId: number;
    name: SupportedChains;
    rpcs: Array<string>;
}

export declare function GetMethodsAbiType<T>(
    abi: JsonFragment[],
    name: keyof T
): JsonFragment;

export interface TokenInterface {
    address: string;
    deadline: number;
    signed_message: string;
}

declare function ChangeChain(chainName: SupportedChains): void;
declare function getChainFromId(chainId: number): SupportedChains;
export interface Web3ProviderInterface {
    provider: ethers.providers.Web3Provider | undefined;
    signer: ethers.providers.JsonRpcSigner | undefined;
    onConnectWalletClick: Function;
    buttonText: String;
    WALLET_STATES: WalletStatesInterface;
    account: string;
    chainId: number;
    getMethodsABI: typeof GetMethodsAbiType;
    changeChain: typeof ChangeChain;
    targetChain: ChainInterface | undefined;
    getChainFromId: typeof getChainFromId;
}

export interface UIProviderInterface {
    sidebarVisible: boolean | undefined;
    searchBarActive: boolean | undefined;
    isMobileView: boolean | undefined;
    sidebarCollapsed: boolean | undefined;
    sidebarToggled: boolean | undefined;
    searchTerm: string | undefined;
    setSearchBarActive: Function;
    setSidebarCollapsed: Function;
    setSearchTerm: Function;
    setSidebarToggled: Function;
    setSidebarVisible: Function;
    sessionId: string | undefined;
    webSiteConfig: WebSiteConfig;
}
// export interface ArgumentFields {
//   value: string;
//   placeholder: string;
//   hide: boolean;
//   label: string;
//   valueIsEther?: boolean;
//   convertToBytes: boolean;
//   initialValue: string;
// }
export interface ArgumentField {
    placeholder?: string;
    initialValue?: string;
    label?: string;
    valueIsEther?: boolean;
    convertToBytes: boolean;
    // hide: boolean;
}
export interface ArgumentFields {
    [Key: string]: ArgumentField;
}

export interface FragmentBaseUIField {
    hide: boolean;
    label: string;
}
export interface UIStringFragmentField extends FragmentBaseUIField {
    value: string;
    placeholder: string;
    convertToBytes?: boolean;
}

export interface UINumberFragmentField extends FragmentBaseUIField {
    value: string;
    placeholder: string;
    valueIsEther?: boolean;
}

export interface UIBoolFragmentField extends FragmentBaseUIField {
    value: boolean;
    placeholder: string;
}
export interface UINUmberFragmentFieldArray
    extends Omit<UINumberFragmentField, "value"> {
    value: Array<string>;
}
export interface UIStringFragmentFieldArray
    extends Omit<UIStringFragmentField, "value"> {
    value: Array<string>;
}
export interface UITupleFragmentField extends FragmentBaseUIField {
    components: Array<UIFragmentField>;
    placeholder?: Array<UIFragmentField>;
    value?: Array<UIFragmentField>;
}
export type UIFragmentField =
    | UINumberFragmentField
    | UIStringFragmentField
    | UITupleFragmentField
    | UINUmberFragmentFieldArray
    | UIStringFragmentFieldArray;
export interface UIFragment extends JsonFragment {
    ui: Array<UIFragmentField>;
    allBytesAsStrings?: boolean;
    allValuesAsEther?: boolean;
}
