import { Brand, Store, Product, StoreInventory } from './types';

// Dummy Brands
export const BRANDS: Brand[] = [
  {
    id: 'brand-1',
    name: 'Starbucks',
    logo: 'SB',
    description: 'Premium coffee & beverages',
    category: 'Cafe',
    rating: 4.5,
    created_at: new Date().toISOString(),
  },
  {
    id: 'brand-2',
    name: 'Nike Store',
    logo: 'NK',
    description: 'Athletic footwear & apparel',
    category: 'Sports',
    rating: 4.7,
    created_at: new Date().toISOString(),
  },
  {
    id: 'brand-3',
    name: 'Fresh Mart',
    logo: 'FM',
    description: 'Organic groceries & produce',
    category: 'Grocery',
    rating: 4.3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'brand-4',
    name: 'BookHaven',
    logo: 'BH',
    description: 'Books, magazines & stationery',
    category: 'Books',
    rating: 4.6,
    created_at: new Date().toISOString(),
  },
  {
    id: 'brand-5',
    name: 'TechZone',
    logo: 'TZ',
    description: 'Electronics & gadgets',
    category: 'Electronics',
    rating: 4.4,
    created_at: new Date().toISOString(),
  },
];

// Dummy Stores (multiple stores per brand)
export const STORES: Store[] = [
  // Starbucks stores
  {
    id: 'store-1',
    tenant_id: 'brand-1',
    brand_name: 'Starbucks',
    brand_logo: 'SB',
    name: 'Starbucks - Koramangala',
    address: '100 Feet Road, Koramangala, Bangalore',
    geo: { lat: 12.9352, lng: 77.6245 },
    distance: 0.8,
    is_open: true,
    phone: '+91 80 4567 8901',
    rating: 4.5,
    created_at: new Date().toISOString(),
  },
  {
    id: 'store-2',
    tenant_id: 'brand-1',
    brand_name: 'Starbucks',
    brand_logo: 'SB',
    name: 'Starbucks - Indiranagar',
    address: '12th Main Road, Indiranagar, Bangalore',
    geo: { lat: 12.9716, lng: 77.6412 },
    distance: 2.3,
    is_open: true,
    phone: '+91 80 4567 8902',
    rating: 4.6,
    created_at: new Date().toISOString(),
  },
  // Nike stores
  {
    id: 'store-3',
    tenant_id: 'brand-2',
    brand_name: 'Nike Store',
    brand_logo: 'NK',
    name: 'Nike - MG Road',
    address: 'MG Road, Bangalore',
    geo: { lat: 12.9750, lng: 77.6089 },
    distance: 1.5,
    is_open: true,
    phone: '+91 80 5678 9012',
    rating: 4.7,
    created_at: new Date().toISOString(),
  },
  {
    id: 'store-4',
    tenant_id: 'brand-2',
    brand_name: 'Nike Store',
    brand_logo: 'NK',
    name: 'Nike - Whitefield',
    address: 'ITPL Main Road, Whitefield, Bangalore',
    geo: { lat: 12.9698, lng: 77.7500 },
    distance: 5.2,
    is_open: false,
    phone: '+91 80 5678 9013',
    rating: 4.5,
    created_at: new Date().toISOString(),
  },
  // Fresh Mart stores
  {
    id: 'store-5',
    tenant_id: 'brand-3',
    brand_name: 'Fresh Mart',
    brand_logo: 'FM',
    name: 'Fresh Mart - HSR Layout',
    address: '27th Main Road, HSR Layout, Bangalore',
    geo: { lat: 12.9121, lng: 77.6446 },
    distance: 1.2,
    is_open: true,
    phone: '+91 80 6789 0123',
    rating: 4.3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'store-6',
    tenant_id: 'brand-3',
    brand_name: 'Fresh Mart',
    brand_logo: 'FM',
    name: 'Fresh Mart - BTM Layout',
    address: '2nd Stage, BTM Layout, Bangalore',
    geo: { lat: 12.9165, lng: 77.6101 },
    distance: 3.1,
    is_open: true,
    phone: '+91 80 6789 0124',
    rating: 4.4,
    created_at: new Date().toISOString(),
  },
  // BookHaven stores
  {
    id: 'store-7',
    tenant_id: 'brand-4',
    brand_name: 'BookHaven',
    brand_logo: 'BH',
    name: 'BookHaven - Jayanagar',
    address: '4th Block, Jayanagar, Bangalore',
    geo: { lat: 12.9250, lng: 77.5937 },
    distance: 2.0,
    is_open: true,
    phone: '+91 80 7890 1234',
    rating: 4.6,
    created_at: new Date().toISOString(),
  },
  // TechZone stores
  {
    id: 'store-8',
    tenant_id: 'brand-5',
    brand_name: 'TechZone',
    brand_logo: 'TZ',
    name: 'TechZone - Malleshwaram',
    address: '8th Cross, Malleshwaram, Bangalore',
    geo: { lat: 13.0037, lng: 77.5704 },
    distance: 4.5,
    is_open: true,
    phone: '+91 80 8901 2345',
    rating: 4.4,
    created_at: new Date().toISOString(),
  },
];

