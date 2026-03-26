import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectMongo } from '@/lib/mongo';
import { AuditLog } from '@/lib/models';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sp         = req.nextUrl.searchParams;
  const page       = parseInt(sp.get('page')     ?? '1');
  const pageSize   = parseInt(sp.get('pageSize') ?? '30');
  const userEmail  = sp.get('user_email') ?? '';
  const action     = sp.get('action')     ?? '';
  const dateFrom   = sp.get('dateFrom')   ?? '';
  const dateTo     = sp.get('dateTo')     ?? '';

  await connectMongo();

  const query: Record<string, unknown> = {};
  if (userEmail) query.user_email = { $regex: userEmail, $options: 'i' };
  if (action)    query.action     = action;
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) (query.createdAt as any).$gte = new Date(dateFrom + 'T00:00:00');
    if (dateTo)   (query.createdAt as any).$lte = new Date(dateTo   + 'T23:59:59');
  }

  const [data, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    AuditLog.countDocuments(query),
  ]);

  return NextResponse.json({ data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}