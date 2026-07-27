import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email và mật khẩu không được để trống' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    if (!trimmedEmail.endsWith('@foody.vn')) {
      return NextResponse.json({
        error: 'Hệ thống chỉ chấp nhận tài khoản email doanh nghiệp thuộc tên miền @foody.vn'
      }, { status: 400 });
    }

    const user = await db.getUserByEmail(trimmedEmail);

    if (!user) {
      return NextResponse.json({
        error: 'Tài khoản chưa được cấp quyền truy cập. Vui lòng liên hệ Admin (huuutan.trinh@foody.vn) để được cấp quyền.'
      }, { status: 403 });
    }

    if (user.password !== password) {
      return NextResponse.json({ error: 'Mật khẩu không chính xác' }, { status: 401 });
    }

    const sessionPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const cookieStore = await cookies();
    cookieStore.set('uat_session', JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (err: any) {
    console.error('Error in POST /api/auth/login:', err);
    return NextResponse.json({ error: 'Lỗi server khi đăng nhập' }, { status: 500 });
  }
}
