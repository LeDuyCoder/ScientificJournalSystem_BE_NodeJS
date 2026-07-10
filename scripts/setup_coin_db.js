import pool from '../src/config/database.js';

async function main() {
  const client = await pool.connect();

  try {
    console.log('Bat dau thiet lap co so du lieu cho he thong Coin...');
    await client.query('BEGIN');

    await client.query(`
      DO $$
      BEGIN
        CREATE TYPE payment_method AS ENUM ('vnpay', 'momo', 'bank_transfer', 'stripe', 'paypal');
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed', 'cancelled', 'refunded');
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        CREATE TYPE wallet_transaction_type AS ENUM ('deposit', 'spend', 'refund', 'admin_adjust');
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet (
        wallet_id UUID PRIMARY KEY,
        user_id UUID NOT NULL UNIQUE REFERENCES "user"(user_id) ON DELETE CASCADE,
        balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
        total_deposit BIGINT NOT NULL DEFAULT 0 CHECK (total_deposit >= 0),
        total_spent BIGINT NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS coin_package (
        package_id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        coin_amount BIGINT NOT NULL CHECK (coin_amount > 0),
        bonus_coin BIGINT NOT NULL DEFAULT 0 CHECK (bonus_coin >= 0),
        price DECIMAL(18,2) NOT NULL CHECK (price > 0),
        currency VARCHAR(10) NOT NULL DEFAULT 'VND',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_transaction (
        transaction_id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
        package_id UUID REFERENCES coin_package(package_id) ON DELETE SET NULL,
        amount DECIMAL(18,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'VND',
        coin_amount BIGINT NOT NULL,
        bonus_coin BIGINT NOT NULL DEFAULT 0,
        total_coin BIGINT NOT NULL,
        payment_method payment_method NOT NULL,
        payment_status payment_status NOT NULL DEFAULT 'pending',
        provider_transaction_code VARCHAR(255),
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet_transaction (
        wallet_transaction_id UUID PRIMARY KEY,
        wallet_id UUID NOT NULL REFERENCES wallet(wallet_id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
        type wallet_transaction_type NOT NULL,
        amount BIGINT NOT NULL,
        balance_before BIGINT NOT NULL,
        balance_after BIGINT NOT NULL,
        payment_transaction_id UUID REFERENCES payment_transaction(transaction_id) ON DELETE SET NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON wallet(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_coin_package_active ON coin_package(is_active);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payment_transaction_user_id ON payment_transaction(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payment_transaction_status ON payment_transaction(payment_status);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_wallet_transaction_user_id ON wallet_transaction(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_wallet_transaction_wallet_id ON wallet_transaction(wallet_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_wallet_transaction_payment_id ON wallet_transaction(payment_transaction_id);');

    await client.query('COMMIT');
    console.log('Thiet lap co so du lieu Coin thanh cong!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Loi khi thiet lap co so du lieu Coin:', error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
