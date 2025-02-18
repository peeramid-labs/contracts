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

/**
 * Returns a shared signer for a game
 * @param publicKey - Public key of the player
 * @param gameMaster - Game master
 * @param gameId - ID of the game
 * @param turn - Turn number
 * @param contractAddress - Address of the contract
 * @param chainId - Chain ID
 * @returns Shared signer
 */
export const sharedGameKeySigner = async ({
  publicKey,
  gameMaster,
  gameId,
  turn,
  contractAddress,
  chainId,
}: {
  publicKey: string;
  gameMaster: Wallet;
  gameId: BigNumberish;
  turn: BigNumberish;
  contractAddress: string;
  chainId: string;
}) => {
  return sharedSigner({
    publicKey,
    signer: new ethers.Wallet(
      await gameKey({
        gameId,
        contractAddress,
        gameMaster,
      }),
    ),
    gameId,
    turn,
    contractAddress,
    chainId,
  });
};

/**
 * Returns the game key for a game
 * @param gameId - ID of the game
 * @param contractAddress - Address of the contract
 * @param gameMaster - Game master
 * @returns Game key
 */
export const gameKey = async ({
  gameId,
  contractAddress,
  gameMaster,
}: {
  gameId: BigNumberish;
  contractAddress: string;
  gameMaster: Wallet;
}): Promise<string> => {
  const message = ethers.utils.solidityPack(['uint256', 'address', 'string'], [gameId, contractAddress, 'gameKey']);
  return gameMaster.signMessage(message).then(sig => keccak256(sig));
};
