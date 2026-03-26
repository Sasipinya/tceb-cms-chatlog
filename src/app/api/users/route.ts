import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectMongo } from '@/lib/mongo';
import { CmsUser } from '@/lib/models';
import bcrypt from 'bcryptjs';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await connectMongo();
  const users = await CmsUser.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { email, name, role, password } = body;

  if (!email || !role) return NextResponse.json({ error: 'email and role required' }, { status: 400 });

  await connectMongo();
  const existing = await CmsUser.findOne({ email });
  if (existing) return NextResponse.json({ error: 'User already exists' }, { status: 409 });

  const adminEmail = (session.user as any)?.email;

  // ถ้ามี password → local user
  const userData: any = {
    email,
    name:        name || email,
    provider:    password ? 'local' : 'microsoft',
    role,
    approved:    role !== 'pending',
    approved_by: adminEmail,
    approved_at: role !== 'pending' ? new Date() : undefined,
  };

  if (password) {
    if (password.length < 6) return NextResponse.json({ error: 'Password ต้องมีอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    userData.password = await bcrypt.hash(password, 10);
  }

  const user = await CmsUser.create(userData);
  const { password: _, ...safeUser } = user.toObject();
  return NextResponse.json(safeUser, { status: 201 });
}