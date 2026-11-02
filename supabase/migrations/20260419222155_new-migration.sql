-- ============================================================
-- Shelf Life Estimator — Database Schema
-- ============================================================
-- Tables: fruits, users, user_inventory, notifications
-- ============================================================

-- 1. Fruits — Reference table of all known fruits with shelf life data
CREATE TABLE IF NOT EXISTS fruits (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    subcategory     VARCHAR(50)  NOT NULL,

    -- Shelf life in days for each storage method
    shelf_life_room_temp_days   DOUBLE PRECISION NOT NULL,
    shelf_life_fridge_days      DOUBLE PRECISION NOT NULL,
    shelf_life_freezer_days     DOUBLE PRECISION NOT NULL,

    -- Fruit-specific attributes
    is_ethylene_producer    BOOLEAN DEFAULT FALSE,
    is_ethylene_sensitive   BOOLEAN DEFAULT FALSE,
    optimal_temp_min        DOUBLE PRECISION,       -- °C
    optimal_temp_max        DOUBLE PRECISION,       -- °C
    ripeness_indicator      TEXT,

    -- General info
    storage_tips    TEXT,
    image_url       VARCHAR(500)
);

CREATE INDEX IF NOT EXISTS idx_fruits_name ON fruits (name);
CREATE INDEX IF NOT EXISTS idx_fruits_subcategory ON fruits (subcategory);


-- 2. Users — User accounts
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);


-- 3. User Inventory — Fruits a user is tracking
CREATE TABLE IF NOT EXISTS user_inventory (
    id                          SERIAL PRIMARY KEY,
    user_id                     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fruit_id                    INTEGER NOT NULL REFERENCES fruits(id) ON DELETE CASCADE,
    freshness_score             DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    storage_method              VARCHAR(20) NOT NULL DEFAULT 'room_temp',
    estimated_days_remaining    DOUBLE PRECISION NOT NULL,
    scanned_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estimated_expiry            TIMESTAMPTZ NOT NULL,
    is_expired                  BOOLEAN DEFAULT FALSE,
    is_consumed                 BOOLEAN DEFAULT FALSE,
    image_path                  VARCHAR(500),
    quantity                    INTEGER DEFAULT 1,
    notes                       TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory (user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_fruit_id ON user_inventory (fruit_id);


-- 4. Notifications — Expiry alert notifications
CREATE TABLE IF NOT EXISTS notifications (
    id              SERIAL PRIMARY KEY,
    inventory_id    INTEGER NOT NULL REFERENCES user_inventory(id) ON DELETE CASCADE,
    message         VARCHAR(500) NOT NULL,
    notify_at       TIMESTAMPTZ NOT NULL,
    sent            BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_inventory_id ON notifications (inventory_id);
