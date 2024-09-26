import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { RegisterMessage, MultipassJs } from '../..//utils/multipass';

export const signRegistrarMessage = async (
    message: RegisterMessage,
    verifierAddress: string,
    signer: SignerWithAddress,
    hre: any
  ) => {
    let { chainId } = await hre.ethers.provider.getNetwork();
    const multipassJs = new MultipassJs({
      chainId: chainId,
      contractName: 'MultipassDNS',
      version: '0.0.1',
      ...hre.network,
    });
    return await multipassJs.signRegistrarMessage(message, verifierAddress, signer);
  };