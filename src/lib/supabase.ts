import { createBrowserClient as ssrBrowser } from '@supabase/ssr';

/**
 * Client-side Supabase.
 * Seguro para Client Components ('use client') — não importa next/headers.
 */
export const createBrowserClient = () =>
  ssrBrowser(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
