module zk_intentbook::intent_registry {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table::{Self, Table};
    use sui::event;
    use sui::clock::{Self, Clock};
    use sui::vec_set::{Self, VecSet};
    use std::vector;

    const EIntentAlreadyExists: u64 = 1;
    const EIntentNotFound: u64 = 2;
    const EIntentExpired: u64 = 3;
    const EUnauthorized: u64 = 4;
    const EIntentAlreadySettled: u64 = 5;
    const EIntentCancelled: u64 = 6;

    public struct IntentRegistry has key {
        id: UID,
        intents: Table<vector<u8>, IntentRecord>,
        user_intents: Table<address, VecSet<vector<u8>>>,
        total_intents: u64,
        settled_intents: u64,
    }

    public struct IntentRecord has store, drop, copy {
        commitment_hash: vector<u8>,
        owner: address,
        deadline: u64,
        pool_id: ID,
        created_at: u64,
        status: u8,
        solver: address,
        execution_price: u64,
        executed_size: u64,
    }

    public struct IntentSubmitted has copy, drop {
        commitment_hash: vector<u8>,
        owner: address,
        deadline: u64,
        pool_id: ID,
    }

    public struct IntentSettled has copy, drop {
        commitment_hash: vector<u8>,
        solver: address,
        execution_price: u64,
        executed_size: u64,
    }

    public struct IntentCancelled has copy, drop {
        commitment_hash: vector<u8>,
        owner: address,
    }

    public struct IntentExpired has copy, drop {
        commitment_hash: vector<u8>,
    }

    const STATUS_PENDING: u8 = 0;
    const STATUS_MATCHED: u8 = 1;
    const STATUS_SETTLED: u8 = 2;
    const STATUS_CANCELLED: u8 = 3;
    const STATUS_EXPIRED: u8 = 4;

    fun init(ctx: &mut TxContext) {
        let registry = IntentRegistry {
            id: object::new(ctx),
            intents: table::new(ctx),
            user_intents: table::new(ctx),
            total_intents: 0,
            settled_intents: 0,
        };
        transfer::share_object(registry);
    }

    public fun submit_commitment(
        registry: &mut IntentRegistry,
        commitment_hash: vector<u8>,
        deadline: u64,
        pool_id: ID,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(!table::contains(&registry.intents, commitment_hash), EIntentAlreadyExists);
        
        let current_time = clock::timestamp_ms(clock);
        assert!(deadline > current_time, EIntentExpired);

        let owner = tx_context::sender(ctx);
        
        let record = IntentRecord {
            commitment_hash,
            owner,
            deadline,
            pool_id,
            created_at: current_time,
            status: STATUS_PENDING,
            solver: @0x0,
            execution_price: 0,
            executed_size: 0,
        };

        table::add(&mut registry.intents, commitment_hash, record);
        
        if (!table::contains(&registry.user_intents, owner)) {
            table::add(&mut registry.user_intents, owner, vec_set::empty());
        };
        let user_set = table::borrow_mut(&mut registry.user_intents, owner);
        vec_set::insert(user_set, commitment_hash);
        
        registry.total_intents = registry.total_intents + 1;

        event::emit(IntentSubmitted {
            commitment_hash,
            owner,
            deadline,
            pool_id,
        });
    }

    public fun settle_intent(
        registry: &mut IntentRegistry,
        commitment_hash: vector<u8>,
        execution_price: u64,
        executed_size: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(table::contains(&registry.intents, commitment_hash), EIntentNotFound);
        
        let record = table::borrow_mut(&mut registry.intents, commitment_hash);
        let current_time = clock::timestamp_ms(clock);
        
        assert!(record.status == STATUS_PENDING || record.status == STATUS_MATCHED, EIntentAlreadySettled);
        assert!(record.status != STATUS_CANCELLED, EIntentCancelled);
        assert!(record.deadline >= current_time, EIntentExpired);

        let solver = tx_context::sender(ctx);
        
        record.status = STATUS_SETTLED;
        record.solver = solver;
        record.execution_price = execution_price;
        record.executed_size = executed_size;
        
        registry.settled_intents = registry.settled_intents + 1;

        event::emit(IntentSettled {
            commitment_hash,
            solver,
            execution_price,
            executed_size,
        });
    }

    public fun cancel_intent(
        registry: &mut IntentRegistry,
        commitment_hash: vector<u8>,
        ctx: &TxContext,
    ) {
        assert!(table::contains(&registry.intents, commitment_hash), EIntentNotFound);
        
        let record = table::borrow_mut(&mut registry.intents, commitment_hash);
        assert!(record.owner == tx_context::sender(ctx), EUnauthorized);
        assert!(record.status == STATUS_PENDING, EIntentAlreadySettled);

        record.status = STATUS_CANCELLED;

        event::emit(IntentCancelled {
            commitment_hash,
            owner: record.owner,
        });
    }

    public fun mark_expired(
        registry: &mut IntentRegistry,
        commitment_hash: vector<u8>,
        clock: &Clock,
    ) {
        assert!(table::contains(&registry.intents, commitment_hash), EIntentNotFound);
        
        let record = table::borrow_mut(&mut registry.intents, commitment_hash);
        let current_time = clock::timestamp_ms(clock);
        
        assert!(record.deadline < current_time, EIntentNotFound);
        assert!(record.status == STATUS_PENDING, EIntentAlreadySettled);

        record.status = STATUS_EXPIRED;

        event::emit(IntentExpired {
            commitment_hash,
        });
    }

    public fun get_intent(
        registry: &IntentRegistry,
        commitment_hash: vector<u8>,
    ): IntentRecord {
        assert!(table::contains(&registry.intents, commitment_hash), EIntentNotFound);
        *table::borrow(&registry.intents, commitment_hash)
    }

    public fun is_intent_pending(
        registry: &IntentRegistry,
        commitment_hash: vector<u8>,
    ): bool {
        if (!table::contains(&registry.intents, commitment_hash)) {
            return false
        };
        let record = table::borrow(&registry.intents, commitment_hash);
        record.status == STATUS_PENDING
    }

    public fun get_user_intent_count(
        registry: &IntentRegistry,
        user: address,
    ): u64 {
        if (!table::contains(&registry.user_intents, user)) {
            return 0
        };
        vec_set::size(table::borrow(&registry.user_intents, user))
    }

    public fun total_intents(registry: &IntentRegistry): u64 {
        registry.total_intents
    }

    public fun settled_intents(registry: &IntentRegistry): u64 {
        registry.settled_intents
    }

    public fun commitment_hash(record: &IntentRecord): vector<u8> {
        record.commitment_hash
    }

    public fun owner(record: &IntentRecord): address {
        record.owner
    }

    public fun deadline(record: &IntentRecord): u64 {
        record.deadline
    }

    public fun status(record: &IntentRecord): u8 {
        record.status
    }

    public fun solver(record: &IntentRecord): address {
        record.solver
    }

    public fun execution_price(record: &IntentRecord): u64 {
        record.execution_price
    }

    public fun executed_size(record: &IntentRecord): u64 {
        record.executed_size
    }
}
