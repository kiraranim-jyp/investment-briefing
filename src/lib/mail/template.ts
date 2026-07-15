import type { InvestmentGuide, MarketOverview } from "../types";

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

function indexRow(name: string, value: number, changePct: number): string {
  const color = changePct >= 0 ? "#D93025" : "#1A73E8";
  const sign = changePct >= 0 ? "+" : "";
  return `<td style="padding:8px 12px;text-align:center;">
    <div style="font-size:12px;color:#8A93A6;">${escapeHtml(name)}</div>
    <div style="font-size:15px;font-weight:600;color:#0B0E14;">${value.toFixed(2)}</div>
    <div style="font-size:12px;color:${color};">${sign}${changePct.toFixed(2)}%</div>
  </td>`;
}

function marketOverviewHtml(overview: MarketOverview): string {
  const indices = [...overview.domesticIndices, ...overview.globalIndices];
  return `
  <table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:24px;">
    <tr>${indices.map((i) => indexRow(i.name, i.value, i.changePct)).join("")}</tr>
  </table>
  <p style="font-size:14px;line-height:1.6;color:#333;margin-bottom:24px;">${escapeHtml(overview.summary)}</p>
  `;
}

function guideCardHtml(guide: InvestmentGuide): string {
  const list = (items: string[]) =>
    items.map((s) => `<li style="margin-bottom:4px;">${escapeHtml(s)}</li>`).join("");
  return `
  <div style="border:1px solid #E4E7EC;border-radius:12px;padding:20px;margin-bottom:16px;">
    <div style="font-size:12px;color:#1454FF;font-weight:600;">${escapeHtml(guide.company.name)} · ${guide.company.market}</div>
    <div style="font-size:17px;font-weight:700;margin:6px 0 10px;color:#0B0E14;">${escapeHtml(guide.headline)}</div>
    ${
      guide.alerts.length
        ? `<div style="margin-bottom:10px;padding:8px 10px;background:#FFF4E5;border-radius:8px;font-size:12px;color:#8A5A00;">🔔 ${escapeHtml(guide.alerts.join(" · "))}</div>`
        : ""
    }
    <p style="font-size:14px;color:#333;line-height:1.6;">${escapeHtml(guide.marketContext)}</p>
    ${
      guide.whatsNew.length
        ? `<div style="margin-top:10px;font-size:13px;color:#0B2A73;"><strong>어제와 달라진 점</strong><ul>${list(guide.whatsNew)}</ul></div>`
        : ""
    }
    <table role="presentation" width="100%" style="margin-top:12px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:8px;">
          <div style="font-size:13px;font-weight:600;color:#1A7F37;">강점</div>
          <ul style="font-size:13px;color:#333;padding-left:18px;">${list(guide.strengths)}</ul>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:8px;">
          <div style="font-size:13px;font-weight:600;color:#D93025;">리스크</div>
          <ul style="font-size:13px;color:#333;padding-left:18px;">${list(guide.risks)}</ul>
        </td>
      </tr>
    </table>
    ${
      guide.opinion
        ? `<p style="margin-top:10px;font-size:13px;color:#0B0E14;"><strong>의견:</strong> ${escapeHtml(guide.opinion)}</p>`
        : ""
    }
    <div style="margin-top:10px;font-size:12px;color:#8A93A6;">체크포인트: ${escapeHtml(guide.checkpoints.join(" · "))}</div>
  </div>`;
}

export function renderMorningMail(
  overview: MarketOverview,
  guides: InvestmentGuide[]
): string {
  const dateStr = overview.date;
  return `<!DOCTYPE html>
<html lang="ko">
  <body style="margin:0;background:#F5F6F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" style="max-width:640px;margin:0 auto;background:#fff;">
      <tr><td style="padding:24px;">
        <div style="font-size:13px;color:#1454FF;font-weight:700;letter-spacing:0.5px;">MORNING BRIEFING</div>
        <div style="font-size:20px;font-weight:700;color:#0B0E14;margin-bottom:16px;">${dateStr} 투자 브리핑</div>
        ${marketOverviewHtml(overview)}
        <div style="font-size:15px;font-weight:700;color:#0B0E14;margin-bottom:12px;">워치리스트 투자가이드</div>
        ${guides.map(guideCardHtml).join("")}
        <div style="font-size:11px;color:#B0B6C2;margin-top:24px;">본 메일은 개인 투자 리서치 목적의 자동 생성 콘텐츠이며, 투자 판단의 책임은 본인에게 있습니다.</div>
      </td></tr>
    </table>
  </body>
</html>`;
}
