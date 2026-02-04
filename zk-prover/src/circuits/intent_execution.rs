use p3_air::{Air, AirBuilder, BaseAir};
use p3_field::{Field, PrimeField64};
use p3_matrix::dense::RowMajorMatrix;
use p3_matrix::Matrix;
use std::marker::PhantomData;

pub const NUM_COLS: usize = 16;

pub struct IntentExecutionAir<F> {
    _phantom: PhantomData<F>,
}

impl<F> Default for IntentExecutionAir<F> {
    fn default() -> Self {
        Self::new()
    }
}

impl<F> IntentExecutionAir<F> {
    pub fn new() -> Self {
        Self {
            _phantom: PhantomData,
        }
    }
}

impl<F: PrimeField64> IntentExecutionAir<F> {
    pub fn generate_trace(&self, witness: &IntentExecutionWitness) -> RowMajorMatrix<F> {
        let num_rows = 1 << 4;
        let mut values = vec![F::ZERO; num_rows * NUM_COLS];

        let input_amount = F::from_u64(witness.input_amount);
        let output_amount = F::from_u64(witness.output_amount);
        let min_output = F::from_u64(witness.min_output_amount);
        let max_input = F::from_u64(witness.max_input_amount);
        let timestamp = F::from_u64(witness.timestamp);
        let deadline = F::from_u64(witness.deadline);

        for i in 0..num_rows {
            let row_offset = i * NUM_COLS;

            values[row_offset] = input_amount;
            values[row_offset + 1] = output_amount;
            values[row_offset + 2] = min_output;
            values[row_offset + 3] = max_input;
            values[row_offset + 4] = timestamp;
            values[row_offset + 5] = deadline;

            for j in 0..8 {
                values[row_offset + 6 + j] = F::from_u64(
                    ((witness.commitment[j * 4] as u64) << 24)
                        | ((witness.commitment[j * 4 + 1] as u64) << 16)
                        | ((witness.commitment[j * 4 + 2] as u64) << 8)
                        | (witness.commitment[j * 4 + 3] as u64),
                );
            }

            let output_ok = if witness.output_amount >= witness.min_output_amount {
                F::ONE
            } else {
                F::ZERO
            };
            values[row_offset + 14] = output_ok;

            let input_ok = if witness.input_amount <= witness.max_input_amount {
                F::ONE
            } else {
                F::ZERO
            };
            values[row_offset + 15] = input_ok;
        }

        RowMajorMatrix::new(values, NUM_COLS)
    }
}

impl<F: Field> BaseAir<F> for IntentExecutionAir<F> {
    fn width(&self) -> usize {
        NUM_COLS
    }
}

impl<AB: AirBuilder> Air<AB> for IntentExecutionAir<AB::F>
where
    AB::F: Field,
{
    fn eval(&self, builder: &mut AB) {
        let main = builder.main();
        let local = main.row_slice(0);
        let local = local.expect("main trace should have at least one row");

        let input_amount = local[0];
        let output_amount = local[1];
        let min_output = local[2];
        let max_input = local[3];
        let _timestamp = local[4];
        let _deadline = local[5];
        let output_ok = local[14];
        let input_ok = local[15];

        builder.assert_bool(output_ok);
        builder.assert_bool(input_ok);

        let output_diff = output_amount - min_output;
        builder.when(output_ok).assert_zero(output_diff * (AB::Expr::ONE - output_ok));

        let input_diff = max_input - input_amount;
        builder.when(input_ok).assert_zero(input_diff * (AB::Expr::ONE - input_ok));

        builder.assert_one(output_ok);
        builder.assert_one(input_ok);
    }
}

#[derive(Debug, Clone)]
pub struct IntentExecutionWitness {
    pub input_amount: u64,
    pub output_amount: u64,
    pub min_output_amount: u64,
    pub max_input_amount: u64,
    pub timestamp: u64,
    pub deadline: u64,
    pub commitment: [u8; 32],
    pub pool_id_hash: [u8; 32],
}

impl IntentExecutionWitness {
    pub fn new(
        input_amount: u64,
        output_amount: u64,
        min_output_amount: u64,
        max_input_amount: u64,
        timestamp: u64,
        deadline: u64,
        commitment: [u8; 32],
        pool_id_hash: [u8; 32],
    ) -> Self {
        Self {
            input_amount,
            output_amount,
            min_output_amount,
            max_input_amount,
            timestamp,
            deadline,
            commitment,
            pool_id_hash,
        }
    }

    pub fn validate(&self) -> Result<(), String> {
        if self.output_amount < self.min_output_amount {
            return Err(format!(
                "Output {} below minimum {}",
                self.output_amount, self.min_output_amount
            ));
        }

        if self.input_amount > self.max_input_amount {
            return Err(format!(
                "Input {} exceeds maximum {}",
                self.input_amount, self.max_input_amount
            ));
        }

        if self.timestamp > self.deadline {
            return Err(format!(
                "Timestamp {} exceeds deadline {}",
                self.timestamp, self.deadline
            ));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use p3_baby_bear::BabyBear;

    #[test]
    fn test_witness_validation() {
        let witness = IntentExecutionWitness::new(
            1000,
            950,
            900,
            1000,
            1000000,
            2000000,
            [0u8; 32],
            [0u8; 32],
        );

        assert!(witness.validate().is_ok());
    }

    #[test]
    fn test_witness_validation_fails_output() {
        let witness = IntentExecutionWitness::new(
            1000,
            800,
            900,
            1000,
            1000000,
            2000000,
            [0u8; 32],
            [0u8; 32],
        );

        assert!(witness.validate().is_err());
    }

    #[test]
    fn test_trace_generation() {
        let air: IntentExecutionAir<BabyBear> = IntentExecutionAir::new();
        let witness = IntentExecutionWitness::new(
            1000,
            950,
            900,
            1000,
            1000000,
            2000000,
            [0u8; 32],
            [0u8; 32],
        );

        let trace = air.generate_trace(&witness);
        assert_eq!(trace.width(), NUM_COLS);
    }
}
