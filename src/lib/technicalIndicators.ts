import type { TechnicalIndicators } from "./types";

// 모든 함수는 종가 배열(과거→최신 순)을 받는다. AI를 쓰지 않고 표준 공식으로 결정적으로 계산한다.

function sma(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const window = values.slice(values.length - period);
  return window.reduce((a, b) => a + b, 0) / period;
}

function stddev(values: number[], period: number, mean: number): number | null {
  if (values.length < period) return null;
  const window = values.slice(values.length - period);
  const variance = window.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
  return Math.sqrt(variance);
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  values.forEach((v, i) => {
    if (i === 0) {
      result.push(v);
    } else {
      result.push(v * k + result[i - 1] * (1 - k));
    }
  });
  return result;
}

function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null;
  const recent = values.slice(values.length - (period + 1));
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum += -diff;
  }
  const avgGain = gainSum / period;
  const avgLoss = lossSum / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function macd(values: number[]): { value: number; signal: number; histogram: number } | null {
  if (values.length < 35) return null; // 26(EMA) + 9(signal) 최소치
  const ema12 = ema(values, 12);
  const ema26 = ema(values, 26);
  const macdLine = values.map((_, i) => ema12[i] - ema26[i]);
  // MACD 라인이 26개 미만 구간은 EMA26이 충분히 안정화되지 않아 신뢰도가 낮으므로 뒤쪽만 사용
  const stableMacd = macdLine.slice(25);
  const signalLine = ema(stableMacd, 9);
  const value = macdLine[macdLine.length - 1];
  const signal = signalLine[signalLine.length - 1];
  return { value, signal, histogram: value - signal };
}

function trendLabel(params: {
  price: number;
  sma20: number | null;
  sma50: number | null;
  rsiValue: number | null;
  macdHistogram: number | null;
}): string {
  const { price, sma20, sma50, rsiValue, macdHistogram } = params;
  const signals: string[] = [];

  if (sma20 != null && sma50 != null) {
    if (price > sma20 && sma20 > sma50) signals.push("상승추세");
    else if (price < sma20 && sma20 < sma50) signals.push("하락추세");
    else signals.push("횡보");
  }

  if (rsiValue != null) {
    if (rsiValue >= 70) signals.push("과매수");
    else if (rsiValue <= 30) signals.push("과매도");
  }

  if (macdHistogram != null) {
    signals.push(macdHistogram >= 0 ? "MACD 상승모멘텀" : "MACD 하락모멘텀");
  }

  return signals.length ? signals.join(" · ") : "판단 데이터 부족";
}

export function computeTechnicalIndicators(closes: number[]): TechnicalIndicators | null {
  if (closes.length < 20) return null; // 볼린저/SMA20 최소 요구치

  const price = closes[closes.length - 1];
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const rsiValue = rsi(closes, 14);
  const macdResult = macd(closes);
  const bollingerMid = sma20;
  const bollingerStd = bollingerMid != null ? stddev(closes, 20, bollingerMid) : null;

  return {
    rsi14: rsiValue,
    macd: macdResult,
    bollinger:
      bollingerMid != null && bollingerStd != null
        ? { upper: bollingerMid + 2 * bollingerStd, middle: bollingerMid, lower: bollingerMid - 2 * bollingerStd }
        : null,
    sma20,
    sma50,
    trendLabel: trendLabel({ price, sma20, sma50, rsiValue, macdHistogram: macdResult?.histogram ?? null }),
  };
}
