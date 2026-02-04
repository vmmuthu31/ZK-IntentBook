#[allow(unused_const, unused_field)]
module zk_intentbook::lending_pool {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::clock::Clock;
    use sui::table::{Self, Table};
    use sui::math;
    use std::type_name::{Self, TypeName};

    const EInsufficientCollateral: u64 = 1;
    const EInsufficientLiquidity: u64 = 2;
    const EPositionNotLiquidatable: u64 = 3;
    const EInvalidLTV: u64 = 4;
    const EPoolNotActive: u64 = 5;
    const EUnauthorized: u64 = 6;
    const EZeroAmount: u64 = 7;
    const EPositionNotFound: u64 = 8;
    const EMaxUtilizationExceeded: u64 = 9;

    const PRECISION: u64 = 1_000_000_000;
    const SECONDS_PER_YEAR: u64 = 31_536_000;
    const MAX_UTILIZATION_BPS: u64 = 9500;
    const LIQUIDATION_BONUS_BPS: u64 = 500;
    const PROTOCOL_FEE_BPS: u64 = 1000;

    public struct LendingPool<phantom BaseAsset, phantom QuoteAsset> has key {
        id: UID,
        base_balance: Balance<BaseAsset>,
        quote_balance: Balance<QuoteAsset>,
        total_base_deposited: u64,
        total_quote_deposited: u64,
        total_base_borrowed: u64,
        total_quote_borrowed: u64,
        base_interest_index: u64,
        quote_interest_index: u64,
        last_update_timestamp: u64,
        base_ltv_bps: u64,
        quote_ltv_bps: u64,
        liquidation_threshold_bps: u64,
        base_interest_rate_model: InterestRateModel,
        quote_interest_rate_model: InterestRateModel,
        is_active: bool,
        admin: address,
    }

    public struct InterestRateModel has store, copy, drop {
        base_rate_bps: u64,
        multiplier_bps: u64,
        jump_multiplier_bps: u64,
        optimal_utilization_bps: u64,
    }

    public struct LendingPosition has key, store {
        id: UID,
        owner: address,
        pool_id: ID,
        base_deposited: u64,
        quote_deposited: u64,
        base_borrowed: u64,
        quote_borrowed: u64,
        base_interest_index_at_open: u64,
        quote_interest_index_at_open: u64,
        created_at: u64,
        last_updated: u64,
    }

    public struct PoolCreated has copy, drop {
        pool_id: ID,
        base_asset: TypeName,
        quote_asset: TypeName,
        base_ltv_bps: u64,
        quote_ltv_bps: u64,
    }

    public struct Deposited has copy, drop {
        pool_id: ID,
        depositor: address,
        asset_type: TypeName,
        amount: u64,
    }

    public struct Borrowed has copy, drop {
        pool_id: ID,
        borrower: address,
        asset_type: TypeName,
        amount: u64,
        collateral_value: u64,
    }

    public struct Repaid has copy, drop {
        pool_id: ID,
        borrower: address,
        asset_type: TypeName,
        amount: u64,
        interest_paid: u64,
    }

    public struct Liquidated has copy, drop {
        pool_id: ID,
        position_owner: address,
        liquidator: address,
        collateral_seized: u64,
        debt_repaid: u64,
        bonus_paid: u64,
    }

    public struct Withdrawn has copy, drop {
        pool_id: ID,
        withdrawer: address,
        asset_type: TypeName,
        amount: u64,
    }

    public fun create_pool<BaseAsset, QuoteAsset>(
        base_ltv_bps: u64,
        quote_ltv_bps: u64,
        liquidation_threshold_bps: u64,
        ctx: &mut TxContext,
    ): LendingPool<BaseAsset, QuoteAsset> {
        assert!(base_ltv_bps <= 8500, EInvalidLTV);
        assert!(quote_ltv_bps <= 8500, EInvalidLTV);
        assert!(liquidation_threshold_bps > base_ltv_bps, EInvalidLTV);
        assert!(liquidation_threshold_bps > quote_ltv_bps, EInvalidLTV);

        let base_model = InterestRateModel {
            base_rate_bps: 200,
            multiplier_bps: 1000,
            jump_multiplier_bps: 5000,
            optimal_utilization_bps: 8000,
        };

        let quote_model = InterestRateModel {
            base_rate_bps: 100,
            multiplier_bps: 800,
            jump_multiplier_bps: 4000,
            optimal_utilization_bps: 8500,
        };

        let pool = LendingPool {
            id: object::new(ctx),
            base_balance: balance::zero<BaseAsset>(),
            quote_balance: balance::zero<QuoteAsset>(),
            total_base_deposited: 0,
            total_quote_deposited: 0,
            total_base_borrowed: 0,
            total_quote_borrowed: 0,
            base_interest_index: PRECISION,
            quote_interest_index: PRECISION,
            last_update_timestamp: 0,
            base_ltv_bps,
            quote_ltv_bps,
            liquidation_threshold_bps,
            base_interest_rate_model: base_model,
            quote_interest_rate_model: quote_model,
            is_active: true,
            admin: tx_context::sender(ctx),
        };

        event::emit(PoolCreated {
            pool_id: object::id(&pool),
            base_asset: type_name::get<BaseAsset>(),
            quote_asset: type_name::get<QuoteAsset>(),
            base_ltv_bps,
            quote_ltv_bps,
        });

        pool
    }

