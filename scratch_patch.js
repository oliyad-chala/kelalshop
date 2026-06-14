const fs = require('fs');

let content = fs.readFileSync('types/database.types.ts', 'utf8');

// Add missing tables: wishlists, wishlist_items, flash_deal_items, user_product_views
const missingTables = `
      wishlists: { Row: { id: string, user_id: string, product_id: string, created_at: string }, Insert: any, Update: any, Relationships: any[] }
      wishlist_items: { Row: { id: string, user_id: string, product_id: string, created_at: string }, Insert: any, Update: any, Relationships: any[] }
      flash_deal_items: { Row: { id: string, product_id: string, discount: number }, Insert: any, Update: any, Relationships: any[] }
      user_product_views: { Row: { user_id: string, product_id: string }, Insert: any, Update: any, Relationships: any[] }
`;

content = content.replace('Tables: {', `Tables: {${missingTables}`);

// Add missing properties
content = content.replace(
  /profiles: {\s*Row: {/,
  `profiles: {\n        Row: {\n          email: string | null`
);
content = content.replace(
  /products: {\s*Row: {/,
  `products: {\n        Row: {\n          attributes: Record<string, string> | null`
);
content = content.replace(
  /shopper_profiles: {\s*Row: {/,
  `shopper_profiles: {\n        Row: {\n          full_name: string | null\n          email: string | null`
);

// Close out the Database object and add Functions, Views, etc.
content = content.replace(/    }\n  }\n}\n$/, `    }
    Views: { [_ in never]: never }
    Functions: {
      get_active_campaign_price: { Args: { p_product_id: string }, Returns: number }
      check_rate_limit: { Args: { p_identifier: string, p_max_requests: number, p_window_seconds: number }, Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
`);

// Add Relationships to all tables
// Find all block endings before the next table
const regex = /(Update: {[^}]*})/g;
let fixed = content.replace(regex, `$1\n        Relationships: any[]`);

fs.writeFileSync('types/database.types.ts', fixed);
console.log('Successfully patched database.types.ts');
