import { createClient } from './lib/supabase/server';

async function main() {
  const supabase = await createClient();
  const result = await supabase.from('shopper_profiles').select('id');
  const d = result.data;
  if (d) {
     d[0].id;
  }
}
