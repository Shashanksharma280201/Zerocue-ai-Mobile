-- ==========================================================================
-- ZeroCue Mobile App - Supabase Database Schema
-- ==========================================================================
-- This schema adds retail/shopping tables to the Fashion AI Supabase project
-- Fashion AI tables (outfit_uploads, ai_analyses, etc.) already exist
-- ==========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial queries (optional, for store location features)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ==========================================================================
-- BRANDS/TENANTS
-- ==========================================================================

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo TEXT,
    description TEXT,
    category TEXT NOT NULL,
    rating DECIMAL(3,2) DEFAULT 4.5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_category ON brands(category);

-- ==========================================================================
-- STORES
-- ==========================================================================

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    brand_name TEXT,
    brand_logo TEXT,
    address TEXT,
    geo JSONB, -- {lat: number, lng: number}
    open_hours JSONB, -- {monday: {open: "10:00", close: "22:00"}, ...}
    phone TEXT,
    rating DECIMAL(3,2) DEFAULT 4.5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stores_tenant ON stores(tenant_id);
-- CREATE INDEX IF NOT EXISTS idx_stores_geo ON stores USING GIST ((geo::geometry)); -- Requires PostGIS

-- ==========================================================================
-- PRODUCTS
-- ==========================================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    barcode TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    mrp DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    category TEXT,
    attributes JSONB, -- {size: "M", color: "blue", material: "cotton"}
    media TEXT[], -- Array of image URLs
    image TEXT, -- Primary image URL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('english', name));

-- ==========================================================================
-- STORE INVENTORY
-- ==========================================================================

CREATE TABLE IF NOT EXISTS store_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty_on_hand INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER DEFAULT 10,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(store_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_store ON store_inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON store_inventory(product_id);

-- ==========================================================================
-- USER PROFILES (extends Fashion AI users table)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    preferences JSONB, -- {language: "en", theme: "light"}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

-- ==========================================================================
-- CARTS
-- ==========================================================================

CREATE TYPE cart_status AS ENUM ('pending', 'paid', 'cleared', 'cancelled');

CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    status cart_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) DEFAULT 0.00,
    tax DECIMAL(10,2) DEFAULT 0.00,
    discount DECIMAL(10,2) DEFAULT 0.00,
    total DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_store ON carts(store_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);

-- ==========================================================================
-- CART ITEMS
-- ==========================================================================

CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);

-- ==========================================================================
-- PAYMENTS
-- ==========================================================================

CREATE TYPE payment_method AS ENUM ('upi', 'card', 'cash', 'wallet');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    method payment_method NOT NULL,
    txn_ref TEXT, -- Transaction reference from payment gateway
    amount DECIMAL(10,2) NOT NULL,
    status payment_status DEFAULT 'pending',
    meta JSONB, -- Additional payment metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_cart ON payments(cart_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_txn_ref ON payments(txn_ref);

-- ==========================================================================
-- RECEIPTS (QR Code Exit Validation)
-- ==========================================================================

CREATE TYPE receipt_status AS ENUM ('valid', 'used', 'expired');

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    qr_token TEXT UNIQUE NOT NULL,
    status receipt_status DEFAULT 'valid',
    verified_by TEXT, -- Staff member who verified
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ, -- 24 hours from creation
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_cart ON receipts(cart_id);
CREATE INDEX IF NOT EXISTS idx_receipts_qr_token ON receipts(qr_token);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);

-- ==========================================================================
-- BOOKINGS (6-hour hold system)
-- ==========================================================================

CREATE TYPE booking_status AS ENUM ('active', 'expired', 'picked_up', 'cancelled');

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    items JSONB NOT NULL, -- [{id, product_id, qty, unit_price}]
    total DECIMAL(10,2) NOT NULL,
    status booking_status DEFAULT 'active',
    expires_at TIMESTAMPTZ NOT NULL, -- 6 hours from creation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_store ON bookings(store_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_expires ON bookings(expires_at);

-- ==========================================================================
-- SHOPPING LISTS
-- ==========================================================================

CREATE TABLE IF NOT EXISTS shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📝',
    items JSONB NOT NULL DEFAULT '[]', -- [{product_id, name, checked, addedAt}]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON shopping_lists(user_id);

-- ==========================================================================
-- FAVORITES/WISHLIST
-- ==========================================================================

CREATE TABLE IF NOT EXISTS favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id);

-- ==========================================================================
-- RETURNS & EXCHANGES
-- ==========================================================================

CREATE TYPE return_status AS ENUM ('requested', 'approved', 'rejected', 'completed');
CREATE TYPE return_reason AS ENUM ('defective', 'wrong_item', 'size_issue', 'not_as_described', 'changed_mind', 'other');

CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    reason return_reason NOT NULL,
    description TEXT,
    images TEXT[], -- Photos of the issue
    status return_status DEFAULT 'requested',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_returns_user ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_cart ON returns(cart_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);

-- ==========================================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================================================

