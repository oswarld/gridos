"use client";

// Supabase 브라우저 클라이언트 (지연 로딩)
// supabase-js를 모듈 최상위에서 import하면 SSR(Node 20)에서 realtime의
// WebSocket 초기화가 실패하므로, 브라우저에서 처음 필요할 때 동적 import한다.

import type { SupabaseClient } from "@supabase/supabase-js";

let clientPromise: Promise<SupabaseClient | null> | null = null;

export function getSupabaseBrowser(): Promise<SupabaseClient | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = (async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) return null;
      const { createClient } = await import("@supabase/supabase-js");
      return createClient(url, key, {
        auth: { persistSession: true, detectSessionInUrl: true, autoRefreshToken: true },
      });
    })();
  }
  return clientPromise;
}
