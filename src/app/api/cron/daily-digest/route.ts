import { NextRequest, NextResponse } from 'next/server';
import { getMysqlStats } from '@/lib/queries';
import { connectMongo } from '@/lib/mongo';
import { SessionMeta } from '@/lib/models';
import { generateDailySummary } from '@/lib/ai';
import { sendDailyDigest } from '@/lib/line';
import { format, subDays } from 'date-fns';

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await getMysqlStats(1);
    await connectMongo();

    const since = subDays(new Date(), 1);
    const [flaggedCount, negativeCount, analyzedCount] = await Promise.all([
      SessionMeta.countDocuments({ is_flagged: true, analyzed_at: { $gte: since } }),
      SessionMeta.countDocuments({ sentiment: 'negative', analyzed_at: { $gte: since } }),
      SessionMeta.countDocuments({ analyzed_at: { $gte: since } }),
    ]);

    const summary = await generateDailySummary(format(since, 'dd/MM/yyyy'), {
      totalMessages: stats.totalMessages,
      totalSessions: stats.totalSessions,
      uniqueUsers:   stats.uniqueUsers,
      analyzedCount,
      flaggedCount,
      negativeCount,
      topUsers:      stats.topUsers.slice(0, 5),
    });

    await sendDailyDigest({
      date:          format(since, 'dd/MM/yyyy'),
      totalMessages: stats.totalMessages,
      totalSessions: stats.totalSessions,
      negativeCount,
      flaggedCount,
      summary,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[cron/daily-digest]', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
