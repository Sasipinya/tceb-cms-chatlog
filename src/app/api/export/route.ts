import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { exportChatLogs } from '@/lib/queries';
import { connectMongo } from '@/lib/mongo';
import { SessionMeta } from '@/lib/models';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  const format = sp.get('format') ?? 'csv';
  try {
    const rows = await exportChatLogs({ search: sp.get('search') ?? '', tceb_user_id: sp.get('tceb_user_id') ?? '', dateFrom: sp.get('dateFrom') ?? '', dateTo: sp.get('dateTo') ?? '' });
    await connectMongo();
    const convIds = [...new Set(rows.map((r) => r.conversation_id))];
    const metas   = await SessionMeta.find({ conversation_id: { $in: convIds } }).lean();
    const metaMap = new Map(metas.map((m) => [m.conversation_id, m]));
    const data = rows.map((r) => {
      const m = metaMap.get(r.conversation_id);
      return { id: r.id, tceb_user_id: r.tceb_user_id ?? '', conversation_id: r.conversation_id, query: r.query, answer_text: r.answer_text ?? '', created_at: r.created_at ?? '', sentiment: m?.sentiment ?? '', topic: m?.topic ?? '', tags: (m?.tags ?? []).join(', '), is_answered: m?.is_answered != null ? (m.is_answered ? 'Yes' : 'No') : '', is_flagged: m?.is_flagged ? 'Yes' : 'No', summary: m?.summary ?? '' };
    });
    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Chat Logs');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      return new NextResponse(buf, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Content-Disposition': 'attachment; filename="tceb-chatlogs.xlsx"' } });
    }
    const header = Object.keys(data[0] ?? {}).join(',') + '\n';
    const csv = header + data.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="tceb-chatlogs.csv"' } });
  } catch (e) {
    console.error('[API/export]', e);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
