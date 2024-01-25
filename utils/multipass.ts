import { ethers, BigNumber, Wallet, BytesLike } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { LibMultipass } from '../types/src/facets/DNSFacet';
export enum SearchCriteria {
  id,
  username,
  address,
}
export interface SignerIdentity {
  name: string;
  id: string;
  wallet: Wallet | SignerWithAddress;
}
interface ReferrerMesage {
  referrerAddress: string;
}
interface RegisterMessage {
  name: BytesLike;
  id: BytesLike;
  domainName: BytesLike;
  deadline: BigNumber;
  nonce: BigNumber;
}

type signatureMessage = ReferrerMesage | RegisterMessage;

export class MultipassJs {
  // private JsonRpcProvider;
  private chainId;
  private name;
  private version;
  constructor({ chainId, contractName, version }: { chainId: any; contractName: string; version: string }) {
    // if (!ProviderNetwork) throw new Error("Provider network not defined");
    // this.JsonRpcProvider = new ethers.providers.BaseProvider(ProviderNetwork);
    this.chainId = chainId;
    this.name = contractName;
    this.version = version;
  }
  public getDappURL(
    message: any,
    signature: string,
    // type: string,
    basepath: string,
    contractAddress: string,
    domain: string,
  ) {
    return (
      basepath +
      '/?message=' +
      Buffer.from(JSON.stringify(message)).toString('base64') +
      '&contractAddress=' +
      contractAddress +
      '&signature=' +
      signature +
      '&chainId=' +
      this.chainId
    );
  }
  public signRegistrarMessage = async (
    message: RegisterMessage,
    verifierAddress: string,
    signer: Wallet | SignerWithAddress,
  ) => {
    let chainId = this.chainId;

    const domain = {
      name: this.name,
      version: this.version,
      chainId,
      verifyingContract: verifierAddress,
    };

    const types = {
      registerName: [
        {
          type: 'bytes32',
          name: 'name',
        },
        {
          type: 'bytes32',
          name: 'id',
        },
        {
          type: 'bytes32',
          name: 'domainName',
        },
        {
          type: 'uint256',
          name: 'deadline',
        },
        {
          type: 'uint96',
          name: 'nonce',
        },
      ],
    };

    const s = await signer._signTypedData(domain, types, { ...message });
    return s;
  };

  public getRegistrarMessage = ({
    username,
    id,
    domainName,
    validUntil,
  }: {
    username: string;
    id: string;
    domainName: string;
    validUntil: number;
  }) => {
    const registrarMessage = {
      name: ethers.utils.formatBytes32String(username),
      id: ethers.utils.formatBytes32String(id),
      domainName: ethers.utils.formatBytes32String(domainName),
      deadline: ethers.BigNumber.from(validUntil),
      nonce: ethers.BigNumber.from(0),
    };

    return registrarMessage;
  };

  public formQueryByAddress = ({
    address,
    domainName,
    targetDomain,
  }: {
    address: string;
    targetDomain?: string;
    domainName: string;
  }) => {
    if (!ethers.utils.isAddress(address)) throw new Error('formQueryByAddress: is not a valid address');
    const query: LibMultipass.NameQueryStruct = {
      name: ethers.utils.formatBytes32String(''),
      id: ethers.utils.formatBytes32String(''),
      wallet: address,
      domainName: ethers.utils.formatBytes32String(domainName),
      targetDomain: targetDomain ?? ethers.utils.formatBytes32String(''),
    };
    return query;
  };

  public formQueryById = ({
    id,
    domainName,
    targetDomain,
  }: {
    id: string;
    targetDomain?: string;
    domainName: string;
  }) => {
    const query: LibMultipass.NameQueryStruct = {
      name: ethers.utils.formatBytes32String(''),
      id: ethers.utils.formatBytes32String(id),
      wallet: ethers.constants.AddressZero,
      domainName: ethers.utils.formatBytes32String(domainName),
      targetDomain: targetDomain ?? ethers.utils.formatBytes32String(''),
    };
    return query;
  };

  public formQueryByUsername = ({
    username,
    domainName,
    targetDomain,
  }: {
    username: string;
    targetDomain?: string;
    domainName: string;
  }) => {
    const query: LibMultipass.NameQueryStruct = {
      name: ethers.utils.formatBytes32String(username),
      id: ethers.utils.formatBytes32String(''),
      wallet: ethers.constants.AddressZero,
      domainName: ethers.utils.formatBytes32String(domainName),
      targetDomain: targetDomain ?? ethers.utils.formatBytes32String(''),
    };
    return query;
  };

  public formQueryByUsernameAndId = ({
    username,
    domainName,
    targetDomain,
    id,
  }: {
    username: string;
    targetDomain?: string;
    domainName: string;
    id: string;
  }) => {
    const query: LibMultipass.NameQueryStruct = {
      name: ethers.utils.formatBytes32String(username),
      id: ethers.utils.formatBytes32String(id),
      wallet: ethers.constants.AddressZero,
      domainName: ethers.utils.formatBytes32String(domainName),
      targetDomain: targetDomain ?? ethers.utils.formatBytes32String(''),
    };
    return query;
  };

  public formQueryByFullDetails = ({
    username,
    domainName,
    targetDomain,
    id,
    address,
  }: {
    username: string;
    targetDomain?: string;
    domainName: string;
    id: string;
    address: string;
  }) => {
    if (!ethers.utils.isAddress(address)) throw new Error('formQueryByAddress: is not a valid address');
    const query: LibMultipass.NameQueryStruct = {
      name: ethers.utils.formatBytes32String(username),
      id: ethers.utils.formatBytes32String(id),
      wallet: address,
      domainName: ethers.utils.formatBytes32String(domainName),
      targetDomain: targetDomain ?? ethers.utils.formatBytes32String(''),
    };
    return query;
  };
}