// Dummy Products by Brand
export const PRODUCTS: Product[] = [
  // Starbucks products
  {
    id: 'prod-1',
    tenant_id: 'brand-1',
    sku: 'SB-LATTE-001',
    barcode: '8901234567890',
    name: 'Caffe Latte',
    description: 'Rich espresso balanced with steamed milk',
    mrp: 280,
    tax_rate: 5,
    category: 'Hot Beverages',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    tenant_id: 'brand-1',
    sku: 'SB-CAPP-001',
    barcode: '8901234567891',
    name: 'Cappuccino',
    description: 'Espresso with steamed milk and foam',
    mrp: 260,
    tax_rate: 5,
    category: 'Hot Beverages',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    tenant_id: 'brand-1',
    sku: 'SB-FRAP-001',
    barcode: '8901234567892',
    name: 'Java Chip Frappuccino',
    description: 'Mocha sauce and Frappuccino chips with coffee',
    mrp: 350,
    tax_rate: 5,
    category: 'Cold Beverages',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    tenant_id: 'brand-1',
    sku: 'SB-CROIS-001',
    barcode: '8901234567893',
    name: 'Butter Croissant',
    description: 'Flaky, buttery French pastry',
    mrp: 180,
    tax_rate: 5,
    category: 'Food',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Nike products
  {
    id: 'prod-5',
    tenant_id: 'brand-2',
    sku: 'NK-AIR-001',
    barcode: '8901234567894',
    name: 'Air Max 270',
    description: 'Lifestyle shoes with Max Air cushioning',
    mrp: 12995,
    tax_rate: 12,
    category: 'Footwear',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    tenant_id: 'brand-2',
    sku: 'NK-DRI-001',
    barcode: '8901234567895',
    name: 'Dri-FIT T-Shirt',
    description: 'Moisture-wicking performance tee',
    mrp: 1995,
    tax_rate: 12,
    category: 'Apparel',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    tenant_id: 'brand-2',
    sku: 'NK-ZOOM-001',
    barcode: '8901234567896',
    name: 'Zoom Pegasus 40',
    description: 'Responsive running shoes',
    mrp: 10795,
    tax_rate: 12,
    category: 'Footwear',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // Fresh Mart products
  {
    id: 'prod-8',
    tenant_id: 'brand-3',
    sku: 'FM-ORG-001',
    barcode: '8901234567897',
    name: 'Organic Bananas (6pcs)',
    description: 'Fresh organic bananas',
    mrp: 45,
    tax_rate: 0,
    category: 'Fruits',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-9',
    tenant_id: 'brand-3',
    sku: 'FM-MILK-001',
    barcode: '8901234567898',
    name: 'Organic Milk 1L',
    description: 'Farm fresh organic whole milk',
    mrp: 65,
    tax_rate: 0,
    category: 'Dairy',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-10',
    tenant_id: 'brand-3',
    sku: 'FM-BREAD-001',
    barcode: '8901234567899',
    name: 'Whole Wheat Bread',
    description: '100% whole wheat bread loaf',
    mrp: 40,
    tax_rate: 0,
    category: 'Bakery',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // BookHaven products
  {
    id: 'prod-11',
    tenant_id: 'brand-4',
    sku: 'BH-NOVEL-001',
    barcode: '8901234567800',
    name: 'The Alchemist',
    description: 'Paulo Coelho - Bestselling novel',
    mrp: 350,
    tax_rate: 0,
    category: 'Fiction',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-12',
    tenant_id: 'brand-4',
    sku: 'BH-NB-001',
    barcode: '8901234567801',
    name: 'Premium Notebook A5',
    description: 'Ruled notebook - 200 pages',
    mrp: 120,
    tax_rate: 12,
    category: 'Stationery',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },

  // TechZone products
  {
    id: 'prod-13',
    tenant_id: 'brand-5',
    sku: 'TZ-AIRP-001',
    barcode: '8901234567802',
    name: 'Wireless Earbuds Pro',
    description: 'Active noise cancellation, 24hr battery',
    mrp: 8999,
    tax_rate: 18,
    category: 'Audio',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-14',
    tenant_id: 'brand-5',
    sku: 'TZ-CHRG-001',
    barcode: '8901234567803',
    name: 'Fast Charger 65W',
    description: 'USB-C PD fast charging adapter',
    mrp: 1499,
    tax_rate: 18,
    category: 'Accessories',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-15',
    tenant_id: 'brand-5',
    sku: 'TZ-MOUSE-001',
    barcode: '8901234567804',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with silent clicks',
    mrp: 799,
    tax_rate: 18,
    category: 'Computer Accessories',
    image: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Store Inventory - map products to stores
export const STORE_INVENTORY: StoreInventory[] = [
  // Starbucks Koramangala inventory
  { id: 'inv-1', store_id: 'store-1', product_id: 'prod-1', qty_on_hand: 50 },
  { id: 'inv-2', store_id: 'store-1', product_id: 'prod-2', qty_on_hand: 45 },
  { id: 'inv-3', store_id: 'store-1', product_id: 'prod-3', qty_on_hand: 30 },
  { id: 'inv-4', store_id: 'store-1', product_id: 'prod-4', qty_on_hand: 25 },

  // Starbucks Indiranagar inventory
  { id: 'inv-5', store_id: 'store-2', product_id: 'prod-1', qty_on_hand: 40 },
  { id: 'inv-6', store_id: 'store-2', product_id: 'prod-2', qty_on_hand: 35 },
  { id: 'inv-7', store_id: 'store-2', product_id: 'prod-3', qty_on_hand: 28 },
  { id: 'inv-8', store_id: 'store-2', product_id: 'prod-4', qty_on_hand: 20 },

  // Nike MG Road inventory
  { id: 'inv-9', store_id: 'store-3', product_id: 'prod-5', qty_on_hand: 15 },
  { id: 'inv-10', store_id: 'store-3', product_id: 'prod-6', qty_on_hand: 30 },
  { id: 'inv-11', store_id: 'store-3', product_id: 'prod-7', qty_on_hand: 12 },

  // Nike Whitefield inventory
  { id: 'inv-12', store_id: 'store-4', product_id: 'prod-5', qty_on_hand: 10 },
  { id: 'inv-13', store_id: 'store-4', product_id: 'prod-6', qty_on_hand: 25 },
  { id: 'inv-14', store_id: 'store-4', product_id: 'prod-7', qty_on_hand: 8 },

  // Fresh Mart HSR inventory
  { id: 'inv-15', store_id: 'store-5', product_id: 'prod-8', qty_on_hand: 100 },
  { id: 'inv-16', store_id: 'store-5', product_id: 'prod-9', qty_on_hand: 80 },
  { id: 'inv-17', store_id: 'store-5', product_id: 'prod-10', qty_on_hand: 60 },

  // Fresh Mart BTM inventory
  { id: 'inv-18', store_id: 'store-6', product_id: 'prod-8', qty_on_hand: 90 },
  { id: 'inv-19', store_id: 'store-6', product_id: 'prod-9', qty_on_hand: 70 },
  { id: 'inv-20', store_id: 'store-6', product_id: 'prod-10', qty_on_hand: 55 },

  // BookHaven Jayanagar inventory
  { id: 'inv-21', store_id: 'store-7', product_id: 'prod-11', qty_on_hand: 20 },
  { id: 'inv-22', store_id: 'store-7', product_id: 'prod-12', qty_on_hand: 150 },

  // TechZone Malleshwaram inventory
  { id: 'inv-23', store_id: 'store-8', product_id: 'prod-13', qty_on_hand: 25 },
  { id: 'inv-24', store_id: 'store-8', product_id: 'prod-14', qty_on_hand: 40 },
  { id: 'inv-25', store_id: 'store-8', product_id: 'prod-15', qty_on_hand: 35 },
];

// Helper function to get products for a store
export function getStoreProducts(storeId: string): Product[] {
  const inventory = STORE_INVENTORY.filter(inv => inv.store_id === storeId);
  return inventory.map(inv => {
    const product = PRODUCTS.find(p => p.id === inv.product_id);
    return product!;
  }).filter(Boolean);
}

// Helper function to get stores by brand
export function getStoresByBrand(brandId: string): Store[] {
  return STORES.filter(store => store.tenant_id === brandId);
}

// Helper function to get inventory quantity
export function getInventoryQty(storeId: string, productId: string): number {
  const inv = STORE_INVENTORY.find(
    i => i.store_id === storeId && i.product_id === productId
  );
  return inv?.qty_on_hand || 0;
}
