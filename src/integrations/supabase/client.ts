import { createClient } from '@supabase/supabase-js';

// Using a mock client for development
const supabaseUrl = 'https://mock-project.supabase.co';
const supabaseAnonKey = 'mock-key';

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