    public fun deposit_base<BaseAsset, QuoteAsset>(
        pool: &mut LendingPool<BaseAsset, QuoteAsset>,
        position: &mut LendingPosition,
        coin: Coin<BaseAsset>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(pool.is_active, EPoolNotActive);

        let amount = coin::value(&coin);
        assert!(amount > 0, EZeroAmount);

        accrue_interest(pool, clock);

        balance::join(&mut pool.base_balance, coin::into_balance(coin));
        pool.total_base_deposited = pool.total_base_deposited + amount;
        position.base_deposited = position.base_deposited + amount;
        position.last_updated = sui::clock::timestamp_ms(clock) / 1000;

        event::emit(Deposited {
            pool_id: object::id(pool),
            depositor: tx_context::sender(ctx),
            asset_type: type_name::get<BaseAsset>(),
            amount,
        });
    }

    public fun deposit_quote<BaseAsset, QuoteAsset>(
        pool: &mut LendingPool<BaseAsset, QuoteAsset>,
        position: &mut LendingPosition,
        coin: Coin<QuoteAsset>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(pool.is_active, EPoolNotActive);

        let amount = coin::value(&coin);
        assert!(amount > 0, EZeroAmount);

        accrue_interest(pool, clock);

        balance::join(&mut pool.quote_balance, coin::into_balance(coin));
        pool.total_quote_deposited = pool.total_quote_deposited + amount;
        position.quote_deposited = position.quote_deposited + amount;
        position.last_updated = sui::clock::timestamp_ms(clock) / 1000;

        event::emit(Deposited {
            pool_id: object::id(pool),
            depositor: tx_context::sender(ctx),
            asset_type: type_name::get<QuoteAsset>(),
            amount,
        });
    }

    public fun borrow_quote<BaseAsset, QuoteAsset>(
        pool: &mut LendingPool<BaseAsset, QuoteAsset>,
        position: &mut LendingPosition,
        amount: u64,
        base_price: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ): Coin<QuoteAsset> {
        assert!(pool.is_active, EPoolNotActive);
        assert!(amount > 0, EZeroAmount);
        assert!(position.owner == tx_context::sender(ctx), EUnauthorized);

        accrue_interest(pool, clock);

        let collateral_value = (position.base_deposited as u128) * (base_price as u128) / (PRECISION as u128);
        let max_borrow = (collateral_value as u128) * (pool.base_ltv_bps as u128) / 10000;
        let current_debt = position.quote_borrowed;
        let new_debt = current_debt + amount;

        assert!((new_debt as u128) <= max_borrow, EInsufficientCollateral);

        let available = balance::value(&pool.quote_balance);
        assert!(available >= amount, EInsufficientLiquidity);

        let utilization_after = calculate_utilization(
            pool.total_quote_borrowed + amount,
            pool.total_quote_deposited
        );
        assert!(utilization_after <= MAX_UTILIZATION_BPS, EMaxUtilizationExceeded);

        pool.total_quote_borrowed = pool.total_quote_borrowed + amount;
        position.quote_borrowed = new_debt;
        position.quote_interest_index_at_open = pool.quote_interest_index;
        position.last_updated = sui::clock::timestamp_ms(clock) / 1000;

        event::emit(Borrowed {
            pool_id: object::id(pool),
            borrower: tx_context::sender(ctx),
            asset_type: type_name::get<QuoteAsset>(),
            amount,
            collateral_value: (collateral_value as u64),
        });

        coin::from_balance(balance::split(&mut pool.quote_balance, amount), ctx)
    }

