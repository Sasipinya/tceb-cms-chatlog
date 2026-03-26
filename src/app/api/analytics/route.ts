import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getMysqlStats } from '@/lib/queries';
import { connectMongo } from '@/lib/mongo';
import { SessionMeta } from '@/lib/models';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp       = req.nextUrl.searchParams;
  const dateFrom = sp.get('dateFrom') ?? '';
  const dateTo   = sp.get('dateTo')   ?? '';

  try {
    const mysqlStats = await getMysqlStats(dateFrom, dateTo);
    await connectMongo();

    const since = dateFrom ? new Date(dateFrom + 'T00:00:00') : new Date(Date.now() - 30 * 86400000);
    const until = dateTo   ? new Date(dateTo   + 'T23:59:59') : new Date();

    const sentimentAgg = await SessionMeta.aggregate([
      { $match: { analyzed_at: { $gte: since, $lte: until } } },
      { $group: { _id: '$sentiment', count: { $sum: 1 } } },
    ]);
    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
    for (const r of sentimentAgg) {
      if (r._id in sentimentBreakdown) sentimentBreakdown[r._id as keyof typeof sentimentBreakdown] = r.count;
    }

    const topicsAgg = await SessionMeta.aggregate([
      { $match: { topic: { $exists: true, $ne: null }, analyzed_at: { $gte: since, $lte: until } } },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 10 },
    ]);
    const topTopics = topicsAgg.map((t) => ({ topic: t._id as string, count: t.count as number }));

    const [analyzedCount, flaggedCount, negativeCount] = await Promise.all([
      SessionMeta.countDocuments({ analyzed_at: { $gte: since, $lte: until } }),
      SessionMeta.countDocuments({ is_flagged: true, analyzed_at: { $gte: since, $lte: until } }),
      SessionMeta.countDocuments({ sentiment: 'negative', analyzed_at: { $gte: since, $lte: until } }),
    ]);

    return NextResponse.json({ ...mysqlStats, analyzedCount, flaggedCount, negativeCount, sentimentBreakdown, topTopics });
  } catch (e) {
    console.error('[API/analytics]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}