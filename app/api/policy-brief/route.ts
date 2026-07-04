import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { loadGridData } from "@/lib/data/loadGridData";
import { buildRuleBasedBrief } from "@/lib/domain/policyBrief";
import type { PolicyBriefRequest, PolicyBriefResponse } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: PolicyBriefRequest;
  try {
    body = (await req.json()) as PolicyBriefRequest;
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }
  if (!body?.scenario || !Array.isArray(body?.topRegions)) {
    return NextResponse.json({ error: "scenario / topRegions 필요" }, { status: 400 });
  }

  const data = await loadGridData();
  // 숫자·순위·판정은 전부 규칙 기반 생성기가 만든다.
  const ruleBased = buildRuleBasedBrief(body.scenario, body.topRegions, data);

  // LLM은 선택 사항: 계산 결과 텍스트를 입력으로 받아 문장만 다듬는다.
  // 숫자를 새로 만들지 않도록 규칙 기반 본문을 그대로 전달한다.
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic();
      const response = await client.messages.create({
        model: process.env.MODEL || "claude-sonnet-5",
        max_tokens: 2048,
        thinking: { type: "adaptive" },
        system:
          "당신은 산업통상부 전력 정책 브리프 편집자입니다. 아래 계산 결과를 바탕으로 정책 담당자용 브리프를 한국어로 작성하세요. " +
          "규칙: (1) 입력에 없는 숫자, 점수, 순위, 지역명을 절대 만들지 마세요. (2) 입력의 수치는 그대로 인용하세요. " +
          "(3) '사용자 입력 시나리오'와 '공공데이터 기반 계산 결과'를 구분해 표기하세요. (4) 근거 데이터 목록은 유지하세요. " +
          "(5) 마크다운 문법(#, |, *, ---)을 쓰지 말고 ■, - 기호와 줄바꿈만 사용하는 일반 텍스트로 작성하세요.",
        messages: [{ role: "user", content: ruleBased }],
      });
      if (response.stop_reason !== "refusal") {
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n");
        if (text.trim()) {
          const out: PolicyBriefResponse = { generator: "llm", content: text };
          return NextResponse.json(out);
        }
      }
    } catch (e) {
      console.error("[policy-brief] LLM 생성 실패, 규칙 기반으로 폴백:", e);
    }
  }

  const out: PolicyBriefResponse = { generator: "rule_based", content: ruleBased };
  return NextResponse.json(out);
}
