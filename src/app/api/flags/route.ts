import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectMongo } from '@/lib/mongo';
import { ChatFlag } from '@/lib/models';

// GET /api/flags?chat_ids=1,2,3  — batch check flags
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const idsParam = req.nextUrl.searchParams.get('chat_ids') ?? '';
  if (!idsParam) return NextResponse.json([]);

  const ids = idsParam.split(',').map(Number).filter(Boolean);
  await connectMongo();

  const flags = await ChatFlag.find({
    chat_id:    { $in: ids },
    is_flagged: true,
  }).lean();

  return NextResponse.json(flags);
}

// POST /api/flags — toggle flag
export async function POST(req: NextRequest) {
  const authSession = await getServerSession(authOptions);
  if (!authSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { chat_id, conversation_id, reason } = body;

  if (!chat_id) return NextResponse.json({ error: 'chat_id required' }, { status: 400 });

  await connectMongo();

  const adminEmail = (authSession.user as { email?: string })?.email ?? 'admin';

  // Toggle: ถ้ามีอยู่แล้วให้ unflag, ถ้าไม่มีให้ flag
  const existing = await ChatFlag.findOne({ chat_id });

  if (existing) {
    const updated = await ChatFlag.findOneAndUpdate(
      { chat_id },
      { is_flagged: !existing.is_flagged },
      { new: true }
    ).lean();
    return NextResponse.json(updated);
  }

  const created = await ChatFlag.create({
    chat_id,
    conversation_id,
    reason:     reason ?? '',
    flagged_by: adminEmail,
    is_flagged: true,
  });

  return NextResponse.json(created);
}