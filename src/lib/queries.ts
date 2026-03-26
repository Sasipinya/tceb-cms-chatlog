import pool from './db';
import mysql from 'mysql2/promise';
import type { IChatLog, ISession, ChatFilters } from '@/types';

const TABLE = () => process.env.MYSQL_TABLE || 'tceb_chat_logs';

function buildWhere(f: ChatFilters) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (f.search)       { conditions.push('(query LIKE ? OR answer_text LIKE ?)'); params.push(`%${f.search}%`, `%${f.search}%`); }
  if (f.conversation_id) { conditions.push('conversation_id = ?'); params.push(f.conversation_id); }
  if (f.tceb_user_id) { conditions.push('tceb_user_id = ?'); params.push(parseInt(f.tceb_user_id)); }
  if (f.dateFrom)     { conditions.push('created_at >= ?'); params.push(f.dateFrom + ' 00:00:00'); }
  if (f.dateTo)       { conditions.push('created_at <= ?'); params.push(f.dateTo + ' 23:59:59'); }
  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

export async function getSessions(f: ChatFilters = {}, flaggedIds: string[] = []) {
  const { where, params } = buildWhere(f);
  const page     = f.page     ?? 1;
  const pageSize = f.pageSize ?? 20;
  const offset   = (page - 1) * pageSize;

  let havingClause = '';
  if (f.is_flagged === 'true' && flaggedIds.length > 0) {
    const placeholders = flaggedIds.map(() => '?').join(',');
    havingClause = `HAVING conversation_id IN (${placeholders})`;
  }

  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT conversation_id, MIN(tceb_user_id) AS tceb_user_id,
            COUNT(*) AS message_count, MIN(created_at) AS first_message_at,
            MAX(created_at) AS last_message_at, SUBSTRING(MIN(query),1,120) AS preview
     FROM ${TABLE()} ${where}
     GROUP BY conversation_id ${havingClause}
     ORDER BY last_message_at DESC LIMIT ? OFFSET ?`,
    [...params, ...(f.is_flagged === 'true' ? flaggedIds : []), pageSize, offset]
  );

  const [[countRow]] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(DISTINCT conversation_id) AS total FROM ${TABLE()} ${where}`,
    params
  );

  return { data: rows as ISession[], total: countRow.total as number, page, pageSize, totalPages: Math.ceil(countRow.total / pageSize) };
}

export async function getConversation(conversation_id: string): Promise<IChatLog[]> {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT * FROM ${TABLE()} WHERE conversation_id = ? ORDER BY created_at ASC`,
    [conversation_id]
  );
  return rows as IChatLog[];
}

export async function getMysqlStats(dateFrom: string, dateTo: string) {
  const fromStr = dateFrom ? dateFrom + ' 00:00:00' : (() => {
    const d = new Date(); d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10) + ' 00:00:00';
  })();
  const toStr = dateTo ? dateTo + ' 23:59:59' : new Date().toISOString().slice(0, 19).replace('T', ' ');
 
  const [[totals]] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS totalMessages, COUNT(DISTINCT conversation_id) AS totalSessions,
            COUNT(DISTINCT tceb_user_id) AS uniqueUsers,
            SUM(DATE(created_at) = CURDATE()) AS todayMessages
     FROM ${TABLE()} WHERE created_at >= ? AND created_at <= ?`, [fromStr, toStr]
  );
  const [msgTrend] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT DATE(created_at) AS date, COUNT(*) AS count FROM ${TABLE()}
     WHERE created_at >= ? AND created_at <= ?
     GROUP BY DATE(created_at) ORDER BY date ASC`, [fromStr, toStr]
  );
  const [sessTrend] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT DATE(created_at) AS date, COUNT(DISTINCT conversation_id) AS count
     FROM ${TABLE()} WHERE created_at >= ? AND created_at <= ?
     GROUP BY DATE(created_at) ORDER BY date ASC`, [fromStr, toStr]
  );
  const [hourly] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT HOUR(created_at) AS hour, COUNT(*) AS count FROM ${TABLE()}
     WHERE created_at >= ? AND created_at <= ?
     GROUP BY HOUR(created_at) ORDER BY hour ASC`, [fromStr, toStr]
  );
  const [topUsers] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT tceb_user_id, COUNT(*) AS count FROM ${TABLE()}
     WHERE created_at >= ? AND created_at <= ? AND tceb_user_id IS NOT NULL
     GROUP BY tceb_user_id ORDER BY count DESC LIMIT 10`, [fromStr, toStr]
  );
 
  return {
    totalMessages: totals.totalMessages  ?? 0,
    totalSessions: totals.totalSessions  ?? 0,
    uniqueUsers:   totals.uniqueUsers    ?? 0,
    todayMessages: totals.todayMessages  ?? 0,
    messageTrend:  msgTrend  as { date: string; count: number }[],
    sessionTrend:  sessTrend as { date: string; count: number }[],
    hourlyVolume:  hourly    as { hour: number; count: number }[],
    topUsers:      topUsers  as { tceb_user_id: number; count: number }[],
  };
}
 

export async function exportChatLogs(f: ChatFilters = {}): Promise<IChatLog[]> {
  const { where, params } = buildWhere(f);
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    `SELECT * FROM ${TABLE()} ${where} ORDER BY created_at DESC LIMIT 50000`, params
  );
  return rows as IChatLog[];
}
