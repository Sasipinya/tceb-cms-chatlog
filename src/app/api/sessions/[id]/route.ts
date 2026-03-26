import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getConversation } from '@/lib/queries';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const conversationId = decodeURIComponent(id);

  console.log('querying conversation_id:', conversationId);

  try {
    const messages = await getConversation(conversationId);
    console.log('found:', messages.length, 'messages');
    if (!messages.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(messages);
  } catch (e) {
    console.error('[API/sessions/id]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}