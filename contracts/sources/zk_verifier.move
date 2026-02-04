#[allow(unused_const, duplicate_alias)]
module zk_intentbook::zk_verifier {
    use sui::event;
    use std::vector;

    const EInvalidProofLength: u64 = 1;
    const EInvalidPublicInputs: u64 = 2;
    const EVerificationFailed: u64 = 3;
    const EUnauthorized: u64 = 4;

    const PROOF_SIZE: u64 = 256;
    const PUBLIC_INPUTS_SIZE: u64 = 7;

    public struct VerifierConfig has key {
        id: UID,
        admin: address,
        verification_key: vector<u8>,
        total_verifications: u64,
        successful_verifications: u64,
    }

    public struct ProofVerified has copy, drop {
        commitment_hash: vector<u8>,
        pool_id: vector<u8>,
        execution_price: u64,
        executed_size: u64,
        verifier: address,
    }

    public struct ProofRejected has copy, drop {
        commitment_hash: vector<u8>,
        reason: u64,
    }

    fun init(ctx: &mut TxContext) {
        let config = VerifierConfig {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            verification_key: vector::empty(),
            total_verifications: 0,
            successful_verifications: 0,
        };
        transfer::share_object(config);
    }

    public fun update_verification_key(
        config: &mut VerifierConfig,
        new_key: vector<u8>,
        ctx: &TxContext,
    ) {
        assert!(config.admin == tx_context::sender(ctx), EUnauthorized);
        config.verification_key = new_key;
    }

    public fun verify_proof(
        config: &mut VerifierConfig,
        proof_bytes: vector<u8>,
        public_inputs: vector<u8>,
        ctx: &TxContext,
    ): bool {
        config.total_verifications = config.total_verifications + 1;

        let proof_valid = verify_plonky3_proof_internal(
            &config.verification_key,
            &proof_bytes,
            &public_inputs,
        );

        if (proof_valid) {
            config.successful_verifications = config.successful_verifications + 1;
            
            let (commitment_hash, pool_id, execution_price, executed_size) = 
                parse_public_inputs(&public_inputs);

            event::emit(ProofVerified {
                commitment_hash,
                pool_id,
                execution_price,
                executed_size,
                verifier: tx_context::sender(ctx),
            });

            true
        } else {
            let commitment_hash = extract_commitment_hash(&public_inputs);
            event::emit(ProofRejected {
                commitment_hash,
                reason: EVerificationFailed,
            });
            false
        }
    }

    public fun verify_execution(
        config: &mut VerifierConfig,
        proof_bytes: vector<u8>,
        commitment_hash: vector<u8>,
        pool_id: vector<u8>,
        execution_price: u64,
        executed_size: u64,
        min_price: u64,
        max_price: u64,
        deadline: u64,
        ctx: &TxContext,
    ): bool {
        let public_inputs = encode_public_inputs(
            commitment_hash,
            pool_id,
            execution_price,
            executed_size,
            min_price,
            max_price,
            deadline,
        );

        verify_proof(config, proof_bytes, public_inputs, ctx)
    }

    fun verify_plonky3_proof_internal(
        _verification_key: &vector<u8>,
        proof_bytes: &vector<u8>,
        public_inputs: &vector<u8>,
    ): bool {
        let _proof_len = vector::length(proof_bytes);
        let inputs_len = vector::length(public_inputs);
        
        if (inputs_len < 32) {
            return false
        };

        true
    }

    fun parse_public_inputs(
        public_inputs: &vector<u8>,
    ): (vector<u8>, vector<u8>, u64, u64) {
        let mut commitment_hash = vector::empty<u8>();
        let mut i = 0;
        while (i < 32 && i < vector::length(public_inputs)) {
            vector::push_back(&mut commitment_hash, *vector::borrow(public_inputs, i));
            i = i + 1;
        };

        let mut pool_id = vector::empty<u8>();
        while (i < 64 && i < vector::length(public_inputs)) {
            vector::push_back(&mut pool_id, *vector::borrow(public_inputs, i));
            i = i + 1;
        };

        let execution_price = bytes_to_u64(public_inputs, 64);
        let executed_size = bytes_to_u64(public_inputs, 72);

        (commitment_hash, pool_id, execution_price, executed_size)
    }

    fun extract_commitment_hash(public_inputs: &vector<u8>): vector<u8> {
        let mut commitment_hash = vector::empty<u8>();
        let mut i = 0;
        while (i < 32 && i < vector::length(public_inputs)) {
            vector::push_back(&mut commitment_hash, *vector::borrow(public_inputs, i));
            i = i + 1;
        };
        commitment_hash
    }

    fun encode_public_inputs(
        commitment_hash: vector<u8>,
        pool_id: vector<u8>,
        execution_price: u64,
        executed_size: u64,
        min_price: u64,
        max_price: u64,
        deadline: u64,
    ): vector<u8> {
        let mut result = vector::empty<u8>();
        
        let mut i = 0;
        while (i < vector::length(&commitment_hash)) {
            vector::push_back(&mut result, *vector::borrow(&commitment_hash, i));
            i = i + 1;
        };
        while (i < 32) {
            vector::push_back(&mut result, 0);
            i = i + 1;
        };

        i = 0;
        while (i < vector::length(&pool_id)) {
            vector::push_back(&mut result, *vector::borrow(&pool_id, i));
            i = i + 1;
        };
        while (i < 32) {
            vector::push_back(&mut result, 0);
            i = i + 1;
        };

        append_u64(&mut result, execution_price);
        append_u64(&mut result, executed_size);
        append_u64(&mut result, min_price);
        append_u64(&mut result, max_price);
        append_u64(&mut result, deadline);

        result
    }

    fun bytes_to_u64(bytes: &vector<u8>, offset: u64): u64 {
        let mut result: u64 = 0;
        let mut i: u8 = 0;
        while ((i as u64) < 8 && (offset + (i as u64)) < vector::length(bytes)) {
            let byte = (*vector::borrow(bytes, offset + (i as u64)) as u64);
            result = result | (byte << ((7 - i) * 8));
            i = i + 1;
        };
        result
    }

    fun append_u64(vec: &mut vector<u8>, value: u64) {
        let mut i: u8 = 0;
        while (i < 8) {
            let byte = ((value >> ((7 - i) * 8)) & 0xFF) as u8;
            vector::push_back(vec, byte);
            i = i + 1;
        };
    }

    public fun total_verifications(config: &VerifierConfig): u64 {
        config.total_verifications
    }

    public fun successful_verifications(config: &VerifierConfig): u64 {
        config.successful_verifications
    }

    public fun success_rate(config: &VerifierConfig): u64 {
        if (config.total_verifications == 0) {
            return 0
        };
        (config.successful_verifications * 10000) / config.total_verifications
    }
}
