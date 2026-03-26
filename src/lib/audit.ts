import { connectMongo } from './mongo';
import { AuditLog } from './models';
import type { AuditAction } from './models';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextRequest } from 'next/server';

interface LogParams {
  req?:         NextRequest;
  user_email:   string;
  user_name?:   string;
  action:       AuditAction;
  target_type?: string;
  target_id?:   string;
  detail?:      string;
  meta?:        Record<string, unknown>;
}

export async function auditLog(params: LogParams) {
  try {
    await connectMongo();
    await AuditLog.create({
      user_email:  params.user_email,
      user_name:   params.user_name,
      action:      params.action,
      target_type: params.target_type,
      target_id:   params.target_id,
      detail:      params.detail,
      meta:        params.meta,
      ip:          params.req?.headers.get('x-forwarded-for') ?? params.req?.headers.get('x-real-ip') ?? 'unknown',
    });
  } catch (e) {
    console.error('[auditLog]', e);
  }
}

// Helper: ดึง session แล้ว log ในคำสั่งเดียว
export async function auditFromRequest(
  req: NextRequest,
  action: AuditAction,
  opts?: { target_type?: string; target_id?: string; detail?: string; meta?: Record<string, unknown> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return;
  await auditLog({
    req,
    user_email:  session.user.email,
    user_name:   session.user.name ?? undefined,
    action,
    ...opts,
  });
}