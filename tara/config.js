// Staff scanner — Supabase public config.
// Bu değerler PUBLIC; anon key tablo erişimi vermez (RLS kapalı, sadece SECURITY DEFINER RPC'ler açık).
// Service role key BURAYA ASLA YAZILMAZ.
//
// İlk deploy öncesi bu iki değeri Supabase projenden al ve doldur:
//   Project Settings → API → Project URL  ve  anon / public

window.MFL_TARA_CONFIG = {
    SUPABASE_URL:      'https://sfoimuxbvxbwywujoeoa.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmb2ltdXhidnhid3l3dWpvZW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4NzI0MjcsImV4cCI6MjA5MjQ0ODQyN30.dCDktXFgwXmNOHhxtXmTj08L_wDBFqvlBcylAIoB26M'
};
