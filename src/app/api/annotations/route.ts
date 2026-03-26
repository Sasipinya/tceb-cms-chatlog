import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const LARAVEL_BASE = 'https://cms-tvai.terodigital.com';
const LARAVEL_TOKEN = process.env.LARAVEL_API_TOKEN ?? '';

function laravelHeaders() {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${LARAVEL_TOKEN}`,
  };
}

// GET /api/annotations — ดึง annotations ทั้งหมด
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const page  = req.nextUrl.searchParams.get('page')  ?? '1';
  const limit = req.nextUrl.searchParams.get('limit') ?? '100';

  try {
    const res  = await fetch(`${LARAVEL_BASE}/api/tceb-annotations?page=${page}&limit=${limit}`, {
      headers: laravelHeaders(),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[annotations GET]', e);
    return NextResponse.json({ error: 'Failed to fetch annotations' }, { status: 500 });
  }
}

// POST /api/annotations — เพิ่ม annotation ใหม่
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  try {
    const res  = await fetch(`${LARAVEL_BASE}/api/tceb-add-annotation`, {
      method:  'POST',
      headers: laravelHeaders(),
      body:    JSON.stringify({ question: body.question, answer: body.answer }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[annotations POST]', e);
    return NextResponse.json({ error: 'Failed to add annotation' }, { status: 500 });
  }
}

// PUT /api/annotations — อัปเดต annotation
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  try {
    const res  = await fetch(`${LARAVEL_BASE}/api/tceb-update-annotation/${body.id}`, {
      method:  'PUT',
      headers: laravelHeaders(),
      body:    JSON.stringify({ id: body.id, question: body.question, answer: body.answer }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[annotations PUT]', e);
    return NextResponse.json({ error: 'Failed to update annotation' }, { status: 500 });
  }
}