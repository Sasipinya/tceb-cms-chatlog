import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';
import mysql from 'mysql2/promise';
import type { ChatFilters } from '@/types';

const TABLE = () => process.env.MYSQL_TABLE || 'tceb_chat_logs';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const filters: ChatFilters = {
    search:       sp.get('search')       ?? '',
    tceb_user_id: sp.get('tceb_user_id') ?? '',
    dateFrom:     sp.get('dateFrom')     ?? '',
    dateTo:       sp.get('dateTo')       ?? '',
    page:     parseInt(sp.get('page')     ?? '1'),
    pageSize: parseInt(sp.get('pageSize') ?? '20'),
  };

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.search) {
    conditions.push('(query LIKE ? OR answer_text LIKE ?)');
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  if (filters.tceb_user_id) {
    conditions.push('tceb_user_id = ?');
    params.push(parseInt(filters.tceb_user_id));
  }
  if (filters.dateFrom) {
    conditions.push('created_at >= ?');
    params.push(filters.dateFrom + ' 00:00:00');
  }
  if (filters.dateTo) {
    conditions.push('created_at <= ?');
    params.push(filters.dateTo + ' 23:59:59');
  }

  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = ((filters.page ?? 1) - 1) * (filters.pageSize ?? 20);

  try {
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT * FROM ${TABLE()} ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, filters.pageSize ?? 20, offset]
    );
    const [[countRow]] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM ${TABLE()} ${where}`,
      params
    );

    return NextResponse.json({
      data:       rows,
      total:      countRow.total as number,
      page:       filters.page,
      pageSize:   filters.pageSize,
      totalPages: Math.ceil((countRow.total as number) / (filters.pageSize ?? 20)),
    });
  } catch (e) {
    console.error('[API/sessions]', e);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}