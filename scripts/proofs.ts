import { buildPoseidon } from 'circomlibjs';
import { BigNumberish, Wallet, ethers, utils } from 'ethers';
import { ProposalSubmission, SignerIdentity } from '../playbook/utils';
import { PrivateProposalsIntegrity15Groth16, ProofProposalsIntegrity15Groth16 } from 'zk';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
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
  const { permutation, secret, commitment } = await generateDeterministicPermutation({
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
      permutedProposals[permutation[i]] = proposal;
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
    permutationCommitment: commitment,
    permutation,
    randomnesses,
    permutationRandomness: secret,
  };
};

const getSeed = async ({
  gameId,
  turn,
  verifierAddress,
  chainId,
  gm,
}: {
  gameId: BigNumberish;
  turn: BigNumberish;
  verifierAddress: string;
  chainId: BigNumberish;
  gm: SignerIdentity | Wallet;
}): Promise<bigint> => {
  const message = utils.solidityKeccak256(
    ['uint256', 'uint256', 'address', 'uint256'],
    [gameId, turn, verifierAddress, chainId],
  );
  const signature = await ('_signTypedData' in gm ? gm : gm.wallet).signMessage(message);
  const seed = utils.keccak256(signature);

  return BigInt(seed);
};
const cachedProofs = new Map<string, ProofProposalsIntegrity15Groth16>();
export const generateEndTurnIntegrity = async ({
  gameId,
  turn,
  verifierAddress,
  chainId,
  gm,
  size = 15,
  proposals,
  hre,
}: {
  gameId: BigNumberish;
  turn: BigNumberish;
  verifierAddress: string;
  chainId: BigNumberish;
  gm: Wallet;
  size?: number;
  proposals: ProposalSubmission[];
  hre: HardhatRuntimeEnvironment;
}) => {
  const maxSize = 15;

  const { permutation, secret: nullifier } = await generateDeterministicPermutation({
    gameId,
    turn: Number(turn) - 1,
    verifierAddress,
    chainId,
    gm,
    size,
  });

  const inputs = await createInputs({
    numActive: size,
    proposals: proposals.map(proposal => proposal.proposalValue),
    commitmentRandomnesses: proposals.map(proposal => proposal.randomnessValue),
    gameId,
    turn,
    verifierAddress,
    chainId: await hre.getChainId(),
    gm,
  });

  // Apply permutation to proposals array
  const permutedProposals = [...proposals];
  for (let i = 0; i < maxSize; i++) {
    if (i < size) {
      permutedProposals[inputs.permutation[i]] = proposals[i];
    }
  }

  const circuit = await hre.zkit.getCircuit('ProposalsIntegrity15');
  const inputsKey = ethers.utils.solidityKeccak256(['string'], [JSON.stringify(inputs)]);
  if (!cachedProofs.has(inputsKey)) {
    const proof = await circuit.generateProof(inputs);
    cachedProofs.set(inputsKey, proof);
  }
  const proof = cachedProofs.get(inputsKey);
  if (!proof) {
    throw new Error('Proof not found');
  }
  const callData = await circuit.generateCalldata(proof);

  return {
    commitment: inputs.permutationCommitment,
    nullifier,
    permutation: permutation.slice(0, size),
    permutedProposals: permutedProposals.map(proposal => proposal.proposal),
    a: callData[0],
    b: callData[1],
    c: callData[2],
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
  gm: Wallet;
  size?: number;
}): Promise<{
  permutation: number[];
  secret: bigint;
  commitment: bigint;
}> => {
  const maxSize = 15;
  // Create deterministic seed from game parameters and GM's signature

  // Use the seed to generate permutation
  const permutation: number[] = Array.from({ length: maxSize }, (_, i) => i);

  // This is kept secret to generate witness
  const secret = await getSeed({ gameId, turn, verifierAddress, chainId, gm });

  // Fisher-Yates shuffle with deterministic randomness
  for (let i = size - 1; i >= 0; i--) {
    // Generate deterministic random number for this position
    const randHash = utils.keccak256(utils.toUtf8Bytes(secret + i.toString()));
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
  const PoseidonFirst = BigInt(
    poseidon.F.toObject(poseidon([permutation[0], permutation[1], permutation[2], permutation[3], permutation[4]])),
  );
  const PoseidonSecond = BigInt(
    poseidon.F.toObject(
      poseidon([PoseidonFirst, permutation[5], permutation[6], permutation[7], permutation[8], permutation[9]]),
    ),
  );
  const PoseidonThird = BigInt(
    poseidon.F.toObject(
      poseidon([PoseidonSecond, permutation[10], permutation[11], permutation[12], permutation[13], permutation[14]]),
    ),
  );

  const commitment = BigInt(poseidon.F.toObject(poseidon([PoseidonThird, secret])));

  return {
    permutation,
    secret,
    commitment,
  };
};
