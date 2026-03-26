import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectMongo } from '@/lib/mongo';
import { AnalyzeLog } from '@/lib/models';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp   = req.nextUrl.searchParams;
  const page = parseInt(sp.get('page') ?? '1');
  const size = parseInt(sp.get('pageSize') ?? '20');
  const conversationId = sp.get('conversation_id') ?? '';
  const onlyFailed     = sp.get('failed') === 'true';

  await connectMongo();

  const query: Record<string, unknown> = {};
  if (conversationId) query.conversation_id = conversationId;
  if (onlyFailed)     query.success = false;

  const [data, total] = await Promise.all([
    AnalyzeLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * size)
      .limit(size)
      .lean(),
    AnalyzeLog.countDocuments(query),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    pageSize: size,
    totalPages: Math.ceil(total / size),
  });
}