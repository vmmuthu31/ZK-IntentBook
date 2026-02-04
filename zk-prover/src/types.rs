use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Intent {
    pub input_token: String,
    pub output_token: String,
    pub input_amount: u64,
    pub min_output_amount: u64,
    pub max_slippage_bps: u16,
    pub deadline: u64,
    pub user_address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Execution {
    pub intent_commitment: [u8; 32],
    pub pool_id: String,
    pub executed_input_amount: u64,
    pub executed_output_amount: u64,
    pub execution_price: u64,
    pub timestamp: u64,
    pub solver_address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicInputs {
    pub intent_commitment: [u8; 32],
    pub pool_id_hash: [u8; 32],
    pub executed_output_amount: u64,
    pub solver_address_hash: [u8; 32],
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofRequest {
    pub intent: Intent,
    pub execution: Execution,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofResponse {
    pub proof: Vec<u8>,
    pub public_inputs: PublicInputs,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyRequest {
    pub proof: Vec<u8>,
    pub public_inputs: PublicInputs,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VerifyResponse {
    pub valid: bool,
    pub error: Option<String>,
}

impl Intent {
    pub fn compute_commitment(&self) -> [u8; 32] {
        use sha2::{Digest, Sha256};
        
        let mut hasher = Sha256::new();
        hasher.update(self.input_token.as_bytes());
        hasher.update(self.output_token.as_bytes());
        hasher.update(self.input_amount.to_le_bytes());
        hasher.update(self.min_output_amount.to_le_bytes());
        hasher.update(self.max_slippage_bps.to_le_bytes());
        hasher.update(self.deadline.to_le_bytes());
        hasher.update(self.user_address.as_bytes());
        
        let first_hash = hasher.finalize();
        
        let mut second_hasher = Sha256::new();
        second_hasher.update(first_hash);
        
        second_hasher.finalize().into()
    }
}

impl Execution {
    pub fn validate_against_intent(&self, intent: &Intent) -> Result<(), String> {
        if self.executed_output_amount < intent.min_output_amount {
            return Err(format!(
                "Output amount {} is below minimum {}",
                self.executed_output_amount, intent.min_output_amount
            ));
        }

        if self.executed_input_amount > intent.input_amount {
            return Err(format!(
                "Input amount {} exceeds intent amount {}",
                self.executed_input_amount, intent.input_amount
            ));
        }

        let current_time = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);

        if self.timestamp > intent.deadline {
            return Err(format!(
                "Execution timestamp {} exceeds deadline {}",
                self.timestamp, intent.deadline
            ));
        }

        let expected_commitment = intent.compute_commitment();
        if self.intent_commitment != expected_commitment {
            return Err("Intent commitment mismatch".to_string());
        }

        Ok(())
    }
}
