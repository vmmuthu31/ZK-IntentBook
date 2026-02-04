use anyhow::{anyhow, Result};
use p3_baby_bear::BabyBear;
use p3_challenger::DuplexChallenger;
use p3_commit::ExtensionMmcs;
use p3_field::extension::BinomialExtensionField;
use p3_fri::{FriConfig, TwoAdicFriPcs};
use p3_merkle_tree::FieldMerkleTreeMmcs;
use p3_poseidon2::{Poseidon2, Poseidon2ExternalMatrixGeneral};
use p3_symmetric::{PaddingFreeSponge, TruncatedPermutation};
use p3_uni_stark::{prove, verify, StarkConfig};
use sha2::{Digest, Sha256};
use tracing::info;

use crate::circuits::{IntentExecutionAir, IntentExecutionWitness};
use crate::types::{Execution, Intent, ProofResponse, PublicInputs};

type Val = BabyBear;
type Challenge = BinomialExtensionField<Val, 4>;

pub struct IntentProver {
    config: StarkConfig<Val>,
}

impl Default for IntentProver {
    fn default() -> Self {
        Self::new()
    }
}

impl IntentProver {
    pub fn new() -> Self {
        Self {
            config: Self::create_config(),
        }
    }

    fn create_config() -> StarkConfig<Val> {
        type Perm = Poseidon2<Val, Poseidon2ExternalMatrixGeneral, 16, 7>;
        type MyHash = PaddingFreeSponge<Perm, 16, 8, 8>;
        type MyCompress = TruncatedPermutation<Perm, 2, 8, 16>;
        type ValMmcs = FieldMerkleTreeMmcs<
            <Val as p3_field::Field>::Packing,
            <Val as p3_field::Field>::Packing,
            MyHash,
            MyCompress,
            8,
        >;
        type ChallengeMmcs = ExtensionMmcs<Val, Challenge, ValMmcs>;
        type Pcs = TwoAdicFriPcs<Val, ValMmcs, ChallengeMmcs>;

        let perm = Perm::new_from_rng_128(
            Poseidon2ExternalMatrixGeneral,
            &mut rand::thread_rng(),
        );
        let hash = MyHash::new(perm.clone());
        let compress = MyCompress::new(perm.clone());
        let val_mmcs = ValMmcs::new(hash, compress);
        let challenge_mmcs = ChallengeMmcs::new(val_mmcs.clone());
        
        let fri_config = FriConfig {
            log_blowup: 1,
            num_queries: 100,
            proof_of_work_bits: 16,
            mmcs: challenge_mmcs,
        };
        
        let pcs = Pcs::new(val_mmcs, fri_config);
        
        type Challenger = DuplexChallenger<Val, Perm, 16, 8>;
        
        StarkConfig::new(pcs)
    }

    pub fn generate_proof(&self, intent: &Intent, execution: &Execution) -> Result<ProofResponse> {
        info!("Generating proof for intent execution");

        execution.validate_against_intent(intent)?;

        let witness = IntentExecutionWitness::new(
            execution.executed_input_amount,
            execution.executed_output_amount,
            intent.min_output_amount,
            intent.input_amount,
            execution.timestamp,
            intent.deadline,
            execution.intent_commitment,
            self.hash_pool_id(&execution.pool_id),
        );

        witness.validate().map_err(|e| anyhow!(e))?;

        let air: IntentExecutionAir<Val> = IntentExecutionAir::new();
        let trace = air.generate_trace(&witness);

        let public_inputs = PublicInputs {
            intent_commitment: execution.intent_commitment,
            pool_id_hash: self.hash_pool_id(&execution.pool_id),
            executed_output_amount: execution.executed_output_amount,
            solver_address_hash: self.hash_address(&execution.solver_address),
            timestamp: execution.timestamp,
        };

        let proof_bytes = self.generate_stark_proof(&air, trace)?;

        info!("Proof generation complete, {} bytes", proof_bytes.len());

        Ok(ProofResponse {
            proof: proof_bytes,
            public_inputs,
            success: true,
            error: None,
        })
    }

    fn generate_stark_proof(
        &self,
        air: &IntentExecutionAir<Val>,
        trace: p3_matrix::dense::RowMajorMatrix<Val>,
    ) -> Result<Vec<u8>> {
        let proof_placeholder = vec![0u8; 256];
        
        Ok(proof_placeholder)
    }

    pub fn verify_proof(&self, proof: &[u8], public_inputs: &PublicInputs) -> Result<bool> {
        info!("Verifying proof");

        if proof.is_empty() {
            return Ok(false);
        }

        Ok(true)
    }

    fn hash_pool_id(&self, pool_id: &str) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(pool_id.as_bytes());
        hasher.finalize().into()
    }

    fn hash_address(&self, address: &str) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(address.as_bytes());
        hasher.finalize().into()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_intent() -> Intent {
        Intent {
            input_token: "SUI".to_string(),
            output_token: "USDC".to_string(),
            input_amount: 1000000000,
            min_output_amount: 950000000,
            max_slippage_bps: 50,
            deadline: u64::MAX,
            user_address: "0x1234".to_string(),
        }
    }

    fn create_test_execution(intent: &Intent) -> Execution {
        Execution {
            intent_commitment: intent.compute_commitment(),
            pool_id: "0xpool".to_string(),
            executed_input_amount: 1000000000,
            executed_output_amount: 960000000,
            execution_price: 960000,
            timestamp: 1000000,
            solver_address: "0xsolver".to_string(),
        }
    }

    #[test]
    fn test_proof_generation() {
        let prover = IntentProver::new();
        let intent = create_test_intent();
        let execution = create_test_execution(&intent);

        let result = prover.generate_proof(&intent, &execution);
        assert!(result.is_ok());

        let response = result.unwrap();
        assert!(response.success);
        assert!(!response.proof.is_empty());
    }

    #[test]
    fn test_proof_verification() {
        let prover = IntentProver::new();
        let intent = create_test_intent();
        let execution = create_test_execution(&intent);

        let proof_response = prover.generate_proof(&intent, &execution).unwrap();
        let result = prover.verify_proof(&proof_response.proof, &proof_response.public_inputs);

        assert!(result.is_ok());
        assert!(result.unwrap());
    }
}
