import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
const MODEL = 'gemini-2.0-flash';

function getModel() {
  return genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });
}

export interface AIResult {
  sentiment:      'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  topic:          string;
  tags:           string[];
  summary:        string;
  is_answered:    boolean;
  flag_reason:    string | null;
  should_flag:    boolean;
}

export async function analyzeConversation(
  messages: { query: string; answer_text: string | null }[]
): Promise<AIResult> {
  const transcript = messages
    .map((m) => `[USER]: ${m.query}\n[BOT]: ${m.answer_text ?? '(ไม่มีคำตอบ)'}`)
    .join('\n\n');

  const prompt = `You are a conversation analyst for TCEB Thailand. Respond only in valid JSON.

Analyze this chat conversation and return JSON with these exact fields:
{
  "sentiment": "positive"|"neutral"|"negative",
  "sentimentScore": number between -1 and 1,
  "topic": "short topic in Thai or English (max 5 words)",
  "tags": ["array","of","relevant","tags"],
  "summary": "1-2 sentence summary in Thai",
  "is_answered": true if the user question was answered,
  "flag_reason": null or short string if needs attention,
  "should_flag": true if user is frustrated or question unanswered
}

Conversation:
${transcript}`;

  const result = await getModel().generateContent(prompt);
  const text   = result.response.text();

  try {
    return JSON.parse(text) as AIResult;
  } catch {
    // Strip markdown fences if model added them despite responseMimeType
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as AIResult;
  }
}

export async function generateDailySummary(
  date: string,
  stats: Record<string, unknown>
): Promise<string> {
  // Daily summary is freeform text — use default mime type
  const model = genAI.getGenerativeModel({ model: MODEL });

  const prompt = `สร้างรายงานสรุปประจำวันสำหรับ TCEB Chatbot เป็น Markdown ภาษาไทย กระชับไม่เกิน 250 คำ

วันที่: ${date}
ข้อมูล: ${JSON.stringify(stats, null, 2)}

ครอบคลุม: ภาพรวมการใช้งาน, ประเด็นที่น่าสนใจ, conversations ที่ต้องติดตาม, ข้อแนะนำ`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}