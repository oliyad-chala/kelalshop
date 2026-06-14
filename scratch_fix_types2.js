const fs = require('fs');

let content = fs.readFileSync('types/database.types.ts', 'utf8');

// Add wishlists table
if (!content.includes('wishlists: {')) {
  const wishlistsTable = `
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
        Relationships: any[]
      }`;
  content = content.replace('Tables: {', `Tables: {${wishlistsTable}`);
}

// Add email to profiles
if (!content.includes('email: string | null') && !content.includes('email: string')) {
  content = content.replace(
    /profiles: {\s*Row: {/,
    `profiles: {\n        Row: {\n          email: string | null`
  );
  content = content.replace(
    /Insert: {\s*id: string/,
    `Insert: {\n          id: string\n          email?: string | null`
  );
  content = content.replace(
    /Update: {\s*id\?: string/,
    `Update: {\n          id?: string\n          email?: string | null`
  );
}

fs.writeFileSync('types/database.types.ts', content);
console.log('Fixed types/database.types.ts');
