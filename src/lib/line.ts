const TOKEN  = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const GROUP  = process.env.LINE_NOTIFY_GROUP_ID;
const BASE   = process.env.NEXTAUTH_URL || 'http://localhost:3000';

async function push(text: string) {
  if (!TOKEN || !GROUP) {
    console.warn('[Line] Not configured — skipping');
    return;
  }
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ to: GROUP, messages: [{ type: 'text', text }] }),
  });
  if (!res.ok) console.error('[Line] push failed:', await res.text());
}

export async function notifyNegativeSentiment(params: {
  conversationId: string;
  summary:        string;
  flagReason?:    string;
}) {
  await push([
    '🔴 Negative Sentiment Alert',
    `Conversation: ${params.conversationId}`,
    params.flagReason ? `เหตุผล: ${params.flagReason}` : '',
    `สรุป: ${params.summary}`,
    `🔗 ${BASE}/sessions/${encodeURIComponent(params.conversationId)}`,
  ].filter(Boolean).join('\n'));
}

export async function notifyKeywordAlert(params: {
  conversationId: string;
  keyword:        string;
  excerpt:        string;
}) {
  await push([
    `⚠️ Keyword Alert: "${params.keyword}"`,
    `Conversation: ${params.conversationId}`,
    `ข้อความ: ${params.excerpt.slice(0, 120)}`,
    `🔗 ${BASE}/sessions/${encodeURIComponent(params.conversationId)}`,
  ].join('\n'));
}

export async function sendDailyDigest(params: {
  date:           string;
  totalMessages:  number;
  totalSessions:  number;
  negativeCount:  number;
  flaggedCount:   number;
  summary:        string;
}) {
  await push([
    `📊 TCEB Chatbot Daily Report — ${params.date}`,
    `Messages: ${params.totalMessages}  |  Sessions: ${params.totalSessions}`,
    `Negative: ${params.negativeCount}  |  Flagged: ${params.flaggedCount}`,
    '',
    params.summary.slice(0, 300),
    `🔗 ${BASE}/dashboard`,
  ].join('\n'));
}

export const ALERT_KEYWORDS = [
  'ร้องเรียน', 'ไม่พอใจ', 'แย่มาก', 'ติดต่อไม่ได้',
  'เสียหาย', 'ยกเลิก', 'โกรธ', 'หลอก',
];

export function findAlertKeyword(text: string): string | null {
  return ALERT_KEYWORDS.find((kw) => text.includes(kw)) ?? null;
}