    public fun repay_quote<BaseAsset, QuoteAsset>(
        pool: &mut LendingPool<BaseAsset, QuoteAsset>,
        position: &mut LendingPosition,
        coin: Coin<QuoteAsset>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): u64 {
        assert!(pool.is_active, EPoolNotActive);

        let amount = coin::value(&coin);
        assert!(amount > 0, EZeroAmount);

        accrue_interest(pool, clock);

        let interest_owed = calculate_interest_owed(
            position.quote_borrowed,
            position.quote_interest_index_at_open,
            pool.quote_interest_index
        );

        let total_owed = position.quote_borrowed + interest_owed;
        let repay_amount = if (amount > total_owed) { total_owed } else { amount };

        let interest_paid = if (repay_amount > position.quote_borrowed) {
            repay_amount - position.quote_borrowed
        } else {
            0
        };

        let principal_paid = repay_amount - interest_paid;

        balance::join(&mut pool.quote_balance, coin::into_balance(coin));
        pool.total_quote_borrowed = pool.total_quote_borrowed - principal_paid;
        position.quote_borrowed = position.quote_borrowed - principal_paid;
        position.quote_interest_index_at_open = pool.quote_interest_index;
        position.last_updated = sui::clock::timestamp_ms(clock) / 1000;

        event::emit(Repaid {
            pool_id: object::id(pool),
            borrower: tx_context::sender(ctx),
            asset_type: type_name::get<QuoteAsset>(),
            amount: repay_amount,
            interest_paid,
        });

        interest_paid
    }

    public fun liquidate<BaseAsset, QuoteAsset>(
        pool: &mut LendingPool<BaseAsset, QuoteAsset>,
        position: &mut LendingPosition,
        repay_coin: Coin<QuoteAsset>,
        base_price: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ): Coin<BaseAsset> {
        assert!(pool.is_active, EPoolNotActive);

        accrue_interest(pool, clock);

        let collateral_value = (position.base_deposited as u128) * (base_price as u128) / (PRECISION as u128);
        let debt_value = (position.quote_borrowed as u128);

        let health_factor = if (debt_value > 0) {
            (collateral_value * 10000) / (debt_value * (pool.liquidation_threshold_bps as u128))
        } else {
            PRECISION as u128
        };

        assert!((health_factor as u64) < PRECISION, EPositionNotLiquidatable);

        let repay_amount = coin::value(&repay_coin);
        let max_repay = (position.quote_borrowed * 50) / 100;
        let actual_repay = if (repay_amount > max_repay) { max_repay } else { repay_amount };

        let collateral_to_seize = (actual_repay as u128) * (PRECISION as u128) / (base_price as u128);
        let bonus = (collateral_to_seize * (LIQUIDATION_BONUS_BPS as u128)) / 10000;
        let total_seize = ((collateral_to_seize + bonus) as u64);

        let seize_amount = if (total_seize > position.base_deposited) {
            position.base_deposited
        } else {
            total_seize
        };

        balance::join(&mut pool.quote_balance, coin::into_balance(repay_coin));
        pool.total_quote_borrowed = pool.total_quote_borrowed - actual_repay;
        position.quote_borrowed = position.quote_borrowed - actual_repay;
        position.base_deposited = position.base_deposited - seize_amount;
        pool.total_base_deposited = pool.total_base_deposited - seize_amount;
        position.last_updated = sui::clock::timestamp_ms(clock) / 1000;

        event::emit(Liquidated {
            pool_id: object::id(pool),
            position_owner: position.owner,
            liquidator: tx_context::sender(ctx),
            collateral_seized: seize_amount,
            debt_repaid: actual_repay,
            bonus_paid: (bonus as u64),
        });

        coin::from_balance(balance::split(&mut pool.base_balance, seize_amount), ctx)
    }

    public fun withdraw_base<BaseAsset, QuoteAsset>(
        pool: &mut LendingPool<BaseAsset, QuoteAsset>,
        position: &mut LendingPosition,
        amount: u64,
        base_price: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ): Coin<BaseAsset> {
        assert!(pool.is_active, EPoolNotActive);
        assert!(position.owner == tx_context::sender(ctx), EUnauthorized);
        assert!(amount > 0, EZeroAmount);
        assert!(amount <= position.base_deposited, EInsufficientCollateral);

        accrue_interest(pool, clock);

        let remaining_collateral = position.base_deposited - amount;
        let collateral_value = (remaining_collateral as u128) * (base_price as u128) / (PRECISION as u128);
        let max_debt = (collateral_value as u128) * (pool.base_ltv_bps as u128) / 10000;

        assert!((position.quote_borrowed as u128) <= max_debt, EInsufficientCollateral);

        pool.total_base_deposited = pool.total_base_deposited - amount;
        position.base_deposited = remaining_collateral;
        position.last_updated = sui::clock::timestamp_ms(clock) / 1000;

        event::emit(Withdrawn {
            pool_id: object::id(pool),
            withdrawer: tx_context::sender(ctx),
            asset_type: type_name::get<BaseAsset>(),
            amount,
        });

        coin::from_balance(balance::split(&mut pool.base_balance, amount), ctx)
    }

