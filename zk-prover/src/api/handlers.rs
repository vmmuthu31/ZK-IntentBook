use axum::{
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Serialize;
use tracing::{error, info};

use crate::prover::IntentProver;
use crate::types::{ProofRequest, ProofResponse, VerifyRequest, VerifyResponse};

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub version: String,
}

pub async fn health_check() -> impl IntoResponse {
    Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

pub async fn generate_proof(Json(request): Json<ProofRequest>) -> impl IntoResponse {
    info!(
        "Received proof request for intent: {} -> {}",
        request.intent.input_token, request.intent.output_token
    );

    let prover = IntentProver::new();

    match prover.generate_proof(&request.intent, &request.execution) {
        Ok(response) => (StatusCode::OK, Json(response)),
        Err(e) => {
            error!("Proof generation failed: {}", e);
            (
                StatusCode::BAD_REQUEST,
                Json(ProofResponse {
                    proof: vec![],
                    public_inputs: crate::types::PublicInputs {
                        intent_commitment: [0u8; 32],
                        pool_id_hash: [0u8; 32],
                        executed_output_amount: 0,
                        solver_address_hash: [0u8; 32],
                        timestamp: 0,
                    },
                    success: false,
                    error: Some(e.to_string()),
                }),
            )
        }
    }
}

pub async fn verify_proof(Json(request): Json<VerifyRequest>) -> impl IntoResponse {
    info!("Received verification request");

    let prover = IntentProver::new();

    match prover.verify_proof(&request.proof, &request.public_inputs) {
        Ok(valid) => (
            StatusCode::OK,
            Json(VerifyResponse { valid, error: None }),
        ),
        Err(e) => {
            error!("Proof verification failed: {}", e);
            (
                StatusCode::BAD_REQUEST,
                Json(VerifyResponse {
                    valid: false,
                    error: Some(e.to_string()),
                }),
            )
        }
    }
}
