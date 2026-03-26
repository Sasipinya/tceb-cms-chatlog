import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectMongo } from '@/lib/mongo';
import { CmsUser } from '@/lib/models';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

// PATCH /api/users/[id] — update role or approve
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id }  = await params;
  const body    = await req.json();
  const adminEmail = (session.user as any)?.email;

  await connectMongo();

  const update: Record<string, any> = {};
  if (body.role !== undefined) {
    update.role     = body.role;
    update.approved = body.role !== 'pending';
    if (body.role !== 'pending') {
      update.approved_by = adminEmail;
      update.approved_at = new Date();
    }
  }
  if (body.name  !== undefined) update.name  = body.name;
  if (body.email !== undefined) update.email = body.email;

  const user = await CmsUser.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json(user);
}

// DELETE /api/users/[id] — remove user
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  await connectMongo();

  const user = await CmsUser.findByIdAndDelete(id).lean();
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}