import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ducjznmujphbwcswhmrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y2p6bm11anBoYndjc3dobXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzQwNTYsImV4cCI6MjA3MDcxMDA1Nn0.g3hJ5haJCnmDIDpTzW8Z3-FSNxdmepUydWyFefvOlBo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);