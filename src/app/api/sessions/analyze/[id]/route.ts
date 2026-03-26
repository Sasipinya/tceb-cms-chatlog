import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getConversation } from '@/lib/queries';
import { analyzeConversation } from '@/lib/ai';
import { connectMongo } from '@/lib/mongo';
import { SessionMeta, AnalyzeLog } from '@/lib/models';
import { notifyNegativeSentiment, findAlertKeyword, notifyKeywordAlert } from '@/lib/line';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authSession = await getServerSession(authOptions);
  if (!authSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const conversationId = decodeURIComponent(id);

  // รับ chat_id จาก body (optional — ส่งมาจาก /chat/[id] page)
  let chatId: number | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    chatId = body.chat_id;
  } catch { /* ignore */ }

  const adminEmail = (authSession.user as { email?: string })?.email ?? 'admin';
  const startTime  = Date.now();

  await connectMongo();

  try {
    const messages = await getConversation(conversationId);
    if (!messages.length) {
      return NextResponse.json({ error: 'No messages found' }, { status: 404 });
    }

    const result = await analyzeConversation(
      messages.map((m) => ({ query: m.query, answer_text: m.answer_text }))
    );

    const duration = Date.now() - startTime;

    // ── บันทึก SessionMeta ────────────────────────────────────────────────
    const meta = await SessionMeta.findOneAndUpdate(
      { conversation_id: conversationId },
      {
        conversation_id: conversationId,
        sentiment:       result.sentiment,
        sentimentScore:  result.sentimentScore,
        topic:           result.topic,
        tags:            result.tags,
        summary:         result.summary,
        is_answered:     result.is_answered,
        is_flagged:      result.should_flag,
        flag_reason:     result.flag_reason ?? undefined,
        analyzed_at:     new Date(),
      },
      { upsert: true, new: true }
    ).lean();

    // ── บันทึก AnalyzeLog ─────────────────────────────────────────────────
    await AnalyzeLog.create({
      conversation_id: conversationId,
      chat_id:         chatId,
      triggered_by:    'manual',
      admin_email:     adminEmail,
      model:           process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
      result: {
        sentiment:      result.sentiment,
        sentimentScore: result.sentimentScore,
        topic:          result.topic,
        tags:           result.tags,
        summary:        result.summary,
        is_answered:    result.is_answered,
        flag_reason:    result.flag_reason,
        should_flag:    result.should_flag,
      },
      success:     true,
      duration_ms: duration,
    });

    // ── Line notifications ────────────────────────────────────────────────
    if (result.sentiment === 'negative' || result.should_flag) {
      await notifyNegativeSentiment({
        conversationId,
        summary:    result.summary,
        flagReason: result.flag_reason ?? undefined,
      });
    }
    const firstQuery = messages[0]?.query ?? '';
    const kw = findAlertKeyword(firstQuery);
    if (kw) {
      await notifyKeywordAlert({ conversationId, keyword: kw, excerpt: firstQuery });
    }

    return NextResponse.json({ meta, analysis: result, duration_ms: duration });

  } catch (e) {
    const duration = Date.now() - startTime;

    // ── บันทึก error log ──────────────────────────────────────────────────
    await AnalyzeLog.create({
      conversation_id: conversationId,
      chat_id:         chatId,
      triggered_by:    'manual',
      admin_email:     adminEmail,
      model:           process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
      success:         false,
      error_msg:       String(e),
      duration_ms:     duration,
    }).catch(() => {}); // ไม่ให้ log error ทำให้ response พัง

    console.error('[API/analyze]', e);
    return NextResponse.json({ error: 'Analysis failed', details: String(e) }, { status: 500 });
  }
}