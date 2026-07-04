"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/auth/browserClient";

export default function AuthModal({
  open,
  reason,
  onClose,
}: {
  open: boolean;
  reason: "quota" | "manual";
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!open) return null;

  const sendLink = async () => {
    if (!email.includes("@")) {
      setErrorMsg("올바른 이메일 주소를 입력해 주세요.");
      setState("error");
      return;
    }
    setState("sending");
    setErrorMsg(null);
    const supabase = await getSupabaseBrowser();
    if (!supabase) {
      setErrorMsg("인증 설정이 없어 로그인할 수 없습니다.");
      setState("error");
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setErrorMsg(error.message);
      setState("error");
    } else {
      setState("sent");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="이메일 로그인"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[28px] bg-canvas p-8 shadow-[rgba(5,0,56,0.12)_0px_16px_48px_-8px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="inline-flex items-center rounded-full bg-surface-yellow px-2.5 py-1 text-[13px] font-semibold text-yellow-dark">
          이메일 로그인
        </div>
        <h3 className="mt-4 text-[22px] font-medium leading-[1.3] text-ink">
          {reason === "quota" ? "무료 실행 3회를 모두 사용했어요" : "로그인"}
        </h3>
        <p className="mt-2 text-[14px] leading-[1.5] text-slate2">
          이메일 주소로 로그인 링크를 보내드립니다. 별도 비밀번호 없이 메일의 링크를 누르면
          로그인되고, 시나리오를 제한 없이 실행할 수 있습니다.
        </p>

        {state === "sent" ? (
          <div className="mt-6 rounded-xl bg-teal-light p-4 text-[14px] leading-[1.5] text-moss">
            <span className="font-semibold">{email}</span> 주소로 로그인 링크를 보냈습니다.
            메일함(스팸함 포함)을 확인해 주세요. 링크를 누르면 이 페이지로 돌아옵니다.
          </div>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendLink()}
              placeholder="name@example.com"
              className="mt-6 h-11 w-full rounded-lg border border-hairline-strong px-4 text-[16px] text-ink outline-none placeholder:text-muted2 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
              aria-label="이메일 주소"
            />
            {errorMsg && <p className="mt-2 text-[13px] text-coral-dark">{errorMsg}</p>}
            <button
              onClick={sendLink}
              disabled={state === "sending"}
              className="mt-4 w-full rounded-full bg-ink px-6 py-3 text-[14px] font-medium text-white transition hover:bg-charcoal disabled:bg-hairline disabled:text-muted2"
            >
              {state === "sending" ? "전송 중..." : "로그인 링크 받기"}
            </button>
          </>
        )}

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-full border border-hairline-strong px-6 py-3 text-[14px] font-medium text-ink transition hover:bg-surface"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
