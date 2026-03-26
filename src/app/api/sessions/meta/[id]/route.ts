import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectMongo } from '@/lib/mongo';
import { SessionMeta } from '@/lib/models';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const conversationId = decodeURIComponent(id);

  await connectMongo();
  const meta = await SessionMeta.findOne({ conversation_id: conversationId }).lean();
  return NextResponse.json(meta ?? { conversation_id: conversationId, tags: [], admin_notes: [] });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authSession = await getServerSession(authOptions);
  if (!authSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const conversationId = decodeURIComponent(id);
  const body = await req.json();
  await connectMongo();

  if (body.note) {
    const meta = await SessionMeta.findOneAndUpdate(
      { conversation_id: conversationId },
      {
        $setOnInsert: { conversation_id: conversationId, tags: [] },
        $push: {
          admin_notes: {
            authorEmail: (authSession.user as { email?: string })?.email ?? 'admin',
            text: body.note,
            createdAt: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    ).lean();
    return NextResponse.json(meta);
  }

  const allowed = ['tags', 'is_flagged', 'flag_reason', 'topic'];
  const update: Record<string, unknown> = { conversation_id: conversationId };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const meta = await SessionMeta.findOneAndUpdate(
    { conversation_id: conversationId },
    { $set: update },
    { upsert: true, new: true }
  ).lean();
  return NextResponse.json(meta);
}