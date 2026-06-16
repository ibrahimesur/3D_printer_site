import { createClient } from '@supabase/supabase-js';

// Varsayılan boş URL vererek Next.js dev server çökmelerini önleyelim. 
// Ortam değişkenleri bulunamazsa tarayıcı konsoluna anlamlı hata basalım.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("DIKKAT: NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY bulunamadi! Lutfen .env.local dosyanizi kontrol edin ve yerel sunucuyu yeniden baslatin.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'public-anon-key'
);
