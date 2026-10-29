import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://hpiljububwgycwhrubkz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwaWxqdWJ1YndneWN3aHJ1Ymt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTA2MDQsImV4cCI6MjEwMjU2NjYwNH0.0APGaI3qiLuN7ObUO09OoAUJMY8xbtBsIRBovWXSDjA';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL).trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY).trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder-project') &&
    !supabaseAnonKey.includes('placeholder-anon-key')
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


