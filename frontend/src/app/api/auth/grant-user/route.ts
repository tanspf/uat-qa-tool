import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('uat_session');

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    if (session.role !== 'pm') {
      return NextResponse.json({ error: 'Chỉ tài khoản PM/Admin mới có quyền cấp quyền người dùng' }, { status: 403 });
    }

    const { email, name, role, password } = await req.json();

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Vui lòng cung cấp đầy đủ Email, Tên và Vai trò' }, { status: 400 });
    }

    const lowerEmail = String(email).trim().toLowerCase();

    if (!lowerEmail.endsWith('@foody.vn')) {
      return NextResponse.json({
        error: 'Địa chỉ email cấp quyền bắt buộc phải có tên miền @foody.vn'
      }, { status: 400 });
    }

    const newUser = {
      id: crypto.randomUUID(),
      email: lowerEmail,
      name: name.trim(),
      role: role === 'pm' ? 'pm' as const : 'tester' as const,
      password: password || 'password123',
      created_at: new Date().toISOString(),
    };

    const granted = await db.grantUser(newUser);
    const { password: _, ...safeUser } = granted;

    return NextResponse.json({
      message: `Đã cấp quyền thành công cho tài khoản ${lowerEmail}`,
      user: safeUser,
    });
  } catch (err: any) {
    console.error('Error in POST /api/auth/grant-user:', err);
    return NextResponse.json({ error: err.message || 'Lỗi khi cấp quyền người dùng' }, { status: 500 });
  }
}
