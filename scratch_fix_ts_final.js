const fs = require('fs');

function patch(file, regex, replacement) {
  if (fs.existsSync(file)) {
    let c = fs.readFileSync(file, 'utf8');
    c = c.replace(regex, replacement);
    fs.writeFileSync(file, c);
  }
}

// 1. admin.ts user destructuring
patch('lib/actions/admin.ts', 
  /const { adminClient: admin } = await requireAdmin\(\)/g, 
  `const { adminClient: admin, user } = await requireAdmin()`);

// 2. SellersTable.tsx toast
patch('components/admin/SellersTable.tsx',
  /toast\({[\s\S]*?}\)/g,
  `setError((result as any).error)`);

// 3. FlashSaleCarousel.tsx
patch('components/promotions/FlashSaleCarousel.tsx',
  /as unknown as ProductWithDetails;/g,
  `as unknown as ProductWithDetails;`);
patch('components/promotions/FlashSaleCarousel.tsx',
  /as ProductWithDetails;/g,
  `as unknown as ProductWithDetails;`);

// 4. make-admin.ts email
patch('scripts/make-admin.ts',
  /const result = await makeUserAdmin\(emailArg\)/,
  `const result = await makeUserAdmin(emailArg as string)`);

// 5. products/page.tsx
patch('app/(shop)/products/page.tsx',
  /return data as ProductWithDetails\[\]/,
  `return data as unknown as ProductWithDetails[]`);

// 6. shoppers/page.tsx
patch('app/(shop)/shoppers/page.tsx',
  /return \(\(data as any\)\?.map/g,
  `return ((data as any)?.map`);
patch('app/(shop)/shoppers/page.tsx',
  /return data as ShopperWithProfile\[\]/g,
  `return data as unknown as ShopperWithProfile[]`);

// 7. notifications/page.tsx
patch('app/admin/(protected)/notifications/page.tsx',
  /message\.profiles\?/g,
  `(message.profiles as any)?`);

// 8. sellers/[id]/page.tsx
patch('app/admin/(protected)/sellers/[id]/page.tsx',
  /seller\.profiles\?/g,
  `(seller.profiles as any)?`);

// 9. admin-auth.ts
patch('lib/actions/admin-auth.ts',
  /profile\.full_name/g,
  `(profile as any).full_name`);

// 10. orders.ts
patch('lib/actions/orders.ts',
  /item\.products as/g,
  `item.products as unknown as`);
patch('lib/actions/orders.ts',
  /order\.products\?/g,
  `(order.products as any)?`);

// 11. products.ts
patch('lib/actions/products.ts',
  /profile\.full_name/g,
  `(profile as any).full_name`);

// 12. shipping-promotion.ts
patch('lib/utils/shipping-promotion.ts',
  /item\.products as/g,
  `item.products as unknown as`);

// 13. AdminCharts.tsx
patch('components/admin/AdminCharts.tsx',
  /labelFormatter={\(dateStr: string\) => {/g,
  `labelFormatter={(dateStr: any) => {`);

// 14. admin.ts (line 224: Type instantiation is excessively deep)
// Find `admin.from('orders').select('amount')` and cast to any
patch('lib/actions/admin.ts',
  /admin\.from\('orders'\)\.select\('amount'\)/g,
  `(admin.from('orders') as any).select('amount')`);
patch('lib/actions/admin.ts',
  /admin\.from\('requests'\)\.select/g,
  `(admin.from('requests') as any).select`);
patch('lib/actions/admin.ts',
  /admin\n      \.from\('shopper_profiles'\)\n      \.select/g,
  `(admin.from('shopper_profiles') as any).select`);
patch('lib/actions/admin.ts',
  /admin\.from\('profiles'\)\.select/g,
  `(admin.from('profiles') as any).select`);
patch('lib/actions/admin.ts',
  /admin\.from\('payment_requests'\)\.select/g,
  `(admin.from('payment_requests') as any).select`);
patch('lib/actions/admin.ts',
  /admin\.from\('products'\)\.select/g,
  `(admin.from('products') as any).select`);

console.log("Applied final TS patches");
