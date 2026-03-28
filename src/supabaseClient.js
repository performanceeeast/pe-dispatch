import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ukcutvkaxhrgyxkwitro.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrY3V0dmtheGhyZ3l4a3dpdHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MjAzMjMsImV4cCI6MjA5MDI5NjMyM30._iXaMPTT-UztmAdbOXBb9j8Tn4ClzYxynoWBikuR6XI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
