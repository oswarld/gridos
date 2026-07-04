import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

// 시나리오 실행 쿼터: 비로그인 사용자는 IP당 하루 3회, 로그인 사용자는 무제한.
// IP는 원문을 저장하지 않고 해시로만 카운트한다 (개인정보 미저장).
const FREE_RUNS_PER_DAY = 3;

type QuotaResponse = {
  allowed: boolean;
  remaining: number | null; // null = 무제한
  requiresAuth: boolean;
  signedIn: boolean;
};

function ipKeyOf(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd ? fwd.split(",")[0] : "local").trim() || "local";
  const salt = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "gridos";
  const hash = createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 24);
  const day = new Date().toISOString().slice(0, 10);
  return `scenario:${day}:${hash}`;
}

async function verifySignedIn(req: Request): Promise<boolean> {
  const auth = req.headers.get("authorization");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!auth?.startsWith("Bearer ") || !url || !anon) return false;
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: auth },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const user = (await res.json()) as { id?: string };
    return !!user?.id;
  } catch {
    return false;
  }
}

async function serviceHeaders(): Promise<{ url: string; headers: Record<string, string> } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return {
    url,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  };
}

async function readCount(key: string): Promise<number | null> {
  const svc = await serviceHeaders();
  if (!svc) return null;
  const res = await fetch(
    `${svc.url}/rest/v1/usage_counters?key=eq.${encodeURIComponent(key)}&select=count`,
    { headers: svc.headers, cache: "no-store" }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as { count: number }[];
  return rows[0]?.count ?? 0;
}

/** 현재 남은 횟수 조회 (카운트 증가 없음) */
export async function GET(req: Request) {
  const signedIn = await verifySignedIn(req);
  if (signedIn) {
    return NextResponse.json<QuotaResponse>({ allowed: true, remaining: null, requiresAuth: false, signedIn: true });
  }
  const count = await readCount(ipKeyOf(req));
  if (count === null) {
    // 카운터 저장소 미설정 시 차단하지 않는다 (데모 연속성 우선)
    return NextResponse.json<QuotaResponse>({ allowed: true, remaining: FREE_RUNS_PER_DAY, requiresAuth: false, signedIn: false });
  }
  const remaining = Math.max(0, FREE_RUNS_PER_DAY - count);
  return NextResponse.json<QuotaResponse>({
    allowed: remaining > 0,
    remaining,
    requiresAuth: remaining <= 0,
    signedIn: false,
  });
}

/** 시나리오 실행 1회 소비 */
export async function POST(req: Request) {
  const signedIn = await verifySignedIn(req);
  if (signedIn) {
    return NextResponse.json<QuotaResponse>({ allowed: true, remaining: null, requiresAuth: false, signedIn: true });
  }
  const svc = await serviceHeaders();
  if (!svc) {
    return NextResponse.json<QuotaResponse>({ allowed: true, remaining: FREE_RUNS_PER_DAY, requiresAuth: false, signedIn: false });
  }
  const key = ipKeyOf(req);
  const current = (await readCount(key)) ?? 0;
  if (current >= FREE_RUNS_PER_DAY) {
    return NextResponse.json<QuotaResponse>({ allowed: false, remaining: 0, requiresAuth: true, signedIn: false });
  }
  const res = await fetch(`${svc.url}/rest/v1/rpc/increment_usage`, {
    method: "POST",
    headers: svc.headers,
    body: JSON.stringify({ p_key: key }),
  });
  if (!res.ok) {
    console.error("[scenario-run] increment 실패:", res.status, await res.text());
    return NextResponse.json<QuotaResponse>({ allowed: true, remaining: null, requiresAuth: false, signedIn: false });
  }
  const newCount = (await res.json()) as number;
  const remaining = Math.max(0, FREE_RUNS_PER_DAY - newCount);
  return NextResponse.json<QuotaResponse>({
    allowed: newCount <= FREE_RUNS_PER_DAY,
    remaining,
    requiresAuth: newCount > FREE_RUNS_PER_DAY,
    signedIn: false,
  });
}
