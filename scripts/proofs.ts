import { buildPoseidon } from 'circomlibjs';
import { BigNumber, BigNumberish, BytesLike, TypedDataField, Wallet, ethers, utils } from 'ethers';
import { SignerIdentity } from '../playbook/utils';
import { PrivateProposalsIntegrity15Groth16 } from 'zk';

// Helper to create test inputs
export const createInputs = async ({
  numActive,
  proposals,
  commitmentRandomnesses,
  gameId,
  turn,
  verifierAddress,
  chainId,
  gm,
}: {
  numActive: number;
  proposals: bigint[];
  commitmentRandomnesses: bigint[];
  gameId: BigNumberish;
  turn: BigNumberish;
  verifierAddress: string;
  chainId: BigNumberish;
  gm: Wallet;
}): Promise<PrivateProposalsIntegrity15Groth16> => {
  const poseidon = await buildPoseidon();
  const maxSize = 15;

  // Initialize arrays with zeros
  const commitments: bigint[] = Array(maxSize).fill(0n);
  const randomnesses: bigint[] = Array(maxSize).fill(0n);
  const permutedProposals: bigint[] = Array(maxSize).fill(0n);

  // Generate deterministic permutation
  const { permutation, permutationRandomness, permutationCommitment } = await generateDeterministicPermutation({
    gameId,
    turn,
    verifierAddress,
    chainId,
    gm,
    size: numActive,
  });

  // Fill arrays with values
  for (let i = 0; i < maxSize; i++) {
    if (i < numActive) {
      // Active slots
      const proposal = proposals[i];
      const randomness = commitmentRandomnesses[i];
      const hash = poseidon([proposal, randomness]);
      commitments[i] = BigInt(poseidon.F.toObject(hash));
      randomnesses[i] = randomness;
      // Store proposal in permuted position
      //   permutedProposals[permutation[i]] = proposal;
      permutedProposals[i] = proposals[permutation[i]];
    } else {
      // Inactive slots
      const hash = poseidon([0n, 0n]);
      commitments[i] = BigInt(poseidon.F.toObject(hash));
      randomnesses[i] = 0n;
      // permutedProposals already 0n
    }
  }

  return {
    numActive: BigInt(numActive),
    commitments,
    permutedProposals,
    permutationCommitment,
    permutation,
    randomnesses,
    permutationRandomness,
  };
};
// Generate deterministic permutation based on game parameters and GM's secret
export const generateDeterministicPermutation = async ({
  gameId,
  turn,
  verifierAddress,
  chainId,
  gm,
  size = 15,
}: {
  gameId: BigNumberish;
  turn: BigNumberish;
  verifierAddress: string;
  chainId: BigNumberish;
  gm: SignerIdentity | Wallet;
  size?: number;
}): Promise<{
  permutation: number[];
  permutationRandomness: bigint;
  permutationCommitment: bigint;
}> => {
  const maxSize = 15;
  // Create deterministic seed from game parameters and GM's signature
  const message = utils.solidityKeccak256(
    ['uint256', 'uint256', 'address', 'uint256'],
    [gameId, turn, verifierAddress, chainId],
  );
  const signature = await ('_signTypedData' in gm ? gm : gm.wallet).signMessage(message);
  const seed = utils.keccak256(signature);

  // Use the seed to generate permutation
  const permutation: number[] = Array.from({ length: maxSize }, (_, i) => i);
  const permutationRandomness = BigInt(seed);

  // Fisher-Yates shuffle with deterministic randomness
  for (let i = size - 1; i >= 0; i--) {
    // Generate deterministic random number for this position
    const randHash = utils.keccak256(utils.toUtf8Bytes(seed + i.toString()));
    const rand = BigInt(randHash);
    const j = Number(rand % BigInt(i + 1));

    // Swap elements
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }

  // Ensure inactive slots map to themselves
  for (let i = size; i < maxSize; i++) {
    permutation[i] = i;
  }

  // Generate commitment
  const poseidon = await buildPoseidon();
  const permutationCommitment = BigInt(
    poseidon.F.toObject(poseidon([...permutation.map(BigInt), permutationRandomness])),
  );

  return {
    permutation,
    permutationRandomness,
    permutationCommitment,
  };
};