-- Enable RLS on all tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Public read access policies (for anon users browsing)
CREATE POLICY "Public read access for brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Public read access for stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Public read access for products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read access for inventory" ON store_inventory FOR SELECT USING (true);

-- User-specific policies (users can only access their own data)
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can read own carts" ON carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create carts" ON carts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own carts" ON carts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own cart items" ON cart_items FOR SELECT USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
);
CREATE POLICY "Users can manage own cart items" ON cart_items FOR ALL USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
);

CREATE POLICY "Users can read own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read own shopping lists" ON shopping_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own shopping lists" ON shopping_lists FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own returns" ON returns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create returns" ON returns FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read for receipts (for store staff verification)
CREATE POLICY "Public can read receipts by QR token" ON receipts FOR SELECT USING (true);

-- ==========================================================================
-- FUNCTIONS
-- ==========================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================================
-- SAMPLE DATA FOR TESTING
-- ==========================================================================

-- Insert mock brand
INSERT INTO brands (id, name, category, description) VALUES
    ('00000000-0000-0000-0000-000000000001', 'ZeroCue Demo', 'Fashion', 'Self-checkout fashion retail')
ON CONFLICT (id) DO NOTHING;

-- Insert mock stores
INSERT INTO stores (id, tenant_id, name, address, geo, open_hours) VALUES
    (
        '00000000-0000-0000-0000-000000000011',
        '00000000-0000-0000-0000-000000000001',
        'Phoenix Mall Store',
        '123 Main Street, Phoenix Mall, Bangalore',
        '{"lat": 12.9716, "lng": 77.5946}',
        '{"monday": {"open": "10:00", "close": "22:00"}, "tuesday": {"open": "10:00", "close": "22:00"}, "wednesday": {"open": "10:00", "close": "22:00"}, "thursday": {"open": "10:00", "close": "22:00"}, "friday": {"open": "10:00", "close": "22:00"}, "saturday": {"open": "10:00", "close": "23:00"}, "sunday": {"open": "10:00", "close": "23:00"}}'
    ),
    (
        '00000000-0000-0000-0000-000000000012',
        '00000000-0000-0000-0000-000000000001',
        'Orion Mall Store',
        '456 Brigade Road, Orion Mall, Bangalore',
        '{"lat": 13.0101, "lng": 77.5526}',
        '{"monday": {"open": "10:00", "close": "22:00"}, "tuesday": {"open": "10:00", "close": "22:00"}, "wednesday": {"open": "10:00", "close": "22:00"}, "thursday": {"open": "10:00", "close": "22:00"}, "friday": {"open": "10:00", "close": "22:00"}, "saturday": {"open": "10:00", "close": "23:00"}, "sunday": {"open": "10:00", "close": "23:00"}}'
    )
ON CONFLICT (id) DO NOTHING;

-- Insert mock products (Fashion items that can be matched with Fashion AI recommendations)
INSERT INTO products (id, tenant_id, sku, barcode, name, description, mrp, category, image) VALUES
    (
        '00000000-0000-0000-0000-000000000021',
        '00000000-0000-0000-0000-000000000001',
        'JACKET-001',
        '8901234567890',
        'Denim Jacket - Light Blue',
        'Classic denim jacket perfect for layering',
        2499.00,
        'Jacket',
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400'
    ),
    (
        '00000000-0000-0000-0000-000000000022',
        '00000000-0000-0000-0000-000000000001',
        'WATCH-001',
        '8901234567891',
        'Silver Minimalist Watch',
        'Sleek silver watch for everyday wear',
        3999.00,
        'Accessories',
        'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400'
    ),
    (
        '00000000-0000-0000-0000-000000000023',
        '00000000-0000-0000-0000-000000000001',
        'SHOES-001',
        '8901234567892',
        'White Canvas Sneakers',
        'Clean white sneakers for a fresh look',
        1899.00,
        'Shoes',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'
    ),
    (
        '00000000-0000-0000-0000-000000000024',
        '00000000-0000-0000-0000-000000000001',
        'TSHIRT-001',
        '8901234567893',
        'Plain White T-Shirt',
        'Essential white cotton tee',
        799.00,
        'T-Shirt',
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'
    ),
    (
        '00000000-0000-0000-0000-000000000025',
        '00000000-0000-0000-0000-000000000001',
        'JEANS-001',
        '8901234567894',
        'Blue Slim Fit Jeans',
        'Classic blue denim jeans',
        1999.00,
        'Jeans',
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'
    )
ON CONFLICT (id) DO NOTHING;

-- Add inventory for mock stores
INSERT INTO store_inventory (store_id, product_id, qty_on_hand) VALUES
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000021', 15),
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000022', 20),
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000023', 25),
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000024', 30),
    ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000025', 18),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000021', 12),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000022', 18),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000023', 22),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000024', 28),
    ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000025', 16)
ON CONFLICT (store_id, product_id) DO NOTHING;

-- ==========================================================================
-- SCHEMA COMPLETE
-- ==========================================================================

COMMENT ON SCHEMA public IS 'ZeroCue self-checkout mobile app with Fashion AI integration';
