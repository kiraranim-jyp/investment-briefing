import type { Market } from "./types";

export function companyId(name: string, market: Market): string {
  return `${market}:${name.trim().toLowerCase()}`;
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  const visible = user.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(user.length - 2, 1))}@${domain}`;
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * fetchWithTimeout의 AbortController는 fetch()가 resolve되는 즉시(=응답 헤더 수신 시점) 해제된다.
 * 이후 res.arrayBuffer()/json()/text()로 본문을 읽는 단계는 별도 보호가 없어, 헤더는 빨리 오지만
 * 본문 전송이 느리거나 멈추는 서버(대용량 응답을 주는 일부 공공 API 등)를 만나면 무한정 대기할 수
 * 있다. 본문 읽기 + 후처리까지 포함한 전체 작업에 하드 데드라인을 씌우기 위한 범용 유틸.
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label = "operation"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} 시간 초과 (${timeoutMs}ms)`));
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}
