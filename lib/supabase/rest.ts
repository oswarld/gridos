// Supabase PostgREST 경량 클라이언트 (fetch 기반)
// supabase-js의 realtime 의존(Node 22 WebSocket)을 피하기 위해 REST를 직접 호출한다.

export type RestConfig = { url: string; key: string };

export function restConfigFromEnv(): RestConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export async function restSelect<T>(cfg: RestConfig, table: string, query = ""): Promise<T[]> {
  const res = await fetch(`${cfg.url}/rest/v1/${table}?${query}`, {
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
    // 공공데이터는 시드 시점에만 바뀌므로 요청 단위 캐시 허용
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Supabase select ${table} 실패: ${res.status} ${await res.text()}`);
  return (await res.json()) as T[];
}

export async function restInsert(cfg: RestConfig, table: string, rows: unknown[]): Promise<void> {
  if (rows.length === 0) return;
  const res = await fetch(`${cfg.url}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase insert ${table} 실패: ${res.status} ${await res.text()}`);
}

export async function restDeleteAll(cfg: RestConfig, table: string, pkCol: string): Promise<void> {
  const res = await fetch(`${cfg.url}/rest/v1/${table}?${pkCol}=not.is.null`, {
    method: "DELETE",
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, Prefer: "return=minimal" },
  });
  if (!res.ok) throw new Error(`Supabase delete ${table} 실패: ${res.status} ${await res.text()}`);
}
