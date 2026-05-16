const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, shopper_profiles!inner(*, shopper_categories(categories(*)), shopper_sources(sources(*)))')
    
  console.log(JSON.stringify(data, null, 2));
  if (error) console.log(error);
}
test();
