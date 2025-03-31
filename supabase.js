const supabaseUrl = 'https://bvtmoiqetuilyxedcfoz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dG1vaXFldHVpbHl4ZWRjZm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTA2MDEsImV4cCI6MjA1OTAyNjYwMX0.TklmkdwCDwV59vNm0qa8F9SYIlR998uGShfNlPx3Tmk';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

export default supabase;