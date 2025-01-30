pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

// Verify a single proposal
template ProposalIntegrity() {
    // Public inputs
    signal input commitment;

    // Private inputs
    signal input proposal;
    signal input commitmentRandomness;

    // Generate commitment and verify
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== proposal;
    commitmentHasher.inputs[1] <== commitmentRandomness;
    commitment === commitmentHasher.out;
}

// Verify multiple proposals in a single proof
template ProposalsIntegrity18(maxSize) {
    // Public inputs
    signal input commitmentHashes[maxSize];

    // Private inputs
    signal input proposals[maxSize];
    signal input commitmentRandomnesses[maxSize];

    // Declare components outside the loop
    component verifiers[maxSize];

    // Initialize components
    for (var i = 0; i < maxSize; i++) {
        verifiers[i] = ProposalIntegrity();
    }

    // Verify each proposal
    for (var i = 0; i < maxSize; i++) {
        // Connect signals directly
        verifiers[i].proposal <== proposals[i];
        verifiers[i].commitmentRandomness <== commitmentRandomnesses[i];
        verifiers[i].commitment <== commitmentHashes[i];
    }
}

component main {public [commitmentHashes]} = ProposalsIntegrity18(18);
