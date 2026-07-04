import { NextResponse } from "next/server";
import { loadGridData } from "@/lib/data/loadGridData";

export const revalidate = 300;

export async function GET() {
  try {
    const data = await loadGridData();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "데이터 로드 실패" },
      { status: 500 }
    );
  }
}
