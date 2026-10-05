-- Trust-Tracker PostgreSQL Full Schema
-- Auto-migrated schema for PostgreSQL self-hosted setup

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT '',
    avatar_url TEXT,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    role VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (role IN ('normal', 'super_admin')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
    welcome_email_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    color VARCHAR(50) NOT NULL DEFAULT '#3B82F6',
    icon VARCHAR(50) NOT NULL DEFAULT 'Tag',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name, type)
);

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    original_amount NUMERIC(12, 2),
    split_received_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    split_status VARCHAR(50) NOT NULL DEFAULT 'none',
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    group_transaction_id UUID,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL DEFAULT '',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    month VARCHAR(7) NOT NULL CHECK (month ~ '^[0-9]{4}-[0-9]{2}$'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id, month)
);

-- 5. Groups Table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    code VARCHAR(10) UNIQUE NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Group Members Table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 7. Group Categories Table
CREATE TABLE IF NOT EXISTS group_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    color VARCHAR(50) NOT NULL DEFAULT '#3B82F6',
    icon VARCHAR(50) NOT NULL DEFAULT 'Tag',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, name)
);

-- 8. Group Transactions Table
CREATE TABLE IF NOT EXISTS group_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    paid_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    personal_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    type VARCHAR(50) NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
    category_id UUID REFERENCES group_categories(id) ON DELETE SET NULL,
    description TEXT NOT NULL DEFAULT '',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    split_type VARCHAR(50) NOT NULL DEFAULT 'equal',
    split_details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Group Settlements Table (Settle-Up Payments)
CREATE TABLE IF NOT EXISTS group_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT DEFAULT '',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- 9.1 Group Split Requests Table (Interactive Approval & Dynamic Transaction Deduction)
CREATE TABLE IF NOT EXISTS group_split_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    group_transaction_id UUID NOT NULL REFERENCES group_transactions(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'paid', 'declined')),
    payment_method VARCHAR(50) DEFAULT 'upi',
    notes TEXT DEFAULT '',
    paid_at TIMESTAMPTZ,
    settlement_id UUID REFERENCES group_settlements(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Group Budgets Table
CREATE TABLE IF NOT EXISTS group_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES group_categories(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    month VARCHAR(7) NOT NULL CHECK (month ~ '^[0-9]{4}-[0-9]{2}$'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, category_id, month)
);

-- 11. Loans & EMI Table
CREATE TABLE IF NOT EXISTS loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('borrowed', 'lent')),
    counterparty VARCHAR(255) NOT NULL,
    principal_amount NUMERIC(12, 2) NOT NULL CHECK (principal_amount > 0),
    interest_rate NUMERIC(6, 2) NOT NULL DEFAULT 0,
    tenure_months INT NOT NULL CHECK (tenure_months > 0),
    start_date DATE NOT NULL,
    emi_day INT NOT NULL DEFAULT 1,
    monthly_emi NUMERIC(12, 2) NOT NULL CHECK (monthly_emi >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'defaulted')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Loan Payments Table
CREATE TABLE IF NOT EXISTS loan_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    payment_number INT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    principal_component NUMERIC(12, 2) NOT NULL DEFAULT 0,
    interest_component NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'skipped')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    cost NUMERIC(12, 2) NOT NULL CHECK (cost >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    billing_cycle VARCHAR(50) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly', 'weekly')),
    next_billing_date DATE NOT NULL,
    payment_method VARCHAR(100) DEFAULT 'Card',
    icon VARCHAR(50) DEFAULT 'Film',
    color VARCHAR(50) DEFAULT '#6366F1',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    reminder_days INT NOT NULL DEFAULT 3,
    is_trial BOOLEAN NOT NULL DEFAULT false,
    trial_ends_at DATE,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Personal Debts & Lender Table
CREATE TABLE IF NOT EXISTS debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    counterparty_name VARCHAR(255) NOT NULL,
    counterparty_contact VARCHAR(255) DEFAULT '',
    type VARCHAR(50) NOT NULL CHECK (type IN ('i_owe', 'owed_to_me')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    due_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'partially_paid', 'settled', 'overdue')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Debt Payments Table
CREATE TABLE IF NOT EXISTS debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Temporary Analytics Sharing Table
CREATE TABLE IF NOT EXISTS temporary_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    access_token TEXT
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_tx_group_date ON group_transactions(group_id, date);
CREATE INDEX IF NOT EXISTS idx_group_settlements_group ON group_settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_group_budgets_group ON group_budgets(group_id, month);
CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(user_id, next_billing_date);
CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_temp_analytics_expiry ON temporary_analytics (expires_at);
