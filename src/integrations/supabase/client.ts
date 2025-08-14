import { createClient } from '@supabase/supabase-js';

// Using a mock client for development
const supabaseUrl = 'https://ducjznmujphbwcswhmrq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Y2p6bm11anBoYndjc3dobXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzQwNTYsImV4cCI6MjA3MDcxMDA1Nn0.g3hJ5haJCnmDIDpTzW8Z3-FSNxdmepUydWyFefvOlBo';

// Mock Supabase client for development
export const supabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        order: (column: string, options?: any) => ({
          limit: (count: number) => ({
            then: (fn: (result: any) => void) => fn({ data: [], error: null })
          }),
          then: (fn: (result: any) => void) => fn({ data: [], error: null })
        }),
        single: () => ({
          then: (fn: (result: any) => void) => fn({ data: null, error: { code: 'PGRST116' } })
        }),
        then: (fn: (result: any) => void) => fn({ data: [], error: null })
      }),
      order: (column: string, options?: any) => ({
        limit: (count: number) => ({
          then: (fn: (result: any) => void) => fn({ data: [], error: null })
        }),
        then: (fn: (result: any) => void) => fn({ data: [], error: null })
      }),
      then: (fn: (result: any) => void) => fn({ data: [], error: null })
    }),
    upsert: (data: any, options?: any) => ({
      then: (fn: (result: any) => void) => fn({ error: null })
    })
  })
};