    public fun create_position<BaseAsset, QuoteAsset>(
        pool: &LendingPool<BaseAsset, QuoteAsset>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): LendingPosition {
        let now = sui::clock::timestamp_ms(clock) / 1000;

        LendingPosition {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            pool_id: object::id(pool),
            base_deposited: 0,
            quote_deposited: 0,
            base_borrowed: 0,
            quote_borrowed: 0,
            base_interest_index_at_open: pool.base_interest_index,
            quote_interest_index_at_open: pool.quote_interest_index,
            created_at: now,
            last_updated: now,
        }
    }

    fun accrue_interest<BaseAsset, QuoteAsset>(
        pool: &mut LendingPool<BaseAsset, QuoteAsset>,
        clock: &Clock,
    ) {
        let current_time = sui::clock::timestamp_ms(clock) / 1000;
        let time_elapsed = current_time - pool.last_update_timestamp;

        if (time_elapsed == 0) {
            return
        };

        let base_utilization = calculate_utilization(
            pool.total_base_borrowed,
            pool.total_base_deposited
        );
        let base_rate = calculate_interest_rate(&pool.base_interest_rate_model, base_utilization);
        let base_interest_factor = (base_rate as u128) * (time_elapsed as u128) / (SECONDS_PER_YEAR as u128);
        pool.base_interest_index = ((pool.base_interest_index as u128) *
            (PRECISION as u128 + base_interest_factor) / (PRECISION as u128)) as u64;

        let quote_utilization = calculate_utilization(
            pool.total_quote_borrowed,
            pool.total_quote_deposited
        );
        let quote_rate = calculate_interest_rate(&pool.quote_interest_rate_model, quote_utilization);
        let quote_interest_factor = (quote_rate as u128) * (time_elapsed as u128) / (SECONDS_PER_YEAR as u128);
        pool.quote_interest_index = ((pool.quote_interest_index as u128) *
            (PRECISION as u128 + quote_interest_factor) / (PRECISION as u128)) as u64;

        pool.last_update_timestamp = current_time;
    }

    fun calculate_utilization(borrowed: u64, deposited: u64): u64 {
        if (deposited == 0) {
            return 0
        };
        ((borrowed as u128) * 10000 / (deposited as u128)) as u64
    }

    fun calculate_interest_rate(model: &InterestRateModel, utilization_bps: u64): u64 {
        if (utilization_bps <= model.optimal_utilization_bps) {
            model.base_rate_bps + (utilization_bps * model.multiplier_bps / 10000)
        } else {
            let excess = utilization_bps - model.optimal_utilization_bps;
            let normal_rate = model.base_rate_bps +
                (model.optimal_utilization_bps * model.multiplier_bps / 10000);
            normal_rate + (excess * model.jump_multiplier_bps / 10000)
        }
    }

    fun calculate_interest_owed(principal: u64, index_at_open: u64, current_index: u64): u64 {
        if (index_at_open == 0 || current_index <= index_at_open) {
            return 0
        };
        ((principal as u128) * ((current_index - index_at_open) as u128) / (index_at_open as u128)) as u64
    }

    public fun get_pool_stats<BaseAsset, QuoteAsset>(
        pool: &LendingPool<BaseAsset, QuoteAsset>
    ): (u64, u64, u64, u64, u64, u64) {
        (
            pool.total_base_deposited,
            pool.total_quote_deposited,
            pool.total_base_borrowed,
            pool.total_quote_borrowed,
            calculate_utilization(pool.total_base_borrowed, pool.total_base_deposited),
            calculate_utilization(pool.total_quote_borrowed, pool.total_quote_deposited),
        )
    }

    public fun get_position_health<BaseAsset, QuoteAsset>(
        pool: &LendingPool<BaseAsset, QuoteAsset>,
        position: &LendingPosition,
        base_price: u64,
    ): u64 {
        if (position.quote_borrowed == 0) {
            return PRECISION
        };

        let collateral_value = (position.base_deposited as u128) * (base_price as u128) / (PRECISION as u128);
        let debt_value = (position.quote_borrowed as u128);

        ((collateral_value * (PRECISION as u128)) /
            (debt_value * (pool.liquidation_threshold_bps as u128) / 10000)) as u64
    }

    public fun is_liquidatable<BaseAsset, QuoteAsset>(
        pool: &LendingPool<BaseAsset, QuoteAsset>,
        position: &LendingPosition,
        base_price: u64,
    ): bool {
        get_position_health(pool, position, base_price) < PRECISION
    }
}
