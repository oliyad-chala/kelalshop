alter table shopper_profiles
  add column if not exists is_top_shopper boolean default false;
