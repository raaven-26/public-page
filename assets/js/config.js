// Supabase Configuration
// Get your credentials from: https://supabase.com/
// 1. Create a free account (no Google required, email only)
// 2. Create a new project
// 3. Go to Project Settings > API Keys
// 4. Copy your anon key and project URL below

const supabaseConfig = {
    url: "https://xqimbrowalyhsohkwsmy.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxaW1icm93YWx5aHNvaGt3c215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTA1OTgsImV4cCI6MjA4NjY2NjU5OH0.l8XHRLFv_gLaHs_-g2v_ZyZt_fEVib7KFDjvfN8FBQU"
};

// If Supabase config is not set, localStorage will be used as fallback
const SUPABASE_ENABLED = supabaseConfig.anonKey !== "YOUR_ANON_KEY";

