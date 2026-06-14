const fs = require('fs');

let content = fs.readFileSync('types/database.types.ts', 'utf8');

// The tables are defined inside `Tables: { ... }`.
// For every table, it has `Row: { ... }`, `Insert: { ... }`, `Update: { ... }`.
// We need to add `Relationships: any[]` inside each table object, right after `Update: { ... }`.

// Let's use a regex to match the end of an Update block. 
// A table ends with the Update block.
// Example:
//         Update: {
//           ...
//         }
//       }
// We can match `Update: {\n[ \t]*.*?\n[ \t]*}` (multiline) and append `\n        Relationships: any[]`

const tables = ['activity_logs', 'profiles', 'shopper_profiles', 'categories', 'import_sources', 'shopper_categories', 'shopper_sources', 'products', 'product_images', 'requests', 'orders', 'reviews', 'messages', 'payment_requests', 'promotions', 'promotion_products'];

let fixed = content;

tables.forEach(table => {
  const regex = new RegExp(`(${table}:[\\s\\S]*?Update: {[^}]*})`, 'g');
  fixed = fixed.replace(regex, `$1\n        Relationships: any[]`);
});

// Also add 'attributes?: Record<string, string> | null' to products Row, Insert, Update
fixed = fixed.replace(
  /products: {\s*Row: {/,
  `products: {\n        Row: {\n          attributes: Record<string, string> | null`
);
fixed = fixed.replace(
  /Insert: {\s*id\?: string/,
  `Insert: {\n          id?: string\n          attributes?: Record<string, string> | null`
);
fixed = fixed.replace(
  /Update: {\s*category_id\?: string \| null/,
  `Update: {\n          category_id?: string | null\n          attributes?: Record<string, string> | null`
);


fs.writeFileSync('types/database.types.ts', fixed);
console.log('Fixed types/database.types.ts');
