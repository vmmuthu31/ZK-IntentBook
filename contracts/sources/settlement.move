module zk_intentbook::settlement {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::clock::{Self, Clock};
    use std::vector;
    use std::type_name::{Self, TypeName};

    use zk_intentbook::intent_registry::{Self, IntentRegistry};
    use zk_intentbook::zk_verifier::{Self, VerifierConfig};

    const EInvalidProof: u64 = 1;
    const EIntentNotPending: u64 = 2;
    const EInsufficientBalance: u64 = 3;
    const ESlippageExceeded: u64 = 4;
    const EUnauthorized: u64 = 5;
    const ESettlementFailed: u64 = 6;

    const FEE_BPS: u64 = 30;
    const BPS_DENOMINATOR: u64 = 10000;

    public struct SettlementVault has key {
        id: UID,
        admin: address,
        referral_address: address,
        total_settlements: u64,
        total_volume: u64,
        total_fees_collected: u64,
    }

    public struct SettlementExecuted has copy, drop {
        commitment_hash: vector<u8>,
        solver: address,
        base_amount: u64,
        quote_amount: u64,
        execution_price: u64,
        fee_collected: u64,
    }

    public struct FeesClaimed has copy, drop {
        recipient: address,
        amount: u64,
        asset_type: TypeName,
    }

    fun init(ctx: &mut TxContext) {
        let vault = SettlementVault {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            referral_address: tx_context::sender(ctx),
            total_settlements: 0,
            total_volume: 0,
            total_fees_collected: 0,
        };
        transfer::share_object(vault);
    }

    public fun execute_verified_settlement<BaseAsset, QuoteAsset>(
        vault: &mut SettlementVault,
        registry: &mut IntentRegistry,
        verifier: &mut VerifierConfig,
        commitment_hash: vector<u8>,
        proof_bytes: vector<u8>,
        execution_price: u64,
        executed_size: u64,
        min_price: u64,
        max_price: u64,
        pool_id_bytes: vector<u8>,
        base_coin: Coin<BaseAsset>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): Coin<QuoteAsset> {
        assert!(intent_registry::is_intent_pending(registry, commitment_hash), EIntentNotPending);

        let intent = intent_registry::get_intent(registry, commitment_hash);
        let deadline = intent_registry::deadline(&intent);

        let proof_valid = zk_verifier::verify_execution(
            verifier,
            proof_bytes,
            commitment_hash,
            pool_id_bytes,
            execution_price,
            executed_size,
            min_price,
            max_price,
            deadline,
            ctx,
        );
        assert!(proof_valid, EInvalidProof);

        assert!(execution_price >= min_price, ESlippageExceeded);
        assert!(max_price == 0 || execution_price <= max_price, ESlippageExceeded);

        intent_registry::settle_intent(
            registry,
            commitment_hash,
            execution_price,
            executed_size,
            clock,
            ctx,
        );

        let base_amount = coin::value(&base_coin);
        let fee_amount = calculate_fee(base_amount);
        
        vault.total_settlements = vault.total_settlements + 1;
        vault.total_volume = vault.total_volume + base_amount;
        vault.total_fees_collected = vault.total_fees_collected + fee_amount;

        let quote_amount = (base_amount * execution_price) / 1_000_000_000;

        event::emit(SettlementExecuted {
            commitment_hash,
            solver: tx_context::sender(ctx),
            base_amount,
            quote_amount,
            execution_price,
            fee_collected: fee_amount,
        });

        transfer::public_transfer(base_coin, vault.referral_address);
        coin::zero<QuoteAsset>(ctx)
    }

    public fun execute_simple_settlement<BaseAsset, QuoteAsset>(
        vault: &mut SettlementVault,
        registry: &mut IntentRegistry,
        commitment_hash: vector<u8>,
        execution_price: u64,
        executed_size: u64,
        base_coin: Coin<BaseAsset>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): Coin<QuoteAsset> {
        assert!(intent_registry::is_intent_pending(registry, commitment_hash), EIntentNotPending);

        intent_registry::settle_intent(
            registry,
            commitment_hash,
            execution_price,
            executed_size,
            clock,
            ctx,
        );

        let base_amount = coin::value(&base_coin);
        let fee_amount = calculate_fee(base_amount);
        
        vault.total_settlements = vault.total_settlements + 1;
        vault.total_volume = vault.total_volume + base_amount;
        vault.total_fees_collected = vault.total_fees_collected + fee_amount;

        let quote_amount = (base_amount * execution_price) / 1_000_000_000;

        event::emit(SettlementExecuted {
            commitment_hash,
            solver: tx_context::sender(ctx),
            base_amount,
            quote_amount,
            execution_price,
            fee_collected: fee_amount,
        });

        transfer::public_transfer(base_coin, vault.referral_address);
        coin::zero<QuoteAsset>(ctx)
    }

    public fun set_referral_address(
        vault: &mut SettlementVault,
        new_address: address,
        ctx: &TxContext,
    ) {
        assert!(vault.admin == tx_context::sender(ctx), EUnauthorized);
        vault.referral_address = new_address;
    }

    public fun update_admin(
        vault: &mut SettlementVault,
        new_admin: address,
        ctx: &TxContext,
    ) {
        assert!(vault.admin == tx_context::sender(ctx), EUnauthorized);
        vault.admin = new_admin;
    }

    fun calculate_fee(amount: u64): u64 {
        (amount * FEE_BPS) / BPS_DENOMINATOR
    }

    public fun total_settlements(vault: &SettlementVault): u64 {
        vault.total_settlements
    }

    public fun total_volume(vault: &SettlementVault): u64 {
        vault.total_volume
    }

    public fun total_fees_collected(vault: &SettlementVault): u64 {
        vault.total_fees_collected
    }

    public fun referral_address(vault: &SettlementVault): address {
        vault.referral_address
    }

    public fun fee_rate_bps(): u64 {
        FEE_BPS
    }
}
