// file location: ./test/multiplier.test.ts

// @ts-ignore
import { buildPoseidon } from 'circomlibjs';
import { zkit } from 'hardhat'; // hardhat-zkit plugin
import { expect } from 'chai'; // chai-zkit extension
import { ProposalsIntegrity18 } from 'zk';
import { createInputs } from '../playbook/utils';

// import { Multiplier } from '@zkit'; // zktype circuit-object

describe('ProposalsIntegrity', () => {
  let poseidon: any;
  let circuit: ProposalsIntegrity18;
  const maxSize = 18;

  before(async () => {
    poseidon = await buildPoseidon();
    circuit = await zkit.getCircuit('ProposalsIntegrity18');
  });

  it('should verify proof if all players are active', async () => {
    const inputs = await createInputs({
      numActive: maxSize,
      proposals: Array(maxSize).fill(0n),
      commitmentRandomnesses: Array(maxSize).fill(1n),
    });
    const proof = await circuit.generateProof(inputs);
    await expect(circuit).to.verifyProof(proof);
  });

  it('should verify proof if only some players are active', async () => {
    const inputs = await createInputs({
      numActive: 5,
      proposals: Array(maxSize).fill(0n),
      commitmentRandomnesses: Array(maxSize).fill(10n),
    });
    const proof = await circuit.generateProof(inputs);
    await expect(circuit).to.verifyProof(proof);
  });

  it('should verify proof with single active player', async () => {
    const inputs = await createInputs({
      numActive: 1,
      proposals: Array(maxSize).fill(0n),
      commitmentRandomnesses: Array(maxSize).fill(1n),
    });
    const proof = await circuit.generateProof(inputs);
    await expect(circuit).to.verifyProof(proof);
  });

  it('should verify proof with custom proposal values', async () => {
    const proposals = Array(5)
      .fill(0n)
      .map((_, i) => BigInt(1000 + i));
    const inputs = await createInputs({
      numActive: 5,
      proposals,
      commitmentRandomnesses: Array(maxSize).fill(0n),
    });
    const proof = await circuit.generateProof(inputs);
    await expect(circuit).to.verifyProof(proof);
  });

  it('should verify proof with all zeros', async () => {
    const inputs = await createInputs({
      numActive: 0,
      proposals: Array(maxSize).fill(0n),
      commitmentRandomnesses: Array(maxSize).fill(1n),
    });
    const proof = await circuit.generateProof(inputs);
    await expect(circuit).to.verifyProof(proof);
  });
});
