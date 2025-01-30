import { BigNumberish, ethers, Wallet } from 'ethers';
import { keccak256 } from 'ethers/lib/utils';

// Derives a private key from the signer's private key, gameId, turn, and contract address
export const privateKeyDerivationFunction = ({
  chainId,
  privateKey,
  gameId,
  turn,
  contractAddress,
}: {
  chainId: string;
  privateKey: string;
  gameId: BigNumberish;
  turn: BigNumberish;
  contractAddress: string;
}) => {
  const derivedPrivateKey = keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'uint256', 'uint256', 'address', 'string'],
      [privateKey, gameId, turn, contractAddress, chainId],
    ),
  );
  return derivedPrivateKey;
};

export const sharedSigner = ({
  publicKey,
  signer,
  gameId,
  turn,
  contractAddress,
  chainId,
}: {
  publicKey: string;
  signer: Wallet;
  gameId: BigNumberish;
  turn: BigNumberish;
  contractAddress: string;
  chainId: string;
}) => {
  const signingKey = new ethers.utils.SigningKey(signer.privateKey);
  const sharedKey = keccak256(signingKey.computeSharedSecret(publicKey));

  const derivedPrivateKey = privateKeyDerivationFunction({
    privateKey: sharedKey,
    gameId,
    turn,
    contractAddress,
    chainId,
  });
  return derivedPrivateKey;
};
