import { Resend } from "resend";
import type { InvestmentGuide, MarketOverview } from "../types";
import { renderMorningMail } from "./template";

export async function sendMorningMail(
  overview: MarketOverview,
  guides: InvestmentGuide[]
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  const to = process.env.MAIL_TO;
  if (!apiKey || !from || !to) {
    throw new Error("RESEND_API_KEY / MAIL_FROM / MAIL_TO 환경변수가 필요합니다.");
  }

  const resend = new Resend(apiKey);
  const html = renderMorningMail(overview, guides);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: `[투자 브리핑] ${overview.date} 모닝 브리핑`,
    html,
  });
  if (error) {
    throw new Error(`메일 발송 실패: ${error.message}`);
  }
}
