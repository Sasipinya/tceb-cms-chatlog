import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import mysql from 'mysql2/promise';

const TABLE = () => process.env.MYSQL_TABLE || 'tceb_chat_logs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  try {
    const [[row]] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT * FROM ${TABLE()} WHERE id = ? LIMIT 1`,
      [parseInt(id)]
    );
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error('[API/chat/id]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}